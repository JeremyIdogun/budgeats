import { NextRequest, NextResponse } from "next/server";
import ingredientsData from "@/data/ingredients.json";
import mealsData from "@/data/meals.json";
import type { Ingredient, Meal, RetailerId } from "@/models";
import { computeMealPricing, parseBooleanFlag, toRetailerId } from "@/lib/pricing-engine-adapter";
import { withCache } from "@/lib/server/cache";
import { loadIngredientPrices } from "@/lib/server/ingredient-prices";
import { captureServerError } from "@/lib/server/observability";
import { applyRateLimitHeaders, enforceRateLimit } from "@/lib/server/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimit = await enforceRateLimit(request, {
    name: "pricing-meal",
    limit: 75,
    windowMs: 5 * 60 * 1000,
  });
  if (rateLimit.response) return rateLimit.response;

  const url = new URL(request.url);
  const mealId = url.searchParams.get("mealId");
  if (!mealId) {
    return applyRateLimitHeaders(NextResponse.json(
      { error: "Missing required query param: mealId" },
      { status: 400 },
    ), rateLimit.state);
  }

  const meal = (mealsData as Meal[]).find((item) => item.id === mealId);
  if (!meal) {
    return applyRateLimitHeaders(NextResponse.json(
      { error: `Meal not found for mealId=${mealId}` },
      { status: 404 },
    ), rateLimit.state);
  }

  const retailer = toRetailerId(url.searchParams.get("retailerId"));
  const loyaltyEnabled = parseBooleanFlag(url.searchParams.get("loyalty"));
  const prices = await loadIngredientPrices({
    ingredientIds: meal.ingredients.map((entry) => entry.ingredientId),
  });
  const preferredRetailers = Array.from(
    new Set(
      meal.ingredients
        .flatMap((entry) =>
          prices
            .filter((price) => price.ingredientId === entry.ingredientId)
            .map((price) => price.retailerId),
        ),
    ),
  ) as RetailerId[];

  try {
    const cacheKey = [
      "pricing:meal",
      mealId,
      retailer ?? "mixed",
      loyaltyEnabled ? "loyalty:on" : "loyalty:off",
    ].join(":");
    const priced = await withCache(cacheKey, 6 * 60 * 60 * 1000, async () =>
      computeMealPricing({
        meal,
        ingredients: ingredientsData as Ingredient[],
        prices,
        preferredRetailers: preferredRetailers.length > 0 ? preferredRetailers : (["tesco"] as RetailerId[]),
        loyaltyEnabled,
        householdSize: 2,
        forcedRetailerId: retailer ?? undefined,
      }));

    return applyRateLimitHeaders(NextResponse.json({
      data: priced,
      explanation: priced.explanation,
    }), rateLimit.state);
  } catch (error) {
    captureServerError(error, { event: "api.pricing.meal.failed", route: "/api/v1/pricing/meal" });
    return applyRateLimitHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to compute meal price" },
      { status: 400 },
    ), rateLimit.state);
  }
}
