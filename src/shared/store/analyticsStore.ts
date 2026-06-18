import { create } from "zustand";
import type { AnalyticsSummary } from "@/shared/types";

interface AnalyticsState {
  summary: AnalyticsSummary | null;
  isLoading: boolean;
  lastUpdated: string | null;
  refreshKey: number;
  setSummary: (summary: AnalyticsSummary) => void;
  setLoading: (loading: boolean) => void;
  triggerRefresh: () => void;
}

const defaultSummary: AnalyticsSummary = {
  totalOperations: 0,
  totalFilesProcessed: 0,
  totalStorageSaved: 0,
  mostUsedOperation: null,
  operationStats: [],
  dailyActivity: [],
};

export const useAnalyticsStore = create<AnalyticsState>()((set) => ({
  summary: defaultSummary,
  isLoading: false,
  lastUpdated: null,
  refreshKey: 0,

  setSummary: (summary) =>
    set({ summary, lastUpdated: new Date().toISOString(), isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
}));
