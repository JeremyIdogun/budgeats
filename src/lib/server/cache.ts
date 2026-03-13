interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface RedisConfig {
  url: string;
  token: string;
}

const REDIS_KEY_REGISTRY = "loavish:cache:keys";

declare global {
  var __loavishCacheStore: Map<string, CacheEntry<unknown>> | undefined;
}

function cacheStore(): Map<string, CacheEntry<unknown>> {
  if (!globalThis.__loavishCacheStore) {
    globalThis.__loavishCacheStore = new Map();
  }
  return globalThis.__loavishCacheStore;
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

function memoryGet<T>(key: string): T | null {
  const entry = cacheStore().get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    cacheStore().delete(key);
    return null;
  }
  return entry.value as T;
}

function memorySet<T>(key: string, value: T, ttlMs: number): T {
  cacheStore().set(key, {
    value,
    expiresAt: Date.now() + Math.max(0, ttlMs),
  });
  return value;
}

function memoryDeleteByPrefix(prefix: string): number {
  let removed = 0;
  for (const key of cacheStore().keys()) {
    if (key.startsWith(prefix)) {
      cacheStore().delete(key);
      removed += 1;
    }
  }
  return removed;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const config = redisConfig();
  if (!config) return memoryGet<T>(key);

  try {
    const raw = await redisCommand(["GET", key]);
    if (typeof raw !== "string") return null;
    return JSON.parse(raw) as T;
  } catch {
    return memoryGet<T>(key);
  }
}

export async function cacheSet<T>(key: string, value: T, ttlMs: number): Promise<T> {
  const config = redisConfig();
  if (!config) return memorySet(key, value, ttlMs);

  try {
    const serialized = JSON.stringify(value);
    await redisCommand(["SET", key, serialized, "PX", Math.max(0, Math.round(ttlMs))]);
    await redisCommand(["SADD", REDIS_KEY_REGISTRY, key]);
    return value;
  } catch {
    return memorySet(key, value, ttlMs);
  }
}

export async function cacheDeleteByPrefix(prefix: string): Promise<number> {
  const config = redisConfig();
  if (!config) return memoryDeleteByPrefix(prefix);

  try {
    const indexedKeysRaw = await redisCommand(["SMEMBERS", REDIS_KEY_REGISTRY]);
    const indexedKeys = Array.isArray(indexedKeysRaw)
      ? indexedKeysRaw.filter((value): value is string => typeof value === "string")
      : [];
    const matches = indexedKeys.filter((key) => key.startsWith(prefix));

    if (matches.length === 0) return 0;

    await Promise.all(
      matches.flatMap((key) => [
        redisCommand(["DEL", key]),
        redisCommand(["SREM", REDIS_KEY_REGISTRY, key]),
      ]),
    );

    return matches.length;
  } catch {
    return memoryDeleteByPrefix(prefix);
  }
}

export async function withCache<T>(
  key: string,
  ttlMs: number,
  resolver: () => Promise<T>,
): Promise<T> {
  const existing = await cacheGet<T>(key);
  if (existing !== null) return existing;
  const resolved = await resolver();
  return cacheSet(key, resolved, ttlMs);
}
