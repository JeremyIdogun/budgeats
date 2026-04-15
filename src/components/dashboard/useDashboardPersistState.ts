"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  persistPlannerState,
  setLatestPlannerPersistState,
  type PlannerPersistState,
} from "@/lib/planner-persistence";

export function useDashboardPersistState(state: PlannerPersistState) {
  const latestState = useMemo<PlannerPersistState>(
    () => ({
      userId: state.userId,
      weekStartDate: state.weekStartDate,
      plan: state.plan,
      checkedItems: state.checkedItems,
      customMeals: state.customMeals,
      pantryItems: state.pantryItems,
      budgetNudgeDismissedForWeek: state.budgetNudgeDismissedForWeek,
      budgetOverridePence: state.budgetOverridePence,
      budgetOverrideWeekStartDate: state.budgetOverrideWeekStartDate,
    }),
    [
      state.userId,
      state.weekStartDate,
      state.plan,
      state.checkedItems,
      state.customMeals,
      state.pantryItems,
      state.budgetNudgeDismissedForWeek,
      state.budgetOverridePence,
      state.budgetOverrideWeekStartDate,
    ],
  );

  const latestDataRef = useRef<PlannerPersistState>(latestState);

  useEffect(() => {
    latestDataRef.current = latestState;
    setLatestPlannerPersistState(latestState);
  }, [latestState]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void persistPlannerState(latestState);
    }, 450);

    return () => clearTimeout(timeout);
  }, [latestState]);

  useEffect(() => {
    return () => {
      void persistPlannerState(latestDataRef.current);
    };
  }, []);
}
