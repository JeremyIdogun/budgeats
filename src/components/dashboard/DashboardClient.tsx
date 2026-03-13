"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/navigation/AppNav";
import { createClient } from "@/lib/supabase/client";
import { deriveBudgetUtilisationPct, deriveMealCostPence } from "@/lib/budget";
import { generateShoppingList } from "@/lib/shopping";
import { RETAILERS, type Meal, type RetailerId, type UserProfile, type WeekPlan } from "@/models";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useBudgeAtsStore, type BudgeAtsState } from "@/store";
import {
  selectBudgetRemainingPence,
  selectCheapestRetailer,
  selectWeekSpendPence,
} from "@/store/selectors";
import { formatPence, poundsToPence } from "@/utils/currency";

type DashboardTab = "planner" | "shopping";
type DashboardMealType = "breakfast" | "lunch" | "dinner";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  aisle: string;
}

interface CustomMeal {
  id: string;
  name: string;
  type: DashboardMealType;
  cost: number; // pounds for legacy custom meals
  ingredients: Ingredient[];
}

interface DashboardClientProps {
  userId: string;
  initialPlan: Record<string, string>;
  initialCheckedItems: string[];
  initialCustomMeals: CustomMeal[];
  profileRetailers: string[];
  profileWeeklyBudgetPence: number | null;
  profileBudgetPeriod: "weekly" | "monthly" | null;
  initialTab?: DashboardTab;
}

interface DisplayMeal {
  id: string;
  name: string;
  type: DashboardMealType;
  kind: "library" | "custom";
  costPence: number;
  costKnown: boolean;
  ingredients: Ingredient[];
}

interface DashboardShoppingItem {
  key: string;
  name: string;
  amount: number;
  unit: string;
  group: string;
  bestOfferRetailerId: RetailerId | null;
  bestOfferPence: number | null;
  productUrl?: string;
  substituteSuggestion?: string | null;
  priced: boolean;
}

const MEAL_TYPES: DashboardMealType[] = ["breakfast", "lunch", "dinner"];

const RETAILER_NAMES: Record<RetailerId, string> = {
  tesco: "Tesco",
  sainsburys: "Sainsbury's",
  aldi: "Aldi",
  lidl: "Lidl",
  asda: "Asda",
  morrisons: "Morrisons",
  waitrose: "Waitrose",
  coop: "Co-op",
  ocado: "Ocado",
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function amountLabel(amount: number, unit: string) {
  if (!unit) return `${amount}`;
  return `${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${unit}`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseIngredientText(input: string): Ingredient[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      amount: 1,
      unit: "unit",
      aisle: "other",
    }));
}

function customMealId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `custom-${crypto.randomUUID()}`;
  }
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isDashboardMealType(value: string): value is DashboardMealType {
  return value === "breakfast" || value === "lunch" || value === "dinner";
}

function isRetailerId(value: string): value is RetailerId {
  return Object.prototype.hasOwnProperty.call(RETAILERS, value);
}

function buildLibraryWeekPlan(params: {
  plan: Record<string, string>;
  weekDays: Date[];
  weekKey: string;
  userId: string;
  mealsById: Map<string, Meal>;
  householdSize: number;
  defaultRetailer: RetailerId;
}): WeekPlan {
  const { plan, weekDays, weekKey, userId, mealsById, householdSize, defaultRetailer } = params;

  const days: WeekPlan["days"] = [{}, {}, {}, {}, {}, {}, {}];
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const date = weekDays[dayIndex];
    for (const type of MEAL_TYPES) {
      const slotKey = `${isoDate(date)}:${type}`;
      const mealId = plan[slotKey];
      if (!mealId) continue;

      const meal = mealsById.get(mealId);
      if (!meal || !isDashboardMealType(meal.type)) continue;

      days[dayIndex][type] = {
        mealId,
        retailerId: meal.preferredRetailer ?? defaultRetailer,
        portions: householdSize,
      };
    }
  }

  const now = new Date().toISOString();
  return {
    id: `week-${userId}-${weekKey}`,
    userId,
    weekStartDate: weekKey,
    days,
    createdAt: now,
    updatedAt: now,
  };
}

