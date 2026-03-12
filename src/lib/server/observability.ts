export async function captureServerError(error: unknown, context?: Record<string, unknown>) {
  try {
    const moduleName = "@sentry/nextjs";
    const sentry = await import(moduleName);
    (sentry as { captureException?: (e: unknown, ctx?: unknown) => void }).captureException?.(
      error,
      { extra: context },
    );
    return;
  } catch {
    // Sentry package is optional in this workspace.
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error(
    JSON.stringify({
      event: "server.error",
      error: message,
      ...context,
    }),
  );
}
