import ingredientsData from "@/data/ingredients.json";
import mealsData from "@/data/meals.json";
import pricesData from "@/data/prices.json";
import type { Ingredient, IngredientPrice, Meal } from "@/models";
import { getOptionalPrisma } from "@/lib/server/optional-prisma";
import { listRetailerContexts } from "@/lib/logismos-ledger";

type MinimalPrisma = {
  ingestionRun: {
    findMany: (input: {
      orderBy: { started_at: "desc" };
      take: number;
    }) => Promise<Array<{
      id: string;
      retailer_id: string;
      started_at: Date;
      completed_at: Date | null;
      status: string;
      products_scraped: number;
      errors_json: unknown;
    }>>;
  };
};

export async function listIngestionRuns(limit = 100): Promise<Array<{
  id: string;
  retailer_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  products_scraped: number;
  errors_json: unknown;
}>> {
  const prisma = (await getOptionalPrisma()) as MinimalPrisma | null;
  if (!prisma) return [];

  try {
    const rows = await prisma.ingestionRun.findMany({
      orderBy: { started_at: "desc" },
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      retailer_id: row.retailer_id,
      started_at: row.started_at.toISOString(),
      completed_at: row.completed_at ? row.completed_at.toISOString() : null,
      status: row.status,
      products_scraped: row.products_scraped,
      errors_json: row.errors_json,
    }));
  } catch {
    return [];
  }
}

export function getIngredientCoverageStats() {
  const ingredients = ingredientsData as Ingredient[];
  const meals = mealsData as Meal[];
  const ingredientIdsUsed = new Set(
    meals.flatMap((meal) => meal.ingredients.map((entry) => entry.ingredientId)),
  );

  return {
    canonicalIngredientCount: ingredients.length,
    usedInMealsCount: ingredientIdsUsed.size,
    unusedCount: ingredients.length - ingredientIdsUsed.size,
    coveragePct: ingredients.length === 0 ? 0 : Math.round((ingredientIdsUsed.size / ingredients.length) * 100),
  };
}

export function getMealCostCoverage() {
  const meals = mealsData as Meal[];
  const prices = pricesData as IngredientPrice[];
  let covered = 0;

  for (const meal of meals) {
    const required = meal.ingredients.filter((entry) => !entry.optional);
    if (required.length === 0) continue;
    const matched = required.filter((entry) =>
      prices.some((price) => price.ingredientId === entry.ingredientId),
    ).length;
    const ratio = matched / required.length;
    if (ratio >= 0.85) covered += 1;
  }

  return {
    mealCount: meals.length,
    coveredMeals: covered,
    coveragePct: meals.length === 0 ? 0 : Math.round((covered / meals.length) * 100),
  };
}

export async function getRetailerContextSummary() {
  const contexts = await listRetailerContexts();
  const grouped = contexts.reduce<Record<string, number>>((acc, row) => {
    acc[row.retailer_id] = (acc[row.retailer_id] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total: contexts.length,
    byRetailer: grouped,
    rows: contexts,
  };
}
