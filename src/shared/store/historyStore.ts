import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryEntry, RecentFile } from "@/shared/types";

interface HistoryState {
  entries: HistoryEntry[];
  recentFiles: RecentFile[];
  refreshKey: number;
  setEntries: (entries: HistoryEntry[]) => void;
  prependEntry: (entry: HistoryEntry) => void;
  removeEntry: (id: number) => void;
  clearEntries: () => void;
  setRecentFiles: (files: RecentFile[]) => void;
  triggerRefresh: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      recentFiles: [],
      refreshKey: 0,

      setEntries: (entries) => set({ entries }),
      prependEntry: (entry) => set((s) => ({ entries: [entry, ...s.entries].slice(0, 200) })),
      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      clearEntries: () => set({ entries: [] }),
      setRecentFiles: (recentFiles) => set({ recentFiles }),
      triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
    }),
    {
      name: "pdftoolkit-history",
      partialize: (s) => ({ recentFiles: s.recentFiles }),
    }
  )
);
