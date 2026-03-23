import { redirect } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { getDashboardServerData } from "@/lib/dashboard-server";

export default async function DashboardPage() {
  const data = await getDashboardServerData("/dashboard");
  if (!data.profileWeeklyBudgetPence) redirect("/onboarding");

  return <DashboardOverview {...data} />;
}
