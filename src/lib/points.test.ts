import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeLogismosScore } from "./points";
import type { DecisionLogEntry } from "../models/logismos";

function makeEntry(input: Partial<DecisionLogEntry> = {}): DecisionLogEntry {
  return {
    decision_id: crypto.randomUUID(),
    timestamp: "2026-03-10T12:00:00.000Z",
    recommendation_type: "cook",
    recommendation_accepted: true,
    meal_id: "meal-1",
    estimated_cost_pence: 450,
    actual_cost_pence: 430,
    points_awarded: 15,
    context_signals: {
      calendarEventSoon: false,
      timeWindowMinutes: 120,
      energyLevel: "medium",
      wasteRiskIngredients: ["spinach"],
      budgetRemainingPence: 2800,
      daysRemainingInWeek: 7,
      dayOfWeek: 2,
      hourOfDay: 12,
    },
    ...input,
  };
}

describe("computeLogismosScore", () => {
  it("returns null when fewer than 3 recent decisions are available", () => {
    const now = new Date("2026-03-12T00:00:00.000Z").getTime();
    const entries = [makeEntry(), makeEntry({ decision_id: "d2" })];
    assert.equal(computeLogismosScore(entries, now), null);
  });

  it("returns a bounded 0-100 score with sufficient data", () => {
    const now = new Date("2026-03-12T00:00:00.000Z").getTime();
    const entries = [
      makeEntry({ decision_id: "d1", recommendation_accepted: true }),
      makeEntry({
        decision_id: "d2",
        recommendation_accepted: false,
        recommendation_type: "eat_out",
        points_awarded: 8,
        estimated_cost_pence: 650,
        actual_cost_pence: 760,
      }),
      makeEntry({
        decision_id: "d3",
        timestamp: "2026-03-11T12:00:00.000Z",
        recommendation_accepted: true,
        estimated_cost_pence: 380,
        actual_cost_pence: 395,
      }),
    ];

    const score = computeLogismosScore(entries, now);
    assert.notEqual(score, null);
    assert.ok((score ?? 0) >= 0 && (score ?? 0) <= 100);
  });
});
