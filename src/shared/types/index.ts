// ─── Theme ────────────────────────────────────────────────────────────────────
export type ThemeMode = "light" | "dark" | "system";
export type AccentColor = "rose" | "blue" | "violet" | "emerald" | "amber" | "indigo";

// ─── PDF Operation Types ───────────────────────────────────────────────────────
export type PdfOperation =
  | "merge"
  | "split"
  | "compress"
  | "rotate"
  | "reorder"
  | "remove-pages"
  | "extract-pages"
  | "repair"
  | "pdf-to-word"
  | "pdf-to-excel"
  | "pdf-to-ppt"
  | "pdf-to-image"
  | "pdf-to-text"
  | "word-to-pdf"
  | "excel-to-pdf"
  | "ppt-to-pdf"
  | "image-to-pdf"
  | "text-to-pdf"
  | "protect"
  | "unlock"
  | "watermark"
  | "remove-watermark"
  | "metadata"
  | "signature"
  | "edit"
  | "fill-form"
  | "ocr"
  | "batch";

// ─── File ──────────────────────────────────────────────────────────────────────
export interface PdfFile {
  id: string;
  name: string;
  path: string;
  size: number;
  pageCount?: number;
  mimeType: string;
  addedAt: string;
  thumbnail?: string;
}

export type FileStatus = "pending" | "processing" | "done" | "error";

export interface FileWithStatus extends PdfFile {
  status: FileStatus;
  progress: number;
  error?: string;
  outputPath?: string;
}

// ─── Job Queue ─────────────────────────────────────────────────────────────────
export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export interface Job {
  id: string;
  operation: PdfOperation;
  inputFiles: string[];
  outputPath: string;
  params: Record<string, unknown>;
  status: JobStatus;
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  resultFiles?: string[];
}

// ─── History ──────────────────────────────────────────────────────────────────
export interface HistoryEntry {
  id: number;
  operation: PdfOperation;
  inputFiles: string[];
  outputFiles: string[];
  status: "success" | "failed";
  fileCount: number;
  totalSize: number;
  savedSize?: number;
  duration: number; // ms
  createdAt: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface OperationStat {
  operation: PdfOperation;
  label: string;
  count: number;
  totalFilesProcessed: number;
  totalSaved: number;
}

export interface DailyActivity {
  date: string;
  count: number;
  saved: number;
}

export interface AnalyticsSummary {
  totalOperations: number;
  totalFilesProcessed: number;
  totalStorageSaved: number;
  mostUsedOperation: PdfOperation | null;
  operationStats: OperationStat[];
  dailyActivity: DailyActivity[];
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export interface AppSettings {
  theme: ThemeMode;
  accentColor: AccentColor;
  defaultOutputFolder: string;
  autoOpenOutput: boolean;
  showThumbnails: boolean;
  thumbnailQuality: "low" | "medium" | "high";
  compressionLevel: "low" | "medium" | "high" | "maximum";
  ocrLanguage: string;
  ocrEngine: "tesseract";
  maxConcurrentJobs: number;
  logRetentionDays: number;
  checkUpdates: boolean;
  language: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  accentColor: "rose",
  defaultOutputFolder: "",
  autoOpenOutput: false,
  showThumbnails: true,
  thumbnailQuality: "medium",
  compressionLevel: "medium",
  ocrLanguage: "eng",
  ocrEngine: "tesseract",
  maxConcurrentJobs: 2,
  logRetentionDays: 30,
  checkUpdates: true,
  language: "en",
};

// ─── Recent File ──────────────────────────────────────────────────────────────
export interface RecentFile {
  id: number;
  path: string;
  name: string;
  operation: PdfOperation;
  openedAt: string;
}

// ─── Compress options ─────────────────────────────────────────────────────────
export interface CompressOptions {
  level: "low" | "medium" | "high" | "maximum";
  removeMetadata: boolean;
  downsampleImages: boolean;
  imageQuality: number; // 0-100
}

// ─── Split options ────────────────────────────────────────────────────────────
export type SplitMode = "all" | "ranges" | "fixed-size" | "bookmarks";

export interface SplitOptions {
  mode: SplitMode;
  ranges?: string; // e.g. "1-3,5,7-9"
  pagesPerFile?: number;
}

// ─── Rotate options ───────────────────────────────────────────────────────────
export type RotationAngle = 90 | 180 | 270;

export interface RotateOptions {
  angle: RotationAngle;
  pages: "all" | number[];
}

// ─── Watermark options ────────────────────────────────────────────────────────
export type WatermarkType = "text" | "image";

export interface WatermarkOptions {
  type: WatermarkType;
  text?: string;
  imagePath?: string;
  opacity: number; // 0-100
  position: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "diagonal";
  fontSize?: number;
  color?: string;
  pages: "all" | number[];
}

// ─── OCR options ──────────────────────────────────────────────────────────────
export interface OcrOptions {
  language: string;
  outputType: "searchable-pdf" | "text-file" | "both";
  dpi: number;
  detectOrientation: boolean;
}

// ─── Conversion options ───────────────────────────────────────────────────────
export type ConvertFromFormat = "word" | "excel" | "ppt" | "image" | "text";
export type ConvertToFormat = "word" | "excel" | "ppt" | "image" | "text";

export interface ConvertOptions {
  format: ConvertFromFormat | ConvertToFormat;
  quality?: "low" | "medium" | "high";
  imageFormat?: "png" | "jpg" | "webp";
  imageResolution?: number;
}

// ─── Security options ─────────────────────────────────────────────────────────
export interface PasswordOptions {
  userPassword: string;
  ownerPassword?: string;
  allowPrinting: boolean;
  allowCopying: boolean;
  allowEditing: boolean;
  encryption: "128bit" | "256bit";
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}

// ─── Batch ────────────────────────────────────────────────────────────────────
export interface BatchOperation {
  id: string;
  name: string;
  operation: PdfOperation;
  params: Record<string, unknown>;
  outputFolder: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}
