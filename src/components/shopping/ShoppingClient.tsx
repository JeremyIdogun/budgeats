"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppNav } from "@/components/navigation/AppNav";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/ui/PageShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { trackEvent } from "@/lib/analytics";
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

const PRICES_LAST_UPDATED = "1 Mar 2026";

interface DashboardShoppingItem {
  key: string;
  name: string;
  amount: number;
  unit: string;
  group: string;
  bestOfferRetailerId: RetailerId | null;
  bestOfferPence: number | null;
  productUrl?: string;
  substituteSuggestion?: string | null;
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
    productUrl: item.productUrl,
    substituteSuggestion: item.substituteSuggestion ?? null,
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
  const [copied, setCopied] = useState(false);
  const basketComparedTrackedRef = useRef(false);
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

  async function handleCopyList() {
    const uncheckedItems = shoppingItems.filter((item) => !checkedSet.has(item.key));
    const groupedUnchecked = CATEGORY_ORDER.map((category) => [
      category,
      uncheckedItems.filter((item) => item.group === category),
    ] as const).filter(([, items]) => items.length > 0);

    const lines: string[] = [`Shopping list — week of ${weekHeading}`, ""];

    for (const [category, items] of groupedUnchecked) {
      lines.push(categoryLabel(category).toUpperCase());
      for (const item of items) {
        const bestPriceText =
          item.bestOfferRetailerId && item.bestOfferPence !== null
            ? ` (${RETAILER_NAMES[item.bestOfferRetailerId]}, ${formatPence(item.bestOfferPence)})`
            : "";
        lines.push(`- ${item.name} — ${amountLabel(item.amount, item.unit)}${bestPriceText}`);
      }
      lines.push("");
    }

    lines.push(`Estimated total: ${formatPence(estimatedTotalPence)}`);
    lines.push("Generated by Loavish");

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
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

  useEffect(() => {
    if (basketComparedTrackedRef.current) return;
    if (shoppingItems.length === 0) return;

    basketComparedTrackedRef.current = true;
    trackEvent("basket_compared", {
      retailer_count: basketByRetailer.length,
      cheapest_total_pence: basketByRetailer[0]?.totalPence ?? 0,
      savings_delta_pence: savingsPence,
      item_count: shoppingItems.length,
    });
  }, [basketByRetailer, savingsPence, shoppingItems]);

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
    <PageShell>
      <AppNav />

      <SectionHeader
        title="Shopping list"
        description={`Week of ${weekHeading}`}
        actions={
          <Card padding="sm" className="w-full max-w-[340px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-muted">
              Estimated total
            </p>
            <p className="mt-1 text-sm font-semibold text-navy">{formatPence(estimatedTotalPence)}</p>
            <p className="mt-1 text-xs text-navy-muted">
              Prices last updated {PRICES_LAST_UPDATED}. Estimates only.
            </p>
            {savingsPence > 0 && topSplitRetailers.length >= 2 && (
              <p className="mt-1 text-xs text-teal">
                Save {formatPence(savingsPence)} by splitting between {topSplitRetailers[0]} +{" "}
                {topSplitRetailers[1]}
              </p>
            )}
          </Card>
        }
      />

      {plannedSlotCount === 0 || shoppingItems.length === 0 ? (
        <Card as="section" padding="lg" className="text-center">
          <p className="text-lg font-semibold text-navy">Plan your meals first.</p>
          <p className="mt-2 text-sm text-navy-muted">
            Add meals to your planner and your shopping list will auto-generate.
          </p>
          <Link
            href="/planner"
            className={buttonClasses({ variant: "primary", size: "md", className: "mt-5" })}
          >
            Go to planner
          </Link>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
          <Card as="aside" className="h-fit xl:sticky xl:top-6">
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
          </Card>

          <Card as="section" className="md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-navy-muted">
                {checkedCount} of {shoppingItems.length} items checked
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={checkAllForWeek}>
                  Check all
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={clearCheckedForWeek}>
                  Clear
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={handleCopyList}>
                  {copied ? "Copied!" : "Copy list"}
                </Button>
              </div>
            </div>

            <div className="space-y-5">
              {shoppingByGroup.map(([group, items]) => (
                <div key={group}>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-navy-muted">
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
                                ? "flex items-center gap-2 text-navy-muted line-through"
                                : "flex items-center gap-2 text-navy"
                            }
                          >
                            {item.name}
                            {storeState.pantryItems[item.key.split("|")[0]] && (
                              <span className="rounded-full bg-teal/10 px-2 py-0.5 text-xs font-medium text-teal no-underline">
                                In pantry
                              </span>
                            )}
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
                          {item.substituteSuggestion && (
                            <span className="block text-[11px] text-coral">{item.substituteSuggestion}</span>
                          )}
                          {item.productUrl && (
                            <a
                              href={item.productUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-[11px] text-navy underline underline-offset-2"
                            >
                              Open product
                            </a>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
