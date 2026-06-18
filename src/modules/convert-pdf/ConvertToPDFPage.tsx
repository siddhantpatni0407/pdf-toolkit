import { useState, useCallback } from "react";
import { FileInput, Play, X } from "lucide-react";
import toast from "react-hot-toast";
import { save } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { useAppStore } from "@/shared/store/appStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { convertToPdf } from "@/shared/utils/tauriCommands";
import { generateId } from "@/shared/utils/fileUtils";
import type { FileWithStatus, ConvertToFormat } from "@/shared/types";

const FORMATS: { value: ConvertToFormat; label: string; accept: string[]; description: string }[] = [
  { value: "word",  label: "Word → PDF",       accept: [".docx", ".doc"],  description: "Word documents" },
  { value: "excel", label: "Excel → PDF",      accept: [".xlsx", ".xls"], description: "Excel spreadsheets" },
  { value: "ppt",   label: "PowerPoint → PDF", accept: [".pptx", ".ppt"], description: "PowerPoint presentations" },
  { value: "image", label: "Images → PDF",     accept: [".png", ".jpg", ".jpeg", ".bmp", ".tiff"], description: "Image files" },
  { value: "text",  label: "Text → PDF",       accept: [".txt"],          description: "Plain text files" },
];

export default function ConvertToPDFPage() {
  const [file, setFile] = useState<FileWithStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [format, setFormat] = useState<ConvertToFormat>("word");
  const [outputPath, setOutputPath] = useState("");
  const { setStatus, setProcessing } = useAppStore();
  const { triggerRefresh } = useHistoryStore();

  const currentFormat = FORMATS.find((f) => f.value === format)!;

  const handleFilesSelected = useCallback((paths: string[]) => {
    setFile({
      id: generateId(),
      name: paths[0].split(/[\\/]/).pop() ?? paths[0],
      path: paths[0],
      size: 0,
      mimeType: "application/octet-stream",
      addedAt: new Date().toISOString(),
      status: "pending",
      progress: 0,
    });
    setOutputPath("");
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) { toast.error("Please select a file."); return; }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const savePath = await save({
      title: "Save as PDF",
      defaultPath: `${baseName}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!savePath) return;

    setIsProcessing(true);
    setProcessing(true);
    setStatus(`Converting ${format.toUpperCase()} to PDF...`, "processing");
    setFile((f) => f ? { ...f, status: "processing", progress: 50 } : f);

    try {
      const result = await convertToPdf(file.path, savePath, { format });
      setOutputPath(result);
      setFile((f) => f ? { ...f, status: "done", progress: 100 } : f);
      toast.success("Converted to PDF successfully!");
      setStatus("Conversion complete", "success");
      triggerRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFile((f) => f ? { ...f, status: "error", error: msg } : f);
      toast.error(`Conversion failed: ${msg}`);
      setStatus("Conversion failed", "error");
    } finally {
      setIsProcessing(false);
      setProcessing(false);
    }
  }, [file, format, setStatus, setProcessing, triggerRefresh]);

  return (
    <div className="space-y-6">
      <PageHeader icon={FileInput} title="Files → PDF"
        description="Convert various file formats to PDF"
        actions={file && (
          <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />}
            onClick={() => { setFile(null); setOutputPath(""); }} disabled={isProcessing}>
            Clear
          </Button>
        )} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Format tabs */}
          <div className="flex flex-wrap gap-1.5">
            {FORMATS.map(({ value, label }) => (
              <button key={value} onClick={() => { setFormat(value); setFile(null); setOutputPath(""); }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  format === value
                    ? "border-brand-600/50 bg-brand-600/20 text-brand-400"
                    : "border-[var(--border-default)] text-secondary hover:border-brand-600/30"
                }`}>
                {label}
              </button>
            ))}
          </div>

          {!file ? (
            <FileDropZone
              onFilesSelected={handleFilesSelected}
              accept={currentFormat.accept}
              multiple={false}
              disabled={isProcessing}
              label={`Drop a ${currentFormat.description} here`}
              sublabel="or click to browse"
            />
          ) : (
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 flex-shrink-0">
                  <FileInput className="h-5 w-5 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                  <p className="text-xs text-muted capitalize">{file.status}</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => { setFile(null); setOutputPath(""); }} disabled={isProcessing}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          )}

          {outputPath && (
            <Card padding="md" className="border-emerald-500/30 bg-emerald-500/5">
              <p className="text-sm font-medium text-emerald-400">✓ Converted successfully</p>
              <p className="text-xs text-muted mt-1 truncate">{outputPath}</p>
            </Card>
          )}
        </div>

        <div>
          <Button variant="primary" size="lg" className="w-full"
            leftIcon={<Play className="h-4 w-4" />}
            loading={isProcessing} onClick={handleConvert} disabled={!file}>
            Convert to PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
