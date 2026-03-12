import { computeMealCostPence } from "../mealCost";
import type { MealCostInput, WeekPlanContext } from "../types";

export interface UserRetailerPreferences {
  retailers: Array<{
    retailerId: string;
    enabled: boolean;
    loyaltyEnabled: boolean;
  }>;
}

export interface BridgeCookOption {
  meal: {
    id: string;
    name: string;
    prepTimeMinutes: number;
  };
  estimatedCostPence: number;
  wastePenaltyPence: number;
  explanation: string;
}

export interface BridgeMealInput extends MealCostInput {
  prepTimeMinutes: number;
}

export function deriveCookCostPence(
  meal: BridgeMealInput,
  weekPlan: WeekPlanContext,
  userRetailerPrefs: UserRetailerPreferences,
): BridgeCookOption {
  const enabledRetailers = userRetailerPrefs.retailers.filter((entry) => entry.enabled);
  if (enabledRetailers.length === 0) {
    throw new Error("No enabled retailers provided");
  }

  const priced = enabledRetailers.map((entry) => ({
    retailerId: entry.retailerId,
    loyaltyEnabled: entry.loyaltyEnabled,
    result: computeMealCostPence(meal, weekPlan, entry.retailerId, entry.loyaltyEnabled),
  }));

  priced.sort((left, right) => left.result.totalCostPence - right.result.totalCostPence);
  const winner = priced[0];

  return {
    meal: {
      id: meal.id,
      name: meal.name,
      prepTimeMinutes: meal.prepTimeMinutes,
    },
    estimatedCostPence: winner.result.totalCostPence,
    wastePenaltyPence: winner.result.wastePenaltyPence,
    explanation: `Selected ${winner.retailerId} as cheapest enabled retailer. ${winner.result.explanation}`,
  };
}
