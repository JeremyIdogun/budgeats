import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getDashboardServerData } from "@/lib/dashboard-server";

export default async function ShoppingPage() {
  const data = await getDashboardServerData("/shopping");
  if (!data.profileWeeklyBudgetPence) redirect("/onboarding");

  return (
    <DashboardClient
      userId={data.userId}
      initialPlan={data.initialPlan}
      initialCheckedItems={data.initialCheckedItems}
      initialCustomMeals={data.initialCustomMeals}
      profileRetailers={data.profileRetailers}
      profileWeeklyBudgetPence={data.profileWeeklyBudgetPence}
      profileBudgetPeriod={data.profileBudgetPeriod}
      initialTab="shopping"
    />
  );
}
