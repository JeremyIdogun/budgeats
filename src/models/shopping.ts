import type { IngredientCategory, UnitType } from "./ingredient";
import type { RetailerId } from "./retailer";

export interface ShoppingLineItem {
  ingredientId: string;
  ingredientName: string;
  category: IngredientCategory;
  totalQuantityNeeded: number;
  unit: UnitType;
  packsNeeded: number;
  cheapestRetailerId: RetailerId;
  cheapestPricePence: number;
  matchLabel?: "exact" | "equivalent" | "substitute";
  productUrl?: string;
  substituteSuggestion?: string | null;
  alternativeRetailers: Array<{
    retailerId: RetailerId;
    pricePence: number;
    productUrl?: string;
  }>;
}

export interface ShoppingList {
  id: string;
  weekPlanId: string;
  userId: string;
  generatedAt: string;
  items: ShoppingLineItem[];
  totalPence: number;
  totalByRetailer: Record<RetailerId, number>;
  estimatedSavingPence: number;
  groupedByRetailer: Record<RetailerId, ShoppingLineItem[]>;
  cheapestSingleRetailer: {
    retailerId: RetailerId | null;
    totalPence: number;
    explanation: string;
  };
  cheapestMixedRetailer: {
    totalPence: number;
    retailerBreakdown: Record<RetailerId, number>;
    explanation: string;
  };
}
