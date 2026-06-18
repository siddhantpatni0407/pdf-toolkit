import { useState, useCallback } from "react";
import { Layers, Play, X } from "lucide-react";
import toast from "react-hot-toast";
import { save } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { FileList } from "@/shared/components/FileList";
import { useAppStore } from "@/shared/store/appStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { mergePdfs } from "@/shared/utils/tauriCommands";
import { formatFileSize } from "@/shared/utils/formatUtils";
import { generateId } from "@/shared/utils/fileUtils";
import type { FileWithStatus } from "@/shared/types";

export default function MergePDFPage() {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputPath, setOutputPath] = useState<string>("");
  const { setStatus, setProcessing } = useAppStore();
  const { triggerRefresh } = useHistoryStore();

  const handleFilesSelected = useCallback((paths: string[]) => {
    const newFiles: FileWithStatus[] = paths.map((p) => ({
      id: generateId(),
      name: p.split(/[\\/]/).pop() ?? p,
      path: p,
      size: 0,
      mimeType: "application/pdf",
      addedAt: new Date().toISOString(),
      status: "pending",
      progress: 0,
    }));
    setFiles((prev) => {
      const existingPaths = new Set(prev.map((f) => f.path));
      return [...prev, ...newFiles.filter((f) => !existingPaths.has(f.path))];
    });
  }, []);

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleMerge = useCallback(async () => {
    if (files.length < 2) {
      toast.error("Please add at least 2 PDF files to merge.");
      return;
    }

    const savePath = await save({
      title: "Save Merged PDF",
      defaultPath: "merged.pdf",
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!savePath) return;

    setIsProcessing(true);
    setProcessing(true);
    setStatus("Merging PDFs...", "processing");
    setFiles((prev) => prev.map((f) => ({ ...f, status: "processing", progress: 50 })));

    try {
      const inputPaths = files.map((f) => f.path);
      const result = await mergePdfs(inputPaths, savePath);
      setOutputPath(result);
      setFiles((prev) => prev.map((f) => ({ ...f, status: "done", progress: 100 })));
      toast.success(`Merged ${files.length} PDFs successfully!`);
      setStatus("Merge complete", "success");
      triggerRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFiles((prev) => prev.map((f) => ({ ...f, status: "error", error: message })));
      toast.error(`Merge failed: ${message}`);
      setStatus("Merge failed", "error");
    } finally {
      setIsProcessing(false);
      setProcessing(false);
    }
  }, [files, setStatus, setProcessing, triggerRefresh]);

  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Layers}
        title="Merge PDF"
        description="Combine multiple PDF files into a single document"
        actions={
          files.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<X className="h-4 w-4" />}
              onClick={() => setFiles([])}
              disabled={isProcessing}
            >
              Clear All
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: File Drop + List */}
        <div className="lg:col-span-2 space-y-4">
          <FileDropZone
            onFilesSelected={handleFilesSelected}
            accept={[".pdf"]}
            multiple
            disabled={isProcessing}
            label="Drop PDF files here"
            sublabel="or click to browse — files will be merged in order"
          />

          {files.length > 0 && (
            <Card padding="sm">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-sm font-medium text-primary">
                  {files.length} file{files.length > 1 ? "s" : ""} added
                </p>
                {totalSize > 0 && (
                  <p className="text-xs text-muted">{formatFileSize(totalSize)} total</p>
                )}
              </div>
              <FileList
                files={files}
                onRemove={handleRemove}
                showProgress
                draggable
              />
            </Card>
          )}
        </div>

        {/* Right: Options + Action */}
        <div className="space-y-4">
          <Card padding="md">
            <h3 className="text-sm font-semibold text-primary mb-4">Merge Options</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[var(--border-default)]">
                <span className="text-sm text-secondary">Files added</span>
                <span className="text-sm font-medium text-primary">{files.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[var(--border-default)]">
                <span className="text-sm text-secondary">Total size</span>
                <span className="text-sm font-medium text-primary">
                  {totalSize > 0 ? formatFileSize(totalSize) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-secondary">Output</span>
                <span className="text-sm font-medium text-primary truncate max-w-[120px]">
                  {outputPath ? outputPath.split(/[\\/]/).pop() : "merged.pdf"}
                </span>
              </div>
            </div>
          </Card>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            leftIcon={<Play className="h-4 w-4" />}
            loading={isProcessing}
            onClick={handleMerge}
            disabled={files.length < 2}
          >
            Merge {files.length >= 2 ? `${files.length} PDFs` : "PDFs"}
          </Button>

          {files.length < 2 && (
            <p className="text-xs text-muted text-center">
              Add at least 2 PDF files to merge
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
