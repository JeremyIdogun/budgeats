import { createHash } from "node:crypto";
import { BlockedByRetailerError } from "./errors";

export interface SnapshotStore {
  hasSnapshot(hash: string): Promise<boolean>;
  putSnapshot(input: { key: string; body: string; contentType: "text/html" | "application/json" }): Promise<void>;
}

export interface PersistSnapshotInput {
  retailerId: string;
  resource: string;
  body: string;
  contentType: "text/html" | "application/json";
  store: SnapshotStore;
}

export interface PersistSnapshotResult {
  payloadHash: string;
  snapshotKey: string;
  skipped: boolean;
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function requiredSnapshotBucket(): string {
  const bucket = process.env.SNAPSHOT_BUCKET?.trim();
  if (!bucket) throw new Error("SNAPSHOT_BUCKET must be configured");
  return bucket;
}

export async function persistSnapshot(input: PersistSnapshotInput): Promise<PersistSnapshotResult> {
  const payloadHash = sha256(input.body);
  const snapshotKey = `${input.retailerId}/${input.resource}/${payloadHash}`;
  const exists = await input.store.hasSnapshot(snapshotKey);
  if (exists) {
    return { payloadHash, snapshotKey, skipped: true };
  }

  await input.store.putSnapshot({
    key: snapshotKey,
    body: input.body,
    contentType: input.contentType,
  });

  return { payloadHash, snapshotKey, skipped: false };
}

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !shouldRetry(error)) break;
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}

export interface ResponseShape {
  status: number;
  body?: string;
}

export function assertNotBlocked(retailerId: string, response: ResponseShape): void {
  const body = (response.body ?? "").toLowerCase();
  const blockedKeywords = ["captcha", "robot check", "access denied", "blocked", "forbidden"];
  const blockedStatusCodes = new Set([403, 429, 503]);
  const hasBlockedKeyword = blockedKeywords.some((keyword) => body.includes(keyword));

  if (blockedStatusCodes.has(response.status) || hasBlockedKeyword) {
    throw new BlockedByRetailerError(retailerId);
  }
}
