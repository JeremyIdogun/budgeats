import type { MealType } from "./meal";
import type { RetailerId } from "./retailer";

export interface PlannedMeal {
  mealId: string;
  retailerId: RetailerId;
  portions: number;
}

export type DayPlan = {
  [key in MealType]?: PlannedMeal;
};

export interface WeekPlan {
  id: string;
  userId: string;
  weekStartDate: string;
  days: [DayPlan, DayPlan, DayPlan, DayPlan, DayPlan, DayPlan, DayPlan];
  createdAt: string;
  updatedAt: string;
}
