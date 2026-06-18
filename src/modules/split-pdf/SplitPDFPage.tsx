import { useState, useCallback } from "react";
import { Scissors, Play, X } from "lucide-react";
import toast from "react-hot-toast";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { useAppStore } from "@/shared/store/appStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { splitPdf } from "@/shared/utils/tauriCommands";
import { generateId } from "@/shared/utils/fileUtils";
import type { FileWithStatus, SplitMode, SplitOptions } from "@/shared/types";

export default function SplitPDFPage() {
  const [file, setFile] = useState<FileWithStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>("all");
  const [ranges, setRanges] = useState("");
  const [pagesPerFile, setPagesPerFile] = useState(1);
  const [outputPaths, setOutputPaths] = useState<string[]>([]);
  const { setStatus, setProcessing } = useAppStore();
  const { triggerRefresh } = useHistoryStore();

  const handleFilesSelected = useCallback((paths: string[]) => {
    const p = paths[0];
    setFile({
      id: generateId(),
      name: p.split(/[\\/]/).pop() ?? p,
      path: p,
      size: 0,
      mimeType: "application/pdf",
      addedAt: new Date().toISOString(),
      status: "pending",
      progress: 0,
    });
    setOutputPaths([]);
  }, []);

  const handleSplit = useCallback(async () => {
    if (!file) { toast.error("Please select a PDF file."); return; }

    const outputDir = await openDialog({
      directory: true,
      title: "Choose Output Folder",
    });
    if (!outputDir || Array.isArray(outputDir)) return;

    const options: SplitOptions = {
      mode: splitMode,
      ranges: splitMode === "ranges" ? ranges : undefined,
      pagesPerFile: splitMode === "fixed-size" ? pagesPerFile : undefined,
    };

    setIsProcessing(true);
    setProcessing(true);
    setStatus("Splitting PDF...", "processing");
    setFile((f) => f ? { ...f, status: "processing", progress: 50 } : f);

    try {
      const result = await splitPdf(file.path, outputDir as string, options);
      setOutputPaths(result);
      setFile((f) => f ? { ...f, status: "done", progress: 100 } : f);
      toast.success(`Split into ${result.length} files successfully!`);
      setStatus("Split complete", "success");
      triggerRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFile((f) => f ? { ...f, status: "error", error: msg } : f);
      toast.error(`Split failed: ${msg}`);
      setStatus("Split failed", "error");
    } finally {
      setIsProcessing(false);
      setProcessing(false);
    }
  }, [file, splitMode, ranges, pagesPerFile, setStatus, setProcessing, triggerRefresh]);

  const splitModes: { value: SplitMode; label: string; description: string }[] = [
    { value: "all",        label: "Extract All Pages",    description: "One file per page" },
    { value: "ranges",     label: "Custom Ranges",        description: "e.g. 1-3, 5, 7-9" },
    { value: "fixed-size", label: "Fixed Page Count",     description: "N pages per file"  },
    { value: "bookmarks",  label: "By Bookmarks",         description: "Split at bookmarks" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Scissors}
        title="Split PDF"
        description="Split a PDF into multiple files by pages or ranges"
        actions={
          file && (
            <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />}
              onClick={() => { setFile(null); setOutputPaths([]); }} disabled={isProcessing}>
              Clear
            </Button>
          )
        }
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
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 flex-shrink-0">
                  <Scissors className="h-5 w-5 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                  <p className="text-xs text-muted capitalize">{file.status}</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => { setFile(null); setOutputPaths([]); }}
                  disabled={isProcessing}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          )}

          {outputPaths.length > 0 && (
            <Card padding="md">
              <p className="text-sm font-semibold text-primary mb-3">
                Output Files ({outputPaths.length})
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {outputPaths.map((p) => (
                  <div key={p} className="flex items-center gap-2 rounded-lg bg-[var(--bg-app-alt)] px-3 py-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs text-secondary truncate">{p.split(/[\\/]/).pop()}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card padding="md">
            <h3 className="text-sm font-semibold text-primary mb-4">Split Mode</h3>
            <div className="space-y-2">
              {splitModes.map(({ value, label, description }) => (
                <label key={value}
                  className="flex items-start gap-3 rounded-lg border border-[var(--border-default)] p-3 cursor-pointer transition-colors hover:border-brand-600/50 has-[:checked]:border-brand-600/50 has-[:checked]:bg-brand-600/10">
                  <input type="radio" name="splitMode" value={value} checked={splitMode === value}
                    onChange={() => setSplitMode(value)}
                    className="mt-0.5 accent-rose-500" />
                  <div>
                    <p className="text-sm font-medium text-primary">{label}</p>
                    <p className="text-xs text-muted">{description}</p>
                  </div>
                </label>
              ))}
            </div>

            {splitMode === "ranges" && (
              <div className="mt-4">
                <label className="text-xs font-medium text-secondary block mb-1.5">
                  Page Ranges
                </label>
                <input
                  type="text"
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  placeholder="e.g. 1-3, 5, 7-9"
                  className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand-500"
                />
              </div>
            )}

            {splitMode === "fixed-size" && (
              <div className="mt-4">
                <label className="text-xs font-medium text-secondary block mb-1.5">
                  Pages Per File
                </label>
                <input
                  type="number"
                  min={1}
                  value={pagesPerFile}
                  onChange={(e) => setPagesPerFile(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-primary focus:outline-none focus:border-brand-500"
                />
              </div>
            )}
          </Card>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            leftIcon={<Play className="h-4 w-4" />}
            loading={isProcessing}
            onClick={handleSplit}
            disabled={!file}
          >
            Split PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
