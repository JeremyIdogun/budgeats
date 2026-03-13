export interface ServerErrorContext {
  event: string;
  userId?: string;
  retailerId?: string;
  runId?: string;
  route?: string;
  [key: string]: unknown;
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

  // Sentry support: install @sentry/nextjs and set SENTRY_DSN env var to enable.
  // Dynamic import is intentionally omitted here to avoid build-time resolution
  // errors. Wire Sentry via sentry.server.config.ts when the package is added.
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
