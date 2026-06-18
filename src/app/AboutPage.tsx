import { Info, FileText, Shield, Zap, Globe } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/Card";

const FEATURES = [
  { icon: FileText, title: "20+ PDF Operations",  description: "Merge, split, compress, rotate, convert, and more." },
  { icon: Shield,   title: "100% Offline",        description: "All processing is done locally. Your files never leave your device." },
  { icon: Zap,      title: "Rust-Powered",        description: "High-performance Rust backend handles large files efficiently." },
  { icon: Globe,    title: "OCR Support",         description: "Multi-language OCR to make scanned PDFs searchable." },
];

const STACK = [
  { label: "Frontend", value: "React 18 + TypeScript + Tailwind CSS" },
  { label: "Desktop",  value: "Tauri 2" },
  { label: "Backend",  value: "Rust" },
  { label: "Database", value: "SQLite (rusqlite)" },
  { label: "State",    value: "Zustand v5" },
  { label: "Charts",   value: "Recharts" },
];

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <PageHeader icon={Info} title="About PDFToolKit" />

      {/* Hero */}
      <Card padding="lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">PDFToolKit</h2>
            <p className="text-sm text-secondary">v1.0.0 — Desktop PDF Suite</p>
          </div>
        </div>
        <p className="text-sm text-secondary leading-relaxed">
          A modern, offline-first PDF management suite. Perform all common PDF operations
          without uploading your files to any server. Built with Tauri for native performance
          and a polished desktop experience.
        </p>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-2 gap-4">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title} padding="md">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600/20">
                <Icon className="h-4 w-4 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">{title}</p>
                <p className="text-xs text-secondary mt-0.5">{description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tech Stack */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-primary mb-4">Technology Stack</h3>
        <div className="grid grid-cols-2 gap-2">
          {STACK.map(({ label, value }) => (
            <div key={label} className="flex items-start gap-2 rounded-lg bg-[var(--bg-app-alt)] px-3 py-2">
              <span className="text-xs font-medium text-muted flex-shrink-0 w-20">{label}</span>
              <span className="text-xs text-secondary">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="md">
        <p className="text-xs text-muted text-center">
          PDFToolKit is open-source desktop software.
          All PDF processing happens locally — your privacy is guaranteed.
        </p>
      </Card>
    </div>
  );
}
