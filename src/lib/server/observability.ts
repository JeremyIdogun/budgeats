export interface ServerErrorContext {
  event: string;
  userId?: string;
  retailerId?: string;
  runId?: string;
  route?: string;
  [key: string]: unknown;
}

async function captureWithSentry(error: unknown, context: Record<string, unknown>): Promise<void> {
  if (!process.env.SENTRY_DSN) return;
  try {
    const dynamicImport = new Function("m", "return import(m)") as (moduleName: string) => Promise<unknown>;
    const sentry = (await dynamicImport("@sentry/nextjs")) as {
      captureException?: (exception: unknown, hint?: unknown) => void;
    };
    sentry.captureException?.(error, {
      extra: context,
      tags: {
        event: typeof context.event === "string" ? context.event : "server.error",
      },
    });
  } catch {
    // Keep error capture non-blocking.
  }
}

export function captureServerError(error: unknown, context: ServerErrorContext): void {
  const { event, ...restContext } = context;
  const structured = {
    level: "error",
    event,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...restContext,
    timestamp: new Date().toISOString(),
  };

  // Always log structurally
  console.error(JSON.stringify(structured));
  void captureWithSentry(error, structured);
}

export function logIngestionSummary(summary: {
  event: string;
  retailer_id: string;
  run_id: string;
  duration_ms: number;
  products_scraped: number;
  matched: number;
  review_queue: number;
  unmatched: number;
  errors: number;
}): void {
  console.log(JSON.stringify({ level: "info", ...summary, timestamp: new Date().toISOString() }));
}
