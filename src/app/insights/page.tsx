import { redirect } from "next/navigation";
import { InsightsClient } from "@/components/insights/InsightsClient";
import { getDashboardServerData } from "@/lib/dashboard-server";

export default async function InsightsPage() {
  const data = await getDashboardServerData("/insights");
  if (!data.profileWeeklyBudgetPence) redirect("/onboarding");

  return <InsightsClient {...data} />;
}
