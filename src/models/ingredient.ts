export type UnitType = "g" | "ml" | "unit" | "tbsp" | "tsp";

export type IngredientCategory =
  | "meat-fish"
  | "dairy-eggs"
  | "fruit-veg"
  | "grains-pasta"
  | "tinned-dried"
  | "condiments"
  | "bakery"
  | "frozen"
  | "other";

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  defaultUnit: UnitType;
  storageUnit: UnitType;
  storageQuantity: number;
}
