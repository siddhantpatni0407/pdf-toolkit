import { useState, useCallback } from "react";
import { RotateCw, Play, X, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { save } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { useAppStore } from "@/shared/store/appStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { rotatePdf } from "@/shared/utils/tauriCommands";
import { generateId } from "@/shared/utils/fileUtils";
import type { FileWithStatus, RotationAngle } from "@/shared/types";

export default function RotatePDFPage() {
  const [file, setFile] = useState<FileWithStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [angle, setAngle] = useState<RotationAngle>(90);
  const [pageMode, setPageMode] = useState<"all" | "custom">("all");
  const [customPages, setCustomPages] = useState("");
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

  const handleRotate = useCallback(async () => {
    if (!file) { toast.error("Please select a PDF file."); return; }

    const savePath = await save({
      title: "Save Rotated PDF",
      defaultPath: `${file.name.replace(".pdf", "")}_rotated.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!savePath) return;

    let pages: "all" | number[] = "all";
    if (pageMode === "custom" && customPages.trim()) {
      pages = customPages
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);
    }

    setIsProcessing(true);
    setProcessing(true);
    setStatus("Rotating pages...", "processing");

    try {
      await rotatePdf(file.path, savePath, { angle, pages });
      setFile((f) => f ? { ...f, status: "done", progress: 100 } : f);
      toast.success("Pages rotated successfully!");
      setStatus("Rotation complete", "success");
      triggerRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFile((f) => f ? { ...f, status: "error", error: msg } : f);
      toast.error(`Rotation failed: ${msg}`);
      setStatus("Rotation failed", "error");
    } finally {
      setIsProcessing(false);
      setProcessing(false);
    }
  }, [file, angle, pageMode, customPages, setStatus, setProcessing, triggerRefresh]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={RotateCw}
        title="Rotate Pages"
        description="Rotate all or specific pages in a PDF"
        actions={file && (
          <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />}
            onClick={() => setFile(null)} disabled={isProcessing}>
            Clear
          </Button>
        )}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!file ? (
            <FileDropZone
              onFilesSelected={handleFilesSelected}
              accept={[".pdf"]}
              multiple={false}
              disabled={isProcessing}
              label="Drop a PDF file here"
              sublabel="or click to browse"
            />
          ) : (
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 flex-shrink-0">
                  <RotateCw className="h-5 w-5 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                  <p className="text-xs text-muted capitalize">{file.status}</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => setFile(null)} disabled={isProcessing}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card padding="md">
            <h3 className="text-sm font-semibold text-primary mb-4">Rotation Options</h3>

            <div className="mb-4">
              <p className="text-xs font-medium text-secondary mb-2">Rotation Angle</p>
              <div className="grid grid-cols-3 gap-2">
                {([90, 180, 270] as RotationAngle[]).map((a) => (
                  <button key={a} onClick={() => setAngle(a)}
                    className={`flex flex-col items-center justify-center rounded-lg border p-3 transition-colors ${
                      angle === a
                        ? "border-brand-600/50 bg-brand-600/20 text-brand-400"
                        : "border-[var(--border-default)] text-secondary hover:border-brand-600/30"
                    }`}>
                    {a === 270 ? <RotateCcw className="h-5 w-5 mb-1" /> : <RotateCw className="h-5 w-5 mb-1" />}
                    <span className="text-xs font-medium">{a}°</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-secondary mb-2">Pages</p>
              <div className="space-y-2">
                {(["all", "custom"] as const).map((m) => (
                  <label key={m}
                    className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] p-2.5 cursor-pointer hover:border-brand-600/30 has-[:checked]:border-brand-600/50 has-[:checked]:bg-brand-600/10">
                    <input type="radio" name="pageMode" value={m} checked={pageMode === m}
                      onChange={() => setPageMode(m)} className="accent-rose-500" />
                    <span className="text-sm text-primary capitalize">{m === "all" ? "All Pages" : "Custom Pages"}</span>
                  </label>
                ))}
              </div>
              {pageMode === "custom" && (
                <input type="text" value={customPages} onChange={(e) => setCustomPages(e.target.value)}
                  placeholder="e.g. 1, 3, 5-7"
                  className="mt-2 w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand-500" />
              )}
            </div>
          </Card>

          <Button variant="primary" size="lg" className="w-full"
            leftIcon={<Play className="h-4 w-4" />}
            loading={isProcessing} onClick={handleRotate} disabled={!file}>
            Rotate Pages
          </Button>
        </div>
      </div>
    </div>
  );
}
