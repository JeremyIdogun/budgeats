"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { deriveMealCostPence } from "@/lib/budget";
import { trackEvent } from "@/lib/analytics";
import { launchFlags } from "@/lib/launch-flags";
import { generateRecommendation, type CookableMeal } from "@/lib/logismos";
import { POINTS } from "@/lib/points";
import { getTodayDayIndex } from "@/lib/planner";
import { getPlannerSessionPlan, setPlannerSessionPlan } from "@/lib/planner-persistence";
import type { Ingredient, IngredientPrice, Meal, MealType } from "@/models";
import type { ContextSignals, DecisionLogEntry, LogismosRecommendation } from "@/models/logismos";
import { useBudgeAtsStore } from "@/store";
import {
  selectBudgetRemainingPence,
  selectDaysRemainingInWeek,
  selectWasteRiskIngredientIds,
} from "@/store/selectors";
import { useDecisionStore } from "@/store/decisions";
import { formatPence } from "@/utils/currency";

interface LogismosCardProps {
  householdSize: number;
  weeklyBudgetPence: number;
  cookableMeals: Meal[];
}

function mealTypeForHour(hour: number): MealType {
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  return "dinner";
}

function computeCost(
  meal: Meal,
  ingredients: Ingredient[],
  prices: IngredientPrice[],
  householdSize: number,
  preferredRetailer: string,
): number {
  return (
    deriveMealCostPence(
      meal,
      ingredients,
      prices,
      preferredRetailer as Parameters<typeof deriveMealCostPence>[3],
      householdSize,
    ) ?? 0
  );
}

