import { useCallback, useRef, useState, type DragEvent } from "react";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { open } from "@tauri-apps/plugin-dialog";

interface FileDropZoneProps {
  onFilesSelected: (paths: string[]) => void;
  accept?: string[];
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  sublabel?: string;
  className?: string;
  compact?: boolean;
}

export function FileDropZone({
  onFilesSelected,
  accept = [".pdf"],
  multiple = true,
  disabled = false,
  label = "Drop PDF files here",
  sublabel = "or click to browse",
  className,
  compact = false,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      if (disabled) return;

      // Tauri provides file paths via dataTransfer
      const paths: string[] = [];
      for (const item of Array.from(e.dataTransfer.items)) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            // In Tauri, the file path is accessible via webkitRelativePath or name
            // We get the real path via the drop event
            paths.push((file as File & { path?: string }).path ?? file.name);
          }
        }
      }
      if (paths.length > 0) onFilesSelected(paths);
    },
    [disabled, onFilesSelected]
  );

  const handleClick = useCallback(async () => {
    if (disabled) return;
    const selected = await open({
      multiple,
      filters: [
        {
          name: "Files",
          extensions: accept.map((a) => a.replace(".", "")),
        },
      ],
    });
    if (!selected) return;
    const paths = Array.isArray(selected) ? selected : [selected];
    onFilesSelected(paths);
  }, [accept, multiple, disabled, onFilesSelected]);

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="File drop zone"
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(); }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "relative w-full rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200",
        "flex flex-col items-center justify-center text-center select-none",
        compact ? "py-6 px-4" : "py-12 px-6",
        isDragging
          ? "border-brand-500 bg-brand-600/10 drop-active"
          : "border-[var(--border-input)] hover:border-brand-500/50 hover:bg-brand-600/5",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className={cn(
        "flex items-center justify-center rounded-full mb-3",
        compact ? "h-10 w-10" : "h-14 w-14",
        isDragging ? "bg-brand-600/30" : "bg-[var(--bg-app-alt)]"
      )}>
        {isDragging ? (
          <FileText className={cn(isDragging ? "text-brand-400" : "text-muted", compact ? "h-5 w-5" : "h-7 w-7")} />
        ) : (
          <Upload className={cn("text-muted", compact ? "h-5 w-5" : "h-7 w-7")} />
        )}
      </div>
      <p className={cn("font-medium text-primary", compact ? "text-sm" : "text-base")}>{label}</p>
      <p className={cn("text-muted mt-1", compact ? "text-xs" : "text-sm")}>{sublabel}</p>
      {accept.length > 0 && (
        <p className="text-xs text-muted mt-2 opacity-70">
          Supported: {accept.join(", ")}
        </p>
      )}
    </div>
  );
}
