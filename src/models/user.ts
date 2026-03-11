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
  calendarSyncEnabled?: boolean; // default false
  geoAwarenessEnabled?: boolean; // default false
  energyCheckInEnabled?: boolean; // default true
  logismosEnabled?: boolean; // default true
  loavishPointsBalance?: number; // pence equivalent
  logismosScore?: number | null; // 0–100; null until 7 days
}
