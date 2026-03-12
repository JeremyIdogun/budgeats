export interface UserProfile {
  id: string;
  budget: {
    amount: number;
    period: "weekly" | "monthly";
  };
}

export interface ContextSignals {
  timeAvailableMinutes: number;
  energyLevel: 1 | 2 | 3 | 4 | 5;
  calendarEventSoon: boolean;
  wasteRiskIngredientIds: string[];
}

export interface Meal {
  id: string;
  name: string;
  prepTimeMinutes: number;
  satisfactionScore?: number;
}

export interface CookOption {
  meal: Meal;
  estimatedCostPence: number;
  wastePenaltyPence: number;
  explanation: string;
}

export interface EatOutEstimate {
  estimatedCostPence: number;
  mealType: "breakfast" | "lunch" | "dinner";
}

export interface LogismosResult {
  recommendation: "cook" | "eat-out";
  primaryMeal?: CookOption;
  score: number;
  explanation: string;
  alternatives: CookOption[];
  guardrailTriggered?: string;
}

export const DEFAULT_EAT_OUT_ESTIMATES: Record<EatOutEstimate["mealType"], number> = {
  breakfast: 400,
  lunch: 700,
  dinner: 1400,
};

interface ScoredOption {
  option: CookOption;
  score: number;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function budgetRemainingPence(userProfile: UserProfile, spendThisWeekPence: number): number {
  return Math.max(0, userProfile.budget.amount - spendThisWeekPence);
}

function scoreCookOption(
  option: CookOption,
  contextSignals: ContextSignals,
  eatOutEstimate: EatOutEstimate,
): number {
  const costEfficiency = clamp(
    (eatOutEstimate.estimatedCostPence - option.estimatedCostPence) /
      Math.max(eatOutEstimate.estimatedCostPence, 1),
  );

  const explanationText = `${option.meal.name} ${option.explanation}`.toLowerCase();
  const hasWasteRiskIngredient = contextSignals.wasteRiskIngredientIds.some((ingredientId) =>
    explanationText.includes(ingredientId.toLowerCase()),
  );
  const wasteReduction = clamp(
    option.wastePenaltyPence / Math.max(option.estimatedCostPence, 1) +
      (hasWasteRiskIngredient ? 0.25 : 0),
  );
  const timeFit = clamp(
    (contextSignals.timeAvailableMinutes - option.meal.prepTimeMinutes) /
      Math.max(contextSignals.timeAvailableMinutes, 1),
  );
  const energyBaseline = contextSignals.energyLevel / 5;
  const prepDifficulty = clamp(option.meal.prepTimeMinutes / 60);
  const energyFit = clamp(1 - Math.abs(energyBaseline - (1 - prepDifficulty)));
  const routineFit = contextSignals.calendarEventSoon ? clamp(timeFit) : 1;
  const satisfactionEst = clamp(option.meal.satisfactionScore ?? 0.7);

  return (
    0.35 * costEfficiency +
    0.2 * wasteReduction +
    0.2 * timeFit +
    0.15 * energyFit +
    0.05 * routineFit +
    0.05 * satisfactionEst
  );
}

function scoreAndSortCookOptions(
  cookableMeals: CookOption[],
  contextSignals: ContextSignals,
  eatOutEstimate: EatOutEstimate,
): ScoredOption[] {
  return cookableMeals
    .map((option) => ({
      option,
      score: scoreCookOption(option, contextSignals, eatOutEstimate),
    }))
    .sort((left, right) => right.score - left.score);
}

function pickAlternatives(primaryMealId: string | undefined, options: CookOption[]): CookOption[] {
  if (!primaryMealId) return options.slice(0, 3);
  return options.filter((option) => option.meal.id !== primaryMealId).slice(0, 3);
}

export function runLogismos(input: {
  userProfile: UserProfile;
  contextSignals: ContextSignals;
  cookableMeals: CookOption[];
  eatOutEstimate: EatOutEstimate;
  spendThisWeekPence: number;
}): LogismosResult {
  const { userProfile, contextSignals, cookableMeals, eatOutEstimate, spendThisWeekPence } = input;
  const budgetRemaining = budgetRemainingPence(userProfile, spendThisWeekPence);
  const mealsThatFitTime = cookableMeals.filter(
    (option) => option.meal.prepTimeMinutes <= contextSignals.timeAvailableMinutes,
  );

  if (budgetRemaining < eatOutEstimate.estimatedCostPence && cookableMeals.length > 0) {
    const cheapest = [...cookableMeals].sort(
      (left, right) => left.estimatedCostPence - right.estimatedCostPence,
    )[0];
    return {
      recommendation: "cook",
      primaryMeal: cheapest,
      score: 1,
      explanation: `Budget critically low: ${budgetRemaining}p remaining is below eat-out estimate ${eatOutEstimate.estimatedCostPence}p, so cook ${cheapest.meal.name}.`,
      alternatives: pickAlternatives(cheapest.meal.id, cookableMeals),
      guardrailTriggered: "budget_critically_low",
    };
  }

  if (contextSignals.energyLevel <= 1) {
    return {
      recommendation: "eat-out",
      score: 1,
      explanation: "Energy level is 1, so eat out is recommended.",
      alternatives: pickAlternatives(undefined, cookableMeals),
      guardrailTriggered: "energy_low",
    };
  }

  if (contextSignals.calendarEventSoon && mealsThatFitTime.length === 0) {
    return {
      recommendation: "eat-out",
      score: 1,
      explanation: "Calendar event is soon and no cookable meal fits the time window, so eat out.",
      alternatives: pickAlternatives(undefined, cookableMeals),
      guardrailTriggered: "calendar_time_window",
    };
  }

  if (mealsThatFitTime.length === 0 && cookableMeals.length > 0) {
    return {
      recommendation: "eat-out",
      score: 1,
      explanation: "Available time is shorter than all cookable meal prep times, so eat out.",
      alternatives: pickAlternatives(undefined, cookableMeals),
      guardrailTriggered: "time_too_short",
    };
  }

  const viable = mealsThatFitTime.length > 0 ? mealsThatFitTime : cookableMeals;
  const allCookTooExpensive = viable.every((option) => option.estimatedCostPence > budgetRemaining);
  if (allCookTooExpensive && budgetRemaining >= eatOutEstimate.estimatedCostPence) {
    return {
      recommendation: "eat-out",
      score: 0.75,
      explanation: "All cook options exceed remaining budget while eat-out is still affordable, so eat out.",
      alternatives: pickAlternatives(undefined, viable),
    };
  }

  const ranked = scoreAndSortCookOptions(viable, contextSignals, eatOutEstimate);
  const best = ranked[0];
  const bestScore = best?.score ?? 0;
  const topMeal = best?.option;

  if (!topMeal) {
    return {
      recommendation: "eat-out",
      score: 0.5,
      explanation: "No cook options are available, so eat out.",
      alternatives: [],
    };
  }

  const cookSavings = eatOutEstimate.estimatedCostPence - topMeal.estimatedCostPence;
  const eatOutScore = clamp(
    (contextSignals.energyLevel / 5) * 0.3 +
      (contextSignals.calendarEventSoon ? 0.35 : 0.1) +
      (cookSavings < 0 ? 0.35 : 0.1),
  );

  if (eatOutScore > bestScore) {
    return {
      recommendation: "eat-out",
      score: eatOutScore,
      explanation: "Current context favors eating out based on time/energy fit and cost profile.",
      alternatives: pickAlternatives(undefined, viable),
    };
  }

  return {
    recommendation: "cook",
    primaryMeal: topMeal,
    score: bestScore,
    explanation: `Cook ${topMeal.meal.name}: best composite score with strong cost and waste impact (${Math.max(cookSavings, 0)}p vs eat out).`,
    alternatives: pickAlternatives(topMeal.meal.id, viable),
  };
}
