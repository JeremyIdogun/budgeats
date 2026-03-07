"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { createClient } from "@/lib/supabase/client";

type DashboardTab = "planner" | "shopping";
type MealType = "breakfast" | "lunch" | "dinner";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  aisle: string;
}

interface Meal {
  id: string;
  name: string;
  type: MealType;
  cost: number;
  ingredients: Ingredient[];
}

interface DashboardClientProps {
  userId: string;
  initialPlan: Record<string, string>;
  initialCheckedItems: string[];
  initialCustomMeals: Meal[];
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

const RETAILER_NAMES: Record<string, string> = {
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

const BUILTIN_MEALS: Meal[] = [
  {
    id: "overnight-oats",
    name: "Overnight oats",
    type: "breakfast",
    cost: 1.8,
    ingredients: [
      { name: "Rolled oats", amount: 350, unit: "g", aisle: "Pantry" },
      { name: "Greek yogurt", amount: 400, unit: "g", aisle: "Dairy" },
      { name: "Bananas", amount: 4, unit: "", aisle: "Produce" },
    ],
  },
  {
    id: "berry-yogurt",
    name: "Berry yogurt bowl",
    type: "breakfast",
    cost: 2.1,
    ingredients: [
      { name: "Greek yogurt", amount: 450, unit: "g", aisle: "Dairy" },
      { name: "Frozen berries", amount: 300, unit: "g", aisle: "Frozen" },
      { name: "Honey", amount: 80, unit: "ml", aisle: "Pantry" },
    ],
  },
  {
    id: "eggs-toast",
    name: "Eggs on toast",
    type: "breakfast",
    cost: 1.7,
    ingredients: [
      { name: "Eggs", amount: 10, unit: "", aisle: "Dairy" },
      { name: "Wholemeal bread", amount: 1, unit: "loaf", aisle: "Bakery" },
      { name: "Butter", amount: 120, unit: "g", aisle: "Dairy" },
    ],
  },
  {
    id: "chickpea-wrap",
    name: "Chickpea wraps",
    type: "lunch",
    cost: 2.9,
    ingredients: [
      { name: "Wraps", amount: 8, unit: "", aisle: "Bakery" },
      { name: "Chickpeas", amount: 2, unit: "cans", aisle: "Pantry" },
      { name: "Cucumber", amount: 2, unit: "", aisle: "Produce" },
    ],
  },
  {
    id: "tuna-pasta",
    name: "Tuna pasta salad",
    type: "lunch",
    cost: 3.2,
    ingredients: [
      { name: "Pasta", amount: 500, unit: "g", aisle: "Pantry" },
      { name: "Tuna", amount: 2, unit: "cans", aisle: "Pantry" },
      { name: "Cherry tomatoes", amount: 250, unit: "g", aisle: "Produce" },
    ],
  },
  {
    id: "veggie-rice",
    name: "Veg stir-fry rice",
    type: "lunch",
    cost: 3,
    ingredients: [
      { name: "Microwave rice", amount: 4, unit: "packs", aisle: "Pantry" },
      { name: "Mixed veg", amount: 700, unit: "g", aisle: "Frozen" },
      { name: "Soy sauce", amount: 120, unit: "ml", aisle: "Pantry" },
    ],
  },
  {
    id: "chicken-traybake",
    name: "Chicken traybake",
    type: "dinner",
    cost: 4.8,
    ingredients: [
      { name: "Chicken thighs", amount: 900, unit: "g", aisle: "Protein" },
      { name: "Baby potatoes", amount: 1, unit: "kg", aisle: "Produce" },
      { name: "Broccoli", amount: 2, unit: "heads", aisle: "Produce" },
    ],
  },
  {
    id: "lentil-curry",
    name: "Lentil curry",
    type: "dinner",
    cost: 3.9,
    ingredients: [
      { name: "Red lentils", amount: 500, unit: "g", aisle: "Pantry" },
      { name: "Coconut milk", amount: 2, unit: "cans", aisle: "Pantry" },
      { name: "Onions", amount: 4, unit: "", aisle: "Produce" },
    ],
  },
  {
    id: "salmon-greens",
    name: "Salmon & greens",
    type: "dinner",
    cost: 5.6,
    ingredients: [
      { name: "Salmon fillets", amount: 4, unit: "", aisle: "Protein" },
      { name: "Green beans", amount: 400, unit: "g", aisle: "Produce" },
      { name: "Lemon", amount: 2, unit: "", aisle: "Produce" },
    ],
  },
  {
    id: "tomato-pasta",
    name: "Tomato basil pasta",
    type: "dinner",
    cost: 3.4,
    ingredients: [
      { name: "Pasta", amount: 500, unit: "g", aisle: "Pantry" },
      { name: "Passata", amount: 2, unit: "jars", aisle: "Pantry" },
      { name: "Parmesan", amount: 120, unit: "g", aisle: "Dairy" },
    ],
  },
];

const BUILTIN_MEALS_BY_TYPE: Record<MealType, Meal[]> = {
  breakfast: BUILTIN_MEALS.filter((meal) => meal.type === "breakfast"),
  lunch: BUILTIN_MEALS.filter((meal) => meal.type === "lunch"),
  dinner: BUILTIN_MEALS.filter((meal) => meal.type === "dinner"),
};

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 2,
});

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

