import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  isDashboardMealType,
  isoDate,
  startOfWeek,
  type DashboardCustomMeal,
} from "@/lib/dashboard-client";

interface SanitizedIngredient {
  name: string;
  amount: number;
  unit: string;
  aisle: string;
}

export interface DashboardServerData {
  userId: string;
  initialPlan: Record<string, string>;
  initialCheckedItems: string[];
  initialCustomMeals: DashboardCustomMeal[];
  initialPantryItems: Record<string, boolean>;
  initialBudgetNudgeDismissedForWeek: string | null;
  initialBudgetOverridePence: number | null;
  initialBudgetOverrideWeekStartDate: string | null;
  profileRetailers: string[];
  profileWeeklyBudgetPence: number | null;
  profileBudgetPeriod: "weekly" | "monthly" | null;
  profileHouseholdSize: number | null;
  profileDietaryPreferences: string[];
  profileEmail: string | null;
}

function sanitizePlan(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const cleaned: Record<string, string> = {};
  for (const [key, mealId] of Object.entries(value as Record<string, unknown>)) {
    if (typeof mealId === "string") {
      cleaned[key] = mealId;
    }
  }
  return cleaned;
}

function sanitizeChecked(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function sanitizeCustomMeals(value: unknown): DashboardCustomMeal[] {
  if (!Array.isArray(value)) return [];

  const meals: DashboardCustomMeal[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const raw = entry as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id : null;
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const type = typeof raw.type === "string" ? raw.type : "";
    const cost =
      typeof raw.cost === "number" && Number.isFinite(raw.cost) ? raw.cost : NaN;

    if (!id || !name || !isDashboardMealType(type) || !Number.isFinite(cost)) continue;

    const ingredients: SanitizedIngredient[] = Array.isArray(raw.ingredients)
      ? raw.ingredients
          .map((item) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) return null;
            const value = item as Record<string, unknown>;
            const ingredientName =
              typeof value.name === "string" ? value.name.trim() : "";
            if (!ingredientName) return null;
            const amount =
              typeof value.amount === "number" && Number.isFinite(value.amount)
                ? value.amount
                : 1;
            return {
              name: ingredientName,
              amount: amount > 0 ? amount : 1,
              unit: typeof value.unit === "string" ? value.unit : "unit",
              aisle: typeof value.aisle === "string" ? value.aisle : "other",
            };
          })
          .filter((item): item is SanitizedIngredient => item !== null)
      : [];

    meals.push({
      id,
      name,
      type,
      cost: Number(cost.toFixed(2)),
      ingredients,
    });
  }

  return meals;
}

function sanitizeRetailerIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
}

function sanitizePantryItems(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const items: Record<string, boolean> = {};
  for (const [key, inStock] of Object.entries(value as Record<string, unknown>)) {
    if (typeof key === "string" && typeof inStock === "boolean") {
      items[key] = inStock;
    }
  }

  return items;
}

function sanitizeWeekKey(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function sanitizeBudgetOverridePence(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed);
}

function sanitizeWeeklyBudgetPence(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.round(parsed);
}

function sanitizeBudgetPeriod(value: unknown): "weekly" | "monthly" | null {
  return value === "weekly" || value === "monthly" ? value : null;
}

function sanitizeHouseholdSize(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed);
}

function sanitizeDietaryPreferences(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function getDashboardServerData(nextPath: string): Promise<DashboardServerData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${nextPath}`);
  }

  const currentWeekStart = isoDate(startOfWeek(new Date()));

  const [{ data: weeklyPlan }, { data: dashboardState }, { data: profile }] = await Promise.all([
    supabase
      .from("weekly_plans")
      .select("week_start, plan, custom_meals, budget_override_pence")
      .eq("user_id", user.id)
      .eq("week_start", currentWeekStart)
      .maybeSingle(),
    supabase
      .from("user_dashboard_state")
      .select(
        "plan, checked_item_keys, custom_meals, pantry_items, budget_nudge_dismissed_for_week, budget_override_pence, budget_override_week_start_date",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_profiles")
      .select(
        "email, household_size, dietary_preferences, preferred_retailer_ids, weekly_budget_pence, budget_period",
      )
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const planSource = weeklyPlan ?? dashboardState;
  const weeklyBudgetOverridePence = sanitizeBudgetOverridePence(weeklyPlan?.budget_override_pence);
  const dashboardBudgetOverridePence = sanitizeBudgetOverridePence(dashboardState?.budget_override_pence);
  const initialBudgetOverridePence = weeklyBudgetOverridePence ?? dashboardBudgetOverridePence;
  const initialBudgetOverrideWeekStartDate =
    initialBudgetOverridePence !== null && weeklyPlan
      ? currentWeekStart
      : sanitizeWeekKey(dashboardState?.budget_override_week_start_date);

  return {
    userId: user.id,
    initialPlan: sanitizePlan(planSource?.plan),
    initialCheckedItems: sanitizeChecked(dashboardState?.checked_item_keys),
    initialCustomMeals: sanitizeCustomMeals(planSource?.custom_meals),
    initialPantryItems: sanitizePantryItems(dashboardState?.pantry_items),
    initialBudgetNudgeDismissedForWeek: sanitizeWeekKey(
      dashboardState?.budget_nudge_dismissed_for_week,
    ),
    initialBudgetOverridePence,
    initialBudgetOverrideWeekStartDate,
    profileRetailers: sanitizeRetailerIds(profile?.preferred_retailer_ids),
    profileWeeklyBudgetPence: sanitizeWeeklyBudgetPence(profile?.weekly_budget_pence),
    profileBudgetPeriod: sanitizeBudgetPeriod(profile?.budget_period),
    profileHouseholdSize: sanitizeHouseholdSize(profile?.household_size),
    profileDietaryPreferences: sanitizeDietaryPreferences(profile?.dietary_preferences),
    profileEmail: typeof profile?.email === "string" ? profile.email : user.email ?? null,
  };
}