export function LogismosCard({ householdSize, weeklyBudgetPence, cookableMeals }: LogismosCardProps) {
  const store = useBudgeAtsStore();
  const addDecisionEntry = useDecisionStore((s) => s.addEntry);
  const setStoreRecommendation = useBudgeAtsStore((s) => s.setRecommendation);

  const [toast, setToast] = useState<string | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const viewedRecommendationsRef = useRef<Set<string>>(new Set());

  const selectorState = useMemo(
    () => ({
      ...store,
      user: store.user
        ? { ...store.user, budget: { ...store.user.budget, amount: weeklyBudgetPence } }
        : store.user,
    }),
    [store, weeklyBudgetPence],
  );

  const budgetRemainingPence = selectBudgetRemainingPence(selectorState);
  const daysRemainingInWeek = selectDaysRemainingInWeek();
  const wasteRiskIngredients = useMemo(
    () => (launchFlags.wasteRiskDetection ? selectWasteRiskIngredientIds(store) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.pantryItems],
  );

  const now = new Date();
  const hourOfDay = now.getHours();
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0

  const preferredRetailer = store.user?.preferredRetailers[0] ?? "tesco";

  const cookableMealsWithCost = useMemo<CookableMeal[]>(() => {
    return cookableMeals
      .map((meal) => ({
        ...meal,
        estimatedCostPence: computeCost(
          meal,
          store.ingredients,
          store.prices,
          householdSize,
          preferredRetailer,
        ),
      }))
      .filter((m) => m.estimatedCostPence <= budgetRemainingPence);
  }, [cookableMeals, store.ingredients, store.prices, householdSize, preferredRetailer, budgetRemainingPence]);

  const contextSignals = useMemo<ContextSignals>(
    () => ({
      calendarEventSoon: launchFlags.calendarSync ? false : false, // gated by launchFlags.calendarSync
      timeWindowMinutes: 120, // default until calendar sync lands
      energyLevel: store.energyLevel,
      wasteRiskIngredients,
      budgetRemainingPence,
      daysRemainingInWeek,
      dayOfWeek,
      hourOfDay,
    }),
    [
      store.energyLevel,
      wasteRiskIngredients,
      budgetRemainingPence,
      daysRemainingInWeek,
      dayOfWeek,
      hourOfDay,
    ],
  );

  const localRecommendation = useMemo(
    () => generateRecommendation(contextSignals, cookableMealsWithCost, householdSize),
    [
      contextSignals,
      cookableMealsWithCost,
      householdSize,
    ],
  );

  const recommendationRequestKey = useMemo(
    () =>
      JSON.stringify({
        contextSignals,
        cookableMealIds: cookableMealsWithCost.map((meal) => meal.id),
        householdSize,
      }),
    [contextSignals, cookableMealsWithCost, householdSize],
  );
  const [apiRecommendation, setApiRecommendation] = useState<{
    key: string;
    value: LogismosRecommendation;
  } | null>(null);
  const recommendation =
    apiRecommendation?.key === recommendationRequestKey
      ? apiRecommendation.value
      : localRecommendation;

  useEffect(() => {
    let cancelled = false;

    async function fetchRecommendation() {
      try {
        const response = await fetch("/api/logismos/recommendation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contextSignals,
            cookableMeals: cookableMealsWithCost,
            householdSize,
          }),
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { data?: LogismosRecommendation };
        if (!cancelled && payload.data) {
          setApiRecommendation({
            key: recommendationRequestKey,
            value: payload.data,
          });
        }
      } catch {
        // Fall back to local recommendation when network/API fails.
      }
    }

    void fetchRecommendation();
    return () => {
      cancelled = true;
    };
  }, [
    contextSignals,
    cookableMealsWithCost,
    householdSize,
    recommendationRequestKey,
  ]);

  useEffect(() => {
    setStoreRecommendation(recommendation);
  }, [recommendation, setStoreRecommendation]);

  useEffect(() => {
    const recommendationKey = `${recommendation.generatedAt}:${recommendation.mealId ?? recommendation.type}`;
    if (viewedRecommendationsRef.current.has(recommendationKey)) return;
    viewedRecommendationsRef.current.add(recommendationKey);

    trackEvent("recommendation_viewed", {
      decision_type: recommendation.type,
      confidence_band: recommendation.confidenceBand,
      projected_savings_pence: recommendation.savingPence,
      meal_id: recommendation.mealId,
    });
  }, [recommendation]);

  const recommendedMeal = useMemo(
    () => cookableMealsWithCost.find((m) => m.id === recommendation.mealId) ?? null,
    [cookableMealsWithCost, recommendation.mealId],
  );

  // Alternatives: other cookable meals excluding the recommended one
  const alternatives = useMemo(
    () => cookableMealsWithCost.filter((m) => m.id !== recommendation.mealId).slice(0, 3),
    [cookableMealsWithCost, recommendation.mealId],
  );

  const [dismissed, setDismissed] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function buildEntry(accepted: boolean, mealId: string | null, costPence: number, points: number): DecisionLogEntry {
    return {
      decision_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      recommendation_type: recommendation.type,
      recommendation_accepted: accepted,
      meal_id: mealId,
      estimated_cost_pence: costPence,
      actual_cost_pence: null,
      saving_pence: accepted ? recommendation.savingPence : null,
      context_signals: recommendation.contextSignals,
      points_awarded: points,
    };
  }

  async function handleAccept(meal: CookableMeal | null) {
    const isCook = meal !== null;
    const fallbackPoints: number = isCook
      ? POINTS.ACCEPT_COOK_RECOMMENDATION
      : POINTS.ACCEPT_EAT_OUT_RECOMMENDATION;
    let awardedPoints = fallbackPoints;
    let acceptApiSucceeded = false;

    try {
      const response = await fetch("/api/logismos/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationType: recommendation.type,
          recommendationJson: recommendation,
          explanation: recommendation.reason,
          addedMealToPlan: isCook,
        }),
      });
      if (response.ok) {
        acceptApiSucceeded = true;
        const payload = (await response.json()) as {
          data?: { pointsAwarded?: number };
        };
        awardedPoints = payload.data?.pointsAwarded ?? fallbackPoints;
      }
    } catch {
      awardedPoints = fallbackPoints;
    }

    const costPence = meal?.estimatedCostPence ?? recommendation.eatOutEstimatePence;
    const entry = buildEntry(true, meal?.id ?? null, costPence, awardedPoints);

    store.acceptRecommendation();
    store.addPoints(awardedPoints);
    addDecisionEntry(entry);

    if (isCook && meal) {
      const todayIndex = getTodayDayIndex(store.currentWeekPlan?.weekStartDate ?? "");
      const mealType = mealTypeForHour(hourOfDay);
      if (todayIndex >= 0) {
        store.addPlannedMeal(todayIndex, mealType, {
          mealId: meal.id,
          retailerId: preferredRetailer as Parameters<typeof store.addPlannedMeal>[2]["retailerId"],
          portions: householdSize,
        });

        // Sync into the planner session cache so DashboardClient picks it up on next mount
        const weekStartDate = store.currentWeekPlan?.weekStartDate;
        const userId = store.user?.id;
        if (weekStartDate && userId) {
          const todayDateObj = new Date(`${weekStartDate}T00:00:00Z`);
          todayDateObj.setUTCDate(todayDateObj.getUTCDate() + todayIndex);
          const slotKey = `${todayDateObj.toISOString().split("T")[0]}:${mealType}`;
          const currentPlan = getPlannerSessionPlan(weekStartDate, userId) ?? {};
          setPlannerSessionPlan(weekStartDate, userId, { ...currentPlan, [slotKey]: meal.id });
        }
      }
      showToast(`Meal added to your plan. +${awardedPoints} pts!`);
    } else {
      showToast(`Noted! +${awardedPoints} pts!`);
    }

    if (acceptApiSucceeded) {
      trackEvent("recommendation_accepted", {
        decision_type: recommendation.type,
        meal_id: meal?.id ?? null,
        cost_pence: meal?.estimatedCostPence ?? recommendation.eatOutEstimatePence,
        points_awarded: awardedPoints,
      });
    }

    setDismissed(true);
  }

  async function handleDismiss() {
    try {
      await fetch("/api/logismos/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationType: recommendation.type,
          recommendationJson: recommendation,
          explanation: recommendation.reason,
        }),
      });
    } catch {
      // noop - keep local UX flow
    }
    store.dismissRecommendation();
    trackEvent("recommendation_overridden", {
      decision_type: recommendation.type,
      override_reason: "user_dismissed",
    });
    setShowAlternatives(true);
  }

  if (dismissed) return null;

  const isCook = recommendation.type === "cook";
  const savingDisplay = recommendation.savingPence > 0 ? formatPence(recommendation.savingPence) : null;

  return (
    <div className="relative rounded-lg border border-cream-dark bg-white p-5">
      {/* Toast */}
      {toast && (
        <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-card">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
          Logismos Recommendation
        </p>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isCook ? "bg-teal/10 text-teal" : "bg-coral/10 text-coral"
            }`}
          >
            {isCook ? "Cook" : "Eat out"}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              recommendation.confidenceBand === "high"
                ? "bg-teal/10 text-teal"
                : recommendation.confidenceBand === "medium"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-cream-dark text-navy-muted"
            }`}
          >
            {recommendation.confidenceBand} confidence
          </span>
        </div>
      </div>

      {!showAlternatives ? (
        <>
          {/* Main recommendation */}
          <div className="mt-4">
            {isCook && recommendedMeal ? (
              <>
                <p className="text-lg font-semibold text-navy">
                  {recommendedMeal.emoji} {recommendedMeal.name}
                </p>
                <p className="mt-1 text-sm text-navy-muted">
                  {formatPence(recommendedMeal.estimatedCostPence)} · {recommendedMeal.prepTimeMinutes} min
                  {savingDisplay && (
                    <span className="ml-2 font-semibold text-teal">saves {savingDisplay}</span>
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-navy">Eat out tonight</p>
                <p className="mt-1 text-sm text-navy-muted">
                  Est. {formatPence(recommendation.eatOutEstimatePence)}
                </p>
              </>
            )}
            <ul className="mt-2 space-y-1">
              {recommendation.topFactors.map((factor, i) => (
                <li key={`${factor}-${i}`} className="flex items-start gap-1.5 text-sm text-navy">
                  <span className="mt-0.5 text-teal">·</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Budget impact bar */}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-navy-muted">
              <span>Budget impact</span>
              <span>
                {formatPence(
                  isCook && recommendedMeal
                    ? recommendedMeal.estimatedCostPence
                    : recommendation.eatOutEstimatePence,
                )}{" "}
                of {formatPence(weeklyBudgetPence)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-cream-dark">
              <div
                className="h-full rounded-full bg-teal transition-all"
                style={{
                  width: weeklyBudgetPence > 0
                    ? `${Math.min(
                        ((isCook && recommendedMeal
                          ? recommendedMeal.estimatedCostPence
                          : recommendation.eatOutEstimatePence) /
                          weeklyBudgetPence) *
                          100,
                        100,
                      )}%`
                    : "0%",
                }}
              />
            </div>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-navy-muted underline">
              View assumptions
            </summary>
            <div className="mt-2 space-y-0.5 text-xs text-navy-muted">
              <p>Household size: {recommendation.assumptions.householdSize}</p>
              <p>Energy: {recommendation.assumptions.energyLevel ?? "not set"}</p>
              <p>Days left in week: {recommendation.assumptions.daysRemainingInWeek}</p>
              <p>Budget remaining: {formatPence(recommendation.assumptions.budgetRemainingPence)}</p>
              <p>Eat-out baseline: {recommendation.assumptions.eatOutBaseline}</p>
            </div>
          </details>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleAccept(isCook ? recommendedMeal : null)}
              className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172744]"
            >
              {isCook ? "Add to plan" : "Got it"}
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg border border-cream-dark px-4 py-2.5 text-sm font-semibold text-navy-muted transition hover:border-navy/25"
            >
              Show alternatives
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Alternatives panel */}
          <div className="mt-4">
            <p className="text-sm font-semibold text-navy">Other options</p>
            {alternatives.length === 0 ? (
              <p className="mt-2 text-sm text-navy-muted">No other cookable meals available right now.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {alternatives.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between rounded-lg border border-cream-dark px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-navy">
                        {meal.emoji} {meal.name}
                      </p>
                      <p className="text-xs text-navy-muted">
                        {formatPence(meal.estimatedCostPence)} · {meal.prepTimeMinutes} min
                      </p>
                    </div>
                    <button
                      onClick={() => handleAccept(meal)}
                      className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#172744]"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
