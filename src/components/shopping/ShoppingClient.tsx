"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/navigation/AppNav";
import { useHydratedProfile } from "@/components/dashboard/useHydratedProfile";
import {
  MEAL_TYPES,
  RETAILER_NAMES,
  addDays,
  amountLabel,
  buildLibraryWeekPlan,
  isDashboardMealType,
  isoDate,
  normalizeKey,
  startOfWeek,
  type DashboardClientCommonProps,
} from "@/lib/dashboard-client";
import { generateShoppingList } from "@/lib/shopping";
import { useBudgeAtsStore } from "@/store";
import { formatPence, poundsToPence } from "@/utils/currency";
import type { RetailerId } from "@/models";

interface DashboardShoppingItem {
  key: string;
  name: string;
  amount: number;
  unit: string;
  group: string;
  bestOfferRetailerId: RetailerId | null;
  bestOfferPence: number | null;
  priced: boolean;
}

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

export function ShoppingClient({
  userId,
  initialPlan,
  initialCheckedItems,
  initialCustomMeals,
  profileRetailers,
  profileWeeklyBudgetPence,
  profileBudgetPeriod,
  profileHouseholdSize,
  profileDietaryPreferences,
}: DashboardClientCommonProps) {
  void initialCheckedItems;

  const { effectiveUser, householdSize, preferredRetailers } = useHydratedProfile({
    userId,
    profileRetailers,
    profileWeeklyBudgetPence,
    profileBudgetPeriod,
    profileHouseholdSize,
    profileDietaryPreferences,
  });

  const storeState = useBudgeAtsStore();
  const setCurrentWeekPlan = useBudgeAtsStore((state) => state.setCurrentWeekPlan);

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const weekKey = isoDate(weekStart);

  const dashboardLibraryMeals = useMemo(
    () => storeState.meals.filter((meal) => isDashboardMealType(meal.type)),
    [storeState.meals],
  );

  const libraryMealsById = useMemo(
    () => new Map(dashboardLibraryMeals.map((meal) => [meal.id, meal])),
    [dashboardLibraryMeals],
  );

  const libraryWeekPlan = useMemo(
    () =>
      buildLibraryWeekPlan({
        plan: initialPlan,
        weekDays,
        weekKey,
        userId,
        mealsById: libraryMealsById,
        householdSize,
        defaultRetailer: preferredRetailers[0] ?? "tesco",
      }),
    [
      initialPlan,
      weekDays,
      weekKey,
      userId,
      libraryMealsById,
      householdSize,
      preferredRetailers,
    ],
  );

  useEffect(() => {
    setCurrentWeekPlan(libraryWeekPlan);
  }, [libraryWeekPlan, setCurrentWeekPlan]);

  const generatedShoppingList = useMemo(
    () =>
      generateShoppingList(
        libraryWeekPlan,
        dashboardLibraryMeals,
        storeState.ingredients,
        storeState.prices,
        effectiveUser,
      ),
    [libraryWeekPlan, dashboardLibraryMeals, storeState.ingredients, storeState.prices, effectiveUser],
  );

  const customMealById = useMemo(
    () => new Map(initialCustomMeals.map((meal) => [meal.id, meal])),
    [initialCustomMeals],
  );

  const customShoppingMap = new Map<string, DashboardShoppingItem>();
  for (let dayIndex = 0; dayIndex < weekDays.length; dayIndex += 1) {
    const day = weekDays[dayIndex];
    for (const type of MEAL_TYPES) {
      const slotKey = `${isoDate(day)}:${type}`;
      const mealId = initialPlan[slotKey];
      if (!mealId) continue;

      const customMeal = customMealById.get(mealId);
      if (!customMeal) continue;

      for (const ingredient of customMeal.ingredients) {
        const key = `${normalizeKey(ingredient.name)}|${ingredient.unit}|${weekKey}`;
        const existing = customShoppingMap.get(key);
        if (existing) {
          existing.amount += ingredient.amount;
        } else {
          customShoppingMap.set(key, {
            key,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            group: ingredient.aisle || "other",
            bestOfferRetailerId: null,
            bestOfferPence: null,
            priced: false,
          });
        }
      }
    }
  }

  const generatedItems: DashboardShoppingItem[] = generatedShoppingList.items.map((item) => ({
    key: `${item.ingredientId}|${weekKey}`,
    name: item.ingredientName,
    amount: item.totalQuantityNeeded,
    unit: item.unit,
    group: item.category,
    bestOfferRetailerId: item.cheapestRetailerId,
    bestOfferPence: item.cheapestPricePence,
    priced: true,
  }));

  const shoppingItems = [...generatedItems, ...Array.from(customShoppingMap.values())].sort(
    (a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a.group as (typeof CATEGORY_ORDER)[number]);
      const indexB = CATEGORY_ORDER.indexOf(b.group as (typeof CATEGORY_ORDER)[number]);
      const safeA = indexA === -1 ? CATEGORY_ORDER.length : indexA;
      const safeB = indexB === -1 ? CATEGORY_ORDER.length : indexB;
      if (safeA === safeB) return a.name.localeCompare(b.name);
      return safeA - safeB;
    },
  );

  const shoppingGroups = new Map<string, DashboardShoppingItem[]>();
  for (const item of shoppingItems) {
    const current = shoppingGroups.get(item.group) ?? [];
    current.push(item);
    shoppingGroups.set(item.group, current);
  }
  const shoppingByGroup = Array.from(shoppingGroups.entries()).sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a[0] as (typeof CATEGORY_ORDER)[number]);
    const indexB = CATEGORY_ORDER.indexOf(b[0] as (typeof CATEGORY_ORDER)[number]);
    const safeA = indexA === -1 ? CATEGORY_ORDER.length : indexA;
    const safeB = indexB === -1 ? CATEGORY_ORDER.length : indexB;
    return safeA - safeB;
  });

  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const checkedSet = useMemo(() => new Set(checkedItems), [checkedItems]);

  function toggleItem(itemKey: string) {
    setCheckedItems((prev) =>
      prev.includes(itemKey)
        ? prev.filter((key) => key !== itemKey)
        : [...prev, itemKey],
    );
  }

  function clearCheckedForWeek() {
    setCheckedItems([]);
  }

  function checkAllForWeek() {
    setCheckedItems(shoppingItems.map((item) => item.key));
  }

  const checkedCount = shoppingItems.filter((item) => checkedSet.has(item.key)).length;

  const basketByRetailer = preferredRetailers
    .map((retailerId) => ({
      retailerId,
      totalPence: generatedShoppingList.totalByRetailer[retailerId] ?? 0,
    }))
    .filter((entry) => entry.totalPence > 0)
    .sort((a, b) => a.totalPence - b.totalPence);

  const cheapestSingleStoreTotal = basketByRetailer[0]?.totalPence ?? 0;
  const splitBasketTotal = generatedShoppingList.totalPence;
  const savingsPence = Math.max(0, cheapestSingleStoreTotal - splitBasketTotal);

  const splitRetailerCounts = generatedShoppingList.items.reduce(
    (acc, item) => {
      acc[item.cheapestRetailerId] = (acc[item.cheapestRetailerId] ?? 0) + 1;
      return acc;
    },
    {} as Record<RetailerId, number>,
  );

  const topSplitRetailers = (Object.entries(splitRetailerCounts) as Array<[RetailerId, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([retailerId]) => RETAILER_NAMES[retailerId]);

  const weekHeading = weekStart.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  const plannedSlotCount = weekDays.flatMap((day) =>
    MEAL_TYPES.map((type) => initialPlan[`${isoDate(day)}:${type}`]).filter(Boolean),
  ).length;

  const customMealCostPence = weekDays.reduce((sum, day) => {
    return (
      sum +
      MEAL_TYPES.reduce((innerSum, type) => {
        const mealId = initialPlan[`${isoDate(day)}:${type}`];
        if (!mealId) return innerSum;
        const customMeal = customMealById.get(mealId);
        return innerSum + (customMeal ? poundsToPence(customMeal.cost) : 0);
      }, 0)
    );
  }, 0);

  const estimatedTotalPence = splitBasketTotal + customMealCostPence;

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-7xl">
        <AppNav />

        <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-navy md:text-3xl">Shopping List</h1>
            <p className="text-sm text-navy-muted">Week of {weekHeading}</p>
          </div>
          <div className="rounded-xl border border-cream-dark bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-navy-muted">Estimated total</p>
            <p className="mt-1 text-sm font-semibold text-navy">{formatPence(estimatedTotalPence)}</p>
            {savingsPence > 0 && topSplitRetailers.length >= 2 && (
              <p className="mt-1 text-xs text-teal">
                Save {formatPence(savingsPence)} by splitting between {topSplitRetailers[0]} +{" "}
                {topSplitRetailers[1]}
              </p>
            )}
          </div>
        </section>

        {plannedSlotCount === 0 || shoppingItems.length === 0 ? (
          <section className="rounded-2xl border border-cream-dark bg-white p-8 text-center">
            <p className="text-lg font-semibold text-navy">Plan your meals first.</p>
            <p className="mt-2 text-sm text-navy-muted">
              Add meals to your planner and your shopping list will auto-generate.
            </p>
            <Link
              href="/planner"
              className="mt-5 inline-block rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go to planner →
            </Link>
          </section>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
            <aside className="rounded-2xl border border-cream-dark bg-white p-4">
              <p className="text-sm font-semibold text-navy">Store split summary</p>
              <div className="mt-3 space-y-2">
                {basketByRetailer.map((retailer) => (
                  <div
                    key={retailer.retailerId}
                    className="flex items-center justify-between rounded-lg bg-cream px-3 py-2 text-sm"
                  >
                    <span className="text-navy">{RETAILER_NAMES[retailer.retailerId]}</span>
                    <span className="font-semibold text-navy">{formatPence(retailer.totalPence)}</span>
                  </div>
                ))}
                {basketByRetailer.length === 0 && (
                  <p className="text-xs text-navy-muted">No pricing estimate available yet.</p>
                )}
              </div>
            </aside>

            <section className="rounded-2xl border border-cream-dark bg-white p-4 md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-navy-muted">
                  {checkedCount} of {shoppingItems.length} items checked
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={checkAllForWeek}
                    className="rounded-lg border border-cream-dark bg-white px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-navy/25"
                  >
                    Check all
                  </button>
                  <button
                    onClick={clearCheckedForWeek}
                    className="rounded-lg border border-cream-dark bg-white px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-navy/25"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {shoppingByGroup.map(([group, items]) => (
                  <div key={group}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
                      {categoryLabel(group)}
                    </h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center justify-between rounded-lg border border-cream-dark px-3 py-2 text-sm"
                        >
                          <span className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checkedSet.has(item.key)}
                              onChange={() => toggleItem(item.key)}
                              className="h-4 w-4 accent-navy"
                            />
                            <span
                              className={
                                checkedSet.has(item.key)
                                  ? "text-navy-muted line-through"
                                  : "text-navy"
                              }
                            >
                              {item.name}
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block text-xs font-medium text-navy-muted">
                              {amountLabel(item.amount, item.unit)}
                            </span>
                            <span className="block text-[11px] text-teal">
                              {item.bestOfferRetailerId && item.bestOfferPence !== null
                                ? `Best: ${RETAILER_NAMES[item.bestOfferRetailerId]} ${formatPence(item.bestOfferPence)}`
                                : "No store price yet"}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
