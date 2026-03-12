export type MatchLabel = "exact" | "equivalent" | "substitute";

export interface RetailerPrice {
  base_price_pence: number;
  promo_price_pence?: number | null;
  loyalty_price_pence?: number | null;
}

export interface IngredientOption {
  retailerProductId: string;
  retailerId: string;
  name: string;
  packSizeBaseUnit: number;
  prices: RetailerPrice;
  isOwnLabel?: boolean;
}

export interface IngredientPriceInput {
  ingredientName: string;
  exactProductMatches: IngredientOption[];
  canonicalIngredientMatches: IngredientOption[];
  approvedSubstitutes: IngredientOption[];
  cheapestValidOptions: IngredientOption[];
  loyaltyEnabled: boolean;
}

export interface IngredientPriceResolution {
  pricePence: number;
  matchLabel: MatchLabel;
  explanation: string;
  chosenOption: IngredientOption;
  effectivePackPricePence: number;
}

export interface MealCostIngredientInput {
  ingredientName: string;
  recipeRequiredQuantity: number;
  reuseInWeekPlan: number;
  reuseDaysFromNow: number;
  wasteHalfLifeDays: number;
  priceInput: IngredientPriceInput;
}

export interface MealCostInput {
  id: string;
  name: string;
  ingredients: MealCostIngredientInput[];
}

export interface WeekPlanContext {
  weekStartDate: string;
}

export interface PerIngredientCost {
  ingredientName: string;
  matchLabel: MatchLabel;
  usedCostPence: number;
  wastePenaltyPence: number;
  totalCostPence: number;
  explanation: string;
}

export interface MealCostResult {
  totalCostPence: number;
  perIngredientCosts: PerIngredientCost[];
  wastePenaltyPence: number;
  explanation: string;
}

export interface BasketIngredientRetailerOption {
  retailerId: string;
  option: IngredientOption;
}

export interface BasketMealInput {
  id: string;
  name: string;
  ingredients: Array<{
    ingredientName: string;
    options: BasketIngredientRetailerOption[];
  }>;
}

export interface BasketOption {
  retailerBreakdown: Record<string, number>;
  totalCostPence: number;
  explanation: string;
}
