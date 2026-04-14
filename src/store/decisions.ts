import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DecisionLogEntry } from "@/models/logismos";

interface DecisionStore {
  activeUserId: string | null;
  entries: DecisionLogEntry[];
  setActiveUser: (userId: string | null) => void;
  addEntry: (entry: DecisionLogEntry) => void;
  clearAll: () => void;
}

const storage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }

  return window.localStorage;
});

export const useDecisionStore = create<DecisionStore>()(
  persist(
    (set) => ({
      activeUserId: null,
      entries: [],
      setActiveUser: (userId) =>
        set((state) =>
          state.activeUserId === userId
            ? state
            : {
                activeUserId: userId,
                entries: [],
              }),
      addEntry: (entry) => set((s) => ({ entries: [entry, ...s.entries] })),
      clearAll: () => set({ entries: [] }),
    }),
    { name: "loavish-decisions", storage },
  ),
);
