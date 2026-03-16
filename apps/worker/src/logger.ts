export interface StructuredLog {
  event: string;
  retailer_id?: string;
  run_id?: string;
  duration_ms?: number;
  error?: string;
  [key: string]: unknown;
}

async function captureWorkerError(log: StructuredLog): Promise<void> {
  if (!log.error || !process.env.SENTRY_DSN) return;
  try {
    const dynamicImport = new Function("m", "return import(m)") as (moduleName: string) => Promise<unknown>;
    const sentry = (await dynamicImport("@sentry/node")) as {
      captureException?: (exception: unknown, hint?: unknown) => void;
    };
    sentry.captureException?.(new Error(log.error), {
      extra: log,
      tags: {
        event: log.event,
        retailer_id: log.retailer_id ?? "unknown",
        run_id: log.run_id ?? "unknown",
      },
    });
  } catch {
    // Keep logging resilient even if Sentry module isn't present.
  }
}

export function logEvent(input: StructuredLog): void {
  // JSON logs are parse-friendly for ingestion/observability tools.
  console.log(JSON.stringify(input));
  void captureWorkerError(input);
}
