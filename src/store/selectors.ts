import {
  deriveBudgetRemainingPence,
  deriveBudgetUtilisationPct,
  deriveWeekTotalPence,
} from "@/lib/budget";
import { getTodayDayIndex } from "@/lib/planner";
import { generateShoppingList } from "@/lib/shopping";
import type { DayPlan, RetailerId } from "@/models";
import type { BudgeAtsState } from "@/store";

export const selectWeekSpendPence = (state: BudgeAtsState): number => {
  if (!state.user || !state.currentWeekPlan) return 0;

  return deriveWeekTotalPence(
    state.currentWeekPlan,
    state.meals,
    state.ingredients,
    state.prices,
    state.user.household.size,
  );
};

// Returns this week's budget: override if set, otherwise profile default
export const selectEffectiveWeeklyBudgetPence = (state: BudgeAtsState): number => {
  return state.currentWeekPlan?.budgetOverridePence ?? state.user?.budget.amount ?? 0;
};

export const selectBudgetRemainingPence = (state: BudgeAtsState): number => {
  if (!state.user) return 0;
  const spent = selectWeekSpendPence(state);
  return deriveBudgetRemainingPence(selectEffectiveWeeklyBudgetPence(state), spent);
};

export const selectBudgetUtilisationPct = (state: BudgeAtsState): number => {
  const budget = selectEffectiveWeeklyBudgetPence(state);
  if (budget <= 0) return 0;
  const spent = selectWeekSpendPence(state);
  return deriveBudgetUtilisationPct(budget, spent);
};

export const selectCheapestRetailer = (state: BudgeAtsState): RetailerId | null => {
  if (!state.user || !state.currentWeekPlan) return null;

  const shoppingList = generateShoppingList(
    state.currentWeekPlan,
    state.meals,
    state.ingredients,
    state.prices,
    state.user,
  );

  const preferred = new Set(state.user.preferredRetailers);
  const sortedRetailers = (Object.entries(shoppingList.totalByRetailer) as Array<[
    RetailerId,
    number,
  ]>)
    .filter(([retailerId, total]) => preferred.has(retailerId) && total > 0)
    .sort((a, b) => a[1] - b[1]);

  return sortedRetailers[0]?.[0] ?? null;
};

export const selectPlannedMealCount = (state: BudgeAtsState): number => {
  if (!state.currentWeekPlan) return 0;
  return state.currentWeekPlan.days
    .flatMap((day) => Object.values(day))
    .filter(Boolean).length;
};

export const selectTodaysMeals = (state: BudgeAtsState): DayPlan => {
  if (!state.currentWeekPlan) return {};
  const todayIndex = getTodayDayIndex(state.currentWeekPlan.weekStartDate);
  return todayIndex >= 0 ? (state.currentWeekPlan.days[todayIndex] ?? {}) : {};
};

export const selectDaysRemainingInWeek = (): number => {
  const today = new Date().getDay(); // 0=Sun, week starts on Sunday
  return Math.max(1, 7 - today);
};

export const selectWasteRiskIngredientIds = (state: BudgeAtsState): string[] => {
  // Phase I stub: return empty array
  // Phase II: compare shopping list purchase dates against current date
  void state;
  return [];
};

export const selectDashboardAlertState = (
  state: BudgeAtsState,
): "under-planned" | "on-track" | "over-budget" => {
  const spent = selectWeekSpendPence(state);
  const budget = selectEffectiveWeeklyBudgetPence(state);
  const count = selectPlannedMealCount(state);
  if (budget > 0 && spent > budget) return "over-budget";
  if (count < 14) return "under-planned";
  return "on-track";
};
