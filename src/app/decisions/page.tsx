import { redirect } from "next/navigation";
import { DecisionsClient } from "@/components/decisions/DecisionsClient";
import { getDashboardServerData } from "@/lib/dashboard-server";

export default async function DecisionsPage() {
  const data = await getDashboardServerData("/decisions");
  if (!data.profileWeeklyBudgetPence) redirect("/onboarding");
  return <DecisionsClient {...data} />;
}
