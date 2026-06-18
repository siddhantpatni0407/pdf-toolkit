import { FileText, X, CheckCircle, AlertCircle, Loader2, GripVertical } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { formatFileSize } from "@/shared/utils/formatUtils";
import { truncateFilename } from "@/shared/utils/formatUtils";
import { ProgressBar } from "./ProgressBar";
import type { FileWithStatus } from "@/shared/types";

interface FileListItemProps {
  file: FileWithStatus;
  onRemove: (id: string) => void;
  showProgress?: boolean;
  draggable?: boolean;
  index?: number;
}

export function FileListItem({ file, onRemove, showProgress = false, draggable = false }: FileListItemProps) {
  const statusIcon = {
    pending:    <FileText className="h-4 w-4 text-muted" />,
    processing: <Loader2 className="h-4 w-4 text-brand-400 animate-spin" />,
    done:       <CheckCircle className="h-4 w-4 text-emerald-400" />,
    error:      <AlertCircle className="h-4 w-4 text-red-400" />,
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-app-alt)] px-3 py-2.5 transition-colors",
        file.status === "done" && "border-emerald-500/20",
        file.status === "error" && "border-red-500/20"
      )}
    >
      {draggable && (
        <GripVertical className="h-4 w-4 text-muted flex-shrink-0 cursor-grab active:cursor-grabbing" />
      )}

      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600/20">
        {statusIcon[file.status]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary truncate" title={file.name}>
          {truncateFilename(file.name, 45)}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted">{formatFileSize(file.size)}</span>
          {file.pageCount != null && (
            <span className="text-xs text-muted">· {file.pageCount} pages</span>
          )}
          {file.status === "error" && file.error && (
            <span className="text-xs text-red-400 truncate">{file.error}</span>
          )}
        </div>
        {showProgress && file.status === "processing" && (
          <ProgressBar value={file.progress} size="sm" className="mt-1.5" />
        )}
      </div>

      {file.status !== "processing" && (
        <button
          onClick={() => onRemove(file.id)}
          className="flex-shrink-0 rounded-md p-1 text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label={`Remove ${file.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

interface FileListProps {
  files: FileWithStatus[];
  onRemove: (id: string) => void;
  showProgress?: boolean;
  draggable?: boolean;
  emptyMessage?: string;
}

export function FileList({ files, onRemove, showProgress, draggable, emptyMessage = "No files added" }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {files.map((file, i) => (
        <FileListItem
          key={file.id}
          file={file}
          onRemove={onRemove}
          showProgress={showProgress}
          draggable={draggable}
          index={i}
        />
      ))}
    </div>
  );
}