function parseIngredientText(input: string): Ingredient[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      amount: 1,
      unit: "item",
      aisle: "Pantry",
    }));
}

function customMealId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `custom-${crypto.randomUUID()}`;
  }
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function DashboardClient({
  userId,
  initialPlan,
  initialCheckedItems,
  initialCustomMeals,
}: DashboardClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const { budget, period, retailers } = useOnboardingStore();

  const [activeTab, setActiveTab] = useState<DashboardTab>("planner");
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [plan, setPlan] = useState<Record<string, string>>(initialPlan);
  const [checkedItems, setCheckedItems] = useState<string[]>(initialCheckedItems);
  const [customMeals, setCustomMeals] = useState<Meal[]>(initialCustomMeals);

  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<MealType>("dinner");
  const [customCost, setCustomCost] = useState("");
  const [customIngredients, setCustomIngredients] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

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
        { onConflict: "user_id" }
      );
    }, 450);

    return () => clearTimeout(timeout);
  }, [supabase, userId, plan, checkedItems, customMeals]);

  const customMealsByType: Record<MealType, Meal[]> = {
    breakfast: customMeals.filter((meal) => meal.type === "breakfast"),
    lunch: customMeals.filter((meal) => meal.type === "lunch"),
    dinner: customMeals.filter((meal) => meal.type === "dinner"),
  };

  const allMealsById: Record<string, Meal> = {
    ...Object.fromEntries(BUILTIN_MEALS.map((meal) => [meal.id, meal])),
    ...Object.fromEntries(customMeals.map((meal) => [meal.id, meal])),
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekKey = isoDate(weekStart);

  const plannedSlots = weekDays.flatMap((day) =>
    MEAL_TYPES.map((type) => {
      const key = `${isoDate(day)}:${type}`;
      const mealId = plan[key];
      const meal = mealId ? allMealsById[mealId] : undefined;
      return { key, day, type, meal };
    })
  );

  const plannedMeals = plannedSlots.filter((slot) => slot.meal);
  const plannedTotal = plannedMeals.reduce(
    (sum, slot) => sum + (slot.meal?.cost ?? 0),
    0
  );
  const weeklyBudget = period === "weekly" ? budget : budget / 4.33;
  const budgetUsedPct = weeklyBudget > 0 ? (plannedTotal / weeklyBudget) * 100 : 0;
  const remaining = weeklyBudget - plannedTotal;

  const mealsWithoutIngredients = plannedMeals.filter(
    (slot) => (slot.meal?.ingredients.length ?? 0) === 0
  );

  const shoppingMap = new Map<
    string,
    { name: string; amount: number; unit: string; aisle: string; key: string }
  >();
  for (const slot of plannedMeals) {
    if (!slot.meal) continue;
    for (const ingredient of slot.meal.ingredients) {
      const key = `${ingredient.aisle}|${ingredient.name}|${ingredient.unit}|${weekKey}`;
      const existing = shoppingMap.get(key);
      if (existing) {
        existing.amount += ingredient.amount;
      } else {
        shoppingMap.set(key, { ...ingredient, key });
      }
    }
  }

  const shoppingItems = Array.from(shoppingMap.values()).sort((a, b) => {
    if (a.aisle === b.aisle) return a.name.localeCompare(b.name);
    return a.aisle.localeCompare(b.aisle);
  });

  const shoppingGroups = new Map<string, typeof shoppingItems>();
  for (const item of shoppingItems) {
    const current = shoppingGroups.get(item.aisle) ?? [];
    current.push(item);
    shoppingGroups.set(item.aisle, current);
  }
  const shoppingByAisle = Array.from(shoppingGroups.entries());

  const checkedSet = new Set(checkedItems);
  const checkedCount = shoppingItems.filter((item) => checkedSet.has(item.key)).length;

  const selectedRetailers = retailers
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
        : [...prev, itemKey]
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

    const newMeal: Meal = {
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
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <BrandLogo />

          <div className="flex items-center gap-2 rounded-xl border border-cream-dark bg-white p-1">
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

          <div className="min-w-56 rounded-xl border border-cream-dark bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-navy-muted">
              Weekly budget
            </p>
            <p className="mt-1 text-sm font-semibold text-navy">
              {currency.format(plannedTotal)} of {currency.format(weeklyBudget)}
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-cream-dark">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(Math.max(budgetUsedPct, 0), 100)}%`,
                  background: budgetColor,
                }}
              />
            </div>
          </div>
        </header>

        <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-navy md:text-3xl">
              {activeTab === "planner" ? "Meal planner" : "Shopping list"}
            </h1>
            <p className="text-sm text-navy-muted">
              {activeTab === "planner"
                ? "Plan meals for the week and track cost per meal."
                : "Auto-generated from this week&apos;s planned meals."}
            </p>
          </div>
          <div className="flex items-center gap-2">
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

        {activeTab === "planner" ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="rounded-2xl border border-cream-dark bg-white p-4 md:p-5">
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
                        <td className="rounded-xl bg-cream px-3 py-3 align-top text-sm font-semibold text-navy">
                          {capitalize(type)}
                        </td>
                        {weekDays.map((day) => {
                          const slotKey = `${isoDate(day)}:${type}`;
                          const selectedMealId = plan[slotKey] ?? "";
                          const selectedMeal = selectedMealId
                            ? allMealsById[selectedMealId]
                            : undefined;

                          return (
                            <td
                              key={slotKey}
                              className="rounded-xl border border-cream-dark bg-white px-2 py-2 align-top"
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
                                  {BUILTIN_MEALS_BY_TYPE[type].map((meal) => (
                                    <option key={meal.id} value={meal.id}>
                                      {meal.name}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                              <p className="mt-2 min-h-4 text-xs font-medium text-navy-muted">
                                {selectedMeal
                                  ? `${currency.format(selectedMeal.cost)} per meal`
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
              <div className="rounded-2xl border border-cream-dark bg-white p-4">
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
                      onChange={(event) => setCustomType(event.target.value as MealType)}
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

              <div className="rounded-2xl border border-cream-dark bg-white p-4">
                <p className="text-sm font-semibold text-navy">Your custom meals</p>
                <div className="mt-3 space-y-2">
                  {customMeals.length === 0 ? (
                    <p className="text-xs text-navy-muted">
                      No custom meals yet. Add one above and it appears in the planner.
                    </p>
                  ) : (
                    customMeals.map((meal) => (
                      <div
                        key={meal.id}
                        className="flex items-center justify-between rounded-lg bg-cream px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-semibold text-navy">{meal.name}</p>
                          <p className="text-[11px] text-navy-muted">
                            {capitalize(meal.type)} · {currency.format(meal.cost)}
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

              <div className="rounded-2xl border border-cream-dark bg-white p-4">
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
                      {currency.format(weeklyBudget)}
                    </span>
                  </p>
                  <p className="flex items-center justify-between text-navy-muted">
                    <span>Planned</span>
                    <span className="font-medium text-navy">
                      {currency.format(plannedTotal)}
                    </span>
                  </p>
                  <p className="flex items-center justify-between text-navy-muted">
                    <span>Remaining</span>
                    <span
                      className={`font-medium ${
                        remaining < 0 ? "text-danger" : "text-teal"
                      }`}
                    >
                      {currency.format(remaining)}
                    </span>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
            <section className="rounded-2xl border border-cream-dark bg-white p-4 md:p-5">
              {mealsWithoutIngredients.length > 0 && (
                <p className="mb-3 rounded-lg bg-amber-100 px-3 py-2 text-xs text-navy-muted">
                  Some selected custom meals have no ingredients, so they will not add
                  items to this list.
                </p>
              )}
              {shoppingItems.length === 0 ? (
                <div className="rounded-xl bg-cream px-5 py-8 text-center">
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

                  {shoppingByAisle.map(([aisle, items]) => (
                    <div key={aisle}>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-navy-muted">
                        {aisle}
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
                            <span className="text-xs font-medium text-navy-muted">
                              {amountLabel(item.amount, item.unit)}
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
              <div className="rounded-2xl border border-cream-dark bg-white p-4">
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
                      {currency.format(plannedTotal)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-cream-dark bg-white p-4">
                <p className="text-sm font-semibold text-navy">Preferred retailers</p>
                <p className="mt-2 text-xs leading-relaxed text-navy-muted">
                  {selectedRetailers || "No preferred retailers set yet."}
                </p>
              </div>

              <div className="rounded-2xl border border-cream-dark bg-white p-4">
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
