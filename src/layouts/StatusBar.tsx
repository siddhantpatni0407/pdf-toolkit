import { CheckCircle, AlertCircle, Loader2, Info } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useAppStore } from "@/shared/store/appStore";
import { ProgressBar } from "@/shared/components/ProgressBar";

export default function StatusBar() {
  const { statusMessage, statusType, globalProgress, isProcessing } = useAppStore();

  const icons = {
    idle:       <Info className="h-3 w-3 text-muted" />,
    processing: <Loader2 className="h-3 w-3 text-brand-400 animate-spin" />,
    success:    <CheckCircle className="h-3 w-3 text-emerald-400" />,
    error:      <AlertCircle className="h-3 w-3 text-red-400" />,
  };

  const textColors = {
    idle:       "text-muted",
    processing: "text-brand-400",
    success:    "text-emerald-400",
    error:      "text-red-400",
  };

  return (
    <div
      className="flex h-7 flex-shrink-0 items-center border-t border-[var(--border-default)] bg-[var(--bg-sidebar)] px-4 gap-3"
      role="status"
      aria-live="polite"
      aria-label="Status bar"
    >
      {icons[statusType]}
      <span className={cn("text-[11px] font-medium", textColors[statusType])}>
        {statusMessage}
      </span>

      {isProcessing && (
        <div className="flex-1 max-w-[200px]">
          <ProgressBar value={globalProgress} size="sm" animated />
        </div>
      )}

      <div className="ml-auto flex items-center gap-4">
        <span className="text-[10px] text-muted">PDFToolKit v1.0</span>
        <span className="text-[10px] text-muted">Offline</span>
      </div>
    </div>
  );
}
