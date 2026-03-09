import { scaleQuantity } from "@/lib/scaling";
import { RETAILERS } from "@/models/retailer";
import type {
  Ingredient,
  IngredientPrice,
  Meal,
  RetailerId,
  ShoppingList,
  UserProfile,
  WeekPlan,
} from "@/models";

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function keyForPrice(ingredientId: string, retailerId: RetailerId): string {
  return `${ingredientId}::${retailerId}`;
}

export function generateShoppingList(
  weekPlan: WeekPlan,
  meals: Meal[],
  ingredients: Ingredient[],
  prices: IngredientPrice[],
  user: UserProfile,
): ShoppingList {
  const mealsById = new Map(meals.map((meal) => [meal.id, meal]));
  const ingredientsById = new Map(
    ingredients.map((ingredient) => [ingredient.id, ingredient]),
  );
  const pricesByKey = new Map(
    prices.map((price) => [keyForPrice(price.ingredientId, price.retailerId), price]),
  );

  const neededByIngredient = new Map<string, number>();

  for (const day of weekPlan.days) {
    const plannedMeals = Object.values(day).filter(
      (value): value is NonNullable<typeof value> => Boolean(value),
    );

    for (const plannedMeal of plannedMeals) {
      const meal = mealsById.get(plannedMeal.mealId);
      if (!meal) continue;

      const targetPortions = plannedMeal.portions > 0
        ? plannedMeal.portions
        : user.household.size;

      for (const ingredientEntry of meal.ingredients) {
        if (ingredientEntry.optional) continue;

        const scaledQuantity = scaleQuantity(
          ingredientEntry.quantity,
          meal.basePortions,
          targetPortions,
        );

        const existing = neededByIngredient.get(ingredientEntry.ingredientId) ?? 0;
        neededByIngredient.set(ingredientEntry.ingredientId, existing + scaledQuantity);
      }
    }
  }

  const retailerIds = Object.keys(RETAILERS) as RetailerId[];
  const retailerTotals = retailerIds.reduce(
    (acc, retailerId) => {
      acc[retailerId] = 0;
      return acc;
    },
    {} as Record<RetailerId, number>,
  );
  const retailerCompleteness = retailerIds.reduce(
    (acc, retailerId) => {
      acc[retailerId] = true;
      return acc;
    },
    {} as Record<RetailerId, boolean>,
  );

  const items: ShoppingList["items"] = [];

  for (const [ingredientId, totalQuantityNeeded] of neededByIngredient) {
    const ingredient = ingredientsById.get(ingredientId);
    if (!ingredient) continue;

    const packsNeeded = Math.ceil(totalQuantityNeeded / ingredient.storageQuantity);

    const offers = user.preferredRetailers
      .map((retailerId) => {
        const price = pricesByKey.get(keyForPrice(ingredientId, retailerId));
        if (!price) return null;

        return {
          retailerId,
          pricePence: price.pricePerStorageUnit * packsNeeded,
        };
      })
      .filter((offer): offer is NonNullable<typeof offer> => Boolean(offer))
      .sort((a, b) => a.pricePence - b.pricePence);

    if (offers.length === 0) continue;

    for (const retailerId of retailerIds) {
      const price = pricesByKey.get(keyForPrice(ingredientId, retailerId));
      if (!price) {
        retailerCompleteness[retailerId] = false;
        continue;
      }

      retailerTotals[retailerId] += price.pricePerStorageUnit * packsNeeded;
    }

    const cheapest = offers[0];
    items.push({
      ingredientId,
      ingredientName: ingredient.name,
      category: ingredient.category,
      totalQuantityNeeded,
      unit: ingredient.defaultUnit,
      packsNeeded,
      cheapestRetailerId: cheapest.retailerId,
      cheapestPricePence: cheapest.pricePence,
      alternativeRetailers: offers.slice(1),
    });
  }

  items.sort((a, b) => {
    if (a.category === b.category) return a.ingredientName.localeCompare(b.ingredientName);
    return a.category.localeCompare(b.category);
  });

  const totalPence = items.reduce((sum, item) => sum + item.cheapestPricePence, 0);

  const totalByRetailer = retailerIds.reduce(
    (acc, retailerId) => {
      acc[retailerId] = retailerCompleteness[retailerId] ? retailerTotals[retailerId] : 0;
      return acc;
    },
    {} as Record<RetailerId, number>,
  );

  const viableSingleRetailerTotals = retailerIds
    .filter((retailerId) => retailerCompleteness[retailerId])
    .map((retailerId) => totalByRetailer[retailerId]);

  const bestSingleRetailerTotal =
    viableSingleRetailerTotals.length > 0
      ? Math.min(...viableSingleRetailerTotals)
      : totalPence;

  return {
    id: generateId("shopping"),
    weekPlanId: weekPlan.id,
    userId: user.id,
    generatedAt: new Date().toISOString(),
    items,
    totalPence,
    totalByRetailer,
    estimatedSavingPence: Math.max(0, bestSingleRetailerTotal - totalPence),
  };
}
