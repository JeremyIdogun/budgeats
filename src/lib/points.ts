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

export function computeLogismosScore(
  entries: DecisionLogEntry[],
  nowTimestamp = Date.now(),
): number | null {
  const fourWeeksAgo = nowTimestamp - 28 * 24 * 60 * 60 * 1000;
  const recent = entries.filter((e) => new Date(e.timestamp).getTime() > fourWeeksAgo);
  if (recent.length < 7) return null;
  const accepted = recent.filter((e) => e.recommendation_accepted).length;
  return Math.round((accepted / recent.length) * 100);
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
