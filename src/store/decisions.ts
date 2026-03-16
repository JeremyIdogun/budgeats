import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DecisionLogEntry } from "@/models/logismos";

interface DecisionStore {
  entries: DecisionLogEntry[];
  addEntry: (entry: DecisionLogEntry) => void;
  clearAll: () => void;
}

export const useDecisionStore = create<DecisionStore>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) => set((s) => ({ entries: [entry, ...s.entries] })),
      clearAll: () => set({ entries: [] }),
    }),
    { name: "loavish-decisions", storage: createJSONStorage(() => localStorage) },
  ),
);
