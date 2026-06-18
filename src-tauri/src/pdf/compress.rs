use crate::error::{AppError, Result};
use lopdf::Document;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CompressOptions {
    pub level: CompressionLevel,
    pub remove_metadata: bool,
    pub downsample_images: bool,
    pub image_quality: u8, // 0-100
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum CompressionLevel {
    Low,
    Medium,
    High,
    Maximum,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressResult {
    pub output_path: String,
    pub original_size: u64,
    pub compressed_size: u64,
}

/// Compresses a PDF file.
pub fn compress_pdf(input_path: &str, output_path: &str, options: &CompressOptions) -> Result<CompressResult> {
    let original_size = std::fs::metadata(input_path)
        .map(|m| m.len())
        .unwrap_or(0);

    let mut doc = Document::load(input_path)
        .map_err(|e| AppError::Pdf(format!("Failed to load PDF: {e}")))?;

    // Apply compression strategies based on level
    match options.level {
        CompressionLevel::Low => {
            // Minimal — just save with compression
        }
        CompressionLevel::Medium => {
            compress_content_streams(&mut doc);
        }
        CompressionLevel::High | CompressionLevel::Maximum => {
            compress_content_streams(&mut doc);
            if options.remove_metadata {
                remove_metadata_from_doc(&mut doc);
            }
        }
    }

    doc.save(output_path)
        .map_err(|e| AppError::Pdf(format!("Failed to save: {e}")))?;

    let compressed_size = std::fs::metadata(output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    log::info!(
        "Compressed {} → {} ({} → {} bytes)",
        input_path, output_path, original_size, compressed_size
    );

    Ok(CompressResult {
        output_path: output_path.to_string(),
        original_size,
        compressed_size,
    })
}

fn compress_content_streams(doc: &mut Document) {
    let ids: Vec<lopdf::ObjectId> = doc.objects.keys().cloned().collect();
    for id in ids {
        if let Ok(lopdf::Object::Stream(ref mut stream)) = doc.get_object_mut(id) {
            let _ = stream.compress();
        }
    }
}

fn remove_metadata_from_doc(doc: &mut Document) {
    // Remove Info dictionary entries
    if let Ok(info_id) = doc.trailer.get(b"Info").and_then(|o| o.as_reference()) {
        if let Ok(lopdf::Object::Dictionary(ref mut info)) = doc.get_object_mut(info_id) {
            info.remove(b"Title");
            info.remove(b"Author");
            info.remove(b"Subject");
            info.remove(b"Keywords");
            info.remove(b"Creator");
            info.remove(b"Producer");
            info.remove(b"CreationDate");
            info.remove(b"ModDate");
        }
    }
}
