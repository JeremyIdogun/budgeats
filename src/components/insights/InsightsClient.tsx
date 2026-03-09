"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { AppNav } from "@/components/navigation/AppNav";
import { useHydratedProfile } from "@/components/dashboard/useHydratedProfile";
import {
  MEAL_TYPES,
  RETAILER_NAMES,
  addDays,
  buildLibraryWeekPlan,
  isDashboardMealType,
  isoDate,
  startOfWeek,
  type DashboardClientCommonProps,
} from "@/lib/dashboard-client";
import { deriveMealCostPence } from "@/lib/budget";
import { generateShoppingList } from "@/lib/shopping";
import { useBudgeAtsStore, type BudgeAtsState } from "@/store";
import { selectPlannedMealCount, selectWeekSpendPence } from "@/store/selectors";
import { formatPence, poundsToPence } from "@/utils/currency";

interface PlannedMealCost {
  name: string;
  costPence: number;
}

export function InsightsClient({
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

  const { effectiveUser, householdSize, preferredRetailers, weeklyBudgetPence } =
    useHydratedProfile({
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

  const selectorState = useMemo<BudgeAtsState>(
    () => ({
      ...storeState,
      user: effectiveUser,
      currentWeekPlan: libraryWeekPlan,
      meals: dashboardLibraryMeals,
    }),
    [storeState, effectiveUser, libraryWeekPlan, dashboardLibraryMeals],
  );

  const spentPence = selectWeekSpendPence(selectorState);
  const plannedMealCount = selectPlannedMealCount(selectorState);

  const customMealById = useMemo(
    () => new Map(initialCustomMeals.map((meal) => [meal.id, meal])),
    [initialCustomMeals],
  );

  const plannedMealCosts = useMemo<PlannedMealCost[]>(() => {
    const items: PlannedMealCost[] = [];

    for (const day of weekDays) {
      for (const type of MEAL_TYPES) {
        const slotKey = `${isoDate(day)}:${type}`;
        const mealId = initialPlan[slotKey];
        if (!mealId) continue;

        const customMeal = customMealById.get(mealId);
        if (customMeal) {
          items.push({
            name: customMeal.name,
            costPence: poundsToPence(customMeal.cost),
          });
          continue;
        }

        const meal = libraryMealsById.get(mealId);
        if (!meal) continue;

        const retailer = meal.preferredRetailer ?? preferredRetailers[0] ?? "tesco";
        const cost = deriveMealCostPence(
          meal,
          storeState.ingredients,
          storeState.prices,
          retailer,
          householdSize,
        );

        if (cost === null) continue;

        items.push({
          name: meal.name,
          costPence: cost,
        });
      }
    }

    return items;
  }, [
    weekDays,
    initialPlan,
    customMealById,
    libraryMealsById,
    preferredRetailers,
    storeState.ingredients,
    storeState.prices,
    householdSize,
  ]);

  const mostExpensiveMeal = useMemo(
    () => plannedMealCosts.reduce((max, meal) => (meal.costPence > max.costPence ? meal : max), plannedMealCosts[0]),
    [plannedMealCosts],
  );

  const bestValueMeal = useMemo(
    () => plannedMealCosts.reduce((min, meal) => (meal.costPence < min.costPence ? meal : min), plannedMealCosts[0]),
    [plannedMealCosts],
  );

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

  const retailerSplit = useMemo(() => {
    const totals = preferredRetailers
      .map((retailerId) => ({
        retailerId,
        totalPence: generatedShoppingList.totalByRetailer[retailerId] ?? 0,
      }))
      .filter((entry) => entry.totalPence > 0)
      .sort((a, b) => b.totalPence - a.totalPence);

    const total = totals.reduce((sum, entry) => sum + entry.totalPence, 0);
    return totals.map((entry) => ({
      ...entry,
      pct: total > 0 ? Math.round((entry.totalPence / total) * 100) : 0,
    }));
  }, [preferredRetailers, generatedShoppingList.totalByRetailer]);

  const hasMeals = plannedMealCosts.length > 0;

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-7xl">
        <AppNav />

        <section className="mb-4">
          <h1 className="text-2xl font-semibold text-navy md:text-3xl">Insights</h1>
          <p className="text-sm text-navy-muted">Current week snapshot based on your plan.</p>
        </section>

        {!hasMeals ? (
          <section className="rounded-2xl border border-cream-dark bg-white p-8 text-center">
            <p className="text-lg font-semibold text-navy">
              No data yet. Plan your first week of meals to see insights.
            </p>
            <Link
              href="/planner"
              className="mt-5 inline-block rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go to planner →
            </Link>
          </section>
        ) : (
          <div className="space-y-4">
            <section className="rounded-2xl border border-cream-dark bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-navy-muted">
                Week Summary
              </h2>
              <p className="mt-2 text-xl font-semibold text-navy">
                This week: {formatPence(spentPence)} of {formatPence(weeklyBudgetPence)}
              </p>
              <p className="mt-1 text-sm text-navy-muted">{plannedMealCount} meals planned</p>
            </section>

            {mostExpensiveMeal && (
              <section className="rounded-2xl border border-cream-dark bg-white p-5">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-navy-muted">
                  Most Expensive Meal
                </h2>
                <p className="mt-2 text-sm text-navy">
                  💸 Your priciest meal this week: <strong>{mostExpensiveMeal.name}</strong> —{" "}
                  {formatPence(mostExpensiveMeal.costPence)}
                </p>
                <p className="mt-1 text-sm text-navy-muted">
                  That&apos;s {Math.round((mostExpensiveMeal.costPence / weeklyBudgetPence) * 100)}%
                  of your weekly budget.
                </p>
              </section>
            )}

            {bestValueMeal && (
              <section className="rounded-2xl border border-cream-dark bg-white p-5">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-navy-muted">
                  Best Value Meal
                </h2>
                <p className="mt-2 text-sm text-navy">
                  👍 Best value this week: <strong>{bestValueMeal.name}</strong> —{" "}
                  {formatPence(bestValueMeal.costPence)}
                </p>
              </section>
            )}

            {retailerSplit.length > 0 && generatedShoppingList.items.length > 0 && (
              <section className="rounded-2xl border border-cream-dark bg-white p-5">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-navy-muted">
                  Retailer Split
                </h2>
                <div className="mt-3 space-y-2">
                  {retailerSplit.map((entry) => (
                    <div key={entry.retailerId}>
                      <div className="mb-1 flex items-center justify-between text-sm text-navy">
                        <span>{RETAILER_NAMES[entry.retailerId]}</span>
                        <span>
                          {entry.pct}% · {formatPence(entry.totalPence)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-cream-dark">
                        <div
                          className="h-full rounded-full bg-teal"
                          style={{ width: `${Math.min(entry.pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
