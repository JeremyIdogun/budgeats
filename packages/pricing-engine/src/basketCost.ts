import { resolveIngredientPrice } from "./ingredientPrice";
import type { BasketMealInput, BasketOption } from "./types";

function sortedUnique(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

export function computeCheapestSingleRetailer(
  meal: BasketMealInput,
  retailers: string[],
  loyaltyPrefs: Record<string, boolean>,
): BasketOption {
  let best: BasketOption | null = null;

  for (const retailerId of retailers) {
    const retailerBreakdown: Record<string, number> = {};
    let valid = true;
    let total = 0;

    for (const ingredient of meal.ingredients) {
      const options = ingredient.options
        .filter((entry) => entry.retailerId === retailerId)
        .map((entry) => entry.option);

      if (options.length === 0) {
        valid = false;
        break;
      }

      const resolution = resolveIngredientPrice({
        ingredientName: ingredient.ingredientName,
        exactProductMatches: options,
        canonicalIngredientMatches: [],
        approvedSubstitutes: [],
        cheapestValidOptions: [],
        loyaltyEnabled: loyaltyPrefs[retailerId] ?? false,
      });

      total += resolution.pricePence;
    }

    if (!valid) continue;
    retailerBreakdown[retailerId] = total;

    if (!best || total < best.totalCostPence) {
      best = {
        retailerBreakdown,
        totalCostPence: total,
        explanation: `Single-retailer winner is ${retailerId} at ${total}p`,
      };
    }
  }

  if (!best) {
    return {
      retailerBreakdown: {},
      totalCostPence: Number.MAX_SAFE_INTEGER,
      explanation: "No single retailer covers all ingredients",
    };
  }

  return best;
}

export function computeCheapestMixedRetailer(
  meal: BasketMealInput,
  retailers: string[],
  loyaltyPrefs: Record<string, boolean>,
): BasketOption {
  const knownRetailers = new Set(retailers);
  const retailerBreakdown: Record<string, number> = {};
  let totalCostPence = 0;

  for (const ingredient of meal.ingredients) {
    const bestPerRetailer = ingredient.options
      .filter((entry) => knownRetailers.has(entry.retailerId))
      .map((entry) => {
        const resolved = resolveIngredientPrice({
          ingredientName: ingredient.ingredientName,
          exactProductMatches: [entry.option],
          canonicalIngredientMatches: [],
          approvedSubstitutes: [],
          cheapestValidOptions: [],
          loyaltyEnabled: loyaltyPrefs[entry.retailerId] ?? false,
        });

        return {
          retailerId: entry.retailerId,
          pricePence: resolved.pricePence,
        };
      })
      .sort((left, right) => left.pricePence - right.pricePence);

    if (bestPerRetailer.length === 0) {
      continue;
    }

    const selected = bestPerRetailer[0];
    retailerBreakdown[selected.retailerId] = (retailerBreakdown[selected.retailerId] ?? 0) + selected.pricePence;
    totalCostPence += selected.pricePence;
  }

  return {
    retailerBreakdown,
    totalCostPence,
    explanation: `Mixed-retailer basket across ${sortedUnique(Object.keys(retailerBreakdown)).join(", ")} totals ${totalCostPence}p`,
  };
}
