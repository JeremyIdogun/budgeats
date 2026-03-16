import { NextResponse } from "next/server";
import ingredientsData from "@/data/ingredients.json";
import pricesData from "@/data/prices.json";
import type { Ingredient, IngredientPrice, RetailerId } from "@/models";
import {
  parseBooleanFlag,
  resolveIngredientPricing,
  toRetailerId,
} from "@/lib/pricing-engine-adapter";
import { withCache } from "@/lib/server/cache";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ingredientId = url.searchParams.get("id");
  if (!ingredientId) {
    return NextResponse.json(
      { error: "Missing required query param: id" },
      { status: 400 },
    );
  }

  const ingredient = (ingredientsData as Ingredient[]).find((item) => item.id === ingredientId);
  if (!ingredient) {
    return NextResponse.json(
      { error: `Ingredient not found for id=${ingredientId}` },
      { status: 404 },
    );
  }

  const retailer = toRetailerId(url.searchParams.get("retailerId"));
  const loyaltyEnabled = parseBooleanFlag(url.searchParams.get("loyalty"));

  const prices = (pricesData as IngredientPrice[]).filter((item) => item.ingredientId === ingredientId);
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

    return NextResponse.json({
      data: priced,
      explanation: priced.explanation,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to price ingredient" },
      { status: 400 },
    );
  }
}
