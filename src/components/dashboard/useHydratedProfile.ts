"use client";

import { useEffect, useMemo } from "react";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useBudgeAtsStore } from "@/store";
import { useDecisionStore } from "@/store/decisions";
import { isRetailerId, normalizeKey } from "@/lib/dashboard-client";
import { poundsToPence } from "@/utils/currency";
import type { DietaryTag, RetailerId, UserProfile } from "@/models";

interface HydratedProfileParams {
  userId: string;
  profileRetailers: string[];
  profileWeeklyBudgetPence: number | null;
  profileBudgetPeriod: "weekly" | "monthly" | null;
  profileHouseholdSize?: number | null;
  profileDietaryPreferences?: string[];
}

const VALID_DIETARY_TAGS: DietaryTag[] = [
  "vegetarian",
  "vegan",
  "halal",
  "gluten-free",
  "dairy-free",
];

function isDietaryTag(value: string): value is DietaryTag {
  return VALID_DIETARY_TAGS.includes(value as DietaryTag);
}

function arraysEqual<T>(left: T[], right: T[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

export function useHydratedProfile({
  userId,
  profileRetailers,
  profileWeeklyBudgetPence,
  profileBudgetPeriod,
  profileHouseholdSize,
  profileDietaryPreferences,
}: HydratedProfileParams) {
  const {
    budget: onboardingBudget,
    period: onboardingPeriod,
    household: onboardingHousehold,
    retailers: onboardingRetailers,
    dietary: onboardingDietary,
  } = useOnboardingStore();

  const storedUser = useBudgeAtsStore((state) => state.user);
  const setUser = useBudgeAtsStore((state) => state.setUser);
  const setDecisionStoreUser = useDecisionStore((state) => state.setActiveUser);

  const preferredRetailers = useMemo<RetailerId[]>(() => {
    const source =
      profileRetailers.length > 0
        ? profileRetailers
        : onboardingRetailers.length > 0
          ? onboardingRetailers
          : storedUser?.id === userId
            ? storedUser.preferredRetailers
            : ["tesco", "aldi"];

    const parsed = source.map((value) => normalizeKey(value)).filter(isRetailerId);
    return parsed.length > 0 ? parsed : (["tesco", "aldi"] as RetailerId[]);
  }, [profileRetailers, onboardingRetailers, storedUser, userId]);

  const effectivePeriod = profileBudgetPeriod ?? onboardingPeriod;

  const weeklyBudgetPence = useMemo(() => {
    if (profileWeeklyBudgetPence && profileWeeklyBudgetPence > 0) {
      return profileWeeklyBudgetPence;
    }

    if (storedUser?.id === userId && storedUser.budget.amount > 0) {
      return storedUser.budget.amount;
    }

    const weeklyFromOnboarding =
      effectivePeriod === "weekly"
        ? poundsToPence(onboardingBudget)
        : Math.round((onboardingBudget * 100) / 4.33);

    return Math.max(0, weeklyFromOnboarding);
  }, [
    profileWeeklyBudgetPence,
    storedUser,
    userId,
    effectivePeriod,
    onboardingBudget,
  ]);

  const householdSize = useMemo(() => {
    if (profileHouseholdSize && profileHouseholdSize > 0) return profileHouseholdSize;
    if (onboardingHousehold && onboardingHousehold > 0) return onboardingHousehold;
    if (storedUser?.id === userId && storedUser.household.size > 0) {
      return storedUser.household.size;
    }
    return 2;
  }, [profileHouseholdSize, onboardingHousehold, storedUser, userId]);

  const dietaryPreferences = useMemo<DietaryTag[]>(() => {
    const fromProfile = (profileDietaryPreferences ?? []).filter(isDietaryTag);
    if (fromProfile.length > 0) return fromProfile;

    if (storedUser?.id === userId && storedUser.dietaryPreferences.length > 0) {
      return storedUser.dietaryPreferences;
    }

    return onboardingDietary.filter(
      (value): value is DietaryTag => value !== "none" && isDietaryTag(value),
    );
  }, [profileDietaryPreferences, storedUser, userId, onboardingDietary]);

  const effectiveUser = useMemo<UserProfile>(
    () => ({
      id: userId,
      createdAt:
        storedUser?.id === userId ? storedUser.createdAt : new Date().toISOString(),
      budget: {
        amount: weeklyBudgetPence,
        period: "weekly",
      },
      household: {
        size: householdSize,
      },
      dietaryPreferences,
      preferredRetailers,
      currency: "GBP",
      region: "UK",
    }),
    [userId, storedUser, weeklyBudgetPence, householdSize, dietaryPreferences, preferredRetailers],
  );

  useEffect(() => {
    const sameUser = storedUser?.id === effectiveUser.id;
    const sameBudget = storedUser?.budget.amount === effectiveUser.budget.amount;
    const sameHousehold = storedUser?.household.size === effectiveUser.household.size;
    const sameRetailers = arraysEqual(
      storedUser?.preferredRetailers ?? [],
      effectiveUser.preferredRetailers,
    );
    const sameDietary = arraysEqual(
      storedUser?.dietaryPreferences ?? [],
      effectiveUser.dietaryPreferences,
    );

    if (!sameUser || !sameBudget || !sameHousehold || !sameRetailers || !sameDietary) {
      setUser(effectiveUser);
    }
    setDecisionStoreUser(effectiveUser.id);
  }, [storedUser, effectiveUser, setUser, setDecisionStoreUser]);

  return {
    effectiveUser,
    weeklyBudgetPence,
    householdSize,
    preferredRetailers,
  };
}
