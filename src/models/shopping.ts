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
  alternativeRetailers: Array<{
    retailerId: RetailerId;
    pricePence: number;
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
}
