import type { MealType, PlannedMeal, WeekPlan } from "@/models";

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mondayOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getCurrentWeekStartDateIso(now = new Date()): string {
  return toIsoDate(mondayOfWeek(now));
}

/**
 * Returns the 0-based day index (Mon=0 … Sun=6) for today
 * relative to the week starting on weekStartDate.
 * Returns -1 if today is outside that week.
 */
export function getTodayDayIndex(weekStartDate: string, now = new Date()): number {
  const start = new Date(weekStartDate);
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 6 ? diffDays : -1;
}

export function createEmptyWeekPlan(userId: string, weekStartDate = getCurrentWeekStartDateIso()): WeekPlan {
  const timestamp = new Date().toISOString();

  return {
    id: `week-${userId}-${weekStartDate}`,
    userId,
    weekStartDate,
    days: [{}, {}, {}, {}, {}, {}, {}],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function withPlannedMeal(
  weekPlan: WeekPlan,
  dayIndex: number,
  mealType: MealType,
  plannedMeal: PlannedMeal,
): WeekPlan {
  if (dayIndex < 0 || dayIndex > 6) return weekPlan;

  const days = [...weekPlan.days] as WeekPlan["days"];
  days[dayIndex] = {
    ...days[dayIndex],
    [mealType]: plannedMeal,
  };

  return {
    ...weekPlan,
    days,
    updatedAt: new Date().toISOString(),
  };
}

export function withoutPlannedMeal(
  weekPlan: WeekPlan,
  dayIndex: number,
  mealType: MealType,
): WeekPlan {
  if (dayIndex < 0 || dayIndex > 6) return weekPlan;

  const days = [...weekPlan.days] as WeekPlan["days"];
  const day = { ...days[dayIndex] };
  delete day[mealType];
  days[dayIndex] = day;

  return {
    ...weekPlan,
    days,
    updatedAt: new Date().toISOString(),
  };
}

export function shiftWeekPlan(
  weekPlan: WeekPlan,
  direction: 1 | -1,
): WeekPlan {
  const start = new Date(weekPlan.weekStartDate);
  const nextWeekStart = toIsoDate(addDays(start, direction * 7));
  return createEmptyWeekPlan(weekPlan.userId, nextWeekStart);
}
