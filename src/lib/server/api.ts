import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z, ZodError, type ZodType } from "zod";
import { requireAuthenticatedApiUser, requireAdminApiUser } from "@/lib/server/auth";
import { captureServerError } from "@/lib/server/observability";

/**
 * Shared API utilities for Next.js route handlers.
 *
 * Goals:
 *  - Consistent JSON response shape: `{ data }` on success, `{ error, code?, details? }` on failure.
 *  - Centralized auth gating (user / admin).
 *  - Zod-based validation for JSON bodies and search params.
 *  - Uniform error capture via observability.
 *
 * Routes may use `jsonOk` / `jsonError` directly, or compose via `handle(...)`.
 */

export type ApiSuccess<T> = { data: T; explanation?: string };
export type ApiFailure = { error: string; code?: string; details?: unknown };

export function jsonOk<T>(data: T, init?: ResponseInit & { explanation?: string }): NextResponse<ApiSuccess<T>> {
  const { explanation, ...rest } = init ?? {};
  return NextResponse.json<ApiSuccess<T>>(
    explanation ? { data, explanation } : { data },
    rest,
  );
}

export function jsonError(
  error: string,
  status: number,
  options: { code?: string; details?: unknown } = {},
): NextResponse<ApiFailure> {
  return NextResponse.json<ApiFailure>(
    { error, ...(options.code ? { code: options.code } : {}), ...(options.details !== undefined ? { details: options.details } : {}) },
    { status },
  );
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function formatZodError(err: ZodError): unknown {
  return err.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body", "invalid_json");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError(400, "Request validation failed", "validation_error", formatZodError(result.error));
  }
  return result.data;
}

export function parseSearchParams<T>(request: Request, schema: ZodType<T>): T {
  const url = new URL(request.url);
  const entries: Record<string, string | string[]> = {};
  for (const [key, value] of url.searchParams.entries()) {
    const existing = entries[key];
    if (existing === undefined) {
      entries[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      entries[key] = [existing, value];
    }
  }
  const result = schema.safeParse(entries);
  if (!result.success) {
    throw new ApiError(400, "Query validation failed", "validation_error", formatZodError(result.error));
  }
  return result.data;
}

type RouteContext = { request: Request; user: User };

type RouteHandler<T> = (ctx: RouteContext) => Promise<NextResponse<ApiSuccess<T>> | NextResponse<ApiFailure>>;

interface HandleOptions {
  /** Route identifier used for observability events. */
  event: string;
  /** "user" requires any authenticated user; "admin" requires admin email; "public" skips auth. */
  auth?: "user" | "admin" | "public";
}

/**
 * Wraps a route handler with auth gating and uniform error handling.
 */
export function handle<T>(
  options: HandleOptions,
  handler: (ctx: RouteContext) => Promise<NextResponse<ApiSuccess<T>> | NextResponse<ApiFailure> | ApiSuccess<T> | T>,
): (request: Request) => Promise<NextResponse> {
  return async (request: Request): Promise<NextResponse> => {
    try {
      let user: User | undefined;
      if (options.auth !== "public") {
        const guard = options.auth === "admin" ? await requireAdminApiUser() : await requireAuthenticatedApiUser();
        if ("response" in guard) return guard.response as NextResponse;
        user = guard.user;
      }
      const result = await (handler as RouteHandler<T>)({ request, user: user as User });
      if (result instanceof NextResponse) return result;
      // Raw data returned — wrap as success.
      return jsonOk(result as T);
    } catch (error) {
      if (error instanceof ApiError) {
        captureServerError(error, {
          event: options.event,
          status: error.status,
          code: error.code,
        });
        return jsonError(error.message, error.status, { code: error.code, details: error.details });
      }
      captureServerError(error, { event: options.event });
      const message = error instanceof Error ? error.message : "Unexpected error";
      return jsonError(message, 500, { code: "internal_error" });
    }
  };
}

export { z };
