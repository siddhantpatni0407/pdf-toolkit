import { useState, useCallback } from "react";
import { ArrowUpDown, Play, X } from "lucide-react";
import toast from "react-hot-toast";
import { save } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { useAppStore } from "@/shared/store/appStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { reorderPdfPages, getPageCount } from "@/shared/utils/tauriCommands";
import { generateId } from "@/shared/utils/fileUtils";
import type { FileWithStatus } from "@/shared/types";

export default function ReorderPDFPage() {
  const [file, setFile] = useState<FileWithStatus | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [orderInput, setOrderInput] = useState("");
  const { setStatus, setProcessing } = useAppStore();
  const { triggerRefresh } = useHistoryStore();

  const handleFilesSelected = useCallback(async (paths: string[]) => {
    const path = paths[0];
    const f: FileWithStatus = {
      id: generateId(),
      name: path.split(/[\\/]/).pop() ?? path,
      path,
      size: 0,
      mimeType: "application/pdf",
      addedAt: new Date().toISOString(),
      status: "pending",
      progress: 0,
    };
    setFile(f);
    setIsLoadingPages(true);
    try {
      const count = await getPageCount(path);
      setPageCount(count);
      const defaultOrder = Array.from({ length: count }, (_, i) => i + 1);
      setPageOrder(defaultOrder);
      setOrderInput(defaultOrder.join(", "));
    } catch {
      toast.error("Failed to read page count");
    } finally {
      setIsLoadingPages(false);
    }
  }, []);

  const handleReorder = useCallback(async () => {
    if (!file || pageOrder.length === 0) {
      toast.error("Please select a PDF file and specify page order.");
      return;
    }

    const savePath = await save({
      title: "Save Reordered PDF",
      defaultPath: `${file.name.replace(".pdf", "")}_reordered.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!savePath) return;

    setIsProcessing(true);
    setProcessing(true);
    setStatus("Reordering pages...", "processing");

    try {
      await reorderPdfPages(file.path, savePath, pageOrder);
      setFile((f) => f ? { ...f, status: "done", progress: 100 } : f);
      toast.success("Pages reordered successfully!");
      setStatus("Reorder complete", "success");
      triggerRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFile((f) => f ? { ...f, status: "error", error: msg } : f);
      toast.error(`Reorder failed: ${msg}`);
      setStatus("Reorder failed", "error");
    } finally {
      setIsProcessing(false);
      setProcessing(false);
    }
  }, [file, pageOrder, setStatus, setProcessing, triggerRefresh]);

  const parseOrder = (input: string) => {
    const parsed = input
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n > 0 && n <= pageCount);
    if (parsed.length > 0) setPageOrder(parsed);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ArrowUpDown}
        title="Reorder Pages"
        description="Change the order of pages in a PDF document"
        actions={file && (
          <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />}
            onClick={() => { setFile(null); setPageCount(0); setPageOrder([]); setOrderInput(""); }}
            disabled={isProcessing}>
            Clear
          </Button>
        )}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
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
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 flex-shrink-0">
                  <ArrowUpDown className="h-5 w-5 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                  {isLoadingPages ? (
                    <p className="text-xs text-muted">Loading page count...</p>
                  ) : (
                    <p className="text-xs text-muted">{pageCount} pages</p>
                  )}
                </div>
              </div>
              {!isLoadingPages && pageCount > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
                    const pos = pageOrder.indexOf(p);
                    return (
                      <div key={p}
                        className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium border ${
                          pos >= 0
                            ? "border-brand-600/50 bg-brand-600/20 text-brand-400"
                            : "border-[var(--border-default)] text-muted"
                        }`}>
                        {p}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card padding="md">
            <h3 className="text-sm font-semibold text-primary mb-4">Page Order</h3>
            {pageCount > 0 && (
              <p className="text-xs text-muted mb-3">
                Enter the new page order as comma-separated numbers.<br />
                e.g. "3, 1, 2" to put page 3 first.
              </p>
            )}
            <textarea
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              onBlur={() => parseOrder(orderInput)}
              placeholder={file ? "e.g. 3, 1, 2, 4" : "Select a file first"}
              rows={4}
              disabled={!file || isLoadingPages}
              className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand-500 resize-none disabled:opacity-50"
            />
            {pageOrder.length > 0 && (
              <p className="text-xs text-muted mt-2">
                {pageOrder.length} pages in order
              </p>
            )}
          </Card>

          <Button variant="primary" size="lg" className="w-full"
            leftIcon={<Play className="h-4 w-4" />}
            loading={isProcessing} onClick={handleReorder} disabled={!file || pageOrder.length === 0}>
            Reorder Pages
          </Button>
        </div>
      </div>
    </div>
  );
}
