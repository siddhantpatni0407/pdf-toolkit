import { useState, useCallback } from "react";
import { Wrench, Play, X } from "lucide-react";
import toast from "react-hot-toast";
import { save } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { useAppStore } from "@/shared/store/appStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { repairPdf } from "@/shared/utils/tauriCommands";
import { generateId } from "@/shared/utils/fileUtils";
import type { FileWithStatus } from "@/shared/types";

export default function RepairPDFPage() {
  const [file, setFile] = useState<FileWithStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [repaired, setRepaired] = useState(false);
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
    setRepaired(false);
  }, []);

  const handleRepair = useCallback(async () => {
    if (!file) { toast.error("Please select a PDF file."); return; }

    const savePath = await save({
      title: "Save Repaired PDF",
      defaultPath: `${file.name.replace(".pdf", "")}_repaired.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!savePath) return;

    setIsProcessing(true);
    setProcessing(true);
    setStatus("Repairing PDF...", "processing");
    setFile((f) => f ? { ...f, status: "processing", progress: 50 } : f);

    try {
      await repairPdf(file.path, savePath);
      setFile((f) => f ? { ...f, status: "done", progress: 100 } : f);
      setRepaired(true);
      toast.success("PDF repaired successfully!");
      setStatus("Repair complete", "success");
      triggerRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFile((f) => f ? { ...f, status: "error", error: msg } : f);
      toast.error(`Repair failed: ${msg}`);
      setStatus("Repair failed", "error");
    } finally {
      setIsProcessing(false);
      setProcessing(false);
    }
  }, [file, setStatus, setProcessing, triggerRefresh]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Wrench} title="Repair PDF"
        description="Attempt to repair and recover data from a corrupted PDF file" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {!file ? (
            <FileDropZone onFilesSelected={handleFilesSelected} accept={[".pdf"]} multiple={false}
              disabled={isProcessing} label="Drop a corrupted PDF here" sublabel="or click to browse" />
          ) : (
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/20 flex-shrink-0">
                  <Wrench className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                  <p className="text-xs text-muted capitalize">{file.status}</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => { setFile(null); setRepaired(false); }} disabled={isProcessing}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          )}
          {repaired && (
            <Card padding="md" className="border-emerald-500/30 bg-emerald-500/5">
              <p className="text-sm font-medium text-emerald-400">
                ✓ PDF repaired and saved successfully.
              </p>
              <p className="text-xs text-muted mt-1">
                The repaired PDF has been saved to your chosen location.
              </p>
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <Card padding="md">
            <h3 className="text-sm font-semibold text-primary mb-3">About Repair</h3>
            <p className="text-xs text-secondary leading-relaxed">
              This tool attempts to rebuild the internal PDF structure, fix cross-reference tables,
              recover pages, and restore accessibility of corrupted PDF files.
            </p>
            <p className="text-xs text-muted mt-3">
              Note: Recovery success depends on the degree of corruption. Severely damaged files may not be fully recoverable.
            </p>
          </Card>
          <Button variant="primary" size="lg" className="w-full"
            leftIcon={<Play className="h-4 w-4" />}
            loading={isProcessing} onClick={handleRepair} disabled={!file}>
            Repair PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
