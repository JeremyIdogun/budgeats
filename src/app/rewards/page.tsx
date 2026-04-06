import { redirect } from "next/navigation";
import { RewardsClient } from "@/components/rewards/RewardsClient";
import { launchFlags } from "@/lib/launch-flags";
import { getDashboardServerData } from "@/lib/dashboard-server";

export default async function RewardsPage() {
  if (!launchFlags.rewards) redirect("/dashboard");
  const data = await getDashboardServerData("/rewards");
  if (!data.profileWeeklyBudgetPence) redirect("/onboarding");
  return <RewardsClient {...data} />;
}
