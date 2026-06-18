import { invoke } from "@tauri-apps/api/core";
import type {
  AppSettings,
  HistoryEntry,
  AnalyticsSummary,
  RecentFile,
  Job,
  PdfMetadata,
  CompressOptions,
  SplitOptions,
  RotateOptions,
  WatermarkOptions,
  OcrOptions,
  PasswordOptions,
  ConvertOptions,
  PdfOperation,
} from "@/shared/types";

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getSettings = () => invoke<AppSettings>("cmd_get_settings");
export const saveSettings = (settings: AppSettings) =>
  invoke<void>("cmd_save_settings", { settings });

// ─── Recent Files ─────────────────────────────────────────────────────────────
export const getRecentFiles = (limit = 20) =>
  invoke<RecentFile[]>("cmd_get_recent_files", { limit });
export const addRecentFile = (path: string, name: string, operation: PdfOperation) =>
  invoke<void>("cmd_add_recent_file", { path, name, operation });
export const clearRecentFiles = () => invoke<void>("cmd_clear_recent_files");

// ─── History ──────────────────────────────────────────────────────────────────
export const getHistory = (limit = 50, offset = 0) =>
  invoke<HistoryEntry[]>("cmd_get_history", { limit, offset });
export const deleteHistoryEntry = (id: number) =>
  invoke<void>("cmd_delete_history_entry", { id });
export const clearHistory = () => invoke<void>("cmd_clear_history");

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getAnalyticsSummary = (days = 30) =>
  invoke<AnalyticsSummary>("cmd_get_analytics_summary", { days });

// ─── Job Queue ────────────────────────────────────────────────────────────────
export const getJobs = () => invoke<Job[]>("cmd_get_jobs");
export const cancelJob = (jobId: string) => invoke<void>("cmd_cancel_job", { jobId });
export const clearCompletedJobs = () => invoke<void>("cmd_clear_completed_jobs");

// ─── PDF Operations ───────────────────────────────────────────────────────────
export const mergePdfs = (inputPaths: string[], outputPath: string) =>
  invoke<string>("cmd_merge_pdfs", { inputPaths, outputPath });

export const splitPdf = (inputPath: string, outputDir: string, options: SplitOptions) =>
  invoke<string[]>("cmd_split_pdf", { inputPath, outputDir, options });

export const compressPdf = (inputPath: string, outputPath: string, options: CompressOptions) =>
  invoke<{ outputPath: string; originalSize: number; compressedSize: number }>(
    "cmd_compress_pdf",
    { inputPath, outputPath, options }
  );

export const rotatePdf = (inputPath: string, outputPath: string, options: RotateOptions) =>
  invoke<string>("cmd_rotate_pdf", { inputPath, outputPath, options });

export const reorderPdfPages = (
  inputPath: string,
  outputPath: string,
  pageOrder: number[]
) => invoke<string>("cmd_reorder_pages", { inputPath, outputPath, pageOrder });

export const removePdfPages = (
  inputPath: string,
  outputPath: string,
  pages: number[]
) => invoke<string>("cmd_remove_pages", { inputPath, outputPath, pages });

export const extractPdfPages = (
  inputPath: string,
  outputPath: string,
  pages: number[]
) => invoke<string>("cmd_extract_pages", { inputPath, outputPath, pages });

export const repairPdf = (inputPath: string, outputPath: string) =>
  invoke<string>("cmd_repair_pdf", { inputPath, outputPath });

export const getPageCount = (inputPath: string) =>
  invoke<number>("cmd_get_page_count", { inputPath });

// ─── Conversion ───────────────────────────────────────────────────────────────
export const convertPdfTo = (
  inputPath: string,
  outputDir: string,
  options: ConvertOptions
) => invoke<string[]>("cmd_convert_pdf_to", { inputPath, outputDir, options });

export const convertToPdf = (
  inputPath: string,
  outputPath: string,
  options: ConvertOptions
) => invoke<string>("cmd_convert_to_pdf", { inputPath, outputPath, options });

// ─── Security ─────────────────────────────────────────────────────────────────
export const protectPdf = (
  inputPath: string,
  outputPath: string,
  options: PasswordOptions
) => invoke<string>("cmd_protect_pdf", { inputPath, outputPath, options });

export const unlockPdf = (inputPath: string, outputPath: string, password: string) =>
  invoke<string>("cmd_unlock_pdf", { inputPath, outputPath, password });

export const addWatermark = (
  inputPath: string,
  outputPath: string,
  options: WatermarkOptions
) => invoke<string>("cmd_add_watermark", { inputPath, outputPath, options });

export const removeWatermark = (inputPath: string, outputPath: string) =>
  invoke<string>("cmd_remove_watermark", { inputPath, outputPath });

export const getMetadata = (inputPath: string) =>
  invoke<PdfMetadata>("cmd_get_metadata", { inputPath });

export const setMetadata = (inputPath: string, outputPath: string, metadata: PdfMetadata) =>
  invoke<string>("cmd_set_metadata", { inputPath, outputPath, metadata });

// ─── OCR ──────────────────────────────────────────────────────────────────────
export const performOcr = (inputPath: string, outputDir: string, options: OcrOptions) =>
  invoke<string[]>("cmd_perform_ocr", { inputPath, outputDir, options });

// ─── File Management ──────────────────────────────────────────────────────────
export const openFileInSystem = (path: string) =>
  invoke<void>("cmd_open_file", { path });

export const openDirectoryInSystem = (path: string) =>
  invoke<void>("cmd_open_directory", { path });

export const getDefaultOutputDir = () =>
  invoke<string>("cmd_get_default_output_dir");

export const generateThumbnail = (inputPath: string, page = 1, quality = "medium") =>
  invoke<string>("cmd_generate_thumbnail", { inputPath, page, quality });
