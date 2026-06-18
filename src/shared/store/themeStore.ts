import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccentColor, ThemeMode } from "@/shared/types";

export const ACCENT_PALETTES: Record<AccentColor, Record<string, string>> = {
  rose:    { "50":"#fff1f2","100":"#ffe4e6","200":"#fecdd3","300":"#fda4af","400":"#fb7185","500":"#f43f5e","600":"#e11d48","700":"#be123c","800":"#9f1239","900":"#881337" },
  blue:    { "50":"#eff6ff","100":"#dbeafe","200":"#bfdbfe","300":"#93c5fd","400":"#60a5fa","500":"#3b82f6","600":"#2563eb","700":"#1d4ed8","800":"#1e40af","900":"#1e3a8a" },
  violet:  { "50":"#f5f3ff","100":"#ede9fe","200":"#ddd6fe","300":"#c4b5fd","400":"#a78bfa","500":"#8b5cf6","600":"#7c3aed","700":"#6d28d9","800":"#5b21b6","900":"#4c1d95" },
  emerald: { "50":"#ecfdf5","100":"#d1fae5","200":"#a7f3d0","300":"#6ee7b7","400":"#34d399","500":"#10b981","600":"#059669","700":"#047857","800":"#065f46","900":"#064e3b" },
  amber:   { "50":"#fffbeb","100":"#fef3c7","200":"#fde68a","300":"#fcd34d","400":"#fbbf24","500":"#f59e0b","600":"#d97706","700":"#b45309","800":"#92400e","900":"#78350f" },
  indigo:  { "50":"#eef2ff","100":"#e0e7ff","200":"#c7d2fe","300":"#a5b4fc","400":"#818cf8","500":"#6366f1","600":"#4f46e5","700":"#4338ca","800":"#3730a3","900":"#312e81" },
};

export function applyAccentColor(color: AccentColor) {
  const palette = ACCENT_PALETTES[color] ?? ACCENT_PALETTES.rose;
  const root = document.documentElement;
  Object.entries(palette).forEach(([shade, value]) => {
    root.style.setProperty(`--accent-${shade}`, value);
  });
}

interface ThemeState {
  theme: ThemeMode;
  accentColor: AccentColor;
  sidebarCollapsed: boolean;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      accentColor: "rose",
      sidebarCollapsed: false,

      setTheme: (theme) => {
        set({ theme });
        get().applyTheme();
      },

      setAccentColor: (color) => {
        set({ accentColor: color });
        applyAccentColor(color);
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      applyTheme: () => {
        const { theme } = get();
        const root = document.documentElement;
        if (theme === "dark") {
          root.classList.add("dark");
        } else if (theme === "light") {
          root.classList.remove("dark");
        } else {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          if (prefersDark) root.classList.add("dark");
          else root.classList.remove("dark");
        }
      },
    }),
    {
      name: "pdftoolkit-theme",
      partialize: (s) => ({ theme: s.theme, accentColor: s.accentColor, sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
);
