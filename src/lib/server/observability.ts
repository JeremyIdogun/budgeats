export interface ServerErrorContext {
  event: string;
  userId?: string;
  retailerId?: string;
  runId?: string;
  route?: string;
  [key: string]: unknown;
}

export interface ServerLogContext {
  event: string;
  level?: "info" | "warn" | "error";
  [key: string]: unknown;
}

function emitStructuredLog(level: "info" | "warn" | "error", payload: Record<string, unknown>): void {
  const logger =
    level === "error" ? console.error
    : level === "warn" ? console.warn
    : console.log;

  logger(JSON.stringify({
    level,
    ...payload,
    timestamp: new Date().toISOString(),
  }));
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
    event,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...restContext,
  };

  emitStructuredLog("error", structured);
  void captureWithSentry(error, structured);
}

export function logServerEvent(context: ServerLogContext): void {
  const { level = "info", ...rest } = context;
  emitStructuredLog(level, rest);
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
  emitStructuredLog("info", summary);
}
