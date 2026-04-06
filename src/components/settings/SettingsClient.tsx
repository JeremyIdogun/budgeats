"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/navigation/AppNav";
import { useHydratedProfile } from "@/components/dashboard/useHydratedProfile";
import { createClient } from "@/lib/supabase/client";
import {
  addDays,
  buildLibraryWeekPlan,
  isDashboardMealType,
  isoDate,
  startOfWeek,
} from "@/lib/dashboard-client";
import {
  BASE_MAX_BUDGET,
  MAX_BUFFER,
  MIN_BUDGET,
  STEP,
  roundUpToStep,
} from "@/components/onboarding/StepBudget";
import { DIETARY_PREFERENCES } from "@/components/onboarding/StepDietary";
import { HOUSEHOLD_OPTIONS } from "@/components/onboarding/StepHousehold";
import { RETAILER_OPTIONS } from "@/components/onboarding/StepRetailers";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useBudgeAtsStore } from "@/store";
import { useDecisionStore } from "@/store/decisions";
import { poundsToPence } from "@/utils/currency";
import type { BudgetPeriod, DietaryTag, RetailerId, UserProfile } from "@/models";
import type { DashboardClientCommonProps } from "@/lib/dashboard-client";

function arraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function normalizeDietary(value: string[]): DietaryTag[] {
  return value.filter(
    (item): item is DietaryTag =>
      item === "vegetarian" ||
      item === "vegan" ||
      item === "halal" ||
      item === "gluten-free" ||
      item === "dairy-free",
  );
}

function toInitialBudgetPounds(
  weeklyBudgetPence: number,
  budgetPeriod: BudgetPeriod,
): number {
  if (budgetPeriod === "monthly") {
    return Math.max(MIN_BUDGET, Math.round((weeklyBudgetPence * 4.33) / 100));
  }
  return Math.max(MIN_BUDGET, Math.round(weeklyBudgetPence / 100));
}

function buildUpdatedUser(base: UserProfile, patch: Partial<UserProfile>): UserProfile {
  return {
    ...base,
    ...patch,
    budget: {
      ...base.budget,
      ...(patch.budget ?? {}),
    },
    household: {
      ...base.household,
      ...(patch.household ?? {}),
    },
  };
}

