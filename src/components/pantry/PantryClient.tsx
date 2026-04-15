"use client";

import { useEffect, useMemo } from "react";
import { useDashboardPersistState } from "@/components/dashboard/useDashboardPersistState";
import { AppNav } from "@/components/navigation/AppNav";
import { useHydratedProfile } from "@/components/dashboard/useHydratedProfile";
import {
  isoDate,
  startOfWeek,
  type DashboardClientCommonProps,
} from "@/lib/dashboard-client";
import { useBudgeAtsStore } from "@/store";

const CATEGORY_ORDER = [
  "meat-fish",
  "dairy-eggs",
  "fruit-veg",
  "grains-pasta",
  "tinned-dried",
  "condiments",
  "bakery",
  "frozen",
  "other",
] as const;

function categoryLabel(category: string): string {
  if (category === "meat-fish") return "Meat & Fish";
  if (category === "dairy-eggs") return "Dairy & Eggs";
  if (category === "fruit-veg") return "Fruit & Veg";
  if (category === "grains-pasta") return "Grains & Pasta";
  if (category === "tinned-dried") return "Tinned & Dried";
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function PantryClient({
  userId,
  profileRetailers,
  profileWeeklyBudgetPence,
  profileBudgetPeriod,
  profileHouseholdSize,
  profileDietaryPreferences,
  initialPlan,
  initialCheckedItems,
  initialCustomMeals,
  initialPantryItems,
  initialBudgetNudgeDismissedForWeek,
  initialBudgetOverridePence,
  initialBudgetOverrideWeekStartDate,
}: DashboardClientCommonProps) {
  useHydratedProfile({
    userId,
    profileRetailers,
    profileWeeklyBudgetPence,
    profileBudgetPeriod,
    profileHouseholdSize,
    profileDietaryPreferences,
  });

  const ingredients = useBudgeAtsStore((state) => state.ingredients);
  const pantryItems = useBudgeAtsStore((state) => state.pantryItems);
  const togglePantryItem = useBudgeAtsStore((state) => state.togglePantryItem);
  const setPantryItems = useBudgeAtsStore((state) => state.setPantryItems);
  const budgetNudgeDismissedForWeek = useBudgeAtsStore((state) => state.budgetNudgeDismissedForWeek);
  const setBudgetNudgeDismissedForWeek = useBudgeAtsStore(
    (state) => state.setBudgetNudgeDismissedForWeek,
  );
  const weekKey = useMemo(() => isoDate(startOfWeek(new Date())), []);

  useEffect(() => {
    setPantryItems(initialPantryItems);
    setBudgetNudgeDismissedForWeek(initialBudgetNudgeDismissedForWeek);
  }, [
    initialPantryItems,
    initialBudgetNudgeDismissedForWeek,
    setPantryItems,
    setBudgetNudgeDismissedForWeek,
  ]);

  useDashboardPersistState({
    userId,
    weekStartDate: weekKey,
    plan: initialPlan,
    checkedItems: initialCheckedItems,
    customMeals: initialCustomMeals,
    pantryItems,
    budgetNudgeDismissedForWeek,
    budgetOverridePence: initialBudgetOverridePence,
    budgetOverrideWeekStartDate: initialBudgetOverrideWeekStartDate,
  });

  const inStockCount = useMemo(
    () => Object.values(pantryItems).filter(Boolean).length,
    [pantryItems],
  );

  const groupedIngredients = useMemo(() => {
    const grouped = new Map<string, typeof ingredients>();
    for (const ingredient of ingredients) {
      const current = grouped.get(ingredient.category) ?? [];
      current.push(ingredient);
      grouped.set(ingredient.category, current);
    }

    return Array.from(grouped.entries())
      .sort((a, b) => {
        const indexA = CATEGORY_ORDER.indexOf(a[0] as (typeof CATEGORY_ORDER)[number]);
        const indexB = CATEGORY_ORDER.indexOf(b[0] as (typeof CATEGORY_ORDER)[number]);
        const safeA = indexA === -1 ? CATEGORY_ORDER.length : indexA;
        const safeB = indexB === -1 ? CATEGORY_ORDER.length : indexB;
        return safeA - safeB;
      })
      .map(([category, items]) => [
        category,
        [...items].sort((left, right) => left.name.localeCompare(right.name)),
      ] as const);
  }, [ingredients]);

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-7xl">
        <AppNav />

        <section className="mb-4 rounded-lg border border-cream-dark bg-white p-5">
          <h1 className="text-2xl font-extrabold text-navy md:text-3xl">Pantry</h1>
          <p className="mt-1 text-sm text-navy-muted">{inStockCount} items in your pantry</p>
        </section>

        <section className="rounded-lg border border-cream-dark bg-white p-5">
          <div className="space-y-5">
            {groupedIngredients.map(([category, items]) => (
              <div key={category}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
                  {categoryLabel(category)}
                </h2>
                <div className="space-y-2">
                  {items.map((ingredient) => (
                    <label
                      key={ingredient.id}
                      className="flex items-center justify-between rounded-lg border border-cream-dark px-3 py-2 text-sm"
                    >
                      <span className="text-navy">{ingredient.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-navy-muted">
                          {pantryItems[ingredient.id] ? "In stock" : "Not in stock"}
                        </span>
                        <input
                          type="checkbox"
                          checked={Boolean(pantryItems[ingredient.id])}
                          onChange={() => togglePantryItem(ingredient.id)}
                          className="h-4 w-4 accent-teal"
                        />
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
