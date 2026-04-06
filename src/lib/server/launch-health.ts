import { isEmailConfigured } from "@/lib/email/resend";
import { cacheGet, cacheSet } from "@/lib/server/cache";
import { getOptionalPrisma } from "@/lib/server/optional-prisma";
import { getPricingReadinessReport } from "@/lib/server/pricing-readiness";

type HealthStatus = "ok" | "warn" | "fail";
type OverallStatus = "ready" | "degraded" | "blocked";

interface HealthCheck {
  status: HealthStatus;
  summary: string;
}

type MinimalPrisma = {
  retailer: {
    findMany: (input: {
      take: number;
      select: { id: true };
    }) => Promise<Array<{ id: string }>>;
  };
};

function overallFromChecks(checks: HealthCheck[]): OverallStatus {
  if (checks.some((check) => check.status === "fail")) return "blocked";
  if (checks.some((check) => check.status === "warn")) return "degraded";
  return "ready";
}

export async function getLaunchHealthReport(): Promise<{
  generatedAt: string;
  overall: OverallStatus;
  checks: {
    auth: HealthCheck;
    database: HealthCheck;
    cache: HealthCheck;
    email: HealthCheck;
    pricing: HealthCheck;
  };
}> {
  const generatedAt = new Date().toISOString();

  const authConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
  const auth: HealthCheck = authConfigured
    ? { status: "ok", summary: "Supabase auth environment is configured." }
    : { status: "fail", summary: "Supabase auth environment is missing." };

  const prisma = (await getOptionalPrisma()) as MinimalPrisma | null;
  let database: HealthCheck;
  if (!prisma) {
    database = { status: "fail", summary: "Prisma database connection is not configured." };
  } else {
    try {
      await prisma.retailer.findMany({ take: 1, select: { id: true } });
      database = { status: "ok", summary: "Database is reachable." };
    } catch {
      database = { status: "fail", summary: "Database is configured but not reachable." };
    }
  }

  const cacheKey = `launch-health:${generatedAt}`;
  let cache: HealthCheck;
  try {
    await cacheSet(cacheKey, { ok: true }, 30_000);
    const roundTrip = await cacheGet<{ ok: boolean }>(cacheKey);
    const memoryMode =
      !(process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.REDIS_REST_URL?.trim());
    cache =
      roundTrip?.ok
        ? {
            status: memoryMode ? "warn" : "ok",
            summary: memoryMode
              ? "Cache is working in memory mode."
              : "Cache is working with Redis-backed configuration.",
          }
        : { status: "fail", summary: "Cache round-trip failed." };
  } catch {
    cache = { status: "fail", summary: "Cache round-trip failed." };
  }

  const email: HealthCheck = isEmailConfigured()
    ? { status: "ok", summary: "Transactional email is configured." }
    : { status: "warn", summary: "Transactional email is not configured." };

  const pricingReport = await getPricingReadinessReport();
  const pricing: HealthCheck =
    pricingReport.overall === "ready"
      ? {
          status: "ok",
          summary: `Live pricing is ready across ${pricingReport.liveReadyRetailerCount} retailers.`,
        }
      : pricingReport.overall === "degraded"
        ? {
            status: "warn",
            summary: `Pricing is partially ready. Source=${pricingReport.sourceMode}, connector=${pricingReport.connectorMode}.`,
          }
        : {
            status: "fail",
            summary: `Pricing is blocked. Source=${pricingReport.sourceMode}, connector=${pricingReport.connectorMode}.`,
          };

  const checks = { auth, database, cache, email, pricing };

  return {
    generatedAt,
    overall: overallFromChecks(Object.values(checks)),
    checks,
  };
}
