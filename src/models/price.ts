import type { RetailerId } from "./retailer";

export interface IngredientPrice {
  ingredientId: string;
  retailerId: RetailerId;
  pricePerStorageUnit: number;
  promoPricePence?: number | null;
  loyaltyPricePence?: number | null;
  loyaltyScheme?: "clubcard" | "nectar" | "none";
  isOwnLabel: boolean;
  lastUpdated: string;
  productName?: string;
}
