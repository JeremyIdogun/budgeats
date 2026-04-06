import { NextResponse } from "next/server";
import ingredientsData from "@/data/ingredients.json";
import mealsData from "@/data/meals.json";
import type { Ingredient, Meal, RetailerId } from "@/models";
import { computeBasketPricing, toRetailerId } from "@/lib/pricing-engine-adapter";
import { withCache } from "@/lib/server/cache";
import { loadIngredientPrices } from "@/lib/server/ingredient-prices";

interface BasketRequestBody {
  mealIds?: unknown;
  retailerIds?: unknown;
  loyaltyPrefs?: unknown;
}

function parseRetailerIds(input: unknown): RetailerId[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => (typeof entry === "string" ? toRetailerId(entry) : null))
    .filter((entry): entry is RetailerId => Boolean(entry));
}

function parseMealIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((entry): entry is string => typeof entry === "string");
}

function parseLoyaltyPrefs(input: unknown): Partial<Record<RetailerId, boolean>> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const prefs: Partial<Record<RetailerId, boolean>> = {};
  for (const [retailer, raw] of Object.entries(input as Record<string, unknown>)) {
    const retailerId = toRetailerId(retailer);
    if (!retailerId) continue;
    prefs[retailerId] = raw === true;
  }
  return prefs;
}

export async function POST(request: Request) {
  let body: BasketRequestBody;
  try {
    body = (await request.json()) as BasketRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const mealIds = parseMealIds(body.mealIds);
  if (mealIds.length === 0) {
    return NextResponse.json(
      { error: "mealIds must be a non-empty string array" },
      { status: 400 },
    );
  }

  const meals = (mealsData as Meal[]).filter((meal) => mealIds.includes(meal.id));
  if (meals.length === 0) {
    return NextResponse.json(
      { error: "No matching meals found for provided mealIds" },
      { status: 404 },
    );
  }

  const prices = await loadIngredientPrices({
    ingredientIds: Array.from(new Set(meals.flatMap((meal) => meal.ingredients.map((entry) => entry.ingredientId)))),
  });

  const requestedRetailers = parseRetailerIds(body.retailerIds);
  const fallbackRetailers = Array.from(
    new Set(
      prices.map((price) => price.retailerId),
    ),
  ) as RetailerId[];
  const retailerIds = requestedRetailers.length > 0 ? requestedRetailers : fallbackRetailers;

  try {
    const loyaltyPrefs = parseLoyaltyPrefs(body.loyaltyPrefs);
    const cacheKey = [
      "pricing:basket",
      [...mealIds].sort().join(","),
      [...retailerIds].sort().join(","),
      JSON.stringify(loyaltyPrefs),
    ].join(":");

    const priced = await withCache(cacheKey, 6 * 60 * 60 * 1000, async () =>
      computeBasketPricing({
        meals,
        ingredients: ingredientsData as Ingredient[],
        prices,
        retailerIds,
        loyaltyPrefs,
      }));

    return NextResponse.json({
      data: priced,
      explanation: `Single retailer ${priced.singleRetailer.totalCostPence}p, mixed retailer ${priced.mixedRetailer.totalCostPence}p.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to compute basket price" },
      { status: 400 },
    );
  }
}
