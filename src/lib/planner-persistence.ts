"use client";

import { createClient } from "@/lib/supabase/client";

export interface PlannerPersistState {
  userId: string;
  plan: Record<string, string>;
  checkedItems: string[];
  customMeals: unknown[];
}

let _plannerCache: { weekKey: string; userId: string; plan: Record<string, string> } | null = null;
let _plannerPersistState: PlannerPersistState | null = null;

function summarizePersistError(error: unknown): Record<string, string | number> {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const value = error as Record<string, unknown>;
  const summary: Record<string, string | number> = {};

  if (typeof value.message === "string" && value.message) summary.message = value.message;
  if (typeof value.details === "string" && value.details) summary.details = value.details;
  if (typeof value.hint === "string" && value.hint) summary.hint = value.hint;
  if (typeof value.code === "string" && value.code) summary.code = value.code;
  if (typeof value.status === "number") summary.status = value.status;
  if (typeof value.statusText === "string" && value.statusText) {
    summary.statusText = value.statusText;
  }

  if (Object.keys(summary).length === 0) {
    summary.message = "Unknown persistence error";
  }

  return summary;
}

function clonePersistState(state: PlannerPersistState): PlannerPersistState {
  return {
    userId: state.userId,
    plan: { ...state.plan },
    checkedItems: [...state.checkedItems],
    customMeals: typeof structuredClone === "function"
      ? structuredClone(state.customMeals)
      : JSON.parse(JSON.stringify(state.customMeals)),
  };
}

export function getPlannerSessionPlan(weekKey: string, userId: string): Record<string, string> | null {
  if (
    _plannerCache &&
    _plannerCache.weekKey === weekKey &&
    _plannerCache.userId === userId &&
    Object.keys(_plannerCache.plan).length > 0
  ) {
    return _plannerCache.plan;
  }

  return null;
}

export function setPlannerSessionPlan(weekKey: string, userId: string, plan: Record<string, string>): void {
  _plannerCache = { weekKey, userId, plan };
}

export function setLatestPlannerPersistState(state: PlannerPersistState): void {
  _plannerPersistState = state;
}

export async function persistPlannerState(state: PlannerPersistState): Promise<void> {
  // Skip expected post-logout writes.
  if (!_plannerPersistState) return;

  const supabase = createClient();
  const { error } = await supabase.from("user_dashboard_state").upsert(
    {
      user_id: state.userId,
      plan: state.plan,
      checked_item_keys: state.checkedItems,
      custom_meals: state.customMeals,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("Failed to save planner state", summarizePersistError(error));
  }
}

export async function flushPlannerStateToServer(): Promise<void> {
  if (!_plannerPersistState) return;
  await persistPlannerState(clonePersistState(_plannerPersistState));
}

export function clearPlannerSessionCache(): void {
  _plannerCache = null;
  _plannerPersistState = null;
}
