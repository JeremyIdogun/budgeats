import { ApifyClient } from "apify-client";

export interface ApifyFetcherOptions {
  token: string;
  timeoutSecs?: number;
}

export interface ApifyActorInput {
  actorId: string;
  input: Record<string, unknown>;
}

export type ApifyDatasetItem = Record<string, unknown>;

export async function runApifyActor(
  options: ApifyFetcherOptions,
  actor: ApifyActorInput,
): Promise<ApifyDatasetItem[]> {
  const client = new ApifyClient({ token: options.token });

  const run = await client.actor(actor.actorId).call(actor.input, {
    waitSecs: options.timeoutSecs ?? 120,
  });

  if (!run.defaultDatasetId) {
    throw new Error(`Apify actor ${actor.actorId} returned no dataset`);
  }

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items as ApifyDatasetItem[];
}

export function requiredApifyToken(): string {
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) throw new Error("APIFY_TOKEN must be configured");
  return token;
}
