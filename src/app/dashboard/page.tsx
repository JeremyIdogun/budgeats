import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

type MealType = "breakfast" | "lunch" | "dinner";

interface SanitizedIngredient {
  name: string;
  amount: number;
  unit: string;
  aisle: string;
}

interface SanitizedMeal {
  id: string;
  name: string;
  type: MealType;
  cost: number;
  ingredients: SanitizedIngredient[];
}

function sanitizePlan(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const cleaned: Record<string, string> = {};
  for (const [key, mealId] of Object.entries(value as Record<string, unknown>)) {
    if (typeof mealId === "string") {
      cleaned[key] = mealId;
    }
  }
  return cleaned;
}

function sanitizeChecked(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function sanitizeMealType(value: unknown): MealType | null {
  return value === "breakfast" || value === "lunch" || value === "dinner"
    ? value
    : null;
}

function sanitizeCustomMeals(value: unknown): SanitizedMeal[] {
  if (!Array.isArray(value)) return [];

  const meals: SanitizedMeal[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const raw = entry as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id : null;
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const type = sanitizeMealType(raw.type);
    const cost =
      typeof raw.cost === "number" && Number.isFinite(raw.cost) ? raw.cost : NaN;

    if (!id || !name || !type || !Number.isFinite(cost)) continue;

    const ingredients: SanitizedIngredient[] = Array.isArray(raw.ingredients)
      ? raw.ingredients
          .map((item) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) return null;
            const value = item as Record<string, unknown>;
            const ingredientName =
              typeof value.name === "string" ? value.name.trim() : "";
            if (!ingredientName) return null;
            const amount =
              typeof value.amount === "number" && Number.isFinite(value.amount)
                ? value.amount
                : 1;
            return {
              name: ingredientName,
              amount: amount > 0 ? amount : 1,
              unit: typeof value.unit === "string" ? value.unit : "item",
              aisle: typeof value.aisle === "string" ? value.aisle : "Pantry",
            };
          })
          .filter((item): item is SanitizedIngredient => item !== null)
      : [];

    meals.push({
      id,
      name,
      type,
      cost: Number(cost.toFixed(2)),
      ingredients,
    });
  }

  return meals;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data } = await supabase
    .from("user_dashboard_state")
    .select("plan, checked_item_keys, custom_meals")
    .eq("user_id", user.id)
    .maybeSingle();

  const initialPlan = sanitizePlan(data?.plan);
  const initialCheckedItems = sanitizeChecked(data?.checked_item_keys);
  const initialCustomMeals = sanitizeCustomMeals(data?.custom_meals);

  return (
    <DashboardClient
      userId={user.id}
      initialPlan={initialPlan}
      initialCheckedItems={initialCheckedItems}
      initialCustomMeals={initialCustomMeals}
    />
  );
}
