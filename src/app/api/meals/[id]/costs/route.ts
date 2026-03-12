import { NextResponse } from "next/server";
import ingredientsData from "@/data/ingredients.json";
import mealsData from "@/data/meals.json";
import pricesData from "@/data/prices.json";
import type { Ingredient, IngredientPrice, Meal, RetailerId } from "@/models";
import { computeMealPricing, toRetailerId } from "@/lib/pricing-engine-adapter";

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
    const preferredRetailers = Array.from(
      new Set(
        (pricesData as IngredientPrice[])
          .filter((price) => meal.ingredients.some((entry) => entry.ingredientId === price.ingredientId))
          .map((price) => price.retailerId),
      ),
    ) as RetailerId[];

    const priced = computeMealPricing({
      meal,
      ingredients: ingredientsData as Ingredient[],
      prices: pricesData as IngredientPrice[],
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
