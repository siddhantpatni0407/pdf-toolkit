use tauri::State;
use crate::database::DbState;
use crate::error::AppError;
use crate::pdf;
use crate::pdf::split::SplitOptions;
use crate::pdf::compress::CompressOptions;
use crate::pdf::rotate::RotateOptions;
use crate::pdf::security::{PasswordOptions, WatermarkOptions, PdfMetadata};
use crate::pdf::convert::ConvertOptions;

// ─── Merge ────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_merge_pdfs(
    input_paths: Vec<String>,
    output_path: String,
    state: State<'_, DbState>,
) -> Result<String, AppError> {
    let result = pdf::merge_pdfs(&input_paths, &output_path)?;
    log_history(&state, "merge", &input_paths, &[result.clone()], "success", 0, 0)?;
    Ok(result)
}

// ─── Split ────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_split_pdf(
    input_path: String,
    output_dir: String,
    options: SplitOptions,
    state: State<'_, DbState>,
) -> Result<Vec<String>, AppError> {
    let results = pdf::split_pdf(&input_path, &output_dir, &options)?;
    log_history(&state, "split", &[input_path], &results, "success", 0, 0)?;
    Ok(results)
}

// ─── Compress ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_compress_pdf(
    input_path: String,
    output_path: String,
    options: CompressOptions,
    state: State<'_, DbState>,
) -> Result<pdf::CompressResult, AppError> {
    let result = pdf::compress_pdf(&input_path, &output_path, &options)?;
    let saved = result.original_size.saturating_sub(result.compressed_size) as i64;
    log_history(&state, "compress", &[input_path], &[output_path], "success",
        result.original_size as i64, saved)?;
    Ok(result)
}

// ─── Rotate ───────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_rotate_pdf(
    input_path: String,
    output_path: String,
    options: RotateOptions,
    state: State<'_, DbState>,
) -> Result<String, AppError> {
    let result = pdf::rotate_pdf(&input_path, &output_path, &options)?;
    log_history(&state, "rotate", &[input_path], &[output_path], "success", 0, 0)?;
    Ok(result)
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_reorder_pages(
    input_path: String,
    output_path: String,
    page_order: Vec<u32>,
    state: State<'_, DbState>,
) -> Result<String, AppError> {
    let result = pdf::reorder_pages(&input_path, &output_path, &page_order)?;
    log_history(&state, "reorder", &[input_path], &[output_path], "success", 0, 0)?;
    Ok(result)
}

// ─── Remove Pages ─────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_remove_pages(
    input_path: String,
    output_path: String,
    pages: Vec<u32>,
    state: State<'_, DbState>,
) -> Result<String, AppError> {
    let result = pdf::remove_pages(&input_path, &output_path, &pages)?;
    log_history(&state, "remove-pages", &[input_path], &[output_path], "success", 0, 0)?;
    Ok(result)
}

// ─── Extract Pages ────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_extract_pages(
    input_path: String,
    output_path: String,
    pages: Vec<u32>,
    state: State<'_, DbState>,
) -> Result<String, AppError> {
    let result = pdf::extract_pages(&input_path, &output_path, &pages)?;
    log_history(&state, "extract-pages", &[input_path], &[output_path], "success", 0, 0)?;
    Ok(result)
}

// ─── Repair ───────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_repair_pdf(
    input_path: String,
    output_path: String,
    state: State<'_, DbState>,
) -> Result<String, AppError> {
    let result = pdf::repair_pdf(&input_path, &output_path)?;
    log_history(&state, "repair", &[input_path], &[output_path], "success", 0, 0)?;
    Ok(result)
}

// ─── Get Page Count ───────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_page_count(input_path: String) -> Result<usize, AppError> {
    let doc = lopdf::Document::load(&input_path)
        .map_err(|e| AppError::Pdf(format!("Failed to load PDF: {e}")))?;
    Ok(doc.get_pages().len())
}

// ─── Convert ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_convert_pdf_to(
    input_path: String,
    output_dir: String,
    options: ConvertOptions,
    state: State<'_, DbState>,
) -> Result<Vec<String>, AppError> {
    let results = pdf::convert_pdf_to(&input_path, &output_dir, &options)?;
    log_history(&state, &format!("pdf-to-{}", options.format), &[input_path], &results, "success", 0, 0)?;
    Ok(results)
}

#[tauri::command]
pub fn cmd_convert_to_pdf(
    input_path: String,
    output_path: String,
    options: ConvertOptions,
    state: State<'_, DbState>,
) -> Result<String, AppError> {
    let result = pdf::convert_to_pdf(&input_path, &output_path, &options)?;
    log_history(&state, &format!("{}-to-pdf", options.format), &[input_path], &[output_path], "success", 0, 0)?;
    Ok(result)
}

// ─── Security ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_protect_pdf(
    input_path: String,
    output_path: String,
    options: PasswordOptions,
    state: State<'_, DbState>,
) -> Result<String, AppError> {
    let result = pdf::protect_pdf(&input_path, &output_path, &options)?;
    log_history(&state, "protect", &[input_path], &[output_path], "success", 0, 0)?;
    Ok(result)
}

#[tauri::command]
pub fn cmd_unlock_pdf(
    input_path: String,
    output_path: String,
    password: String,
    state: State<'_, DbState>,
) -> Result<String, AppError> {
    let result = pdf::unlock_pdf(&input_path, &output_path, &password)?;
    log_history(&state, "unlock", &[input_path], &[output_path], "success", 0, 0)?;
    Ok(result)
}

#[tauri::command]
pub fn cmd_add_watermark(
    input_path: String,
    output_path: String,
    options: WatermarkOptions,
    state: State<'_, DbState>,
) -> Result<String, AppError> {
    let result = pdf::add_watermark(&input_path, &output_path, &options)?;
    log_history(&state, "watermark", &[input_path], &[output_path], "success", 0, 0)?;
    Ok(result)
}

#[tauri::command]
pub fn cmd_get_metadata(input_path: String) -> Result<PdfMetadata, AppError> {
    pdf::get_metadata(&input_path)
}

#[tauri::command]
pub fn cmd_set_metadata(
    input_path: String,
    output_path: String,
    metadata: PdfMetadata,
    state: State<'_, DbState>,
) -> Result<String, AppError> {
    let result = pdf::set_metadata(&input_path, &output_path, &metadata)?;
    log_history(&state, "metadata", &[input_path], &[output_path], "success", 0, 0)?;
    Ok(result)
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

fn log_history(
    state: &State<'_, DbState>,
    operation: &str,
    input_files: &[impl AsRef<str>],
    output_files: &[impl AsRef<str>],
    status: &str,
    total_size: i64,
    saved_size: i64,
) -> Result<(), AppError> {
    let db = state.0.lock().map_err(|_| AppError::Database("Lock poisoned".into()))?;
    let inputs_json = serde_json::to_string(&input_files.iter().map(|s| s.as_ref()).collect::<Vec<_>>())?;
    let outputs_json = serde_json::to_string(&output_files.iter().map(|s| s.as_ref()).collect::<Vec<_>>())?;

    db.execute(
        "INSERT INTO processing_history (operation, input_files, output_files, status,
                                         file_count, total_size, saved_size, duration_ms)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0)",
        rusqlite::params![
            operation,
            inputs_json,
            outputs_json,
            status,
            input_files.len() as i64,
            total_size,
            if saved_size > 0 { Some(saved_size) } else { None::<i64> },
        ],
    )?;
    Ok(())
}
