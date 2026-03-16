export type DietaryPreference =
  | "vegetarian"
  | "vegan"
  | "halal"
  | "gluten-free"
  | "dairy-free"
  | "none";

export type BudgetPeriod = "weekly" | "monthly";

export interface UserProfile {
  id: string;
  email: string;
  household_size: number;
  weekly_budget_pence: number; // always stored in pence
  budget_period: BudgetPeriod;
  dietary_preferences: DietaryPreference[];
  preferred_retailer_ids: string[];
  created_at: string;
  updated_at: string;
  calendarSyncEnabled?: boolean;
  geoAwarenessEnabled?: boolean;
  energyCheckInEnabled?: boolean;
  logismosEnabled?: boolean;
  loavishPointsBalance?: number;
  logismosScore?: number | null;
}

export interface OnboardingState {
  budget: number; // display value in pounds
  period: BudgetPeriod;
  household: number | null;
  dietary: DietaryPreference[];
  retailers: string[];
}
