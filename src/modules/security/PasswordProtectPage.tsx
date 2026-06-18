import { useState, useCallback } from "react";
import { Lock, Play, X, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { save } from "@tauri-apps/plugin-dialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { FileDropZone } from "@/shared/components/FileDropZone";
import { useAppStore } from "@/shared/store/appStore";
import { useHistoryStore } from "@/shared/store/historyStore";
import { protectPdf } from "@/shared/utils/tauriCommands";
import { generateId } from "@/shared/utils/fileUtils";
import type { FileWithStatus, PasswordOptions } from "@/shared/types";

export default function PasswordProtectPage() {
  const [file, setFile] = useState<FileWithStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userPassword, setUserPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [showUser, setShowUser] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(false);
  const [allowEditing, setAllowEditing] = useState(false);
  const [encryption, setEncryption] = useState<"128bit" | "256bit">("256bit");
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

  const handleProtect = useCallback(async () => {
    if (!file) { toast.error("Please select a PDF file."); return; }
    if (!userPassword) { toast.error("Please enter a password."); return; }
    if (userPassword.length < 4) { toast.error("Password must be at least 4 characters."); return; }

    const savePath = await save({
      title: "Save Protected PDF",
      defaultPath: `${file.name.replace(".pdf", "")}_protected.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (!savePath) return;

    const options: PasswordOptions = {
      userPassword,
      ownerPassword: ownerPassword || undefined,
      allowPrinting,
      allowCopying,
      allowEditing,
      encryption,
    };

    setIsProcessing(true);
    setProcessing(true);
    setStatus("Protecting PDF...", "processing");

    try {
      await protectPdf(file.path, savePath, options);
      setFile((f) => f ? { ...f, status: "done", progress: 100 } : f);
      toast.success("PDF protected with password!");
      setStatus("Protection applied", "success");
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
  }, [file, userPassword, ownerPassword, allowPrinting, allowCopying, allowEditing, encryption, setStatus, setProcessing, triggerRefresh]);

  return (
    <div className="space-y-6">
      <PageHeader icon={Lock} title="Password Protect PDF"
        description="Add password protection and access restrictions to a PDF" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!file ? (
            <FileDropZone onFilesSelected={handleFilesSelected} accept={[".pdf"]} multiple={false}
              disabled={isProcessing} label="Drop a PDF file here" sublabel="or click to browse" />
          ) : (
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 flex-shrink-0">
                  <Lock className="h-5 w-5 text-brand-400" />
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
            <h3 className="text-sm font-semibold text-primary mb-4">Security Settings</h3>
            <div className="space-y-4">
              {/* User Password */}
              <div>
                <label className="text-xs font-medium text-secondary block mb-1.5">
                  Open Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input type={showUser ? "text" : "password"} value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 pr-9 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand-500" />
                  <button onClick={() => setShowUser(!showUser)} tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-secondary">
                    {showUser ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Owner Password */}
              <div>
                <label className="text-xs font-medium text-secondary block mb-1.5">
                  Owner Password <span className="text-muted">(optional)</span>
                </label>
                <div className="relative">
                  <input type={showOwner ? "text" : "password"} value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Permissions password"
                    className="w-full rounded-lg border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 pr-9 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand-500" />
                  <button onClick={() => setShowOwner(!showOwner)} tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-secondary">
                    {showOwner ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Encryption */}
              <div>
                <label className="text-xs font-medium text-secondary block mb-2">Encryption</label>
                <div className="flex gap-2">
                  {(["128bit", "256bit"] as const).map((e) => (
                    <button key={e} onClick={() => setEncryption(e)}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        encryption === e
                          ? "border-brand-600/50 bg-brand-600/20 text-brand-400"
                          : "border-[var(--border-default)] text-secondary hover:border-brand-600/30"
                      }`}>
                      {e === "128bit" ? "128-bit RC4" : "256-bit AES"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="text-xs font-medium text-secondary block mb-2">Permissions</label>
                <div className="space-y-2">
                  {[
                    { label: "Allow printing", value: allowPrinting, setter: setAllowPrinting },
                    { label: "Allow copying", value: allowCopying, setter: setAllowCopying },
                    { label: "Allow editing", value: allowEditing, setter: setAllowEditing },
                  ].map(({ label, value, setter }) => (
                    <label key={label} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)}
                        className="accent-rose-500" />
                      <span className="text-sm text-secondary">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Button variant="primary" size="lg" className="w-full"
            leftIcon={<Play className="h-4 w-4" />}
            loading={isProcessing} onClick={handleProtect} disabled={!file || !userPassword}>
            Protect PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
