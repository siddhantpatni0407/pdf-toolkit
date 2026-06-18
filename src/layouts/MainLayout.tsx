import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import StatusBar from "./StatusBar";
import { useThemeStore, applyAccentColor } from "@/shared/store/themeStore";
import { useSettingsStore } from "@/shared/store/settingsStore";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { theme, accentColor, applyTheme } = useThemeStore();
  const { settings } = useSettingsStore();

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme();
  }, [theme, applyTheme]);

  // Apply accent color
  useEffect(() => {
    applyAccentColor(accentColor);
  }, [accentColor]);

  // Sync settings store accent with theme store
  useEffect(() => {
    if (settings.accentColor && settings.accentColor !== accentColor) {
      applyAccentColor(settings.accentColor);
    }
  }, [settings.accentColor, accentColor]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-y-auto p-6"
          role="main"
          aria-label="Main content"
        >
          <div className="mx-auto max-w-7xl animate-fade-in">
            {children}
          </div>
        </main>
        <StatusBar />
      </div>
    </div>
  );
}
