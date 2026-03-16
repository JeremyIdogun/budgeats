import type { DecisionLogEntry } from "@/models/logismos";

export const POINTS = {
  ACCEPT_COOK_RECOMMENDATION: 15,
  COMPLETE_PLANNED_MEAL: 10,
  ACCEPT_EAT_OUT_RECOMMENDATION: 8,
  ADD_MEAL_TO_PLAN: 3,
  USE_INGREDIENT_BEFORE_EXPIRY: 12,
  SEVEN_DAY_STREAK_BONUS: 50,
  SHARE_MEAL_PLAN: 20, // Phase II
} as const;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function safeDiv(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

export function computeLogismosScore(
  entries: DecisionLogEntry[],
  nowTimestamp = Date.now(),
): number | null {
  const fourWeeksAgo = nowTimestamp - 28 * 24 * 60 * 60 * 1000;
  const recent = entries.filter((e) => new Date(e.timestamp).getTime() > fourWeeksAgo);
  if (recent.length < 3) return null;

  const acceptanceRate = safeDiv(
    recent.filter((entry) => entry.recommendation_accepted).length,
    recent.length,
  );

  const budgetAdherenceScores = recent.map((entry) => {
    const dailyBudget = safeDiv(
      entry.context_signals.budgetRemainingPence,
      Math.max(entry.context_signals.daysRemainingInWeek, 1),
    );
    if (dailyBudget <= 0) return 0;
    const overspend = Math.max(0, entry.estimated_cost_pence - dailyBudget);
    return clamp01(1 - overspend / dailyBudget);
  });
  const budgetAdherenceRatio = safeDiv(
    budgetAdherenceScores.reduce((sum, value) => sum + value, 0),
    budgetAdherenceScores.length,
  );

  const wastePreventionActions = recent.filter(
    (entry) =>
      entry.recommendation_accepted &&
      entry.recommendation_type === "cook" &&
      entry.context_signals.wasteRiskIngredients.length > 0,
  ).length;
  const wastePreventionRatio = clamp01(safeDiv(wastePreventionActions, recent.length));

  const plannedDays = new Set(
    recent
      .filter((entry) => entry.recommendation_accepted && entry.recommendation_type === "cook")
      .map((entry) => entry.timestamp.slice(0, 10)),
  ).size;
  const planningConsistency = clamp01(plannedDays / 28);

  const accuracyEntries = recent.filter((entry) => entry.actual_cost_pence !== null);
  const costAccuracy = accuracyEntries.length === 0
    ? 0.5
    : safeDiv(
      accuracyEntries.reduce((sum, entry) => {
        const estimated = Math.max(entry.estimated_cost_pence, 1);
        const delta = Math.abs((entry.actual_cost_pence ?? estimated) - estimated);
        const accuracy = clamp01(1 - delta / estimated);
        return sum + accuracy;
      }, 0),
      accuracyEntries.length,
    );

  const weighted =
    0.3 * acceptanceRate +
    0.25 * budgetAdherenceRatio +
    0.15 * wastePreventionRatio +
    0.15 * planningConsistency +
    0.15 * costAccuracy;

  return Math.round(clamp01(weighted) * 100);
}

export function computeAcceptedThisMonth(
  entries: DecisionLogEntry[],
  nowTimestamp = Date.now(),
): number {
  const fourWeeksAgo = nowTimestamp - 28 * 24 * 60 * 60 * 1000;
  return entries.filter(
    (entry) =>
      entry.recommendation_accepted &&
      new Date(entry.timestamp).getTime() > fourWeeksAgo,
  ).length;
}
