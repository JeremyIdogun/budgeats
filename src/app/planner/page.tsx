import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getDashboardServerData } from "@/lib/dashboard-server";

export default async function PlannerPage() {
  const data = await getDashboardServerData("/planner");

  return <DashboardClient {...data} initialTab="planner" />;
}
