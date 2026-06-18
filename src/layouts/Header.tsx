import { useLocation } from "react-router-dom";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useThemeStore } from "@/shared/store/themeStore";
import { useJobQueueStore } from "@/shared/store/jobQueueStore";

const PAGE_TITLES: Record<string, string> = {
  "/":             "Dashboard",
  "/dashboard":    "Dashboard",
  "/merge":        "Merge PDF",
  "/split":        "Split PDF",
  "/compress":     "Compress PDF",
  "/rotate":       "Rotate Pages",
  "/reorder":      "Reorder Pages",
  "/remove-pages": "Remove Pages",
  "/extract-pages":"Extract Pages",
  "/repair":       "Repair PDF",
  "/pdf-to":       "PDF → Files",
  "/to-pdf":       "Files → PDF",
  "/protect":      "Protect PDF",
  "/unlock":       "Unlock PDF",
  "/watermark":    "Add Watermark",
  "/metadata":     "Metadata Editor",
  "/signature":    "Digital Signature",
  "/ocr":          "OCR",
  "/edit":         "Edit PDF",
  "/fill-form":    "Fill Form",
  "/batch":        "Batch Processing",
  "/history":      "Operation History",
  "/settings":     "Settings",
  "/about":        "About",
};

export default function Header() {
  const { theme, setTheme } = useThemeStore();
  const jobs = useJobQueueStore((s) => s.jobs);
  const runningCount = jobs.filter((j) => j.status === "running" || j.status === "queued").length;
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? "PDFToolKit";

  const cycleTheme = () => {
    const next: Record<string, "light" | "dark" | "system"> = {
      dark: "light",
      light: "system",
      system: "dark",
    };
    setTheme(next[theme] ?? "dark");
  };

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <header
      className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-card)] px-6 drag-region"
      role="banner"
    >
      <h1 className="text-sm font-semibold text-primary no-drag">{title}</h1>

      <div className="flex items-center gap-2 no-drag">
        {/* Running Jobs Indicator */}
        {runningCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-brand-600/20 border border-brand-600/30 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs text-brand-400 font-medium">{runningCount} job{runningCount > 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          title={`Theme: ${theme}`}
          aria-label={`Switch theme (currently ${theme})`}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-[var(--bg-app-alt)] transition-colors"
          )}
        >
          <ThemeIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
