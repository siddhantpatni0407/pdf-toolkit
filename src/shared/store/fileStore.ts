import { create } from "zustand";
import type { FileWithStatus, PdfFile } from "@/shared/types";
import { generateId } from "@/shared/utils/fileUtils";

interface FileState {
  files: FileWithStatus[];
  selectedFileIds: Set<string>;
  addFiles: (files: PdfFile[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  updateFileStatus: (
    id: string,
    status: FileWithStatus["status"],
    progress?: number,
    error?: string,
    outputPath?: string
  ) => void;
  toggleSelectFile: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;
}

export const useFileStore = create<FileState>()((set, get) => ({
  files: [],
  selectedFileIds: new Set(),

  addFiles: (newFiles) => {
    const withStatus: FileWithStatus[] = newFiles.map((f) => ({
      ...f,
      id: f.id || generateId(),
      status: "pending",
      progress: 0,
    }));
    set((s) => ({ files: [...s.files, ...withStatus] }));
  },

  removeFile: (id) => {
    set((s) => ({
      files: s.files.filter((f) => f.id !== id),
      selectedFileIds: new Set([...s.selectedFileIds].filter((fid) => fid !== id)),
    }));
  },

  clearFiles: () => set({ files: [], selectedFileIds: new Set() }),

  updateFileStatus: (id, status, progress, error, outputPath) => {
    set((s) => ({
      files: s.files.map((f) =>
        f.id === id
          ? { ...f, status, progress: progress ?? f.progress, error, outputPath }
          : f
      ),
    }));
  },

  toggleSelectFile: (id) => {
    const next = new Set(get().selectedFileIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ selectedFileIds: next });
  },

  selectAll: () => {
    const ids = get().files.map((f) => f.id);
    set({ selectedFileIds: new Set(ids) });
  },

  deselectAll: () => set({ selectedFileIds: new Set() }),

  reorderFiles: (fromIndex, toIndex) => {
    const files = [...get().files];
    const [moved] = files.splice(fromIndex, 1);
    files.splice(toIndex, 0, moved);
    set({ files });
  },
}));
