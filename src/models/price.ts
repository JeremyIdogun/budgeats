import type { RetailerId } from "./retailer";

export interface IngredientPrice {
  ingredientId: string;
  retailerId: RetailerId;
  pricePerStorageUnit: number;
  isOwnLabel: boolean;
  lastUpdated: string;
  productName?: string;
}
