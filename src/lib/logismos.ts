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
    return {
      type: "eat_out",
      mealId: null,
      reason: buildReason("eat_out", signals, null, 0),
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
    return {
      type: "cook",
      mealId: best.id,
      reason: buildReason("cook", signals, best, savingPence),
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
  return {
    type: "eat_out",
    mealId: null,
    reason: buildReason("eat_out", signals, null, 0),
    cookCostPence: best?.estimatedCostPence ?? 0,
    eatOutEstimatePence,
    savingPence: 0,
    timeRequiredMinutes: null,
    contextSignals: signals,
    generatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
}
