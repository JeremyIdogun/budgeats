import { NextRequest, NextResponse } from "next/server";
import ingredientsData from "@/data/ingredients.json";
import type { Ingredient, RetailerId } from "@/models";
import {
  parseBooleanFlag,
  resolveIngredientPricing,
  toRetailerId,
} from "@/lib/pricing-engine-adapter";
import { withCache } from "@/lib/server/cache";
import { loadIngredientPrices } from "@/lib/server/ingredient-prices";
import { captureServerError } from "@/lib/server/observability";
import { applyRateLimitHeaders, enforceRateLimit } from "@/lib/server/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimit = await enforceRateLimit(request, {
    name: "pricing-ingredient",
    limit: 90,
    windowMs: 5 * 60 * 1000,
  });
  if (rateLimit.response) return rateLimit.response;

  const url = new URL(request.url);
  const ingredientId = url.searchParams.get("id");
  if (!ingredientId) {
    return applyRateLimitHeaders(NextResponse.json(
      { error: "Missing required query param: id" },
      { status: 400 },
    ), rateLimit.state);
  }

  const ingredient = (ingredientsData as Ingredient[]).find((item) => item.id === ingredientId);
  if (!ingredient) {
    return applyRateLimitHeaders(NextResponse.json(
      { error: `Ingredient not found for id=${ingredientId}` },
      { status: 404 },
    ), rateLimit.state);
  }

  const retailer = toRetailerId(url.searchParams.get("retailerId"));
  const loyaltyEnabled = parseBooleanFlag(url.searchParams.get("loyalty"));

  const prices = (await loadIngredientPrices({ ingredientIds: [ingredientId] }))
    .filter((item) => item.ingredientId === ingredientId);
  const preferredRetailers = Array.from(
    new Set(prices.map((price) => price.retailerId)),
  ) as RetailerId[];

  try {
    const cacheKey = [
      "pricing:ingredient",
      ingredientId,
      retailer ?? "mixed",
      loyaltyEnabled ? "loyalty:on" : "loyalty:off",
    ].join(":");

    const priced = await withCache(cacheKey, 6 * 60 * 60 * 1000, async () =>
      resolveIngredientPricing({
        ingredient,
        prices,
        preferredRetailers,
        loyaltyEnabled,
        forcedRetailerId: retailer ?? undefined,
      }));

    return applyRateLimitHeaders(NextResponse.json({
      data: priced,
      explanation: priced.explanation,
    }), rateLimit.state);
  } catch (error) {
    captureServerError(error, { event: "api.pricing.ingredient.failed", route: "/api/v1/pricing/ingredient" });
    return applyRateLimitHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to price ingredient" },
      { status: 400 },
    ), rateLimit.state);
  }
}
