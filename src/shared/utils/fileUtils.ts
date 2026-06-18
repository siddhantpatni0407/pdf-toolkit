/**
 * Generates a unique ID (uses crypto.randomUUID if available).
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Returns the file extension (without dot), lower-cased.
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/**
 * Returns the basename without extension.
 */
export function getBaseName(filename: string): string {
  const ext = filename.lastIndexOf(".");
  return ext >= 0 ? filename.slice(0, ext) : filename;
}

/**
 * Returns the directory portion of a file path.
 */
export function getDirname(filePath: string): string {
  const sep = filePath.includes("\\") ? "\\" : "/";
  const idx = filePath.lastIndexOf(sep);
  return idx >= 0 ? filePath.slice(0, idx) : ".";
}

/**
 * Checks whether a file is a PDF by extension.
 */
export function isPdfFile(filename: string): boolean {
  return getFileExtension(filename) === "pdf";
}

/**
 * Checks whether a file is an image.
 */
export function isImageFile(filename: string): boolean {
  return ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "tif"].includes(
    getFileExtension(filename)
  );
}

/**
 * Returns accepted MIME types for open-file dialog.
 */
export const PDF_MIME = "application/pdf";
export const IMAGE_MIME = "image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff";
export const OFFICE_MIME =
  "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";
