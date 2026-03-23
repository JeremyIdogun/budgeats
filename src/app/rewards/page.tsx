import { redirect } from "next/navigation";
import { RewardsClient } from "@/components/rewards/RewardsClient";
import { getDashboardServerData } from "@/lib/dashboard-server";

export default async function RewardsPage() {
  const data = await getDashboardServerData("/rewards");
  if (!data.profileWeeklyBudgetPence) redirect("/onboarding");
  return <RewardsClient {...data} />;
}
