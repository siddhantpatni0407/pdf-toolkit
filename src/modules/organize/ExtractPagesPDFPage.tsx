import { useState, useCallback } from "react";
import { Crop, Play, X } from "lucide-react";
import toast from "react-hot-toast";
import { save } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { useAppStore } from "@/shared/store/appStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { extractPdfPages } from "@/shared/utils/tauriCommands";
import { generateId } from "@/shared/utils/fileUtils";
import type { FileWithStatus } from "@/shared/types";

export default function ExtractPagesPDFPage() {
  const [file, setFile] = useState<FileWithStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pagesInput, setPagesInput] = useState("");
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

  const parsePages = (input: string): number[] => {
    const pages: number[] = [];
    for (const part of input.split(",")) {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [start, end] = trimmed.split("-").map((s) => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) pages.push(i);
        }
      } else {
        const n = parseInt(trimmed);
        if (!isNaN(n) && n > 0) pages.push(n);
      }
    }
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  const handleExtract = useCallback(async () => {
    if (!file) { toast.error("Please select a PDF file."); return; }
    const pages = parsePages(pagesInput);
    if (pages.length === 0) { toast.error("Please specify pages to extract (e.g. 1-3, 5)"); return; }

    const savePath = await save({
      title: "Save Extracted Pages",
      defaultPath: `${file.name.replace(".pdf", "")}_extracted.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!savePath) return;

    setIsProcessing(true);
    setProcessing(true);
    setStatus("Extracting pages...", "processing");

    try {
      await extractPdfPages(file.path, savePath, pages);
      setFile((f) => f ? { ...f, status: "done", progress: 100 } : f);
      toast.success(`Extracted ${pages.length} page(s) successfully!`);
      setStatus("Extraction complete", "success");
      triggerRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFile((f) => f ? { ...f, status: "error", error: msg } : f);
      toast.error(`Failed: ${msg}`);
      setStatus("Failed", "error");
    } finally {
      setIsProcessing(false);
      setProcessing(false);
    }
  }, [file, pagesInput, setStatus, setProcessing, triggerRefresh]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Crop} title="Extract Pages" description="Extract specific pages from a PDF into a new document" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!file ? (
            <FileDropZone onFilesSelected={handleFilesSelected} accept={[".pdf"]} multiple={false}
              disabled={isProcessing} label="Drop a PDF file here" sublabel="or click to browse" />
          ) : (
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 flex-shrink-0">
                  <Crop className="h-5 w-5 text-brand-400" />
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
            <h3 className="text-sm font-semibold text-primary mb-3">Pages to Extract</h3>
            <p className="text-xs text-muted mb-3">Specify page numbers or ranges (e.g. 1-3, 5, 7-9)</p>
            <textarea value={pagesInput} onChange={(e) => setPagesInput(e.target.value)}
              placeholder="e.g. 1-3, 5, 7-9" rows={3} disabled={!file}
              className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand-500 resize-none disabled:opacity-50" />
            {pagesInput && (
              <p className="text-xs text-muted mt-2">
                Will extract: {parsePages(pagesInput).length} page(s)
              </p>
            )}
          </Card>
          <Button variant="primary" size="lg" className="w-full"
            leftIcon={<Play className="h-4 w-4" />}
            loading={isProcessing} onClick={handleExtract} disabled={!file || !pagesInput.trim()}>
            Extract Pages
          </Button>
        </div>
      </div>
    </div>
  );
}
