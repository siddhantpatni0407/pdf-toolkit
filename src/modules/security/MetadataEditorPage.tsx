import { useState, useCallback } from "react";
import { FileCode2, X, Save } from "lucide-react";
import toast from "react-hot-toast";
import { save } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { Spinner } from "@/shared/components/Spinner";
import { useAppStore } from "@/shared/store/appStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { getMetadata, setMetadata } from "@/shared/utils/tauriCommands";
import { generateId } from "@/shared/utils/fileUtils";
import type { FileWithStatus, PdfMetadata } from "@/shared/types";

const FIELDS: { key: keyof PdfMetadata; label: string; placeholder: string }[] = [
  { key: "title",    label: "Title",    placeholder: "Document title" },
  { key: "author",   label: "Author",   placeholder: "Author name" },
  { key: "subject",  label: "Subject",  placeholder: "Document subject" },
  { key: "keywords", label: "Keywords", placeholder: "keyword1, keyword2" },
  { key: "creator",  label: "Creator",  placeholder: "Creating application" },
  { key: "producer", label: "Producer", placeholder: "PDF producer" },
];

export default function MetadataEditorPage() {
  const [file, setFile] = useState<FileWithStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [metadata, setMetadataState] = useState<PdfMetadata>({});
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
    setMetadataState({});
    setIsLoading(true);
    try {
      const meta = await getMetadata(path);
      setMetadataState(meta);
    } catch {
      toast.error("Failed to read PDF metadata");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!file) { toast.error("Please select a PDF file."); return; }

    const savePath = await save({
      title: "Save PDF with Updated Metadata",
      defaultPath: file.name,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!savePath) return;

    setIsProcessing(true);
    setProcessing(true);
    setStatus("Saving metadata...", "processing");

    try {
      await setMetadata(file.path, savePath, metadata);
      setFile((f) => f ? { ...f, status: "done", progress: 100 } : f);
      toast.success("Metadata updated successfully!");
      setStatus("Metadata saved", "success");
      triggerRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed: ${msg}`);
      setStatus("Failed", "error");
    } finally {
      setIsProcessing(false);
      setProcessing(false);
    }
  }, [file, metadata, setStatus, setProcessing, triggerRefresh]);

  return (
    <div className="space-y-6">
      <PageHeader icon={FileCode2} title="Metadata Editor"
        description="View and edit PDF document metadata properties" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {!file ? (
            <FileDropZone onFilesSelected={handleFilesSelected} accept={[".pdf"]} multiple={false}
              disabled={isProcessing} label="Drop a PDF file here" sublabel="or click to browse" />
          ) : (
            <>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 flex-shrink-0">
                    <FileCode2 className="h-5 w-5 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                    <p className="text-xs text-muted">{isLoading ? "Loading metadata..." : "Ready to edit"}</p>
                  </div>
                  <Button variant="ghost" size="xs" onClick={() => { setFile(null); setMetadataState({}); }} disabled={isProcessing}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>

              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Spinner label="Reading metadata..." />
                </div>
              ) : (
                <Card padding="md">
                  <h3 className="text-sm font-semibold text-primary mb-4">Metadata Fields</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {FIELDS.map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs font-medium text-secondary block mb-1.5">{label}</label>
                        <input
                          type="text"
                          value={(metadata[key] as string) ?? ""}
                          onChange={(e) => setMetadataState((m) => ({ ...m, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>

        <div>
          <Button variant="primary" size="lg" className="w-full"
            leftIcon={<Save className="h-4 w-4" />}
            loading={isProcessing} onClick={handleSave} disabled={!file || isLoading}>
            Save Metadata
          </Button>
        </div>
      </div>
    </div>
  );
}
