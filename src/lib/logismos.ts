import type { Meal } from "@/models";
import type { ContextSignals, LogismosRecommendation } from "@/models/logismos";

// Phase I static eat-out baselines (pence)
// Source: ONS-aligned estimates per PRD §11
export const EAT_OUT_BASELINE_PENCE: Record<"breakfast" | "lunch" | "dinner", number> = {
  breakfast: 400,
  lunch: 700,
  dinner: 1400,
};

// Meal extended with pre-computed cost (component responsibility to supply)
export interface CookableMeal extends Meal {
  estimatedCostPence: number;
}

function mealTypeForHour(hour: number): "breakfast" | "lunch" | "dinner" {
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  return "dinner";
}

function formatPenceInEngine(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function buildReason(
  type: "cook" | "eat_out",
  signals: ContextSignals,
  meal: CookableMeal | null,
  savingPence: number,
): string {
  if (type === "eat_out" && signals.calendarEventSoon) {
    return `You have an event soon — eating out saves you ${signals.timeWindowMinutes} mins of cooking.`;
  }
  if (type === "cook" && meal && signals.wasteRiskIngredients.length > 0) {
    const riskId = signals.wasteRiskIngredients[0];
    const ingredientName = meal.ingredients.find((i) => i.ingredientId === riskId)
      ? riskId
      : signals.wasteRiskIngredients[0];
    return `You have ${ingredientName} expiring soon — cook tonight to avoid waste.`;
  }
  if (type === "cook" && meal && signals.energyLevel === "low") {
    return `Low energy today — this quick meal fits your ${meal.prepTimeMinutes}-min window.`;
  }
  if (type === "cook") {
    return `Cooking saves you ${savingPence}p vs eating out tonight.`;
  }
  return "No cookable meals fit your current time or budget — eating out makes sense tonight.";
}

function buildConfidenceBand(params: {
  bestMeal: CookableMeal | null;
  eatOutEstimatePence: number;
  budgetPerDayPence: number;
}): "low" | "medium" | "high" {
  const { bestMeal, eatOutEstimatePence, budgetPerDayPence } = params;
  if (bestMeal && bestMeal.estimatedCostPence < eatOutEstimatePence * 0.7) {
    return "high";
  }
  if (!bestMeal || budgetPerDayPence < 200) {
    return "low";
  }
  return "medium";
}

function buildTopFactors(params: {
  type: "cook" | "eat_out";
  signals: ContextSignals;
  meal: CookableMeal | null;
  savingPence: number;
  budgetPerDayPence: number;
}): [string, string, string] {
  const { type, signals, meal, savingPence, budgetPerDayPence } = params;
  const factors: string[] = [];

  if (type === "cook" && savingPence > 0) {
    factors.push(`Cooking saves ${formatPenceInEngine(savingPence)} vs eating out`);
  }
  if (signals.energyLevel === "low" && meal) {
    factors.push(`Low energy: ${meal.prepTimeMinutes}-minute meal`);
  }
  if (signals.wasteRiskIngredients.length > 0) {
    factors.push("Ingredient expiry risk detected");
  }
  if (signals.calendarEventSoon) {
    factors.push(`Time window is ${signals.timeWindowMinutes} minutes`);
  } else {
    factors.push("No time pressure today");
  }
  if (budgetPerDayPence < 200) {
    factors.push("Budget tight: cooking keeps costs down");
  } else {
    factors.push(`${signals.daysRemainingInWeek} days left in budget week`);
  }
  if (type === "eat_out" && !meal) {
    factors.push("No cookable meals fit your current context");
  }

  const unique = Array.from(new Set(factors));
  const fallbackFactors = [
    `${formatPenceInEngine(signals.budgetRemainingPence)} budget remaining this week`,
    `${signals.daysRemainingInWeek} days left in budget week`,
    "Recommendation based on your current context",
  ];
  for (const fallback of fallbackFactors) {
    if (unique.length >= 3) break;
    if (!unique.includes(fallback)) unique.push(fallback);
  }

  return [unique[0], unique[1], unique[2]];
}

export function generateRecommendation(
  signals: ContextSignals,
  cookableMeals: CookableMeal[],
  householdSize: number,
): LogismosRecommendation {
  void householdSize; // available for future scoring extensions

  const mealType = mealTypeForHour(signals.hourOfDay);
  const eatOutEstimatePence = EAT_OUT_BASELINE_PENCE[mealType];

  // Step 1: filter by time window
  let filtered: CookableMeal[] = cookableMeals;
  if (signals.timeWindowMinutes < 60) {
    filtered = filtered.filter((m) => m.prepTimeMinutes <= signals.timeWindowMinutes);
  }

  // Step 2: filter by energy level
  if (signals.energyLevel === "low") {
    filtered = filtered.filter((m) => m.prepTimeMinutes <= 25);
  } else if (signals.energyLevel === "medium") {
    filtered = filtered.filter((m) => m.prepTimeMinutes <= 45);
  }

  // Step 3: score each remaining meal
  const budgetPerDay =
    signals.daysRemainingInWeek > 0
      ? signals.budgetRemainingPence / signals.daysRemainingInWeek
      : signals.budgetRemainingPence;

  const scored = filtered.map((meal) => {
    let score = 100;
    const hasWasteIngredient = meal.ingredients.some((i) =>
      signals.wasteRiskIngredients.includes(i.ingredientId),
    );
    if (hasWasteIngredient) score += 30;
    if (meal.estimatedCostPence < budgetPerDay) score += 20;
    return { meal, score };
  });

  // Step 4: pick highest scoring meal
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]?.meal ?? null;

  // Step 5: calendar override — always eat out if event is imminent
  if (signals.calendarEventSoon && signals.timeWindowMinutes < 35) {
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 60 * 1000);
    const confidenceBand = buildConfidenceBand({
      bestMeal: best,
      eatOutEstimatePence,
      budgetPerDayPence: budgetPerDay,
    });
    const topFactors = buildTopFactors({
      type: "eat_out",
      signals,
      meal: null,
      savingPence: 0,
      budgetPerDayPence: budgetPerDay,
    });
    return {
      type: "eat_out",
      mealId: null,
      reason: buildReason("eat_out", signals, null, 0),
      confidenceBand,
      topFactors,
      assumptions: {
        householdSize,
        energyLevel: signals.energyLevel,
        daysRemainingInWeek: signals.daysRemainingInWeek,
        budgetRemainingPence: signals.budgetRemainingPence,
        eatOutBaseline: `ONS estimate: ${mealType} ${formatPenceInEngine(eatOutEstimatePence)}`,
      },
      cookCostPence: 0,
      eatOutEstimatePence,
      savingPence: 0,
      timeRequiredMinutes: null,
      contextSignals: signals,
      generatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
  }

  // Step 6: recommend cook if cheaper and a meal exists
  const now = new Date();
  const expires = new Date(now.getTime() + 60 * 60 * 1000);

  if (best && best.estimatedCostPence < eatOutEstimatePence) {
    const savingPence = eatOutEstimatePence - best.estimatedCostPence;
    const confidenceBand = buildConfidenceBand({
      bestMeal: best,
      eatOutEstimatePence,
      budgetPerDayPence: budgetPerDay,
    });
    const topFactors = buildTopFactors({
      type: "cook",
      signals,
      meal: best,
      savingPence,
      budgetPerDayPence: budgetPerDay,
    });
    return {
      type: "cook",
      mealId: best.id,
      reason: buildReason("cook", signals, best, savingPence),
      confidenceBand,
      topFactors,
      assumptions: {
        householdSize,
        energyLevel: signals.energyLevel,
        daysRemainingInWeek: signals.daysRemainingInWeek,
        budgetRemainingPence: signals.budgetRemainingPence,
        eatOutBaseline: `ONS estimate: ${mealType} ${formatPenceInEngine(eatOutEstimatePence)}`,
      },
      cookCostPence: best.estimatedCostPence,
      eatOutEstimatePence,
      savingPence,
      timeRequiredMinutes: best.prepTimeMinutes,
      contextSignals: signals,
      generatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
  }

  // Fall back to eat_out
  const confidenceBand = buildConfidenceBand({
    bestMeal: best,
    eatOutEstimatePence,
    budgetPerDayPence: budgetPerDay,
  });
  const topFactors = buildTopFactors({
    type: "eat_out",
    signals,
    meal: best,
    savingPence: 0,
    budgetPerDayPence: budgetPerDay,
  });
  return {
    type: "eat_out",
    mealId: null,
    reason: buildReason("eat_out", signals, null, 0),
    confidenceBand,
    topFactors,
    assumptions: {
      householdSize,
      energyLevel: signals.energyLevel,
      daysRemainingInWeek: signals.daysRemainingInWeek,
      budgetRemainingPence: signals.budgetRemainingPence,
      eatOutBaseline: `ONS estimate: ${mealType} ${formatPenceInEngine(eatOutEstimatePence)}`,
    },
    cookCostPence: best?.estimatedCostPence ?? 0,
    eatOutEstimatePence,
    savingPence: 0,
    timeRequiredMinutes: null,
    contextSignals: signals,
    generatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
}
