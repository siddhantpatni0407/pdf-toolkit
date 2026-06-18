import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings } from "@/shared/types";
import { DEFAULT_SETTINGS } from "@/shared/types";

interface SettingsState {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "pdftoolkit-settings",
    }
  )
);
