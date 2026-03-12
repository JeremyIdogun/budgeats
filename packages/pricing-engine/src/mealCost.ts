import { resolveIngredientPrice } from "./ingredientPrice";
import type {
  MealCostInput,
  MealCostResult,
  PerIngredientCost,
  WeekPlanContext,
} from "./types";

function round(value: number): number {
  return Math.round(value);
}

function computeWastePenaltyPence(input: {
  packSize: number;
  recipeRequiredQuantity: number;
  reuseInWeekPlan: number;
  pricePence: number;
  reuseDaysFromNow: number;
  wasteHalfLifeDays: number;
}): number {
  const packSize = Math.max(input.packSize, 1);
  const wastedQuantity = Math.max(packSize - input.recipeRequiredQuantity - input.reuseInWeekPlan, 0);
  const wastedCostPence = (wastedQuantity / packSize) * input.pricePence;
  const wasteHalfLife = Math.max(input.wasteHalfLifeDays, 1);
  const perishabilityFactor = Math.exp(-input.reuseDaysFromNow / wasteHalfLife);
  return round(wastedCostPence * perishabilityFactor);
}

export function computeMealCostPence(
  meal: MealCostInput,
  weekPlan: WeekPlanContext,
  retailerId: string,
  loyaltyEnabled: boolean,
): MealCostResult {
  void weekPlan;
  const perIngredientCosts: PerIngredientCost[] = [];

  for (const ingredient of meal.ingredients) {
    const resolution = resolveIngredientPrice({
      ...ingredient.priceInput,
      loyaltyEnabled,
      exactProductMatches: ingredient.priceInput.exactProductMatches.filter(
        (option) => option.retailerId === retailerId,
      ),
      canonicalIngredientMatches: ingredient.priceInput.canonicalIngredientMatches.filter(
        (option) => option.retailerId === retailerId,
      ),
      approvedSubstitutes: ingredient.priceInput.approvedSubstitutes.filter(
        (option) => option.retailerId === retailerId,
      ),
      cheapestValidOptions: ingredient.priceInput.cheapestValidOptions.filter(
        (option) => option.retailerId === retailerId,
      ),
    });

    const packSize = Math.max(resolution.chosenOption.packSizeBaseUnit, 1);
    const usedFraction = Math.min(ingredient.recipeRequiredQuantity / packSize, 1);
    const usedCostPence = round(resolution.effectivePackPricePence * usedFraction);
    const wastePenaltyPence = computeWastePenaltyPence({
      packSize,
      recipeRequiredQuantity: ingredient.recipeRequiredQuantity,
      reuseInWeekPlan: ingredient.reuseInWeekPlan,
      pricePence: resolution.effectivePackPricePence,
      reuseDaysFromNow: ingredient.reuseDaysFromNow,
      wasteHalfLifeDays: ingredient.wasteHalfLifeDays,
    });

    perIngredientCosts.push({
      ingredientName: ingredient.ingredientName,
      matchLabel: resolution.matchLabel,
      usedCostPence,
      wastePenaltyPence,
      totalCostPence: usedCostPence + wastePenaltyPence,
      explanation: `${resolution.explanation}; used=${usedCostPence}p, wastePenalty=${wastePenaltyPence}p`,
    });
  }

  const totalCostPence = perIngredientCosts.reduce((sum, row) => sum + row.totalCostPence, 0);
  const wastePenaltyPence = perIngredientCosts.reduce((sum, row) => sum + row.wastePenaltyPence, 0);

  return {
    totalCostPence,
    perIngredientCosts,
    wastePenaltyPence,
    explanation: `Meal ${meal.name}: ${totalCostPence}p total including ${wastePenaltyPence}p waste penalty`,
  };
}
