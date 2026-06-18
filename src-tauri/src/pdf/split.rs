use crate::error::{AppError, Result};
use lopdf::Document;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SplitOptions {
    pub mode: SplitMode,
    pub ranges: Option<String>,
    pub pages_per_file: Option<usize>,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum SplitMode {
    All,
    Ranges,
    FixedSize,
    Bookmarks,
}

/// Splits a PDF according to the given options.
/// Returns the list of output file paths.
pub fn split_pdf(input_path: &str, output_dir: &str, options: &SplitOptions) -> Result<Vec<String>> {
    let doc = Document::load(input_path)
        .map_err(|e| AppError::Pdf(format!("Failed to load PDF: {e}")))?;

    let total_pages = doc.get_pages().len();
    if total_pages == 0 {
        return Err(AppError::Pdf("PDF has no pages".into()));
    }

    std::fs::create_dir_all(output_dir)?;

    let stem = Path::new(input_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("output");

    let groups: Vec<Vec<u32>> = match options.mode {
        SplitMode::All => (1..=total_pages as u32).map(|p| vec![p]).collect(),
        SplitMode::Ranges => {
            let ranges_str = options.ranges.as_deref().unwrap_or("");
            parse_ranges(ranges_str, total_pages)?
                .into_iter()
                .map(|p| vec![p])
                .collect()
        }
        SplitMode::FixedSize => {
            let n = options.pages_per_file.unwrap_or(1).max(1);
            (1..=total_pages as u32)
                .collect::<Vec<_>>()
                .chunks(n)
                .map(|c| c.to_vec())
                .collect()
        }
        SplitMode::Bookmarks => {
            // Fallback: split every page if bookmarks not available
            (1..=total_pages as u32).map(|p| vec![p]).collect()
        }
    };

    let mut output_paths = Vec::new();

    for (i, group) in groups.iter().enumerate() {
        let out_path = format!("{}/{}_part{:03}.pdf", output_dir, stem, i + 1);
        extract_pages_to_file(&doc, group, &out_path)?;
        output_paths.push(out_path);
    }

    log::info!("Split {} → {} files in {}", input_path, output_paths.len(), output_dir);
    Ok(output_paths)
}

fn extract_pages_to_file(source: &Document, pages: &[u32], output_path: &str) -> Result<()> {
    let mut out = Document::with_version("1.5");
    let pages_map = source.get_pages();
    let mut page_ids = Vec::new();

    for &page_num in pages {
        if let Some(&page_id) = pages_map.get(&page_num) {
            let page_obj = source
                .get_object(page_id)
                .map_err(|e| AppError::Pdf(e.to_string()))?
                .clone();
            let new_id = out.add_object(page_obj);
            page_ids.push(new_id);
        }
    }

    let pages_id = out.add_object(lopdf::Object::Dictionary(lopdf::Dictionary::from_iter(vec![
        ("Type",  lopdf::Object::Name(b"Pages".to_vec())),
        ("Kids",  lopdf::Object::Array(page_ids.iter().map(|id| lopdf::Object::Reference(*id)).collect())),
        ("Count", lopdf::Object::Integer(page_ids.len() as i64)),
    ])));

    for page_id in &page_ids {
        if let Ok(lopdf::Object::Dictionary(ref mut dict)) = out.get_object_mut(*page_id) {
            dict.set("Parent", lopdf::Object::Reference(pages_id));
        }
    }

    let catalog_id = out.add_object(lopdf::Object::Dictionary(lopdf::Dictionary::from_iter(vec![
        ("Type",  lopdf::Object::Name(b"Catalog".to_vec())),
        ("Pages", lopdf::Object::Reference(pages_id)),
    ])));
    out.trailer.set("Root", lopdf::Object::Reference(catalog_id));

    out.save(output_path)
        .map_err(|e| AppError::Pdf(format!("Failed to save: {e}")))?;
    Ok(())
}

pub fn parse_ranges(input: &str, max_page: usize) -> Result<Vec<u32>> {
    let mut pages = Vec::new();
    for part in input.split(',') {
        let part = part.trim();
        if part.is_empty() { continue; }
        if part.contains('-') {
            let bounds: Vec<&str> = part.splitn(2, '-').collect();
            let start: u32 = bounds[0].trim().parse().map_err(|_| AppError::Validation(format!("Invalid range: {part}")))?;
            let end:   u32 = bounds[1].trim().parse().map_err(|_| AppError::Validation(format!("Invalid range: {part}")))?;
            if start > end || end as usize > max_page {
                return Err(AppError::Validation(format!("Range {part} out of bounds (max {max_page})")));
            }
            pages.extend(start..=end);
        } else {
            let p: u32 = part.parse().map_err(|_| AppError::Validation(format!("Invalid page: {part}")))?;
            if p == 0 || p as usize > max_page {
                return Err(AppError::Validation(format!("Page {p} out of bounds (max {max_page})")));
            }
            pages.push(p);
        }
    }
    pages.sort_unstable();
    pages.dedup();
    Ok(pages)
}
