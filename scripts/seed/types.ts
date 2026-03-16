export type SeedMealType = "breakfast" | "lunch" | "dinner";

export interface CanonicalIngredientSeed {
  name: string;
  category: string;
  default_unit: "g" | "kg" | "ml" | "l" | "each";
  waste_half_life_days: number;
  perishability_tier: "low" | "medium" | "high";
}

export interface MealIngredientSeed {
  ingredient_name: string;
  quantity: number;
  unit: "g" | "kg" | "ml" | "l" | "each";
}

export interface MealSeed {
  name: string;
  mealType: SeedMealType;
  prepTimeMinutes: number;
  meal_ingredients: MealIngredientSeed[];
}

export interface RetailerSeed {
  slug: "tesco" | "asda" | "sainsburys" | "ocado" | "lidl";
  name: string;
  status: "active" | "stub";
  loyalty_scheme: "clubcard" | "nectar" | "none";
}

export interface SubstitutionRuleSeed {
  canonical_ingredient: string;
  substitute_ingredient: string;
  quality_tier: "high" | "medium" | "low";
  reason: string;
}
