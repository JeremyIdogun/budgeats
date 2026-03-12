import type { RetailerSeed } from "./types";

export const retailersSeed: RetailerSeed[] = [
  { slug: "tesco", name: "Tesco", status: "active", loyalty_scheme: "clubcard" },
  { slug: "asda", name: "Asda", status: "active", loyalty_scheme: "none" },
  { slug: "sainsburys", name: "Sainsbury's", status: "active", loyalty_scheme: "nectar" },
  { slug: "ocado", name: "Ocado", status: "stub", loyalty_scheme: "none" },
  { slug: "lidl", name: "Lidl", status: "stub", loyalty_scheme: "none" },
];
