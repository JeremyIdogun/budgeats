import type { DecisionLogEntry } from "@/models/logismos";
import type { DecisionLogRow } from "@/lib/logismos-ledger";

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function asEnergy(value: unknown): "low" | "medium" | "high" | null {
  if (value === "low" || value === "medium" || value === "high") return value;
  return null;
}

export function toDecisionLogEntry(row: DecisionLogRow): DecisionLogEntry {
  const recommendation = (row.recommendation_json ?? {}) as Record<string, unknown>;
  const contextRaw =
    (recommendation.contextSignals as Record<string, unknown> | undefined) ??
    (recommendation.context_signals as Record<string, unknown> | undefined) ??
    {};

  const cookCostPence = asNumber(recommendation.cookCostPence, 0);
  const estimatedCostPence = cookCostPence > 0
    ? cookCostPence
    : asNumber(recommendation.estimatedCostPence, 0);

  const contextSignals = {
    calendarEventSoon: asBool(contextRaw.calendarEventSoon),
    timeWindowMinutes: asNumber(contextRaw.timeWindowMinutes, 120),
    energyLevel: asEnergy(contextRaw.energyLevel),
    wasteRiskIngredients:
      asStringArray(contextRaw.wasteRiskIngredients).length > 0
        ? asStringArray(contextRaw.wasteRiskIngredients)
        : asStringArray(contextRaw.wasteRiskIngredientIds),
    budgetRemainingPence: asNumber(contextRaw.budgetRemainingPence, 0),
    daysRemainingInWeek: asNumber(contextRaw.daysRemainingInWeek, 7),
    dayOfWeek: asNumber(contextRaw.dayOfWeek, new Date(row.created_at).getDay()),
    hourOfDay: asNumber(contextRaw.hourOfDay, new Date(row.created_at).getHours()),
  };

  const actualCostValue = recommendation.actualCostPence;
  const actualCostPence =
    typeof actualCostValue === "number" && Number.isFinite(actualCostValue)
      ? actualCostValue
      : null;

  const savingValue = recommendation.savingPence;
  const savingPence =
    typeof savingValue === "number" && Number.isFinite(savingValue) ? savingValue : null;

  return {
    decision_id: row.id,
    timestamp: row.created_at,
    recommendation_type: row.recommendation_type,
    recommendation_accepted: row.accepted ?? false,
    meal_id: row.meal_id,
    estimated_cost_pence: estimatedCostPence,
    actual_cost_pence: actualCostPence,
    saving_pence: savingPence,
    context_signals: contextSignals,
    points_awarded: row.points_awarded ?? 0,
  };
}
