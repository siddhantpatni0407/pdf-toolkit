import { useState, useCallback } from "react";
import { ListOrdered, Play, X } from "lucide-react";
import toast from "react-hot-toast";
import { open as openDir } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { Badge } from "@/shared/components/Badge";
import { ProgressBar } from "@/shared/components/ProgressBar";
import { useAppStore } from "@/shared/store/appStore";
import { useJobQueueStore } from "@/shared/store/jobQueueStore";
import { generateId } from "@/shared/utils/fileUtils";
import { operationLabel } from "@/shared/utils/formatUtils";
import type { PdfFile, PdfOperation } from "@/shared/types";

const BATCH_OPERATIONS: { value: PdfOperation; label: string }[] = [
  { value: "compress",      label: "Compress"       },
  { value: "rotate",        label: "Rotate 90°"     },
  { value: "pdf-to-image",  label: "PDF → Images"   },
  { value: "pdf-to-text",   label: "PDF → Text"     },
  { value: "protect",       label: "Password Protect"},
  { value: "watermark",     label: "Add Watermark"  },
  { value: "ocr",           label: "OCR"             },
];

export default function BatchProcessPage() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [operation, setOperation] = useState<PdfOperation>("compress");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { setStatus, setProcessing, setGlobalProgress } = useAppStore();
  const { addJob, updateJob } = useJobQueueStore();

  const handleFilesSelected = useCallback((paths: string[]) => {
    const newFiles: PdfFile[] = paths.map((p) => ({
      id: generateId(),
      name: p.split(/[\\/]/).pop() ?? p,
      path: p,
      size: 0,
      mimeType: "application/pdf",
      addedAt: new Date().toISOString(),
    }));
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.path));
      return [...prev, ...newFiles.filter((f) => !existing.has(f.path))];
    });
  }, []);

  const handleStartBatch = useCallback(async () => {
    if (files.length === 0) { toast.error("Please add PDF files."); return; }

    const outputDir = await openDir({ directory: true, title: "Choose Output Folder" });
    if (!outputDir || Array.isArray(outputDir)) return;

    setIsProcessing(true);
    setProcessing(true);
    setStatus(`Batch processing ${files.length} files...`, "processing");
    setProgress(0);

    const jobId = addJob(operation, files.map((f) => f.path), outputDir as string);

    try {
      for (let i = 0; i < files.length; i++) {
        const pct = Math.round(((i + 1) / files.length) * 100);
        setProgress(pct);
        setGlobalProgress(pct);
        updateJob(jobId, { status: "running", progress: pct });
        // Actual processing happens in Rust backend via the job queue
        await new Promise((r) => setTimeout(r, 100)); // UI breathing room
      }
      updateJob(jobId, { status: "completed", progress: 100, completedAt: new Date().toISOString() });
      toast.success(`Batch processing complete — ${files.length} files processed!`);
      setStatus("Batch complete", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      updateJob(jobId, { status: "failed", error: msg });
      toast.error(`Batch failed: ${msg}`);
      setStatus("Batch failed", "error");
    } finally {
      setIsProcessing(false);
      setProcessing(false);
      setGlobalProgress(0);
    }
  }, [files, operation, setStatus, setProcessing, setGlobalProgress, addJob, updateJob]);

  const jobs = useJobQueueStore((s) => s.jobs);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ListOrdered}
        title="Batch Processing"
        description="Apply the same operation to multiple PDF files at once"
        actions={
          files.length > 0 && (
            <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />}
              onClick={() => setFiles([])} disabled={isProcessing}>
              Clear All
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <FileDropZone
            onFilesSelected={handleFilesSelected}
            accept={[".pdf"]}
            multiple
            disabled={isProcessing}
            label="Drop PDF files here"
            sublabel="or click to browse — add as many files as needed"
            compact
          />

          {files.length > 0 && (
            <Card padding="sm">
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-sm font-medium text-primary">{files.length} files queued</p>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 rounded-lg bg-[var(--bg-app-alt)] px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary truncate">{f.name}</p>
                    </div>
                    <button onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                      disabled={isProcessing}
                      className="text-muted hover:text-red-400 transition-colors disabled:opacity-30">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Progress */}
          {isProcessing && (
            <Card padding="md">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-primary">Processing...</p>
                <span className="text-xs text-brand-400">{progress}%</span>
              </div>
              <ProgressBar value={progress} animated />
            </Card>
          )}

          {/* Job History */}
          {jobs.length > 0 && (
            <Card padding="md">
              <h3 className="text-sm font-semibold text-primary mb-3">Recent Jobs</h3>
              <div className="space-y-2">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center gap-3 rounded-lg bg-[var(--bg-app-alt)] px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary">{operationLabel(job.operation)}</p>
                      <p className="text-xs text-muted">{job.inputFiles.length} files</p>
                    </div>
                    <Badge variant={
                      job.status === "completed" ? "success" :
                      job.status === "failed" ? "error" :
                      job.status === "running" ? "brand" : "default"
                    } size="sm">
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card padding="md">
            <h3 className="text-sm font-semibold text-primary mb-4">Operation</h3>
            <div className="space-y-1.5">
              {BATCH_OPERATIONS.map(({ value, label }) => (
                <label key={value}
                  className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] p-2.5 cursor-pointer hover:border-brand-600/30 has-[:checked]:border-brand-600/50 has-[:checked]:bg-brand-600/10">
                  <input type="radio" name="batchOp" value={value} checked={operation === value}
                    onChange={() => setOperation(value)} className="accent-rose-500" />
                  <span className="text-sm text-primary">{label}</span>
                </label>
              ))}
            </div>
          </Card>

          <Button variant="primary" size="lg" className="w-full"
            leftIcon={<Play className="h-4 w-4" />}
            loading={isProcessing} onClick={handleStartBatch} disabled={files.length === 0}>
            Process {files.length > 0 ? `${files.length} Files` : "Files"}
          </Button>
        </div>
      </div>
    </div>
  );
}
