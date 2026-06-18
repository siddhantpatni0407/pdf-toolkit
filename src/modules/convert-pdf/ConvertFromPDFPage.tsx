import { useState, useCallback } from "react";
import { FileOutput, Play, X } from "lucide-react";
import toast from "react-hot-toast";
import { open as openDir } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { useAppStore } from "@/shared/store/appStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { convertPdfTo } from "@/shared/utils/tauriCommands";
import { generateId } from "@/shared/utils/fileUtils";
import type { FileWithStatus, ConvertFromFormat } from "@/shared/types";

const FORMATS: { value: ConvertFromFormat; label: string; ext: string; description: string }[] = [
  { value: "word",  label: "PDF → Word",       ext: ".docx", description: "Editable Word document" },
  { value: "excel", label: "PDF → Excel",      ext: ".xlsx", description: "Excel spreadsheet"       },
  { value: "ppt",   label: "PDF → PowerPoint", ext: ".pptx", description: "PowerPoint presentation" },
  { value: "image", label: "PDF → Images",     ext: ".png",  description: "One image per page"      },
  { value: "text",  label: "PDF → Text",       ext: ".txt",  description: "Plain text extraction"   },
];

export default function ConvertFromPDFPage() {
  const [file, setFile] = useState<FileWithStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [format, setFormat] = useState<ConvertFromFormat>("word");
  const [imageFormat, setImageFormat] = useState<"png" | "jpg">("png");
  const [outputPaths, setOutputPaths] = useState<string[]>([]);
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
    setOutputPaths([]);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) { toast.error("Please select a PDF file."); return; }

    const outputDir = await openDir({ directory: true, title: "Choose Output Folder" });
    if (!outputDir || Array.isArray(outputDir)) return;

    setIsProcessing(true);
    setProcessing(true);
    setStatus(`Converting PDF to ${format.toUpperCase()}...`, "processing");
    setFile((f) => f ? { ...f, status: "processing", progress: 50 } : f);

    try {
      const results = await convertPdfTo(file.path, outputDir as string, {
        format,
        imageFormat: format === "image" ? imageFormat : undefined,
      });
      setOutputPaths(results);
      setFile((f) => f ? { ...f, status: "done", progress: 100 } : f);
      toast.success(`Converted to ${results.length} file(s) successfully!`);
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
  }, [file, format, imageFormat, setStatus, setProcessing, triggerRefresh]);

  return (
    <div className="space-y-6">
      <PageHeader icon={FileOutput} title="PDF → Files"
        description="Convert PDF documents to other file formats"
        actions={file && (
          <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />}
            onClick={() => { setFile(null); setOutputPaths([]); }} disabled={isProcessing}>
            Clear
          </Button>
        )} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {!file ? (
            <FileDropZone onFilesSelected={handleFilesSelected} accept={[".pdf"]} multiple={false}
              disabled={isProcessing} label="Drop a PDF file here" sublabel="or click to browse" />
          ) : (
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 flex-shrink-0">
                  <FileOutput className="h-5 w-5 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                  <p className="text-xs text-muted capitalize">{file.status}</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => { setFile(null); setOutputPaths([]); }} disabled={isProcessing}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          )}
          {outputPaths.length > 0 && (
            <Card padding="md">
              <p className="text-sm font-semibold text-primary mb-3">Output Files ({outputPaths.length})</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
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
            <h3 className="text-sm font-semibold text-primary mb-4">Output Format</h3>
            <div className="space-y-2">
              {FORMATS.map(({ value, label, description }) => (
                <label key={value}
                  className="flex items-start gap-3 rounded-lg border border-[var(--border-default)] p-3 cursor-pointer hover:border-brand-600/30 has-[:checked]:border-brand-600/50 has-[:checked]:bg-brand-600/10">
                  <input type="radio" name="format" value={value} checked={format === value}
                    onChange={() => setFormat(value)} className="mt-0.5 accent-rose-500" />
                  <div>
                    <p className="text-sm font-medium text-primary">{label}</p>
                    <p className="text-xs text-muted">{description}</p>
                  </div>
                </label>
              ))}
            </div>
            {format === "image" && (
              <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                <p className="text-xs font-medium text-secondary mb-2">Image Format</p>
                <div className="flex gap-2">
                  {(["png", "jpg"] as const).map((f) => (
                    <button key={f} onClick={() => setImageFormat(f)}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        imageFormat === f
                          ? "border-brand-600/50 bg-brand-600/20 text-brand-400"
                          : "border-[var(--border-default)] text-secondary hover:border-brand-600/30"
                      }`}>
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Button variant="primary" size="lg" className="w-full"
            leftIcon={<Play className="h-4 w-4" />}
            loading={isProcessing} onClick={handleConvert} disabled={!file}>
            Convert PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
