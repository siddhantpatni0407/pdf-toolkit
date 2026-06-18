import { useState, useCallback } from "react";
import { Droplets, Play, X } from "lucide-react";
import toast from "react-hot-toast";
import { save } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { useAppStore } from "@/shared/store/appStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { addWatermark } from "@/shared/utils/tauriCommands";
import { generateId } from "@/shared/utils/fileUtils";
import type { FileWithStatus, WatermarkOptions, WatermarkType } from "@/shared/types";

type Position = WatermarkOptions["position"];

const POSITIONS: { value: Position; label: string }[] = [
  { value: "center",       label: "Center" },
  { value: "diagonal",     label: "Diagonal" },
  { value: "top-left",     label: "Top Left" },
  { value: "top-right",    label: "Top Right" },
  { value: "bottom-left",  label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

export default function WatermarkPage() {
  const [file, setFile] = useState<FileWithStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [type, setType] = useState<WatermarkType>("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(30);
  const [position, setPosition] = useState<Position>("diagonal");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#ff0000");
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

  const handleApply = useCallback(async () => {
    if (!file) { toast.error("Please select a PDF file."); return; }
    if (type === "text" && !text.trim()) { toast.error("Please enter watermark text."); return; }

    const savePath = await save({
      title: "Save Watermarked PDF",
      defaultPath: `${file.name.replace(".pdf", "")}_watermarked.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!savePath) return;

    const options: WatermarkOptions = {
      type,
      text: type === "text" ? text : undefined,
      opacity,
      position,
      fontSize: type === "text" ? fontSize : undefined,
      color: type === "text" ? color : undefined,
      pages: "all",
    };

    setIsProcessing(true);
    setProcessing(true);
    setStatus("Adding watermark...", "processing");

    try {
      await addWatermark(file.path, savePath, options);
      setFile((f) => f ? { ...f, status: "done", progress: 100 } : f);
      toast.success("Watermark added successfully!");
      setStatus("Watermark applied", "success");
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
  }, [file, type, text, opacity, position, fontSize, color, setStatus, setProcessing, triggerRefresh]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Droplets} title="Add Watermark"
        description="Add a text or image watermark to PDF pages" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!file ? (
            <FileDropZone onFilesSelected={handleFilesSelected} accept={[".pdf"]} multiple={false}
              disabled={isProcessing} label="Drop a PDF file here" sublabel="or click to browse" />
          ) : (
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 flex-shrink-0">
                  <Droplets className="h-5 w-5 text-brand-400" />
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
            <h3 className="text-sm font-semibold text-primary mb-4">Watermark Settings</h3>
            <div className="space-y-4">
              {/* Type */}
              <div className="flex gap-2">
                {(["text", "image"] as WatermarkType[]).map((t) => (
                  <button key={t} onClick={() => setType(t)}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-medium capitalize transition-colors ${
                      type === t
                        ? "border-brand-600/50 bg-brand-600/20 text-brand-400"
                        : "border-[var(--border-default)] text-secondary hover:border-brand-600/30"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>

              {type === "text" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-secondary block mb-1.5">Watermark Text</label>
                    <input type="text" value={text} onChange={(e) => setText(e.target.value)}
                      placeholder="CONFIDENTIAL"
                      className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-secondary block mb-1.5">Font Size</label>
                      <input type="number" value={fontSize} min={8} max={200}
                        onChange={(e) => setFontSize(parseInt(e.target.value) || 48)}
                        className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-primary focus:outline-none focus:border-brand-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-secondary block mb-1.5">Color</label>
                      <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                        className="w-full h-9 rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] cursor-pointer" />
                    </div>
                  </div>
                </>
              )}

              {/* Opacity */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium text-secondary">Opacity</label>
                  <span className="text-xs font-medium text-primary">{opacity}%</span>
                </div>
                <input type="range" min={5} max={100} value={opacity}
                  onChange={(e) => setOpacity(parseInt(e.target.value))}
                  className="w-full accent-rose-500" />
              </div>

              {/* Position */}
              <div>
                <label className="text-xs font-medium text-secondary block mb-2">Position</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {POSITIONS.map(({ value, label }) => (
                    <button key={value} onClick={() => setPosition(value)}
                      className={`rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                        position === value
                          ? "border-brand-600/50 bg-brand-600/20 text-brand-400"
                          : "border-[var(--border-default)] text-secondary hover:border-brand-600/30"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Button variant="primary" size="lg" className="w-full"
            leftIcon={<Play className="h-4 w-4" />}
            loading={isProcessing} onClick={handleApply} disabled={!file}>
            Add Watermark
          </Button>
        </div>
      </div>
    </div>
  );
}
