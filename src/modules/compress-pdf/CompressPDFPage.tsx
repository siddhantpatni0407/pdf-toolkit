import { useState, useCallback } from "react";
import { Minimize2, Play, X } from "lucide-react";
import toast from "react-hot-toast";
import { save } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { Badge } from "@/shared/components/Badge";
import { useAppStore } from "@/shared/store/appStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { compressPdf } from "@/shared/utils/tauriCommands";
import { formatFileSize, compressionRatio } from "@/shared/utils/formatUtils";
import { generateId } from "@/shared/utils/fileUtils";
import type { FileWithStatus, CompressOptions } from "@/shared/types";

type Level = CompressOptions["level"];

const LEVEL_CONFIG: Record<Level, { label: string; description: string; color: string }> = {
  low:     { label: "Low",     description: "Minimal compression, best quality",    color: "info"    },
  medium:  { label: "Medium",  description: "Balanced quality and size reduction",  color: "brand"   },
  high:    { label: "High",    description: "Significant size reduction",           color: "warning" },
  maximum: { label: "Maximum", description: "Smallest file size, lower quality",   color: "error"   },
};

export default function CompressPDFPage() {
  const [file, setFile] = useState<FileWithStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [level, setLevel] = useState<Level>("medium");
  const [removeMetadata, setRemoveMetadata] = useState(false);
  const [downsampleImages, setDownsampleImages] = useState(true);
  const [imageQuality, setImageQuality] = useState(75);
  const [result, setResult] = useState<{ outputPath: string; originalSize: number; compressedSize: number } | null>(null);
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
    setResult(null);
  }, []);

  const handleCompress = useCallback(async () => {
    if (!file) { toast.error("Please select a PDF file."); return; }

    const savePath = await save({
      title: "Save Compressed PDF",
      defaultPath: `${file.name.replace(".pdf", "")}_compressed.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!savePath) return;

    const options: CompressOptions = { level, removeMetadata, downsampleImages, imageQuality };

    setIsProcessing(true);
    setProcessing(true);
    setStatus("Compressing PDF...", "processing");
    setFile((f) => f ? { ...f, status: "processing", progress: 50 } : f);

    try {
      const res = await compressPdf(file.path, savePath, options);
      setResult(res);
      setFile((f) => f ? { ...f, status: "done", progress: 100 } : f);
      toast.success("PDF compressed successfully!");
      setStatus("Compression complete", "success");
      triggerRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFile((f) => f ? { ...f, status: "error", error: msg } : f);
      toast.error(`Compression failed: ${msg}`);
      setStatus("Compression failed", "error");
    } finally {
      setIsProcessing(false);
      setProcessing(false);
    }
  }, [file, level, removeMetadata, downsampleImages, imageQuality, setStatus, setProcessing, triggerRefresh]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Minimize2}
        title="Compress PDF"
        description="Reduce PDF file size while preserving quality"
        actions={file && (
          <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />}
            onClick={() => { setFile(null); setResult(null); }} disabled={isProcessing}>
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
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 flex-shrink-0">
                  <Minimize2 className="h-5 w-5 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                  <p className="text-xs text-muted capitalize">{file.status}</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => { setFile(null); setResult(null); }}
                  disabled={isProcessing}><X className="h-3.5 w-3.5" /></Button>
              </div>
            </Card>
          )}

          {/* Result */}
          {result && (
            <Card padding="md" className="border-emerald-500/30 bg-emerald-500/5">
              <h3 className="text-sm font-semibold text-emerald-400 mb-3">Compression Result</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted mb-1">Original Size</p>
                  <p className="text-sm font-semibold text-primary">{formatFileSize(result.originalSize)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Compressed Size</p>
                  <p className="text-sm font-semibold text-emerald-400">{formatFileSize(result.compressedSize)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1">Reduction</p>
                  <p className="text-sm font-semibold text-emerald-400">
                    {compressionRatio(result.originalSize, result.compressedSize).toFixed(1)}%
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card padding="md">
            <h3 className="text-sm font-semibold text-primary mb-4">Compression Level</h3>
            <div className="space-y-2">
              {(Object.entries(LEVEL_CONFIG) as [Level, typeof LEVEL_CONFIG[Level]][]).map(([v, { label, description, color }]) => (
                <label key={v}
                  className="flex items-start gap-3 rounded-lg border border-[var(--border-default)] p-3 cursor-pointer transition-colors hover:border-brand-600/50 has-[:checked]:border-brand-600/50 has-[:checked]:bg-brand-600/10">
                  <input type="radio" name="level" value={v} checked={level === v}
                    onChange={() => setLevel(v)} className="mt-0.5 accent-rose-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-primary">{label}</p>
                      <Badge variant={color as "info" | "brand" | "warning" | "error"} size="sm">{label}</Badge>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 space-y-3 pt-4 border-t border-[var(--border-default)]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={removeMetadata}
                  onChange={(e) => setRemoveMetadata(e.target.checked)} className="accent-rose-500" />
                <span className="text-sm text-secondary">Remove metadata</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={downsampleImages}
                  onChange={(e) => setDownsampleImages(e.target.checked)} className="accent-rose-500" />
                <span className="text-sm text-secondary">Downsample images</span>
              </label>
              {downsampleImages && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-secondary">Image quality</span>
                    <span className="text-xs font-medium text-primary">{imageQuality}%</span>
                  </div>
                  <input type="range" min={10} max={100} value={imageQuality}
                    onChange={(e) => setImageQuality(parseInt(e.target.value))}
                    className="w-full accent-rose-500" />
                </div>
              )}
            </div>
          </Card>

          <Button variant="primary" size="lg" className="w-full"
            leftIcon={<Play className="h-4 w-4" />}
            loading={isProcessing} onClick={handleCompress} disabled={!file}>
            Compress PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
