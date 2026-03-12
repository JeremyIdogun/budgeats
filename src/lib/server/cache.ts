interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

declare global {
  var __loavishCacheStore: Map<string, CacheEntry<unknown>> | undefined;
}

function cacheStore(): Map<string, CacheEntry<unknown>> {
  if (!globalThis.__loavishCacheStore) {
    globalThis.__loavishCacheStore = new Map();
  }
  return globalThis.__loavishCacheStore;
}

export function cacheGet<T>(key: string): T | null {
  const entry = cacheStore().get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    cacheStore().delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): T {
  cacheStore().set(key, {
    value,
    expiresAt: Date.now() + Math.max(0, ttlMs),
  });
  return value;
}

export function cacheDeleteByPrefix(prefix: string): number {
  let removed = 0;
  for (const key of cacheStore().keys()) {
    if (key.startsWith(prefix)) {
      cacheStore().delete(key);
      removed += 1;
    }
  }
  return removed;
}

export async function withCache<T>(
  key: string,
  ttlMs: number,
  resolver: () => Promise<T>,
): Promise<T> {
  const existing = cacheGet<T>(key);
  if (existing !== null) return existing;
  const resolved = await resolver();
  return cacheSet(key, resolved, ttlMs);
}
