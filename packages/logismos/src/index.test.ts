import { describe, expect, it } from "vitest";
import { runLogismos, type CookOption } from "./index";

const baseUser = {
  id: "u1",
  budget: {
    amount: 4000,
    period: "weekly" as const,
  },
};

const eatOutEstimate = { estimatedCostPence: 700, mealType: "lunch" as const };

const cookOptions: CookOption[] = [
  {
    meal: { id: "m1", name: "Quick Pasta", prepTimeMinutes: 20, satisfactionScore: 0.7 },
    estimatedCostPence: 320,
    wastePenaltyPence: 40,
    explanation: "uses tomato and spinach",
  },
  {
    meal: { id: "m2", name: "Slow Curry", prepTimeMinutes: 45, satisfactionScore: 0.8 },
    estimatedCostPence: 520,
    wastePenaltyPence: 25,
    explanation: "uses coconut milk",
  },
];

describe("runLogismos guardrails and scoring", () => {
  it("budget critically low forces cook", () => {
    const result = runLogismos({
      userProfile: baseUser,
      contextSignals: {
        timeAvailableMinutes: 30,
        energyLevel: 2,
        calendarEventSoon: false,
        wasteRiskIngredientIds: [],
      },
      cookableMeals: cookOptions,
      eatOutEstimate,
      spendThisWeekPence: 3800,
    });

    expect(result.recommendation).toBe("cook");
    expect(result.guardrailTriggered).toBe("budget_critically_low");
  });

  it("energy level 1 forces eat out", () => {
    const result = runLogismos({
      userProfile: baseUser,
      contextSignals: {
        timeAvailableMinutes: 45,
        energyLevel: 1,
        calendarEventSoon: false,
        wasteRiskIngredientIds: [],
      },
      cookableMeals: cookOptions,
      eatOutEstimate,
      spendThisWeekPence: 1200,
    });

    expect(result.recommendation).toBe("eat-out");
    expect(result.guardrailTriggered).toBe("energy_low");
  });

  it("waste risk ingredient in plan helps cook score", () => {
    const result = runLogismos({
      userProfile: baseUser,
      contextSignals: {
        timeAvailableMinutes: 40,
        energyLevel: 3,
        calendarEventSoon: false,
        wasteRiskIngredientIds: ["spinach"],
      },
      cookableMeals: cookOptions,
      eatOutEstimate,
      spendThisWeekPence: 1000,
    });

    expect(result.recommendation).toBe("cook");
    expect(result.primaryMeal?.meal.id).toBe("m1");
  });

  it("time too short for all meals recommends eat out", () => {
    const result = runLogismos({
      userProfile: baseUser,
      contextSignals: {
        timeAvailableMinutes: 10,
        energyLevel: 3,
        calendarEventSoon: false,
        wasteRiskIngredientIds: [],
      },
      cookableMeals: cookOptions,
      eatOutEstimate,
      spendThisWeekPence: 1200,
    });

    expect(result.recommendation).toBe("eat-out");
    expect(result.guardrailTriggered).toBe("time_too_short");
  });

  it("normal conditions cook wins on cost efficiency", () => {
    const result = runLogismos({
      userProfile: baseUser,
      contextSignals: {
        timeAvailableMinutes: 35,
        energyLevel: 3,
        calendarEventSoon: false,
        wasteRiskIngredientIds: [],
      },
      cookableMeals: cookOptions,
      eatOutEstimate,
      spendThisWeekPence: 500,
    });

    expect(result.recommendation).toBe("cook");
    expect(result.primaryMeal?.meal.id).toBe("m1");
  });

  it("eat-out wins when all cook options exceed budget", () => {
    const expensiveOptions: CookOption[] = [
      {
        meal: { id: "m9", name: "Premium Bowl", prepTimeMinutes: 15 },
        estimatedCostPence: 850,
        wastePenaltyPence: 20,
        explanation: "premium ingredients",
      },
      {
        meal: { id: "m10", name: "Steak Wrap", prepTimeMinutes: 20 },
        estimatedCostPence: 900,
        wastePenaltyPence: 15,
        explanation: "high-cost protein",
      },
    ];

    const result = runLogismos({
      userProfile: { ...baseUser, budget: { amount: 1500, period: "weekly" } },
      contextSignals: {
        timeAvailableMinutes: 40,
        energyLevel: 4,
        calendarEventSoon: false,
        wasteRiskIngredientIds: [],
      },
      cookableMeals: expensiveOptions,
      eatOutEstimate,
      spendThisWeekPence: 600,
    });

    expect(result.recommendation).toBe("eat-out");
  });
});
