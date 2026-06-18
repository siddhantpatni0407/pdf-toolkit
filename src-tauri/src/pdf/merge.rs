use crate::error::{AppError, Result};
use lopdf::Document;
use std::path::Path;

/// Merges multiple PDF files into a single output PDF.
pub fn merge_pdfs(input_paths: &[String], output_path: &str) -> Result<String> {
    if input_paths.len() < 2 {
        return Err(AppError::Validation("At least 2 PDF files required for merge".into()));
    }

    let mut merged = Document::with_version("1.5");
    let mut page_ids = Vec::new();

    for path in input_paths {
        validate_pdf_path(path)?;
        let doc = Document::load(path)
            .map_err(|e| AppError::Pdf(format!("Failed to load {path}: {e}")))?;

        for page_id in doc.page_iter() {
            let page = doc
                .get_object(page_id)
                .map_err(|e| AppError::Pdf(e.to_string()))?
                .clone();
            let new_id = merged.add_object(page);
            page_ids.push(new_id);
        }
    }

    // Build pages tree
    let pages_id = merged.add_object(lopdf::Object::Dictionary(lopdf::Dictionary::from_iter(vec![
        ("Type",  lopdf::Object::Name(b"Pages".to_vec())),
        ("Kids",  lopdf::Object::Array(page_ids.iter().map(|id| lopdf::Object::Reference(*id)).collect())),
        ("Count", lopdf::Object::Integer(page_ids.len() as i64)),
    ])));

    for page_id in &page_ids {
        if let Ok(lopdf::Object::Dictionary(ref mut dict)) = merged.get_object_mut(*page_id) {
            dict.set("Parent", lopdf::Object::Reference(pages_id));
        }
    }

    let catalog_id = merged.add_object(lopdf::Object::Dictionary(lopdf::Dictionary::from_iter(vec![
        ("Type",  lopdf::Object::Name(b"Catalog".to_vec())),
        ("Pages", lopdf::Object::Reference(pages_id)),
    ])));

    merged.trailer.set("Root", lopdf::Object::Reference(catalog_id));

    merged
        .save(output_path)
        .map_err(|e| AppError::Pdf(format!("Failed to save merged PDF: {e}")))?;

    log::info!("Merged {} PDFs → {}", input_paths.len(), output_path);
    Ok(output_path.to_string())
}

fn validate_pdf_path(path: &str) -> Result<()> {
    let p = Path::new(path);
    if !p.exists() {
        return Err(AppError::NotFound(format!("File not found: {path}")));
    }
    if p.extension().and_then(|e| e.to_str()).map(|e| e.to_lowercase()) != Some("pdf".to_string()) {
        return Err(AppError::Validation(format!("Not a PDF file: {path}")));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merge_requires_two_files() {
        let result = merge_pdfs(&["single.pdf".to_string()], "out.pdf");
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), AppError::Validation(_)));
    }
}
