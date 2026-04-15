import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedApiUser } from "@/lib/server/auth";
import { captureServerError } from "@/lib/server/observability";

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? "12");
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 12;
  }

  return Math.min(Math.floor(parsed), 52);
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuthenticatedApiUser();
    if ("response" in auth) return auth.response;

    const supabase = await createClient();
    const url = new URL(request.url);
    const limit = parseLimit(url.searchParams.get("limit"));

    const { data, error } = await supabase
      .from("weekly_plans")
      .select(
        "week_start, plan, custom_meals, budget_override_pence, total_spent_pence, updated_at",
      )
      .eq("user_id", auth.user.id)
      .order("week_start", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      explanation: `Loaded ${data?.length ?? 0} weekly plan records.`,
    });
  } catch (error) {
    await captureServerError(error, { event: "api.weekly-plans.failed" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load weekly plans" },
      { status: 500 },
    );
  }
}
