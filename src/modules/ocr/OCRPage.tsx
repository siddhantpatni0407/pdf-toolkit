import { useState, useCallback } from "react";
import { ScanSearch, Play, X } from "lucide-react";
import toast from "react-hot-toast";
import { open as openDir } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { useAppStore } from "@/shared/store/appStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { performOcr } from "@/shared/utils/tauriCommands";
import { generateId } from "@/shared/utils/fileUtils";
import type { FileWithStatus, OcrOptions } from "@/shared/types";

const LANGUAGES = [
  { value: "eng", label: "English" },
  { value: "fra", label: "French" },
  { value: "deu", label: "German" },
  { value: "spa", label: "Spanish" },
  { value: "ita", label: "Italian" },
  { value: "por", label: "Portuguese" },
  { value: "rus", label: "Russian" },
  { value: "chi_sim", label: "Chinese (Simplified)" },
  { value: "chi_tra", label: "Chinese (Traditional)" },
  { value: "jpn", label: "Japanese" },
  { value: "kor", label: "Korean" },
  { value: "ara", label: "Arabic" },
  { value: "hin", label: "Hindi" },
];

type OutputType = OcrOptions["outputType"];

export default function OCRPage() {
  const [file, setFile] = useState<FileWithStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState("eng");
  const [outputType, setOutputType] = useState<OutputType>("searchable-pdf");
  const [dpi, setDpi] = useState(300);
  const [detectOrientation, setDetectOrientation] = useState(true);
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

  const handleOcr = useCallback(async () => {
    if (!file) { toast.error("Please select a PDF or image file."); return; }

    const outputDir = await openDir({ directory: true, title: "Choose Output Folder" });
    if (!outputDir || Array.isArray(outputDir)) return;

    const options: OcrOptions = { language, outputType, dpi, detectOrientation };

    setIsProcessing(true);
    setProcessing(true);
    setStatus("Running OCR...", "processing");
    setFile((f) => f ? { ...f, status: "processing", progress: 50 } : f);

    try {
      const results = await performOcr(file.path, outputDir as string, options);
      setOutputPaths(results);
      setFile((f) => f ? { ...f, status: "done", progress: 100 } : f);
      toast.success(`OCR complete — ${results.length} file(s) created!`);
      setStatus("OCR complete", "success");
      triggerRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFile((f) => f ? { ...f, status: "error", error: msg } : f);
      toast.error(`OCR failed: ${msg}`);
      setStatus("OCR failed", "error");
    } finally {
      setIsProcessing(false);
      setProcessing(false);
    }
  }, [file, language, outputType, dpi, detectOrientation, setStatus, setProcessing, triggerRefresh]);

  return (
    <div className="space-y-6">
      <PageHeader icon={ScanSearch} title="OCR"
        description="Extract text from scanned PDFs and images using optical character recognition" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {!file ? (
            <FileDropZone
              onFilesSelected={handleFilesSelected}
              accept={[".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp"]}
              multiple={false}
              disabled={isProcessing}
              label="Drop a PDF or image here"
              sublabel="Supported: PDF, PNG, JPG, TIFF, BMP"
            />
          ) : (
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 flex-shrink-0">
                  <ScanSearch className="h-5 w-5 text-brand-400" />
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
              <p className="text-sm font-semibold text-primary mb-3">Output ({outputPaths.length})</p>
              <div className="space-y-1.5">
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
            <h3 className="text-sm font-semibold text-primary mb-4">OCR Settings</h3>
            <div className="space-y-4">
              {/* Language */}
              <div>
                <label className="text-xs font-medium text-secondary block mb-1.5">Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-primary focus:outline-none focus:border-brand-500">
                  {LANGUAGES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Output Type */}
              <div>
                <label className="text-xs font-medium text-secondary block mb-2">Output Type</label>
                <div className="space-y-1.5">
                  {([
                    { value: "searchable-pdf", label: "Searchable PDF", desc: "PDF with searchable text layer" },
                    { value: "text-file",      label: "Text File",      desc: "Plain .txt output" },
                    { value: "both",           label: "Both",           desc: "PDF and text file" },
                  ] as const).map(({ value, label, desc }) => (
                    <label key={value}
                      className="flex items-start gap-2 rounded-lg border border-[var(--border-default)] p-2.5 cursor-pointer hover:border-brand-600/30 has-[:checked]:border-brand-600/50 has-[:checked]:bg-brand-600/10">
                      <input type="radio" name="outputType" value={value} checked={outputType === value}
                        onChange={() => setOutputType(value)} className="mt-0.5 accent-rose-500" />
                      <div>
                        <p className="text-sm font-medium text-primary">{label}</p>
                        <p className="text-xs text-muted">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* DPI */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium text-secondary">Resolution (DPI)</label>
                  <span className="text-xs font-medium text-primary">{dpi}</span>
                </div>
                <input type="range" min={72} max={600} step={50} value={dpi}
                  onChange={(e) => setDpi(parseInt(e.target.value))}
                  className="w-full accent-rose-500" />
              </div>

              {/* Detect Orientation */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={detectOrientation}
                  onChange={(e) => setDetectOrientation(e.target.checked)} className="accent-rose-500" />
                <span className="text-sm text-secondary">Auto-detect orientation</span>
              </label>
            </div>
          </Card>

          <Button variant="primary" size="lg" className="w-full"
            leftIcon={<Play className="h-4 w-4" />}
            loading={isProcessing} onClick={handleOcr} disabled={!file}>
            Run OCR
          </Button>
        </div>
      </div>
    </div>
  );
}
