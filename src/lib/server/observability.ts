export interface ServerErrorContext {
  event: string;
  userId?: string;
  retailerId?: string;
  runId?: string;
  route?: string;
  [key: string]: unknown;
}

export function captureServerError(error: unknown, context: ServerErrorContext): void {
  const structured = {
    level: "error",
    event: context.event,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
    timestamp: new Date().toISOString(),
  };

  // Always log structurally
  console.error(JSON.stringify(structured));

  // Send to Sentry if DSN configured (non-blocking)
  if (process.env.SENTRY_DSN) {
    import("@sentry/nextjs")
      .then(({ captureException, withScope }) => {
        withScope((scope) => {
          scope.setTag("event", context.event);
          if (context.userId) scope.setUser({ id: context.userId });
          if (context.retailerId) scope.setTag("retailer_id", context.retailerId);
          if (context.runId) scope.setTag("run_id", context.runId);
          if (context.route) scope.setTag("route", context.route);
          captureException(error instanceof Error ? error : new Error(String(error)));
        });
      })
      .catch(() => {
        // Sentry not available, already logged above
      });
  }
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
