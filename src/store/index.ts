import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import mealsData from "@/data/meals.json";
import ingredientsData from "@/data/ingredients.json";
import pricesData from "@/data/prices.json";
import {
  createEmptyWeekPlan,
  getCurrentWeekStartDateIso,
  shiftWeekPlan,
  withPlannedMeal,
  withoutPlannedMeal,
} from "@/lib/planner";
import type {
  Ingredient,
  IngredientPrice,
  Meal,
  MealType,
  PlannedMeal,
  UserProfile,
  WeekPlan,
} from "@/models";

export interface BudgeAtsState {
  user: UserProfile | null;
  currentWeekPlan: WeekPlan | null;
  meals: Meal[];
  ingredients: Ingredient[];
  prices: IngredientPrice[];

  setUser: (user: UserProfile) => void;
  setCurrentWeekPlan: (weekPlan: WeekPlan | null) => void;
  setMeals: (meals: Meal[]) => void;
  setIngredients: (ingredients: Ingredient[]) => void;
  setPrices: (prices: IngredientPrice[]) => void;
  addPlannedMeal: (dayIndex: number, mealType: MealType, plannedMeal: PlannedMeal) => void;
  removePlannedMeal: (dayIndex: number, mealType: MealType) => void;
  shiftWeek: (direction: 1 | -1) => void;
}

const storage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }

  return window.localStorage;
});

function ensureWeekPlan(state: BudgeAtsState): WeekPlan {
  if (state.currentWeekPlan) return state.currentWeekPlan;

  const userId = state.user?.id ?? "anonymous";
  return createEmptyWeekPlan(userId, getCurrentWeekStartDateIso());
}

export const useBudgeAtsStore = create<BudgeAtsState>()(
  persist(
    (set) => ({
      user: null,
      currentWeekPlan: null,
      meals: mealsData as Meal[],
      ingredients: ingredientsData as Ingredient[],
      prices: pricesData as IngredientPrice[],

      setUser: (user) => set({ user }),
      setCurrentWeekPlan: (currentWeekPlan) => set({ currentWeekPlan }),
      setMeals: (meals) => set({ meals }),
      setIngredients: (ingredients) => set({ ingredients }),
      setPrices: (prices) => set({ prices }),

      addPlannedMeal: (dayIndex, mealType, plannedMeal) =>
        set((state) => {
          const weekPlan = ensureWeekPlan(state);
          return {
            currentWeekPlan: withPlannedMeal(weekPlan, dayIndex, mealType, plannedMeal),
          };
        }),

      removePlannedMeal: (dayIndex, mealType) =>
        set((state) => {
          if (!state.currentWeekPlan) return state;
          return {
            currentWeekPlan: withoutPlannedMeal(state.currentWeekPlan, dayIndex, mealType),
          };
        }),

      shiftWeek: (direction) =>
        set((state) => {
          const basePlan = ensureWeekPlan(state);
          return {
            currentWeekPlan: shiftWeekPlan(basePlan, direction),
          };
        }),
    }),
    {
      name: "budgeats-storage",
      storage,
      partialize: (state) => ({
        user: state.user,
        currentWeekPlan: state.currentWeekPlan,
      }),
    },
  ),
);
