import { ShoppingClient } from "@/components/shopping/ShoppingClient";
import { getDashboardServerData } from "@/lib/dashboard-server";

export default async function ShoppingPage() {
  const data = await getDashboardServerData("/shopping");

  return <ShoppingClient {...data} />;
}
