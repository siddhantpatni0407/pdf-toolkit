import { create } from "zustand";
import type { Job, PdfOperation } from "@/shared/types";
import { generateId } from "@/shared/utils/fileUtils";

interface JobQueueState {
  jobs: Job[];
  activeJobId: string | null;
  addJob: (
    operation: PdfOperation,
    inputFiles: string[],
    outputPath: string,
    params?: Record<string, unknown>
  ) => string;
  updateJob: (
    id: string,
    updates: Partial<Pick<Job, "status" | "progress" | "error" | "resultFiles" | "startedAt" | "completedAt">>
  ) => void;
  removeJob: (id: string) => void;
  clearCompleted: () => void;
  setActiveJob: (id: string | null) => void;
  getJobById: (id: string) => Job | undefined;
  getPendingJobs: () => Job[];
  getRunningJobs: () => Job[];
}

export const useJobQueueStore = create<JobQueueState>()((set, get) => ({
  jobs: [],
  activeJobId: null,

  addJob: (operation, inputFiles, outputPath, params = {}) => {
    const id = generateId();
    const job: Job = {
      id,
      operation,
      inputFiles,
      outputPath,
      params,
      status: "queued",
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ jobs: [job, ...s.jobs] }));
    return id;
  },

  updateJob: (id, updates) => {
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j)),
    }));
  },

  removeJob: (id) => {
    set((s) => ({
      jobs: s.jobs.filter((j) => j.id !== id),
      activeJobId: s.activeJobId === id ? null : s.activeJobId,
    }));
  },

  clearCompleted: () => {
    set((s) => ({
      jobs: s.jobs.filter((j) => j.status !== "completed" && j.status !== "failed"),
    }));
  },

  setActiveJob: (id) => set({ activeJobId: id }),

  getJobById: (id) => get().jobs.find((j) => j.id === id),

  getPendingJobs: () => get().jobs.filter((j) => j.status === "queued"),

  getRunningJobs: () => get().jobs.filter((j) => j.status === "running"),
}));
