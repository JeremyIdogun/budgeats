import { create } from "zustand";
import { OnboardingState, DietaryPreference, BudgetPeriod } from "@/types";

interface OnboardingStore extends OnboardingState {
  setBudget: (budget: number) => void;
  setPeriod: (period: BudgetPeriod) => void;
  setHousehold: (size: number) => void;
  toggleDietary: (pref: DietaryPreference) => void;
  setNoDietaryPreference: () => void;
  toggleRetailer: (id: string) => void;
  reset: () => void;
}

const initialState: OnboardingState = {
  budget: 75,
  period: "weekly",
  household: null,
  dietary: [],
  retailers: [],
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...initialState,

  setBudget: (budget) => set({ budget }),

  setPeriod: (period) => set({ period }),

  setHousehold: (household) => set({ household }),

  toggleDietary: (pref) =>
    set((state) => {
      // Remove 'none' if a real preference is selected
      const filtered = state.dietary.filter((d) => d !== "none");
      const exists = filtered.includes(pref);
      return {
        dietary: exists
          ? filtered.filter((d) => d !== pref)
          : [...filtered, pref],
      };
    }),

  setNoDietaryPreference: () => set({ dietary: ["none"] }),

  toggleRetailer: (id) =>
    set((state) => {
      const exists = state.retailers.includes(id);
      return {
        retailers: exists
          ? state.retailers.filter((r) => r !== id)
          : [...state.retailers, id],
      };
    }),

  reset: () => set(initialState),
}));