export function DashboardClient({
  userId,
  initialPlan,
  initialCheckedItems,
  initialCustomMeals,
  profileRetailers,
  profileWeeklyBudgetPence,
  profileBudgetPeriod,
  initialTab,
}: DashboardClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const {
    budget: onboardingBudget,
    period: onboardingPeriod,
    household: onboardingHousehold,
    retailers: onboardingRetailers,
  } = useOnboardingStore();

  const storeState = useBudgeAtsStore();
  const {
    meals: storeMeals,
    ingredients: storeIngredients,
    prices: storePrices,
    user: storedUser,
    setUser,
    setCurrentWeekPlan,
  } = storeState;

  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab ?? "planner");
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [plan, setPlan] = useState<Record<string, string>>(initialPlan);
  const [checkedItems, setCheckedItems] = useState<string[]>(initialCheckedItems);
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>(initialCustomMeals);

  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<DashboardMealType>("dinner");
  const [customCost, setCustomCost] = useState("");
  const [customIngredients, setCustomIngredients] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const weekKey = useMemo(() => isoDate(weekStart), [weekStart]);
  const effectivePeriod = profileBudgetPeriod ?? onboardingPeriod;

  const preferredRetailers = useMemo(() => {
    const source =
      profileRetailers.length > 0
        ? profileRetailers
        : onboardingRetailers.length > 0
          ? onboardingRetailers
          : ["tesco", "aldi"];

    const parsed = source.map((value) => normalizeKey(value)).filter(isRetailerId);
    return parsed.length > 0 ? parsed : (["tesco", "aldi"] as RetailerId[]);
  }, [profileRetailers, onboardingRetailers]);

  const weeklyBudgetPence = useMemo(() => {
    if (profileWeeklyBudgetPence && profileWeeklyBudgetPence > 0) {
      return profileWeeklyBudgetPence;
    }

    const weeklyFromOnboarding =
      effectivePeriod === "weekly"
        ? poundsToPence(onboardingBudget)
        : Math.round((onboardingBudget * 100) / 4.33);

    return Math.max(0, weeklyFromOnboarding);
  }, [profileWeeklyBudgetPence, onboardingBudget, effectivePeriod]);

  const householdSize = useMemo(() => {
    if (onboardingHousehold && onboardingHousehold > 0) return onboardingHousehold;
    if (storedUser?.household.size && storedUser.household.size > 0) return storedUser.household.size;
    return 2;
  }, [onboardingHousehold, storedUser]);

  const effectiveUser = useMemo<UserProfile>(
    () => ({
      id: userId,
      createdAt: storedUser?.id === userId ? storedUser.createdAt : new Date().toISOString(),
      budget: {
        amount: weeklyBudgetPence,
        // Dashboard planning is weekly today; keep spend math aligned to weekly values.
        period: "weekly",
      },
      household: {
        size: householdSize,
      },
      dietaryPreferences: storedUser?.id === userId ? storedUser.dietaryPreferences : [],
      preferredRetailers,
      currency: "GBP",
      region: "UK",
    }),
    [userId, storedUser, weeklyBudgetPence, householdSize, preferredRetailers],
  );

  useEffect(() => {
    const sameUser = storedUser?.id === effectiveUser.id;
    const sameBudget = storedUser?.budget.amount === effectiveUser.budget.amount;
    const sameHousehold = storedUser?.household.size === effectiveUser.household.size;
    const sameRetailers =
      (storedUser?.preferredRetailers ?? []).join("|") ===
      effectiveUser.preferredRetailers.join("|");

    if (!sameUser || !sameBudget || !sameHousehold || !sameRetailers) {
      setUser(effectiveUser);
    }
  }, [storedUser, effectiveUser, setUser]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void supabase.from("user_dashboard_state").upsert(
        {
          user_id: userId,
          plan,
          checked_item_keys: checkedItems,
          custom_meals: customMeals,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    }, 450);

    return () => clearTimeout(timeout);
  }, [supabase, userId, plan, checkedItems, customMeals]);

  const dashboardLibraryMeals = useMemo(
    () => storeMeals.filter((meal) => isDashboardMealType(meal.type)),
    [storeMeals],
  );

  const ingredientById = useMemo(
    () => new Map(storeIngredients.map((ingredient) => [ingredient.id, ingredient])),
    [storeIngredients],
  );

  const libraryMealsById = useMemo(
    () => new Map(dashboardLibraryMeals.map((meal) => [meal.id, meal])),
    [dashboardLibraryMeals],
  );

  const libraryDisplayMeals = useMemo<DisplayMeal[]>(() => {
    const fallbackRetailer = preferredRetailers[0] ?? "tesco";

    return dashboardLibraryMeals.map((meal) => {
      const retailerId = meal.preferredRetailer ?? fallbackRetailer;
      const costPence = deriveMealCostPence(
        meal,
        storeIngredients,
        storePrices,
        retailerId,
        householdSize,
      );

      const ingredients: Ingredient[] = meal.ingredients
        .filter((ingredient) => !ingredient.optional)
        .map((ingredient) => ({
          name: ingredientById.get(ingredient.ingredientId)?.name ?? ingredient.ingredientId,
          amount: ingredient.quantity,
          unit: ingredient.unit,
          aisle: ingredientById.get(ingredient.ingredientId)?.category ?? "other",
        }));

      return {
        id: meal.id,
        name: `${meal.emoji} ${meal.name}`,
        type: meal.type as DashboardMealType,
        kind: "library",
        costPence: costPence ?? 0,
        costKnown: costPence !== null,
        ingredients,
      };
    });
  }, [dashboardLibraryMeals, preferredRetailers, storeIngredients, storePrices, householdSize, ingredientById]);

  const customDisplayMeals = useMemo<DisplayMeal[]>(
    () =>
      customMeals.map((meal) => ({
        id: meal.id,
        name: meal.name,
        type: meal.type,
        kind: "custom",
        costPence: poundsToPence(meal.cost),
        costKnown: true,
        ingredients: meal.ingredients,
      })),
    [customMeals],
  );

  const customMealsByType: Record<DashboardMealType, DisplayMeal[]> = {
    breakfast: customDisplayMeals.filter((meal) => meal.type === "breakfast"),
    lunch: customDisplayMeals.filter((meal) => meal.type === "lunch"),
    dinner: customDisplayMeals.filter((meal) => meal.type === "dinner"),
  };

  const libraryMealsByType: Record<DashboardMealType, DisplayMeal[]> = {
    breakfast: libraryDisplayMeals.filter((meal) => meal.type === "breakfast"),
    lunch: libraryDisplayMeals.filter((meal) => meal.type === "lunch"),
    dinner: libraryDisplayMeals.filter((meal) => meal.type === "dinner"),
  };

  const allMealsById = useMemo(
    () =>
      new Map<string, DisplayMeal>([
        ...libraryDisplayMeals.map((meal) => [meal.id, meal] as const),
        ...customDisplayMeals.map((meal) => [meal.id, meal] as const),
      ]),
    [libraryDisplayMeals, customDisplayMeals],
  );

  const plannedSlots = weekDays.flatMap((day, dayIndex) =>
    MEAL_TYPES.map((type) => {
      const key = `${isoDate(day)}:${type}`;
      const mealId = plan[key];
      const meal = mealId ? allMealsById.get(mealId) : undefined;
      return { key, day, dayIndex, type, meal };
    }),
  );

  const plannedMeals = plannedSlots.filter((slot) => slot.meal);
  const customPlannedSpendPence = plannedMeals.reduce(
    (sum, slot) => (slot.meal?.kind === "custom" ? sum + slot.meal.costPence : sum),
    0,
  );

  const libraryWeekPlan = buildLibraryWeekPlan({
    plan,
    weekDays,
    weekKey,
    userId,
    mealsById: libraryMealsById,
    householdSize,
    defaultRetailer: preferredRetailers[0] ?? "tesco",
  });

  useEffect(() => {
    const weekPlanForStore = buildLibraryWeekPlan({
      plan,
      weekDays,
      weekKey,
      userId,
      mealsById: libraryMealsById,
      householdSize,
      defaultRetailer: preferredRetailers[0] ?? "tesco",
    });
    setCurrentWeekPlan(weekPlanForStore);
  }, [
    plan,
    weekDays,
    weekKey,
    userId,
    libraryMealsById,
    householdSize,
    preferredRetailers,
    setCurrentWeekPlan,
  ]);

  const selectorState: BudgeAtsState = {
    ...storeState,
    user: effectiveUser,
    currentWeekPlan: libraryWeekPlan,
    meals: dashboardLibraryMeals,
    ingredients: storeIngredients,
    prices: storePrices,
  };

  const libraryWeekSpendPence = selectWeekSpendPence(selectorState);
  const plannedTotalPence = libraryWeekSpendPence + customPlannedSpendPence;
  const remainingPence = selectBudgetRemainingPence(selectorState) - customPlannedSpendPence;
  const budgetUsedPct = deriveBudgetUtilisationPct(weeklyBudgetPence, plannedTotalPence);
  const cheapestRetailer = selectCheapestRetailer(selectorState);

  const mealsWithoutIngredients = plannedMeals.filter(
    (slot) => (slot.meal?.ingredients.length ?? 0) === 0,
  );

  const generatedShoppingList = generateShoppingList(
    libraryWeekPlan,
    dashboardLibraryMeals,
    storeIngredients,
    storePrices,
    effectiveUser,
  );

  const customShoppingMap = new Map<string, DashboardShoppingItem>();
  for (const slot of plannedMeals) {
    if (!slot.meal || slot.meal.kind !== "custom") continue;
    for (const ingredient of slot.meal.ingredients) {
      const key = `${normalizeKey(ingredient.name)}|${ingredient.unit}|${weekKey}`;
      const existing = customShoppingMap.get(key);
      if (existing) {
        existing.amount += ingredient.amount;
      } else {
        customShoppingMap.set(key, {
          key,
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          group: ingredient.aisle || "other",
          bestOfferRetailerId: null,
          bestOfferPence: null,
          priced: false,
        });
      }
    }
  }

  const generatedItems: DashboardShoppingItem[] = generatedShoppingList.items.map((item) => ({
    key: `${item.ingredientId}|${weekKey}`,
    name: item.ingredientName,
    amount: item.totalQuantityNeeded,
    unit: item.unit,
    group: item.category,
    bestOfferRetailerId: item.cheapestRetailerId,
    bestOfferPence: item.cheapestPricePence,
    productUrl: item.productUrl,
    substituteSuggestion: item.substituteSuggestion ?? null,
    priced: true,
  }));

  const shoppingItems = [...generatedItems, ...Array.from(customShoppingMap.values())].sort(
    (a, b) => {
      if (a.group === b.group) return a.name.localeCompare(b.name);
      return a.group.localeCompare(b.group);
    },
  );

  const shoppingGroups = new Map<string, DashboardShoppingItem[]>();
  for (const item of shoppingItems) {
    const current = shoppingGroups.get(item.group) ?? [];
    current.push(item);
    shoppingGroups.set(item.group, current);
  }
  const shoppingByGroup = Array.from(shoppingGroups.entries());

  const checkedSet = new Set(checkedItems);
  const checkedCount = shoppingItems.filter((item) => checkedSet.has(item.key)).length;

  const pricedItemCount = shoppingItems.filter((item) => item.priced).length;
  const basketByRetailer = preferredRetailers
    .map((retailerId) => {
      const matchedCount = generatedShoppingList.items.filter(
        (item) =>
          item.cheapestRetailerId === retailerId ||
          item.alternativeRetailers.some((option) => option.retailerId === retailerId),
      ).length;
      return {
        retailerId,
        totalPence: generatedShoppingList.totalByRetailer[retailerId] ?? 0,
        matchedCount,
      };
    })
    .sort((a, b) => a.totalPence - b.totalPence);

  const bestBasket = basketByRetailer.find((retailer) => retailer.matchedCount > 0);

  const selectedRetailers = preferredRetailers
    .map((id) => RETAILER_NAMES[id] ?? id)
    .slice(0, 3)
    .join(", ");

  function setMealForSlot(slotKey: string, mealId: string) {
    setPlan((prev) => {
      const next = { ...prev };
      if (!mealId) {
        delete next[slotKey];
      } else {
        next[slotKey] = mealId;
      }
      return next;
    });
  }

  function toggleItem(itemKey: string) {
    setCheckedItems((prev) =>
      prev.includes(itemKey)
        ? prev.filter((key) => key !== itemKey)
        : [...prev, itemKey],
    );
  }

  function clearCheckedForWeek() {
    setCheckedItems((prev) => prev.filter((key) => !key.endsWith(`|${weekKey}`)));
  }

  function checkAllForWeek() {
    const weekItemKeys = shoppingItems.map((item) => item.key);
    setCheckedItems((prev) => Array.from(new Set([...prev, ...weekItemKeys])));
  }

  function removeCustomMeal(mealId: string) {
    setCustomMeals((prev) => prev.filter((meal) => meal.id !== mealId));
    setPlan((prev) => {
      const next = { ...prev };
      for (const [slotKey, selectedMealId] of Object.entries(prev)) {
        if (selectedMealId === mealId) {
          delete next[slotKey];
        }
      }
      return next;
    });
  }

  function handleCreateCustomMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCustomError(null);

    const name = customName.trim();
    const parsedCost = Number(customCost);

    if (!name) {
      setCustomError("Meal name is required.");
      return;
    }

    if (!Number.isFinite(parsedCost) || parsedCost <= 0) {
      setCustomError("Enter a valid cost greater than 0.");
      return;
    }

    const newMeal: CustomMeal = {
      id: customMealId(),
      name,
      type: customType,
      cost: Number(parsedCost.toFixed(2)),
      ingredients: parseIngredientText(customIngredients),
    };

    setCustomMeals((prev) => [newMeal, ...prev]);
    setCustomName("");
    setCustomCost("");
    setCustomIngredients("");
  }

  const weekRangeLabel = `${weekDays[0].toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
  })} - ${weekDays[6].toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
  })}`;

  const budgetColor =
    budgetUsedPct > 100 ? "#D94F4F" : budgetUsedPct > 85 ? "#E8693A" : "#3DBFB8";

  return (
    <main className="min-h-screen bg-cream px-4 py-5 md:px-8 md:py-7">
      <div className="mx-auto max-w-7xl">
        <AppNav />

        <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-navy md:text-3xl">
              {activeTab === "planner" ? "Meal planner" : "Shopping list"}
            </h1>
            <p className="text-sm text-navy-muted">
              {activeTab === "planner"
                ? "Plan meals for the week and track cost per meal."
                : "Auto-generated from this week&apos;s planned meals."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-cream-dark bg-white p-1 md:flex">
              <button
                onClick={() => setActiveTab("planner")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "planner"
                    ? "bg-navy text-white"
                    : "text-navy-muted hover:text-navy"
                }`}
              >
                Meal planner
              </button>
              <button
                onClick={() => setActiveTab("shopping")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === "shopping"
                    ? "bg-navy text-white"
                    : "text-navy-muted hover:text-navy"
                }`}
              >
                Shopping list
              </button>
            </div>
            <button
              onClick={() => setWeekStart((prev) => addDays(prev, -7))}
              className="h-9 w-9 rounded-lg border border-cream-dark bg-white text-navy transition hover:border-navy/25"
              aria-label="Previous week"
            >
              ←
            </button>
            <p className="min-w-40 text-center text-sm font-semibold text-navy">
              {weekRangeLabel}
            </p>
            <button
              onClick={() => setWeekStart((prev) => addDays(prev, 7))}
              className="h-9 w-9 rounded-lg border border-cream-dark bg-white text-navy transition hover:border-navy/25"
              aria-label="Next week"
            >
              →
            </button>
          </div>
        </section>

        <div className="mb-4 flex items-center gap-2 rounded-lg border border-cream-dark bg-white p-1 md:hidden">
          <button
            onClick={() => setActiveTab("planner")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "planner"
                ? "bg-navy text-white"
                : "text-navy-muted hover:text-navy"
            }`}
          >
            Meal planner
          </button>
          <button
            onClick={() => setActiveTab("shopping")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "shopping"
                ? "bg-navy text-white"
                : "text-navy-muted hover:text-navy"
            }`}
          >
            Shopping list
          </button>
        </div>

        {activeTab === "planner" ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="rounded-lg border border-cream-dark bg-white p-4 md:p-5">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-separate border-spacing-2">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
                        Meal
                      </th>
                      {weekDays.map((day) => (
                        <th
                          key={isoDate(day)}
                          className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted"
                        >
                          {day.toLocaleDateString("en-GB", { weekday: "short" })}
                          <span className="mt-0.5 block text-[11px] font-medium normal-case tracking-normal text-navy">
                            {day.toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MEAL_TYPES.map((type) => (
                      <tr key={type}>
                        <td className="rounded-lg bg-cream px-3 py-3 align-top text-sm font-semibold text-navy">
                          {capitalize(type)}
                        </td>
                        {weekDays.map((day) => {
                          const slotKey = `${isoDate(day)}:${type}`;
                          const selectedMealId = plan[slotKey] ?? "";
                          const selectedMeal = selectedMealId
                            ? allMealsById.get(selectedMealId)
                            : undefined;

                          return (
                            <td
                              key={slotKey}
                              className="rounded-lg border border-cream-dark bg-white px-2 py-2 align-top"
                            >
                              <label
                                htmlFor={slotKey}
                                className="sr-only"
                              >{`${capitalize(type)} meal for ${isoDate(day)}`}</label>
                              <select
                                id={slotKey}
                                value={selectedMealId}
                                onChange={(event) =>
                                  setMealForSlot(slotKey, event.target.value)
                                }
                                className="w-full rounded-lg border border-cream-dark bg-white px-2 py-2 text-xs text-navy outline-none transition focus:border-navy/30"
                              >
                                <option value="">Select meal</option>
                                {customMealsByType[type].length > 0 && (
                                  <optgroup label="Your meals">
                                    {customMealsByType[type].map((meal) => (
                                      <option key={meal.id} value={meal.id}>
                                        {meal.name}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                <optgroup label="Suggestions">
                                  {libraryMealsByType[type].map((meal) => (
                                    <option key={meal.id} value={meal.id}>
                                      {meal.name}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                              <p className="mt-2 min-h-4 text-xs font-medium text-navy-muted">
                                {selectedMeal
                                  ? selectedMeal.costKnown
                                    ? `${formatPence(selectedMeal.costPence)} per meal`
                                    : "Price data missing"
                                  : " "}
                              </p>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-lg border border-cream-dark bg-white p-4">
                <p className="text-sm font-semibold text-navy">Add custom meal</p>
                <form onSubmit={handleCreateCustomMeal} className="mt-3 space-y-2">
                  <input
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                    placeholder="Meal name"
                    className="w-full rounded-lg border border-cream-dark px-3 py-2 text-xs text-navy outline-none focus:border-navy/30"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={customType}
                      onChange={(event) => setCustomType(event.target.value as DashboardMealType)}
                      className="rounded-lg border border-cream-dark px-3 py-2 text-xs text-navy outline-none focus:border-navy/30"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                    </select>
                    <input
                      value={customCost}
                      onChange={(event) => setCustomCost(event.target.value)}
                      inputMode="decimal"
                      placeholder="Cost (£)"
                      className="rounded-lg border border-cream-dark px-3 py-2 text-xs text-navy outline-none focus:border-navy/30"
                    />
                  </div>
                  <input
                    value={customIngredients}
                    onChange={(event) => setCustomIngredients(event.target.value)}
                    placeholder="Ingredients (comma-separated, optional)"
                    className="w-full rounded-lg border border-cream-dark px-3 py-2 text-xs text-navy outline-none focus:border-navy/30"
                  />
                  {customError && <p className="text-xs text-danger">{customError}</p>}
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white"
                  >
                    Save meal
                  </button>
                </form>
              </div>

              <div className="rounded-lg border border-cream-dark bg-white p-4">
                <p className="text-sm font-semibold text-navy">Your custom meals</p>
                <div className="mt-3 space-y-2">
                  {customDisplayMeals.length === 0 ? (
                    <p className="text-xs text-navy-muted">
                      No custom meals yet. Add one above and it appears in the planner.
                    </p>
                  ) : (
                    customDisplayMeals.map((meal) => (
                      <div
                        key={meal.id}
                        className="flex items-center justify-between rounded-lg bg-cream px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-semibold text-navy">{meal.name}</p>
                          <p className="text-[11px] text-navy-muted">
                            {capitalize(meal.type)} · {formatPence(meal.costPence)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeCustomMeal(meal.id)}
                          className="text-[11px] font-semibold text-danger"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-cream-dark bg-white p-4">
                <p className="text-sm font-semibold text-navy">This week&apos;s budget</p>
                <p className="mt-3 text-3xl font-semibold text-navy">
                  {Math.round(budgetUsedPct)}%
                </p>
                <p className="text-xs text-navy-muted">budget used</p>
                <div className="mt-3 h-2 rounded-full bg-cream-dark">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(Math.max(budgetUsedPct, 0), 100)}%`,
                      background: budgetColor,
                    }}
                  />
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="flex items-center justify-between text-navy-muted">
                    <span>Budget</span>
                    <span className="font-medium text-navy">
                      {formatPence(weeklyBudgetPence)}
                    </span>
                  </p>
                  <p className="flex items-center justify-between text-navy-muted">
                    <span>Planned</span>
                    <span className="font-medium text-navy">
                      {formatPence(plannedTotalPence)}
                    </span>
                  </p>
                  <p className="flex items-center justify-between text-navy-muted">
                    <span>Remaining</span>
                    <span
                      className={`font-medium ${
                        remainingPence < 0 ? "text-danger" : "text-teal"
                      }`}
                    >
                      {formatPence(remainingPence)}
                    </span>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
            <section className="rounded-lg border border-cream-dark bg-white p-4 md:p-5">
              {mealsWithoutIngredients.length > 0 && (
                <p className="mb-3 rounded-lg bg-amber-100 px-3 py-2 text-xs text-navy-muted">
                  Some selected custom meals have no ingredients, so they will not add
                  items to this list.
                </p>
              )}
              {shoppingItems.length === 0 ? (
                <div className="rounded-lg bg-cream px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-navy">No shopping items yet</p>
                  <p className="mt-1 text-sm text-navy-muted">
                    Plan meals in the weekly grid and your list will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-navy-muted">
                      {checkedCount} of {shoppingItems.length} items checked
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={checkAllForWeek}
                        className="rounded-lg border border-cream-dark bg-white px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-navy/25"
                      >
                        Check all
                      </button>
                      <button
                        onClick={clearCheckedForWeek}
                        className="rounded-lg border border-cream-dark bg-white px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-navy/25"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {shoppingByGroup.map(([group, items]) => (
                    <div key={group}>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
                        {capitalize(group.replace(/-/g, " "))}
                      </h3>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center justify-between rounded-lg border border-cream-dark px-3 py-2 text-sm"
                          >
                            <span className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={checkedSet.has(item.key)}
                                onChange={() => toggleItem(item.key)}
                                className="h-4 w-4 accent-navy"
                              />
                              <span
                                className={
                                  checkedSet.has(item.key)
                                    ? "text-navy-muted line-through"
                                    : "text-navy"
                                }
                              >
                                {item.name}
                              </span>
                            </span>
                            <span className="text-right">
                              <span className="block text-xs font-medium text-navy-muted">
                                {amountLabel(item.amount, item.unit)}
                              </span>
                                <span className="block text-[11px] text-teal">
                                  {item.bestOfferRetailerId && item.bestOfferPence !== null
                                    ? `Best: ${RETAILER_NAMES[item.bestOfferRetailerId]} ${formatPence(item.bestOfferPence)}`
                                    : "No store price yet"}
                                </span>
                                {item.substituteSuggestion && (
                                  <span className="block text-[11px] text-coral">{item.substituteSuggestion}</span>
                                )}
                                {item.productUrl && (
                                  <a
                                    href={item.productUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block text-[11px] text-navy underline underline-offset-2"
                                  >
                                    Open product
                                  </a>
                                )}
                              </span>
                            </label>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <div className="rounded-lg border border-cream-dark bg-white p-4">
                <p className="text-sm font-semibold text-navy">Shopping summary</p>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="flex items-center justify-between text-navy-muted">
                    <span>Items</span>
                    <span className="font-medium text-navy">{shoppingItems.length}</span>
                  </p>
                  <p className="flex items-center justify-between text-navy-muted">
                    <span>Checked</span>
                    <span className="font-medium text-navy">{checkedCount}</span>
                  </p>
                  <p className="flex items-center justify-between text-navy-muted">
                    <span>Planned cost</span>
                    <span className="font-medium text-navy">
                      {formatPence(plannedTotalPence)}
                    </span>
                  </p>
                  <p className="flex items-center justify-between text-navy-muted">
                    <span>Priced items</span>
                    <span className="font-medium text-navy">
                      {pricedItemCount}/{shoppingItems.length}
                    </span>
                  </p>
                  <p className="flex items-center justify-between text-navy-muted">
                    <span>Best basket</span>
                    <span className="font-medium text-navy">
                      {bestBasket
                        ? `${RETAILER_NAMES[bestBasket.retailerId]} ${formatPence(bestBasket.totalPence)}`
                        : "No estimate"}
                    </span>
                  </p>
                  <p className="flex items-center justify-between text-navy-muted">
                    <span>Cheapest retailer</span>
                    <span className="font-medium text-navy">
                      {cheapestRetailer ? RETAILER_NAMES[cheapestRetailer] : "No estimate"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-cream-dark bg-white p-4">
                <p className="text-sm font-semibold text-navy">Basket by retailer</p>
                <div className="mt-3 space-y-2">
                  {basketByRetailer.map((retailer) => (
                    <p
                      key={retailer.retailerId}
                      className="flex items-center justify-between text-xs text-navy-muted"
                    >
                      <span>
                        {RETAILER_NAMES[retailer.retailerId]} ({retailer.matchedCount}/
                        {generatedShoppingList.items.length})
                      </span>
                      <span className="font-semibold text-navy">
                        {retailer.matchedCount > 0
                          ? formatPence(retailer.totalPence)
                          : "No matches"}
                      </span>
                    </p>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-cream-dark bg-white p-4">
                <p className="text-sm font-semibold text-navy">Preferred retailers</p>
                <p className="mt-2 text-xs leading-relaxed text-navy-muted">
                  {selectedRetailers || "No preferred retailers set yet."}
                </p>
              </div>

              <div className="rounded-lg border border-cream-dark bg-white p-4">
                <p className="text-sm font-semibold text-navy">Tip</p>
                <p className="mt-2 text-xs leading-relaxed text-navy-muted">
                  Keep this list open in-store and check items as you shop to avoid
                  duplicate buys.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
