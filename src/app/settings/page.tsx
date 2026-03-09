import { SettingsClient } from "@/components/settings/SettingsClient";
import { getDashboardServerData } from "@/lib/dashboard-server";

export default async function SettingsPage() {
  const data = await getDashboardServerData("/settings");

  return <SettingsClient {...data} />;
}
