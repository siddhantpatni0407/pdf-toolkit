use serde::Serialize;
use thiserror::Error;

/// Central error type for PDFToolKit backend.
#[derive(Debug, Error, Serialize)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(String),

    #[error("PDF error: {0}")]
    Pdf(String),

    #[error("IO error: {0}")]
    Io(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("OCR error: {0}")]
    Ocr(String),

    #[error("Conversion error: {0}")]
    Conversion(String),

    #[error("Security error: {0}")]
    Security(String),

    #[error("Serialization error: {0}")]
    Serialization(String),
}

impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        AppError::Database(e.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::Serialization(e.to_string())
    }
}

impl From<tauri::Error> for AppError {
    fn from(e: tauri::Error) -> Self {
        AppError::Io(e.to_string())
    }
}

impl From<lopdf::Error> for AppError {
    fn from(e: lopdf::Error) -> Self {
        AppError::Pdf(e.to_string())
    }
}

impl From<image::ImageError> for AppError {
    fn from(e: image::ImageError) -> Self {
        AppError::Conversion(e.to_string())
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
