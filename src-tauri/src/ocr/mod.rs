use crate::error::{AppError, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OcrOptions {
    pub language: String,
    pub output_type: OcrOutputType,
    pub dpi: u32,
    pub detect_orientation: bool,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum OcrOutputType {
    SearchablePdf,
    TextFile,
    Both,
}

/// Performs OCR on a PDF or image file.
/// 
/// NOTE: This requires Tesseract OCR to be installed on the system.
/// The Tesseract binary is invoked via std::process::Command.
/// In production, consider using the `leptess` Rust crate for embedded Tesseract.
pub fn perform_ocr(input_path: &str, output_dir: &str, options: &OcrOptions) -> Result<Vec<String>> {
    // Validate input file
    if !Path::new(input_path).exists() {
        return Err(AppError::NotFound(format!("File not found: {input_path}")));
    }

    // Validate language code (basic alphanumeric + underscore)
    if !options.language.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return Err(AppError::Validation(format!(
            "Invalid language code: '{}'. Use Tesseract language codes like 'eng', 'fra', 'chi_sim'.",
            options.language
        )));
    }

    std::fs::create_dir_all(output_dir)?;

    let stem = Path::new(input_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("ocr_output");

    let output_base = format!("{}/{}", output_dir, stem);
    let mut output_paths = Vec::new();

    let (output_type_arg, out_ext) = match options.output_type {
        OcrOutputType::SearchablePdf => ("pdf", "pdf"),
        OcrOutputType::TextFile      => ("txt", "txt"),
        OcrOutputType::Both          => ("pdf txt", "pdf"),
    };

    // Check if tesseract is available
    let tesseract_available = std::process::Command::new("tesseract")
        .arg("--version")
        .output()
        .is_ok();

    if !tesseract_available {
        return Err(AppError::Ocr(
            "Tesseract OCR is not installed. Please install Tesseract and ensure it is on the PATH. \
             Download from: https://github.com/tesseract-ocr/tesseract/releases".into()
        ));
    }

    // Run Tesseract
    let output = std::process::Command::new("tesseract")
        .arg(input_path)
        .arg(&output_base)
        .arg("-l").arg(&options.language)
        .arg("--dpi").arg(options.dpi.to_string())
        .args(output_type_arg.split_whitespace())
        .output()
        .map_err(|e| AppError::Ocr(format!("Failed to run Tesseract: {e}")))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Ocr(format!("Tesseract failed: {}", stderr)));
    }

    let primary_out = format!("{}.{}", output_base, out_ext);
    if Path::new(&primary_out).exists() {
        output_paths.push(primary_out);
    }

    if matches!(options.output_type, OcrOutputType::Both) {
        let txt_out = format!("{}.txt", output_base);
        if Path::new(&txt_out).exists() {
            output_paths.push(txt_out);
        }
    }

    log::info!("OCR complete → {:?}", output_paths);
    Ok(output_paths)
}
