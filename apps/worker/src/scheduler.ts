export interface IngestionScheduleDefinition {
  id:
    | "full-category-refresh"
    | "offers-refresh"
    | "top-ingredient-refresh"
    | "price-alerts-check";
  cron: string;
  description: string;
}

export type SchedulerProvider = "trigger-dev" | "bullmq";

export const ingestionSchedules: IngestionScheduleDefinition[] = [
  {
    id: "full-category-refresh",
    cron: "0 2 * * *",
    description: "Daily full category refresh",
  },
  {
    id: "offers-refresh",
    cron: "0 */6 * * *",
    description: "Offers refresh every 6 hours",
  },
  {
    id: "top-ingredient-refresh",
    cron: "0 */3 * * *",
    description: "Top-ingredient refresh every 3 hours",
  },
  {
    id: "price-alerts-check",
    cron: "0 */6 * * *",
    description: "Price alert sweep every 6 hours",
  },
];

export function shouldRunOnDemand(lastSnapshotAtIso: string | null, now: Date = new Date()): boolean {
  if (!lastSnapshotAtIso) return true;
  const lastSnapshotAt = new Date(lastSnapshotAtIso);
  const ageMs = now.getTime() - lastSnapshotAt.getTime();
  const maxAgeMs = 12 * 60 * 60 * 1000;
  return ageMs >= maxAgeMs;
}

export interface ProviderJobDescriptor {
  provider: SchedulerProvider;
  jobName: string;
  cron: string;
  payload: {
    scheduleId: IngestionScheduleDefinition["id"];
  };
}

export function buildProviderSchedules(provider: SchedulerProvider): ProviderJobDescriptor[] {
  return ingestionSchedules.map((schedule) => ({
    provider,
    jobName: `ingestion:${schedule.id}`,
    cron: schedule.cron,
    payload: { scheduleId: schedule.id },
  }));
}
