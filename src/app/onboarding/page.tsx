import { redirect } from "next/navigation";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("weekly_budget_pence")
      .eq("id", user.id)
      .maybeSingle();

    const weeklyBudgetPence =
      typeof profile?.weekly_budget_pence === "number"
        ? profile.weekly_budget_pence
        : typeof profile?.weekly_budget_pence === "string"
          ? Number(profile.weekly_budget_pence)
          : 0;

    if (Number.isFinite(weeklyBudgetPence) && weeklyBudgetPence > 0) {
      redirect("/dashboard");
    }
  }

  return <OnboardingClient />;
}
