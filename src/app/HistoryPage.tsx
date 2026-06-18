import { useEffect, useState, useCallback } from "react";
import { History, Trash2, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { Badge } from "@/shared/components/Badge";
import { EmptyState } from "@/shared/components/EmptyState";
import { Spinner } from "@/shared/components/Spinner";
import { Modal } from "@/shared/components/Modal";
import { useHistoryStore } from "@/shared/store/historyStore";
import { getHistory, clearHistory, deleteHistoryEntry } from "@/shared/utils/tauriCommands";
import { formatFileSize, formatDuration, operationLabel } from "@/shared/utils/formatUtils";
import toast from "react-hot-toast";

export default function HistoryPage() {
  const { entries, setEntries, removeEntry, clearEntries, refreshKey } = useHistoryStore();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const loadHistory = useCallback(() => {
    setIsLoading(true);
    getHistory(100, 0)
      .then(setEntries)
      .catch(() => toast.error("Failed to load history"))
      .finally(() => setIsLoading(false));
  }, [setEntries]);

  useEffect(() => { loadHistory(); }, [loadHistory, refreshKey]);

  const handleDelete = async (id: number) => {
    try {
      await deleteHistoryEntry(id);
      removeEntry(id);
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  const handleClearAll = async () => {
    try {
      await clearHistory();
      clearEntries();
      setConfirmClear(false);
      toast.success("History cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={History}
        title="Operation History"
        description="View past PDF processing operations"
        actions={
          entries.length > 0 && (
            <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setConfirmClear(true)}>
              Clear All
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" label="Loading history..." />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<History className="h-7 w-7 text-muted" />}
          title="No history yet"
          description="Your completed PDF operations will appear here."
        />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-[var(--border-default)]">
            {entries.map((entry) => (
              <div key={entry.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--bg-app-alt)] transition-colors">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600/20">
                  <FileText className="h-4 w-4 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-primary">{operationLabel(entry.operation)}</p>
                    <Badge variant={entry.status === "success" ? "success" : "error"} size="sm">
                      {entry.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {entry.fileCount} file{entry.fileCount !== 1 ? "s" : ""} ·{" "}
                    {formatFileSize(entry.totalSize)}
                    {entry.savedSize != null && entry.savedSize > 0
                      ? ` · Saved ${formatFileSize(entry.savedSize)}`
                      : ""}
                    {" · "}{formatDuration(entry.duration)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-xs text-muted">
                    {format(parseISO(entry.createdAt), "MMM dd, HH:mm")}
                  </p>
                  <button onClick={() => handleDelete(entry.id)}
                    className="rounded-md p-1 text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear History"
        description="Are you sure you want to clear all operation history? This cannot be undone."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          </>
        }
      >
        <p className="text-sm text-secondary">
          {entries.length} record{entries.length !== 1 ? "s" : ""} will be permanently deleted.
        </p>
      </Modal>
    </div>
  );
}
