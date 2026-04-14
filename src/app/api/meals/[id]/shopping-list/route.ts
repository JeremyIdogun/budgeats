import { NextRequest, NextResponse } from "next/server";
import ingredientsData from "@/data/ingredients.json";
import mealsData from "@/data/meals.json";
import type { Ingredient, Meal, UserProfile, WeekPlan } from "@/models";
import { generateShoppingList } from "@/lib/shopping";
import { loadIngredientPrices } from "@/lib/server/ingredient-prices";
import { captureServerError } from "@/lib/server/observability";
import { applyRateLimitHeaders, enforceRateLimit } from "@/lib/server/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const rateLimit = await enforceRateLimit(request, {
    name: "shopping-list-preview",
    limit: 45,
    windowMs: 5 * 60 * 1000,
  });
  if (rateLimit.response) return rateLimit.response;

  try {
    const { id } = await context.params;
    const meal = (mealsData as Meal[]).find((row) => row.id === id);
    if (!meal) {
      return applyRateLimitHeaders(
        NextResponse.json({ error: `Meal not found for id=${id}` }, { status: 404 }),
        rateLimit.state,
      );
    }

    const today = new Date();
    const dayIndex = ((today.getDay() + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayIndex);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartIso = weekStart.toISOString().slice(0, 10);

    const planDays: WeekPlan["days"] = [{}, {}, {}, {}, {}, {}, {}];
    planDays[dayIndex].dinner = {
      mealId: meal.id,
      retailerId: (meal.preferredRetailer ?? "tesco"),
      portions: 2,
    };

    const weekPlan: WeekPlan = {
      id: `meal-preview-${meal.id}`,
      userId: "preview-user",
      weekStartDate: weekStartIso,
      days: planDays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const prices = await loadIngredientPrices({
      ingredientIds: meal.ingredients.map((entry) => entry.ingredientId),
    });

    const retailerIds = Array.from(
      new Set(prices.map((price) => price.retailerId)),
    );
    const user: UserProfile = {
      id: "preview-user",
      createdAt: new Date().toISOString(),
      budget: { amount: 8_000, period: "weekly" },
      household: { size: 2 },
      dietaryPreferences: [],
      preferredRetailers: retailerIds as UserProfile["preferredRetailers"],
      currency: "GBP",
      region: "UK",
    };

    const shopping = generateShoppingList(
      weekPlan,
      mealsData as Meal[],
      ingredientsData as Ingredient[],
      prices,
      user,
    );

    return applyRateLimitHeaders(NextResponse.json({
      data: shopping,
      explanation: `Generated shopping list for meal ${meal.name}.`,
    }), rateLimit.state);
  } catch (error) {
    captureServerError(error, { event: "api.meal.shopping_list.failed", route: "/api/meals/[id]/shopping-list" });
    return applyRateLimitHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to build meal shopping list" },
      { status: 500 },
    ), rateLimit.state);
  }
}
