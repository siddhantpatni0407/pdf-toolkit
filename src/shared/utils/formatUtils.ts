/**
 * Formats a byte count into a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Returns a shortened filename, truncating the middle if too long.
 */
export function truncateFilename(name: string, maxLength = 40): string {
  if (name.length <= maxLength) return name;
  const ext = name.lastIndexOf(".");
  const extension = ext >= 0 ? name.slice(ext) : "";
  const base = ext >= 0 ? name.slice(0, ext) : name;
  const keep = maxLength - extension.length - 3;
  const half = Math.floor(keep / 2);
  return `${base.slice(0, half)}...${base.slice(-half)}${extension}`;
}

/**
 * Formats a duration in milliseconds to human-readable.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

/**
 * Formats a percentage.
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculates compression ratio.
 */
export function compressionRatio(original: number, compressed: number): number {
  if (original === 0) return 0;
  return ((original - compressed) / original) * 100;
}

/**
 * Returns a readable operation label.
 */
export function operationLabel(op: string): string {
  const labels: Record<string, string> = {
    merge: "Merge PDF",
    split: "Split PDF",
    compress: "Compress PDF",
    rotate: "Rotate Pages",
    reorder: "Reorder Pages",
    "remove-pages": "Remove Pages",
    "extract-pages": "Extract Pages",
    repair: "Repair PDF",
    "pdf-to-word": "PDF → Word",
    "pdf-to-excel": "PDF → Excel",
    "pdf-to-ppt": "PDF → PowerPoint",
    "pdf-to-image": "PDF → Images",
    "pdf-to-text": "PDF → Text",
    "word-to-pdf": "Word → PDF",
    "excel-to-pdf": "Excel → PDF",
    "ppt-to-pdf": "PowerPoint → PDF",
    "image-to-pdf": "Images → PDF",
    "text-to-pdf": "Text → PDF",
    protect: "Password Protect",
    unlock: "Unlock PDF",
    watermark: "Add Watermark",
    "remove-watermark": "Remove Watermark",
    metadata: "Edit Metadata",
    signature: "Digital Signature",
    edit: "Edit PDF",
    "fill-form": "Fill Form",
    ocr: "OCR",
    batch: "Batch Process",
  };
  return labels[op] ?? op;
}
