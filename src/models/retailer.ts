export type RetailerId =
  | "tesco"
  | "sainsburys"
  | "aldi"
  | "lidl"
  | "asda"
  | "morrisons"
  | "waitrose"
  | "coop"
  | "ocado";

export interface Retailer {
  id: RetailerId;
  name: string;
  color: string;
  logoInitial: string;
}

export const RETAILERS: Record<RetailerId, Retailer> = {
  tesco: { id: "tesco", name: "Tesco", color: "#005DAA", logoInitial: "T" },
  sainsburys: {
    id: "sainsburys",
    name: "Sainsbury's",
    color: "#F07800",
    logoInitial: "S",
  },
  aldi: { id: "aldi", name: "Aldi", color: "#E8693A", logoInitial: "A" },
  lidl: { id: "lidl", name: "Lidl", color: "#0050AA", logoInitial: "L" },
  asda: { id: "asda", name: "Asda", color: "#007932", logoInitial: "A" },
  morrisons: {
    id: "morrisons",
    name: "Morrisons",
    color: "#F5A500",
    logoInitial: "M",
  },
  waitrose: {
    id: "waitrose",
    name: "Waitrose",
    color: "#006B3C",
    logoInitial: "W",
  },
  coop: { id: "coop", name: "Co-op", color: "#6B48C8", logoInitial: "C" },
  ocado: { id: "ocado", name: "Ocado", color: "#5D9B00", logoInitial: "O" },
};
