import { useState, useCallback } from "react";
import { Unlock, Play, X, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { save } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { useAppStore } from "@/shared/store/appStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { unlockPdf } from "@/shared/utils/tauriCommands";
import { generateId } from "@/shared/utils/fileUtils";
import type { FileWithStatus } from "@/shared/types";

export default function UnlockPDFPage() {
  const [file, setFile] = useState<FileWithStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setStatus, setProcessing } = useAppStore();
  const { triggerRefresh } = useHistoryStore();

  const handleFilesSelected = useCallback((paths: string[]) => {
    setFile({
      id: generateId(),
      name: paths[0].split(/[\\/]/).pop() ?? paths[0],
      path: paths[0],
      size: 0,
      mimeType: "application/pdf",
      addedAt: new Date().toISOString(),
      status: "pending",
      progress: 0,
    });
  }, []);

  const handleUnlock = useCallback(async () => {
    if (!file) { toast.error("Please select a PDF file."); return; }
    if (!password) { toast.error("Please enter the PDF password."); return; }

    const savePath = await save({
      title: "Save Unlocked PDF",
      defaultPath: `${file.name.replace(".pdf", "")}_unlocked.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!savePath) return;

    setIsProcessing(true);
    setProcessing(true);
    setStatus("Unlocking PDF...", "processing");

    try {
      await unlockPdf(file.path, savePath, password);
      setFile((f) => f ? { ...f, status: "done", progress: 100 } : f);
      toast.success("PDF unlocked successfully!");
      setStatus("PDF unlocked", "success");
      triggerRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFile((f) => f ? { ...f, status: "error", error: msg } : f);
      const isWrongPwd = msg.toLowerCase().includes("password") || msg.toLowerCase().includes("auth");
      toast.error(isWrongPwd ? "Incorrect password" : `Failed: ${msg}`);
      setStatus("Unlock failed", "error");
    } finally {
      setIsProcessing(false);
      setProcessing(false);
    }
  }, [file, password, setStatus, setProcessing, triggerRefresh]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Unlock} title="Unlock PDF"
        description="Remove password protection from a PDF file" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!file ? (
            <FileDropZone onFilesSelected={handleFilesSelected} accept={[".pdf"]} multiple={false}
              disabled={isProcessing} label="Drop a protected PDF here" sublabel="or click to browse" />
          ) : (
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/20 flex-shrink-0">
                  <Unlock className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                  <p className="text-xs text-muted capitalize">{file.status}</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => { setFile(null); setPassword(""); }} disabled={isProcessing}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card padding="md">
            <h3 className="text-sm font-semibold text-primary mb-4">Password</h3>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
                placeholder="Enter PDF password"
                className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 pr-9 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand-500" />
              <button onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-secondary">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted mt-2">
              The password will not be stored or transmitted anywhere.
            </p>
          </Card>

          <Button variant="primary" size="lg" className="w-full"
            leftIcon={<Play className="h-4 w-4" />}
            loading={isProcessing} onClick={handleUnlock} disabled={!file || !password}>
            Unlock PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
