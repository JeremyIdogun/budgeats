import type { SnapshotStore } from "../runtime";
import { AsdaConnector } from "../asda/connector";
import { SainsburysConnector } from "../sainsburys/connector";
import { TescoConnector } from "../tesco/connector";
import { requiredApifyToken } from "./fetcher";

export type ApifyRetailerSlug = "tesco" | "asda" | "sainsburys";

export function createApifyConnector(
  slug: ApifyRetailerSlug,
  snapshotStore: SnapshotStore,
) {
  const apifyOptions = {
    token: requiredApifyToken(),
    timeoutSecs: 120,
  };

  if (slug === "tesco") return new TescoConnector(snapshotStore, undefined, apifyOptions);
  if (slug === "asda") return new AsdaConnector(snapshotStore, undefined, apifyOptions);
  return new SainsburysConnector(snapshotStore, undefined, apifyOptions);
}
