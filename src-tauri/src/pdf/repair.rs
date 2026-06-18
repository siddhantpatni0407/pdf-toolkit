use crate::error::{AppError, Result};
use lopdf::Document;

/// Attempts to repair a corrupted PDF by loading and re-saving it.
pub fn repair_pdf(input_path: &str, output_path: &str) -> Result<String> {
    // lopdf is lenient about malformed PDFs and will attempt to recover.
    let mut doc = Document::load(input_path)
        .map_err(|e| AppError::Pdf(format!("Cannot open PDF (too severely damaged?): {e}")))?;

    doc.save(output_path)
        .map_err(|e| AppError::Pdf(format!("Failed to save repaired PDF: {e}")))?;

    log::info!("Repaired {} → {}", input_path, output_path);
    Ok(output_path.to_string())
}
