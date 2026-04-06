import { NextRequest, NextResponse } from "next/server";
import { logServerEvent } from "@/lib/server/observability";

interface RedisConfig {
  url: string;
  token: string;
}

interface RateLimitCounter {
  count: number;
  resetAt: number;
}

declare global {
  var __loavishRateLimitStore: Map<string, RateLimitCounter> | undefined;
}

export interface RateLimitPolicy {
  name: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitState {
  policy: RateLimitPolicy;
  key: string;
  identifier: string;
  limit: number;
  currentCount: number;
  remaining: number;
  resetAt: number;
}

function rateLimitStore(): Map<string, RateLimitCounter> {
  if (!globalThis.__loavishRateLimitStore) {
    globalThis.__loavishRateLimitStore = new Map();
  }
  return globalThis.__loavishRateLimitStore;
}

function redisConfig(): RedisConfig | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL ?? process.env.REDIS_REST_URL ?? "").trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.REDIS_REST_TOKEN ?? "").trim();
  if (!url || !token) return null;
  return { url, token };
}

async function redisCommand(args: Array<string | number>): Promise<unknown> {
  const config = redisConfig();
  if (!config) throw new Error("Redis config unavailable");

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Redis command failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { result?: unknown; error?: string };
  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload.result;
}

function defaultIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  const userAgent = request.headers.get("user-agent")?.trim() || "unknown-agent";
  const origin = forwarded || realIp || cfIp || "unknown-ip";
  return `${origin}:${userAgent.slice(0, 80)}`;
}

function memoryEvaluate(key: string, policy: RateLimitPolicy): RateLimitState {
  const now = Date.now();
  const existing = rateLimitStore().get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + policy.windowMs;
    rateLimitStore().set(key, { count: 1, resetAt });
    return {
      policy,
      key,
      identifier: key,
      limit: policy.limit,
      currentCount: 1,
      remaining: Math.max(0, policy.limit - 1),
      resetAt,
    };
  }

  existing.count += 1;
  rateLimitStore().set(key, existing);
  return {
    policy,
    key,
    identifier: key,
    limit: policy.limit,
    currentCount: existing.count,
    remaining: Math.max(0, policy.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

async function redisEvaluate(key: string, policy: RateLimitPolicy): Promise<RateLimitState> {
  const incremented = await redisCommand(["INCR", key]);
  const count = typeof incremented === "number" ? incremented : Number(incremented);

  if (!Number.isFinite(count)) {
    throw new Error("Redis INCR returned a non-numeric value");
  }

  if (count === 1) {
    await redisCommand(["PEXPIRE", key, Math.max(1000, Math.round(policy.windowMs))]);
  }

  const pttlRaw = await redisCommand(["PTTL", key]);
  let ttlMs = typeof pttlRaw === "number" ? pttlRaw : Number(pttlRaw);
  if (!Number.isFinite(ttlMs) || ttlMs < 0) {
    ttlMs = policy.windowMs;
    await redisCommand(["PEXPIRE", key, Math.max(1000, Math.round(policy.windowMs))]);
  }

  return {
    policy,
    key,
    identifier: key,
    limit: policy.limit,
    currentCount: count,
    remaining: Math.max(0, policy.limit - count),
    resetAt: Date.now() + ttlMs,
  };
}

function buildHeaders(state: RateLimitState): Headers {
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", String(state.limit));
  headers.set("X-RateLimit-Remaining", String(state.remaining));
  headers.set("X-RateLimit-Reset", String(Math.ceil(state.resetAt / 1000)));
  headers.set("X-RateLimit-Policy", state.policy.name);
  return headers;
}

export function applyRateLimitHeaders<T extends NextResponse>(response: T, state: RateLimitState): T {
  const headers = buildHeaders(state);
  headers.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export async function enforceRateLimit(
  request: NextRequest,
  policy: RateLimitPolicy,
  options?: { identifier?: string },
): Promise<{ state: RateLimitState; response?: NextResponse<{ error: string }> }> {
  if (process.env.RATE_LIMIT_DISABLED === "true") {
    const state: RateLimitState = {
      policy,
      key: `disabled:${policy.name}`,
      identifier: options?.identifier ?? "disabled",
      limit: policy.limit,
      currentCount: 0,
      remaining: policy.limit,
      resetAt: Date.now() + policy.windowMs,
    };
    return { state };
  }

  const identifier = options?.identifier?.trim() || defaultIdentifier(request);
  const key = `loavish:ratelimit:${policy.name}:${identifier}`;

  let state: RateLimitState;
  try {
    state = redisConfig()
      ? await redisEvaluate(key, policy)
      : memoryEvaluate(key, policy);
  } catch {
    state = memoryEvaluate(key, policy);
  }

  state = { ...state, identifier, key };

  if (state.currentCount > state.limit || state.limit <= 0) {
    const retryAfter = Math.max(1, Math.ceil((state.resetAt - Date.now()) / 1000));
    logServerEvent({
      level: "warn",
      event: "api.rate_limit.exceeded",
      policy: policy.name,
      identifier,
      path: request.nextUrl.pathname,
      retry_after_seconds: retryAfter,
    });

    const response = NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfter} seconds.` },
      { status: 429 },
    );
    applyRateLimitHeaders(response, state);
    response.headers.set("Retry-After", String(retryAfter));
    return { state, response };
  }

  return { state };
}
