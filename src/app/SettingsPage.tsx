import { Settings } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { useThemeStore, ACCENT_PALETTES } from "@/shared/store/themeStore";
import { useSettingsStore } from "@/shared/store/settingsStore";
import { saveSettings } from "@/shared/utils/tauriCommands";
import toast from "react-hot-toast";
import type { AccentColor, ThemeMode } from "@/shared/types";

const ACCENT_COLORS: AccentColor[] = ["rose", "blue", "violet", "emerald", "amber", "indigo"];

export default function SettingsPage() {
  const { theme, setTheme, accentColor, setAccentColor } = useThemeStore();
  const { settings, updateSettings } = useSettingsStore();

  const handleSave = async () => {
    try {
      await saveSettings(settings);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings to database");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title="Settings"
        description="Configure PDFToolKit preferences"
        actions={
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Appearance */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-primary mb-4">Appearance</h3>
          <div className="space-y-5">
            {/* Theme */}
            <div>
              <label className="text-xs font-medium text-secondary block mb-2">Theme</label>
              <div className="flex gap-2">
                {(["dark", "light", "system"] as ThemeMode[]).map((t) => (
                  <button key={t} onClick={() => setTheme(t)}
                    className={`flex-1 rounded-lg border py-2 text-xs font-medium capitalize transition-colors ${
                      theme === t
                        ? "border-brand-600/50 bg-brand-600/20 text-brand-400"
                        : "border-[var(--border-default)] text-secondary hover:border-brand-600/30"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="text-xs font-medium text-secondary block mb-2">Accent Color</label>
              <div className="flex gap-2 flex-wrap">
                {ACCENT_COLORS.map((color) => {
                  const swatch = ACCENT_PALETTES[color]["500"];
                  return (
                    <button key={color} onClick={() => setAccentColor(color)}
                      title={color}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                        accentColor === color
                          ? "border-white scale-110 shadow-md"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ background: swatch }}>
                      {accentColor === color && (
                        <div className="h-2.5 w-2.5 rounded-full bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Output */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-primary mb-4">Output</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={settings.autoOpenOutput}
                onChange={(e) => updateSettings({ autoOpenOutput: e.target.checked })}
                className="accent-rose-500" />
              <span className="text-sm text-secondary">Auto-open output folder after processing</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={settings.showThumbnails}
                onChange={(e) => updateSettings({ showThumbnails: e.target.checked })}
                className="accent-rose-500" />
              <span className="text-sm text-secondary">Show page thumbnails</span>
            </label>
            <div>
              <label className="text-xs font-medium text-secondary block mb-1.5">Thumbnail Quality</label>
              <select value={settings.thumbnailQuality}
                onChange={(e) => updateSettings({ thumbnailQuality: e.target.value as "low" | "medium" | "high" })}
                className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-primary focus:outline-none focus:border-brand-500">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Processing */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-primary mb-4">Processing</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-secondary block mb-1.5">
                Default Compression Level
              </label>
              <select value={settings.compressionLevel}
                onChange={(e) => updateSettings({ compressionLevel: e.target.value as "low" | "medium" | "high" | "maximum" })}
                className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-primary focus:outline-none focus:border-brand-500">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="maximum">Maximum</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-secondary block mb-1.5">
                Max Concurrent Jobs
              </label>
              <input type="number" min={1} max={8}
                value={settings.maxConcurrentJobs}
                onChange={(e) => updateSettings({ maxConcurrentJobs: Math.max(1, Math.min(8, parseInt(e.target.value) || 2)) })}
                className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-primary focus:outline-none focus:border-brand-500" />
            </div>
          </div>
        </Card>

        {/* OCR */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-primary mb-4">OCR</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-secondary block mb-1.5">Default Language</label>
              <select value={settings.ocrLanguage}
                onChange={(e) => updateSettings({ ocrLanguage: e.target.value })}
                className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-primary focus:outline-none focus:border-brand-500">
                <option value="eng">English</option>
                <option value="fra">French</option>
                <option value="deu">German</option>
                <option value="spa">Spanish</option>
                <option value="chi_sim">Chinese (Simplified)</option>
                <option value="jpn">Japanese</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Data */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-primary mb-4">Data & Privacy</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-secondary block mb-1.5">
                Log Retention (days)
              </label>
              <input type="number" min={1} max={365}
                value={settings.logRetentionDays}
                onChange={(e) => updateSettings({ logRetentionDays: parseInt(e.target.value) || 30 })}
                className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-primary focus:outline-none focus:border-brand-500" />
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-app-alt)] border border-[var(--border-default)]">
              <p className="text-xs text-secondary">
                🔒 PDFToolKit processes all files locally. No data is sent to external servers.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
