import { redirect } from "next/navigation";
import { PantryClient } from "@/components/pantry/PantryClient";
import { getDashboardServerData } from "@/lib/dashboard-server";

export default async function PantryPage() {
  const data = await getDashboardServerData("/pantry");
  if (!data.profileWeeklyBudgetPence) redirect("/onboarding");
  return <PantryClient {...data} />;
}
