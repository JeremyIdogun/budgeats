import { NextResponse } from "next/server";
import ingredientsData from "@/data/ingredients.json";
import mealsData from "@/data/meals.json";
import type { Ingredient, Meal, RetailerId } from "@/models";
import { computeMealPricing, toRetailerId } from "@/lib/pricing-engine-adapter";
import { loadIngredientPrices } from "@/lib/server/ingredient-prices";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const meal = (mealsData as Meal[]).find((row) => row.id === id);
    if (!meal) {
      return NextResponse.json({ error: `Meal not found for id=${id}` }, { status: 404 });
    }

    const url = new URL(request.url);
    const retailerId = toRetailerId(url.searchParams.get("retailerId"));
    const prices = await loadIngredientPrices({
      ingredientIds: meal.ingredients.map((entry) => entry.ingredientId),
    });
    const preferredRetailers = Array.from(
      new Set(
        prices
          .filter((price) => meal.ingredients.some((entry) => entry.ingredientId === price.ingredientId))
          .map((price) => price.retailerId),
      ),
    ) as RetailerId[];

    const priced = computeMealPricing({
      meal,
      ingredients: ingredientsData as Ingredient[],
      prices,
      preferredRetailers: preferredRetailers.length > 0 ? preferredRetailers : (["tesco"] as RetailerId[]),
      loyaltyEnabled: false,
      householdSize: 2,
      forcedRetailerId: retailerId ?? undefined,
    });

    return NextResponse.json({
      data: priced,
      explanation: priced.explanation,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to compute meal costs" },
      { status: 500 },
    );
  }
}
