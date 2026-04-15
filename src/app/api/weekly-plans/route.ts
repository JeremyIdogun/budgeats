import { createClient } from "@/lib/supabase/server";
import { ApiError, handle, jsonOk, parseSearchParams, z } from "@/lib/server/api";

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(52).optional(),
});

export const GET = handle({ event: "api.weekly-plans.failed", auth: "user" }, async ({ request, user }) => {
  const { limit = 12 } = parseSearchParams(request, querySchema);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("weekly_plans")
    .select(
      "week_start, plan, custom_meals, budget_override_pence, total_spent_pence, updated_at",
    )
    .eq("user_id", user.id)
    .order("week_start", { ascending: false })
    .limit(limit);

  if (error) {
    throw new ApiError(500, error.message, "db_error");
  }

  return jsonOk(data, { explanation: `Loaded ${data?.length ?? 0} weekly plan records.` });
});
