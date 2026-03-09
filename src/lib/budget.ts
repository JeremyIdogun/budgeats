import { scaleQuantity } from "@/lib/scaling";
import type {
  Ingredient,
  IngredientPrice,
  Meal,
  RetailerId,
  WeekPlan,
} from "@/models";

function indexIngredients(ingredients: Ingredient[]): Map<string, Ingredient> {
  return new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
}

function indexPrices(
  prices: IngredientPrice[],
): Map<string, IngredientPrice> {
  return new Map(
    prices.map((price) => [
      `${price.ingredientId}::${price.retailerId}`,
      price,
    ]),
  );
}

export function deriveIngredientCostPence(
  ingredient: Ingredient,
  price: IngredientPrice,
  requiredQuantity: number,
): number {
  if (!Number.isFinite(requiredQuantity) || requiredQuantity < 0) {
    throw new Error("requiredQuantity must be >= 0");
  }

  if (!Number.isFinite(ingredient.storageQuantity) || ingredient.storageQuantity <= 0) {
    throw new Error("ingredient.storageQuantity must be > 0");
  }

  const pricePerUnit = price.pricePerStorageUnit / ingredient.storageQuantity;
  return Math.ceil(pricePerUnit * requiredQuantity);
}

export function deriveMealCostPence(
  meal: Meal,
  ingredients: Ingredient[],
  prices: IngredientPrice[],
  retailerId: RetailerId,
  householdSize: number,
): number | null {
  const ingredientsById = indexIngredients(ingredients);
  const pricesByKey = indexPrices(prices);

  let total = 0;

  for (const mealIngredient of meal.ingredients) {
    if (mealIngredient.optional) continue;

    const ingredient = ingredientsById.get(mealIngredient.ingredientId);
    if (!ingredient) return null;

    const price = pricesByKey.get(`${mealIngredient.ingredientId}::${retailerId}`);
    if (!price) return null;

    const scaledQty = scaleQuantity(
      mealIngredient.quantity,
      meal.basePortions,
      householdSize,
    );

    total += deriveIngredientCostPence(ingredient, price, scaledQty);
  }

  return total;
}

export function deriveWeekTotalPence(
  weekPlan: WeekPlan,
  meals: Meal[],
  ingredients: Ingredient[],
  prices: IngredientPrice[],
  householdSize: number,
): number {
  return weekPlan.days
    .flatMap((day) => Object.values(day))
    .filter((plannedMeal): plannedMeal is NonNullable<typeof plannedMeal> => Boolean(plannedMeal))
    .reduce((sum, plannedMeal) => {
      const meal = meals.find((entry) => entry.id === plannedMeal.mealId);
      if (!meal) return sum;

      const targetPortions = plannedMeal.portions > 0 ? plannedMeal.portions : householdSize;
      const cost = deriveMealCostPence(
        meal,
        ingredients,
        prices,
        plannedMeal.retailerId,
        targetPortions,
      );

      return sum + (cost ?? 0);
    }, 0);
}

export function deriveBudgetRemainingPence(
  budgetPence: number,
  spentPence: number,
): number {
  return budgetPence - spentPence;
}

export function deriveBudgetUtilisationPct(
  budgetPence: number,
  spentPence: number,
): number {
  if (budgetPence <= 0) return 0;
  return (spentPence / budgetPence) * 100;
}
