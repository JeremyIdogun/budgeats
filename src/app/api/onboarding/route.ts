import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedApiUser } from "@/lib/server/auth";
import { captureServerError } from "@/lib/server/observability";
import { createClient } from "@/lib/supabase/server";

const retailerIdSchema = z.enum([
  "tesco",
  "sainsburys",
  "aldi",
  "lidl",
  "asda",
  "morrisons",
  "waitrose",
  "coop",
  "ocado",
]);

const dietarySchema = z.enum([
  "vegetarian",
  "vegan",
  "halal",
  "gluten-free",
  "dairy-free",
  "none",
]);

const onboardingSchema = z.object({
  budget: z.number().finite().min(20).max(1000),
  period: z.enum(["weekly", "monthly"]),
  household: z.number().int().min(1).max(5),
  dietary: z.array(dietarySchema),
  retailers: z.array(retailerIdSchema).min(1),
});

type UserProfileRow = {
  id: string;
  email: string;
};

function normalizeDietary(input: string[]): string[] {
  const filtered = input.filter((value) => value !== "none");
  return Array.from(new Set(filtered));
}

function normalizeRetailers(input: string[]): string[] {
  return Array.from(new Set(input.filter((value) => value.trim().length > 0)));
}

function toWeeklyBudgetPence(budget: number, period: "weekly" | "monthly"): number {
  return period === "weekly"
    ? Math.round(budget * 100)
    : Math.round((budget * 100) / 4.33);
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedApiUser();
    if ("response" in auth) return auth.response;

    const body = await request.json().catch(() => null);
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Complete every onboarding step before continuing." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const dietaryPreferences = normalizeDietary(parsed.data.dietary);
    const preferredRetailers = normalizeRetailers(parsed.data.retailers);
    const weeklyBudgetPence = toWeeklyBudgetPence(parsed.data.budget, parsed.data.period);

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("user_profiles")
      .select("id, email")
      .eq("id", auth.user.id)
      .maybeSingle<UserProfileRow>();

    if (existingProfileError) {
      throw existingProfileError;
    }

    const email = auth.user.email ?? existingProfile?.email ?? null;
    if (!email) {
      return NextResponse.json(
        {
          error:
            "Your account does not have an email address yet. Please contact support so we can complete setup.",
        },
        { status: 400 },
      );
    }

    const payload = {
      household_size: parsed.data.household,
      weekly_budget_pence: weeklyBudgetPence,
      budget_period: parsed.data.period,
      dietary_preferences: dietaryPreferences,
      preferred_retailer_ids: preferredRetailers,
      updated_at: new Date().toISOString(),
    };

    const writeError = existingProfile
      ? (
          await supabase
            .from("user_profiles")
            .update(payload)
            .eq("id", auth.user.id)
        ).error
      : (
          await supabase
            .from("user_profiles")
            .insert({
              id: auth.user.id,
              email,
              ...payload,
            })
        ).error;

    if (writeError) {
      throw writeError;
    }

    return NextResponse.json({
      data: {
        weeklyBudgetPence,
        dietaryPreferences,
        preferredRetailers,
      },
      explanation: "Onboarding profile saved.",
    });
  } catch (error) {
    captureServerError(error, { event: "api.onboarding.save.failed", route: "/api/onboarding" });
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "We couldn't save your setup. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