export function SettingsClient({
  userId,
  initialPlan,
  profileRetailers,
  profileWeeklyBudgetPence,
  profileBudgetPeriod,
  profileHouseholdSize,
  profileDietaryPreferences,
  profileEmail,
  initialBudgetOverridePence,
  initialBudgetOverrideWeekStartDate,
}: DashboardClientCommonProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const { effectiveUser, weeklyBudgetPence, householdSize, preferredRetailers } =
    useHydratedProfile({
      userId,
      profileRetailers,
      profileWeeklyBudgetPence,
      profileBudgetPeriod,
      profileHouseholdSize,
      profileDietaryPreferences,
    });

  const storedUser = useBudgeAtsStore((state) => state.user);
  const setUser = useBudgeAtsStore((state) => state.setUser);
  const storeMeals = useBudgeAtsStore((state) => state.meals);
  const setCurrentWeekPlan = useBudgeAtsStore((state) => state.setCurrentWeekPlan);

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const weekKey = isoDate(weekStart);
  const persistedBudgetOverridePence =
    initialBudgetOverrideWeekStartDate === weekKey ? initialBudgetOverridePence : null;

  const dashboardLibraryMeals = useMemo(
    () => storeMeals.filter((meal) => isDashboardMealType(meal.type)),
    [storeMeals],
  );

  const libraryMealsById = useMemo(
    () => new Map(dashboardLibraryMeals.map((meal) => [meal.id, meal])),
    [dashboardLibraryMeals],
  );

  const weekPlan = useMemo(
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
    setCurrentWeekPlan(
      persistedBudgetOverridePence !== null
        ? { ...weekPlan, budgetOverridePence: persistedBudgetOverridePence }
        : weekPlan,
    );
  }, [persistedBudgetOverridePence, setCurrentWeekPlan, weekPlan]);

  const initialBudgetPeriod = profileBudgetPeriod ?? "weekly";

  const [budget, setBudget] = useState<number>(
    toInitialBudgetPounds(weeklyBudgetPence, initialBudgetPeriod),
  );
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>(initialBudgetPeriod);
  const [household, setHousehold] = useState<number>(householdSize);
  const [dietary, setDietary] = useState<string[]>(
    profileDietaryPreferences && profileDietaryPreferences.length > 0
      ? profileDietaryPreferences
      : ["none"],
  );
  const [retailers, setRetailers] = useState<RetailerId[]>(preferredRetailers);

  const [savingBudget, setSavingBudget] = useState(false);
  const [savingHousehold, setSavingHousehold] = useState(false);
  const [savingDietary, setSavingDietary] = useState(false);
  const [savingRetailers, setSavingRetailers] = useState(false);

  const [savedBudget, setSavedBudget] = useState(false);
  const [savedHousehold, setSavedHousehold] = useState(false);
  const [savedDietary, setSavedDietary] = useState(false);
  const [savedRetailers, setSavedRetailers] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const sliderMax = Math.max(BASE_MAX_BUDGET, roundUpToStep(budget + MAX_BUFFER));

  const initialDietary = useMemo(
    () =>
      profileDietaryPreferences && profileDietaryPreferences.length > 0
        ? profileDietaryPreferences
        : ["none"],
    [profileDietaryPreferences],
  );

  const dietaryChanged = useMemo(() => {
    const left = [...dietary].sort();
    const right = [...initialDietary].sort();
    return !arraysEqual(left, right);
  }, [dietary, initialDietary]);

  function currentUserForPatch() {
    return storedUser?.id === userId ? storedUser : effectiveUser;
  }

  function markSaved(setSaved: (value: boolean) => void) {
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  }

  async function saveBudgetSection() {
    setError(null);
    setSavingBudget(true);

    const weeklyBudgetPenceNext =
      budgetPeriod === "weekly"
        ? poundsToPence(budget)
        : Math.round((budget * 100) / 4.33);

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        weekly_budget_pence: weeklyBudgetPenceNext,
        budget_period: budgetPeriod,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSavingBudget(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    const nextUser = buildUpdatedUser(currentUserForPatch(), {
      budget: {
        amount: weeklyBudgetPenceNext,
        period: "weekly",
      },
    });
    setUser(nextUser);
    markSaved(setSavedBudget);
  }

  async function saveHouseholdSection() {
    setError(null);
    setSavingHousehold(true);

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        household_size: household,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSavingHousehold(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    const nextUser = buildUpdatedUser(currentUserForPatch(), {
      household: {
        size: household,
      },
    });
    setUser(nextUser);
    markSaved(setSavedHousehold);
  }

  async function saveDietarySection() {
    setError(null);
    setSavingDietary(true);

    const dietaryForDb = normalizeDietary(dietary);

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        dietary_preferences: dietaryForDb,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSavingDietary(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    const nextUser = buildUpdatedUser(currentUserForPatch(), {
      dietaryPreferences: dietaryForDb,
    });
    setUser(nextUser);
    markSaved(setSavedDietary);
  }

  async function saveRetailersSection() {
    if (retailers.length < 1) return;

    setError(null);
    setSavingRetailers(true);

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        preferred_retailer_ids: retailers,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSavingRetailers(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    const nextUser = buildUpdatedUser(currentUserForPatch(), {
      preferredRetailers: retailers,
    });
    setUser(nextUser);
    markSaved(setSavedRetailers);
  }

  function toggleDietary(pref: string) {
    if (pref === "none") {
      setDietary(["none"]);
      return;
    }

    const withoutNone = dietary.filter((item) => item !== "none");
    if (withoutNone.includes(pref)) {
      setDietary(withoutNone.filter((item) => item !== pref));
      return;
    }

    setDietary([...withoutNone, pref]);
  }

  function toggleRetailer(retailerId: RetailerId) {
    setRetailers((prev) =>
      prev.includes(retailerId)
        ? prev.filter((item) => item !== retailerId)
        : [...prev, retailerId],
    );
  }

  function handleDeleteLocalData() {
    useBudgeAtsStore.getState().clearUserSession();
    useDecisionStore.getState().setActiveUser(null);
    useOnboardingStore.getState().reset();
    localStorage.removeItem("budgeats-storage");
    localStorage.removeItem("loavish-decisions");
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-7xl">
        <AppNav />

        <section className="mb-4">
          <h1 className="text-2xl font-extrabold text-navy md:text-3xl">Settings</h1>
          <p className="text-sm text-navy-muted">Update your profile preferences.</p>
        </section>

        {error && (
          <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <section className="rounded-lg border border-cream-dark bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-navy-muted">Budget</h2>
            <div className="mt-4 text-center">
              <div className="font-heading text-5xl font-extrabold text-navy tracking-tight">
                <span className="text-coral text-3xl align-super">£</span>
                {budget}
              </div>
              <p className="text-xs text-navy-muted">
                per {budgetPeriod === "weekly" ? "week" : "month"}
              </p>
            </div>

            <input
              type="range"
              min={MIN_BUDGET}
              max={sliderMax}
              step={STEP}
              value={budget}
              onChange={(event) => setBudget(parseInt(event.target.value, 10))}
              className="budget-range mt-4"
            />

            <div className="mt-2 flex justify-between text-xs text-navy-muted">
              <span>£{MIN_BUDGET}</span>
              <span>£{sliderMax}</span>
            </div>

            <label className="mt-4 block text-sm text-navy">
              Exact amount (£)
              <input
                type="number"
                min={MIN_BUDGET}
                step={1}
                value={budget}
                onChange={(event) => setBudget(parseInt(event.target.value, 10))}
                className="mt-2 w-full rounded-lg border border-cream-dark bg-white px-3 py-2.5 text-sm text-navy outline-none transition-colors duration-150 focus:border-navy/30"
              />
            </label>

            <div className="mt-4 flex w-fit gap-1 rounded-lg bg-cream p-1">
              {(["weekly", "monthly"] as BudgetPeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setBudgetPeriod(period)}
                  className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors duration-150 ${
                    budgetPeriod === period
                      ? "border border-cream-dark bg-white text-navy"
                      : "text-navy-muted hover:text-navy"
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={saveBudgetSection}
                disabled={savingBudget}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingBudget ? "Saving..." : "Save"}
              </button>
              {savedBudget && <span className="text-sm text-teal">Saved ✓</span>}
            </div>
          </section>

          <section className="rounded-lg border border-cream-dark bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-navy-muted">Household</h2>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {HOUSEHOLD_OPTIONS.map(({ size, label }) => (
                <button
                  key={size}
                  onClick={() => setHousehold(size)}
                  className={`aspect-square rounded-lg border-2 text-xl font-bold transition-colors duration-150 ${
                    household === size
                      ? "border-teal bg-teal/10 text-navy"
                      : "border-cream-dark bg-white text-navy-muted hover:border-teal/40"
                  }`}
                >
                  {size === 5 ? "5+" : size}
                  <span className="block text-[10px] font-normal">{label}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={saveHouseholdSection}
                disabled={savingHousehold}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingHousehold ? "Saving..." : "Save"}
              </button>
              {savedHousehold && <span className="text-sm text-teal">Saved ✓</span>}
            </div>
          </section>

          <section className="rounded-lg border border-cream-dark bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-navy-muted">
              Dietary Preferences
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {DIETARY_PREFERENCES.map(({ id, emoji, label }) => {
                const selected = dietary.includes(id) && !dietary.includes("none");
                return (
                  <button
                    key={id}
                    onClick={() => toggleDietary(id)}
                    className={`rounded-full border-2 px-5 py-3 text-sm font-medium transition-colors duration-150 ${
                      selected
                        ? "border-coral bg-coral/10 text-navy"
                        : "border-cream-dark bg-white text-navy-muted hover:border-coral/40"
                    }`}
                  >
                    <span className="mr-1">{emoji}</span>
                    {label}
                  </button>
                );
              })}
              <button
                onClick={() => toggleDietary("none")}
                className={`rounded-full border-2 px-5 py-3 text-sm font-medium transition-colors duration-150 ${
                  dietary.includes("none")
                    ? "border-navy-muted bg-cream text-navy"
                    : "border-cream-dark bg-white text-navy-muted hover:border-navy-muted/40"
                }`}
              >
                ✓ No preference
              </button>
            </div>

            {dietaryChanged && (
              <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-xs text-navy">
                Changing this will re-filter your meal suggestions.
              </p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={saveDietarySection}
                disabled={savingDietary}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingDietary ? "Saving..." : "Save"}
              </button>
              {savedDietary && <span className="text-sm text-teal">Saved ✓</span>}
            </div>
          </section>

          <section className="rounded-lg border border-cream-dark bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-navy-muted">
              Preferred Retailers
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {RETAILER_OPTIONS.map(({ id, label, initial, bg, color }) => {
                const isSelected = retailers.includes(id as RetailerId);
                return (
                  <button
                    key={id}
                    onClick={() => toggleRetailer(id as RetailerId)}
                    className={`rounded-lg border-2 p-4 text-sm font-medium transition-colors duration-150 ${
                      isSelected
                        ? "border-teal bg-teal/10 text-navy"
                        : "border-cream-dark bg-white text-navy-muted hover:border-teal/40"
                    }`}
                  >
                    <div
                      className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg text-lg font-extrabold"
                      style={{ background: bg, color }}
                    >
                      {initial}
                    </div>
                    {label}
                  </button>
                );
              })}
            </div>

            {retailers.length < 1 && (
              <p className="mt-3 text-xs text-danger">Select at least one retailer.</p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={saveRetailersSection}
                disabled={savingRetailers || retailers.length < 1}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingRetailers ? "Saving..." : "Save"}
              </button>
              {savedRetailers && <span className="text-sm text-teal">Saved ✓</span>}
            </div>
          </section>

          <section className="rounded-lg border border-cream-dark bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-navy-muted">Account</h2>
            <p className="mt-2 text-sm text-navy">
              Email: <span className="font-medium">{profileEmail ?? "Unknown"}</span>
            </p>
            <button
              onClick={handleDeleteLocalData}
              className="mt-4 rounded-lg border border-danger px-4 py-2 text-sm font-semibold text-danger"
            >
              Delete all my data
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
