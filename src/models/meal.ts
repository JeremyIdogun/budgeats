import type { UnitType } from "./ingredient";
import type { RetailerId } from "./retailer";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type DietaryTag =
  | "vegetarian"
  | "vegan"
  | "halal"
  | "gluten-free"
  | "dairy-free";

export interface MealIngredient {
  ingredientId: string;
  quantity: number;
  unit: UnitType;
  optional?: boolean;
}

export interface Meal {
  id: string;
  name: string;
  emoji: string;
  type: MealType;
  prepTimeMinutes: number;
  dietaryTags: DietaryTag[];
  ingredients: MealIngredient[];
  basePortions: number;
  preferredRetailer?: RetailerId;
}
