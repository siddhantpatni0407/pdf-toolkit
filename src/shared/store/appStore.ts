import { create } from "zustand";

interface AppState {
  statusMessage: string;
  statusType: "idle" | "processing" | "success" | "error";
  globalProgress: number;
  isProcessing: boolean;
  setStatus: (message: string, type?: AppState["statusType"]) => void;
  setGlobalProgress: (progress: number) => void;
  setProcessing: (processing: boolean) => void;
  clearStatus: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  statusMessage: "Ready",
  statusType: "idle",
  globalProgress: 0,
  isProcessing: false,

  setStatus: (message, type = "idle") =>
    set({ statusMessage: message, statusType: type }),

  setGlobalProgress: (progress) => set({ globalProgress: progress }),

  setProcessing: (processing) =>
    set({ isProcessing: processing, statusType: processing ? "processing" : "idle" }),

  clearStatus: () =>
    set({ statusMessage: "Ready", statusType: "idle", globalProgress: 0, isProcessing: false }),
}));
