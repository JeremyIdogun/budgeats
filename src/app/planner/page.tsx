import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getDashboardServerData } from "@/lib/dashboard-server";

export default async function PlannerPage() {
  const data = await getDashboardServerData("/planner");
  if (!data.profileWeeklyBudgetPence) redirect("/onboarding");

  return <DashboardClient {...data} initialTab="planner" />;
}
