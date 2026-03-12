export async function captureServerError(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    JSON.stringify({
      event: "server.error",
      error: message,
      ...context,
    }),
  );
}
