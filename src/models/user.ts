import type { RetailerId } from "./retailer";
import type { DietaryTag } from "./meal";

export type BudgetPeriod = "weekly" | "monthly";

export interface UserProfile {
  id: string;
  createdAt: string;
  budget: {
    amount: number;
    period: BudgetPeriod;
  };
  household: {
    size: number;
  };
  dietaryPreferences: DietaryTag[];
  preferredRetailers: RetailerId[];
  currency: "GBP";
  region: "UK";
}
