"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { AppNav } from "@/components/navigation/AppNav";
import { useHydratedProfile } from "@/components/dashboard/useHydratedProfile";
import { LogismosCard } from "@/components/logismos/LogismosCard";
import { WeeklyBudgetNudge } from "@/components/dashboard/WeeklyBudgetNudge";
import {
  addDays,
  buildLibraryWeekPlan,
  isDashboardMealType,
  isoDate,
  startOfWeek,
  type DashboardClientCommonProps,
} from "@/lib/dashboard-client";
import { getTodayDayIndex } from "@/lib/planner";
import { useBudgeAtsStore, type BudgeAtsState } from "@/store";
import {
  selectBudgetUtilisationPct,
  selectDashboardAlertState,
  selectEffectiveWeeklyBudgetPence,
  selectPlannedMealCount,
  selectWeekSpendPence,
} from "@/store/selectors";
import { formatPence } from "@/utils/currency";

function getBudgetColorClass(utilisationPct: number): string {
  return utilisationPct >= 100 ? "bg-danger" : "bg-teal";
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { weekday: "short" });
}

function dateLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function DashboardOverview({
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
  void initialCustomMeals;

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

  const storeWeekStartDate = storeState.currentWeekPlan?.weekStartDate;
  const storeBudgetOverridePence = storeState.currentWeekPlan?.budgetOverridePence;

  useEffect(() => {
    const weekPlanWithOverride =
      storeWeekStartDate === libraryWeekPlan.weekStartDate && storeBudgetOverridePence !== undefined
        ? { ...libraryWeekPlan, budgetOverridePence: storeBudgetOverridePence }
        : libraryWeekPlan;

    setCurrentWeekPlan(weekPlanWithOverride);
  }, [libraryWeekPlan, setCurrentWeekPlan, storeWeekStartDate, storeBudgetOverridePence]);

  const effectiveWeekPlan =
    storeState.currentWeekPlan?.weekStartDate === weekKey
      ? storeState.currentWeekPlan
      : libraryWeekPlan;

  const selectorState = useMemo<BudgeAtsState>(
    () => ({
      ...storeState,
      user: effectiveUser,
      currentWeekPlan: effectiveWeekPlan,
      meals: dashboardLibraryMeals,
    }),
    [storeState, effectiveUser, effectiveWeekPlan, dashboardLibraryMeals],
  );

  const spentPence = selectWeekSpendPence(selectorState);
  const utilisationPct = selectBudgetUtilisationPct(selectorState);
  // Use the per-week override if the user has set one, otherwise fall back to the profile default
  const effectiveBudgetPence = selectEffectiveWeeklyBudgetPence(selectorState);
  const remainingPence = effectiveBudgetPence - spentPence;
  const plannedMealCount = selectPlannedMealCount(selectorState);
  const alertState = selectDashboardAlertState(selectorState);

  const budgetColorClass = getBudgetColorClass(utilisationPct);
  const progress = Math.min(Math.max(utilisationPct, 0), 100);

  const todayIndex = getTodayDayIndex(weekKey);

  const logismosEnabled = effectiveUser?.logismosEnabled !== false;

  const hourOfDay = new Date().getHours();
  const currentMealType = hourOfDay < 11 ? "breakfast" : hourOfDay < 16 ? "lunch" : "dinner";
  const cookableMealsForToday = useMemo(
    () =>
      dashboardLibraryMeals.filter((meal) => {
        if (meal.type !== currentMealType) return false;
        const userPrefs = effectiveUser?.dietaryPreferences ?? [];
        if (userPrefs.length === 0) return true;
        return userPrefs.every((pref) => meal.dietaryTags.includes(pref));
      }),
    [dashboardLibraryMeals, currentMealType, effectiveUser?.dietaryPreferences],
  );

  const overagePence = Math.max(spentPence - effectiveBudgetPence, 0);

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-7xl">
        <AppNav />

        <WeeklyBudgetNudge
          weekStartDate={weekKey}
          defaultBudgetPence={weeklyBudgetPence}
        />

        <div className="grid gap-5 lg:grid-cols-[340px_1fr] mt-5">
          <section className="rounded-lg border border-cream-dark bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
              Weekly Budget
            </p>
            <div className="mt-5">
              <div className="h-1 rounded-full bg-cream-dark">
                <div
                  className={`h-1 rounded-full ${budgetColorClass} transition-opacity duration-150`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="mt-4 text-center text-3xl font-semibold text-navy">
              {Math.round(utilisationPct)}% used
            </p>
            <p className="mt-2 text-center text-sm text-navy-muted">
              {remainingPence >= 0
                ? `${formatPence(remainingPence)} remaining`
                : `${formatPence(Math.abs(remainingPence))} over budget`}
            </p>
          </section>

          {plannedMealCount === 0 ? (
            <section className="rounded-lg border border-cream-dark bg-white p-8 text-center">
              <p className="text-lg font-semibold text-navy">No meals planned yet</p>
              <p className="mt-2 text-sm text-navy-muted">
                Add meals to your weekly plan to see your budget breakdown here.
              </p>
              <a
                href="/planner"
                className="mt-5 inline-block rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white"
              >
                Go to planner →
              </a>
            </section>
          ) : (
            <section className="rounded-lg border border-cream-dark bg-white p-4 md:p-5">
              <p className="text-sm font-semibold text-navy">Week summary</p>
              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
                {weekDays.map((date, index) => {
                  const mealCount = Object.values(effectiveWeekPlan.days[index]).filter(Boolean).length;
                  const isToday = todayIndex === index;

                  return (
                    <Link
                      key={isoDate(date)}
                      href="/planner"
                      className={`rounded-lg border px-3 py-3 transition-colors duration-150 ${
                        isToday
                          ? "border-teal bg-teal/5"
                          : "border-cream-dark bg-cream/40 hover:border-navy/25"
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-navy-muted">
                        {dayLabel(date)}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-navy">{dateLabel(date)}</p>
                      <p className="mt-3 text-xs text-navy-muted">
                        {mealCount} meal{mealCount === 1 ? "" : "s"}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {logismosEnabled && plannedMealCount >= 3 && (
          <section className="mt-5">
            <LogismosCard
              householdSize={householdSize}
              weeklyBudgetPence={effectiveBudgetPence}
              cookableMeals={cookableMealsForToday}
            />
          </section>
        )}

        <section className="mt-5 rounded-lg border border-cream-dark bg-white p-5">
          <p className="text-sm font-semibold text-navy">Quick actions</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Link
              href="/planner"
              className="rounded-lg bg-navy px-4 py-3 text-center text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#172744]"
            >
              + Add meals to this week
            </Link>
            <Link
              href="/shopping"
              className="rounded-lg border border-cream-dark bg-white px-4 py-3 text-center text-sm font-semibold text-navy transition-colors duration-150 hover:border-navy/25"
            >
              View shopping list
            </Link>
            <Link
              href="/insights"
              className="rounded-lg border border-cream-dark bg-white px-4 py-3 text-center text-sm font-semibold text-navy transition-colors duration-150 hover:border-navy/25"
            >
              See insights
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-cream-dark bg-white p-5">
          {alertState === "under-planned" && (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <p className="text-sm text-navy">
                <span className="mr-2">⚠️</span>
                You&apos;ve planned {plannedMealCount} meals this week. Aim for at least 14
                to stay within your {formatPence(effectiveBudgetPence)} budget.
              </p>
              <Link
                href="/planner"
                className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white"
              >
                Finish planning →
              </Link>
            </div>
          )}

          {alertState === "on-track" && (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <p className="text-sm text-navy">
                <span className="mr-2">✅</span>
                Great week ahead. {plannedMealCount} meals planned, {formatPence(remainingPence)}
                {" "}still available. Your shopping list is ready.
              </p>
              <Link
                href="/shopping"
                className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white"
              >
                View shopping list →
              </Link>
            </div>
          )}

          {alertState === "over-budget" && (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <p className="text-sm text-navy">
                <span className="mr-2">🔴</span>
                You&apos;re {formatPence(overagePence)} over your weekly budget. Remove a meal
                or try a cheaper swap.
              </p>
              <Link
                href="/planner"
                className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white"
              >
                Edit meals →
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
