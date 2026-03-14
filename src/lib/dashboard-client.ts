import { RETAILERS, type Meal, type RetailerId, type WeekPlan } from "@/models";

export type DashboardMealType = "breakfast" | "lunch" | "dinner";

export interface DashboardIngredient {
  name: string;
  amount: number;
  unit: string;
  aisle: string;
}

export interface DashboardCustomMeal {
  id: string;
  name: string;
  type: DashboardMealType;
  cost: number; // pounds for persisted custom meals
  ingredients: DashboardIngredient[];
}

export interface DashboardClientCommonProps {
  userId: string;
  initialPlan: Record<string, string>;
  initialCheckedItems: string[];
  initialCustomMeals: DashboardCustomMeal[];
  profileRetailers: string[];
  profileWeeklyBudgetPence: number | null;
  profileBudgetPeriod: "weekly" | "monthly" | null;
  profileHouseholdSize?: number | null;
  profileDietaryPreferences?: string[];
  profileEmail?: string | null;
}

export const MEAL_TYPES: DashboardMealType[] = ["breakfast", "lunch", "dinner"];

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, week starts on Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isoDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function amountLabel(amount: number, unit: string): string {
  if (!unit) return `${amount}`;
  return `${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${unit}`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/["'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseIngredientText(input: string): DashboardIngredient[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      amount: 1,
      unit: "unit",
      aisle: "other",
    }));
}

export function customMealId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `custom-${crypto.randomUUID()}`;
  }
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isDashboardMealType(value: string): value is DashboardMealType {
  return value === "breakfast" || value === "lunch" || value === "dinner";
}

export function isRetailerId(value: string): value is RetailerId {
  return Object.prototype.hasOwnProperty.call(RETAILERS, value);
}

export function buildLibraryWeekPlan(params: {
  plan: Record<string, string>;
  weekDays: Date[];
  weekKey: string;
  userId: string;
  mealsById: Map<string, Meal>;
  householdSize: number;
  defaultRetailer: RetailerId;
}): WeekPlan {
  const {
    plan,
    weekDays,
    weekKey,
    userId,
    mealsById,
    householdSize,
    defaultRetailer,
  } = params;

  const days: WeekPlan["days"] = [{}, {}, {}, {}, {}, {}, {}];
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const date = weekDays[dayIndex];
    for (const type of MEAL_TYPES) {
      const slotKey = `${isoDate(date)}:${type}`;
      const mealId = plan[slotKey];
      if (!mealId) continue;

      const meal = mealsById.get(mealId);
      if (!meal || !isDashboardMealType(meal.type)) continue;

      days[dayIndex][type] = {
        mealId,
        retailerId: meal.preferredRetailer ?? defaultRetailer,
        portions: householdSize,
      };
    }
  }

  const now = new Date().toISOString();
  return {
    id: `week-${userId}-${weekKey}`,
    userId,
    weekStartDate: weekKey,
    days,
    createdAt: now,
    updatedAt: now,
  };
}

export const RETAILER_NAMES: Record<RetailerId, string> = {
  tesco: "Tesco",
  sainsburys: "Sainsbury's",
  aldi: "Aldi",
  lidl: "Lidl",
  asda: "Asda",
  morrisons: "Morrisons",
  waitrose: "Waitrose",
  coop: "Co-op",
  ocado: "Ocado",
};
