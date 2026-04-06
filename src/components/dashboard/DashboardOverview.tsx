"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { AppNav } from "@/components/navigation/AppNav";
import { useDashboardPersistState } from "@/components/dashboard/useDashboardPersistState";
import { WeeklyBudgetNudge } from "@/components/dashboard/WeeklyBudgetNudge";
import { useHydratedProfile } from "@/components/dashboard/useHydratedProfile";
import { LogismosCard } from "@/components/logismos/LogismosCard";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/ui/PageShell";
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
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function DashboardOverview({
  userId,
  initialPlan,
  initialCheckedItems,
  initialCustomMeals,
  initialPantryItems,
  initialBudgetNudgeDismissedForWeek,
  initialBudgetOverridePence,
  initialBudgetOverrideWeekStartDate,
  profileRetailers,
  profileWeeklyBudgetPence,
  profileBudgetPeriod,
  profileHouseholdSize,
  profileDietaryPreferences,
}: DashboardClientCommonProps) {
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
  const setPantryItems = useBudgeAtsStore((state) => state.setPantryItems);
  const setBudgetNudgeDismissedForWeek = useBudgeAtsStore(
    (state) => state.setBudgetNudgeDismissedForWeek,
  );

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekKey = isoDate(weekStart);
  const persistedBudgetOverridePence =
    initialBudgetOverrideWeekStartDate === weekKey ? initialBudgetOverridePence : null;

  useEffect(() => {
    setPantryItems(initialPantryItems);
    setBudgetNudgeDismissedForWeek(initialBudgetNudgeDismissedForWeek);
  }, [
    initialPantryItems,
    initialBudgetNudgeDismissedForWeek,
    setPantryItems,
    setBudgetNudgeDismissedForWeek,
  ]);

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
        : persistedBudgetOverridePence !== null
          ? { ...libraryWeekPlan, budgetOverridePence: persistedBudgetOverridePence }
        : libraryWeekPlan;

    setCurrentWeekPlan(weekPlanWithOverride);
  }, [
    libraryWeekPlan,
    setCurrentWeekPlan,
    storeWeekStartDate,
    storeBudgetOverridePence,
    persistedBudgetOverridePence,
  ]);

  const effectiveWeekPlan =
    storeState.currentWeekPlan?.weekStartDate === weekKey ? storeState.currentWeekPlan : libraryWeekPlan;

  useDashboardPersistState({
    userId,
    plan: initialPlan,
    checkedItems: initialCheckedItems,
    customMeals: initialCustomMeals,
    pantryItems: storeState.pantryItems,
    budgetNudgeDismissedForWeek: storeState.budgetNudgeDismissedForWeek,
    budgetOverridePence:
      effectiveWeekPlan.weekStartDate === weekKey
        ? effectiveWeekPlan.budgetOverridePence ?? persistedBudgetOverridePence
        : persistedBudgetOverridePence,
    budgetOverrideWeekStartDate:
      (
        effectiveWeekPlan.weekStartDate === weekKey
          ? effectiveWeekPlan.budgetOverridePence ?? persistedBudgetOverridePence
          : persistedBudgetOverridePence
      ) !== null
        ? weekKey
        : null,
  });

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
    <PageShell>
      <AppNav />

        <WeeklyBudgetNudge weekStartDate={weekKey} defaultBudgetPence={weeklyBudgetPence} />

        <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
          <Card as="section" className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-muted">
              Weekly budget
            </p>
            <div className="mt-5">
              <div className="h-1 rounded-full bg-cream-dark">
                <div
                  className={`h-1 rounded-full ${budgetColorClass} transition-opacity duration-150`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold text-navy">{Math.round(utilisationPct)}% used</p>
            <p className="mt-2 text-sm text-navy-muted">
              {remainingPence >= 0
                ? `${formatPence(remainingPence)} remaining`
                : `${formatPence(Math.abs(remainingPence))} over budget`}
            </p>
          </Card>

          {plannedMealCount === 0 ? (
            <Card as="section" padding="lg" className="text-center">
              <p className="text-lg font-semibold text-navy">No meals planned yet</p>
              <p className="mt-2 text-sm text-navy-muted">
                Add meals to your weekly plan to see your budget breakdown here.
              </p>
              <Link
                href="/planner"
                className={buttonClasses({ variant: "primary", size: "md", className: "mt-5" })}
              >
                Go to planner
              </Link>
            </Card>
          ) : (
            <Card as="section" className="md:p-5">
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
                          ? "border-navy/25 bg-navy/3"
                          : "border-cream-dark bg-cream/40 hover:border-navy/25"
                      }`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-navy-muted">
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
            </Card>
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

        <Card as="section" className="mt-5">
          {alertState === "under-planned" && (
            <div className="flex flex-wrap items-start justify-between gap-4 border-l-2 border-amber-400 pl-4">
              <p className="text-sm text-navy">
                You&apos;ve planned {plannedMealCount} meals this week. Aim for at least 14 to stay within your{" "}
                {formatPence(effectiveBudgetPence)} budget.
              </p>
              <Link href="/planner" className={buttonClasses({ variant: "primary", size: "sm" })}>
                Finish planning
              </Link>
            </div>
          )}

          {alertState === "on-track" && (
            <div className="flex flex-wrap items-start justify-between gap-4 border-l-2 border-teal pl-4">
              <p className="text-sm text-navy">
                {plannedMealCount} meals planned, {formatPence(remainingPence)} still available.
              </p>
              <Link href="/shopping" className={buttonClasses({ variant: "secondary", size: "sm" })}>
                View shopping list
              </Link>
            </div>
          )}

          {alertState === "over-budget" && (
            <div className="flex flex-wrap items-start justify-between gap-4 border-l-2 border-danger pl-4">
              <p className="text-sm text-navy">
                {formatPence(overagePence)} over budget. Remove a meal or try a cheaper swap.
              </p>
              <Link href="/planner" className={buttonClasses({ variant: "danger", size: "sm" })}>
                Edit meals
              </Link>
            </div>
          )}
        </Card>
    </PageShell>
  );
}
