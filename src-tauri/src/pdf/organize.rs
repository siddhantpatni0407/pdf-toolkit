use crate::error::{AppError, Result};
use lopdf::Document;

/// Reorders the pages of a PDF.
pub fn reorder_pages(input_path: &str, output_path: &str, page_order: &[u32]) -> Result<String> {
    if page_order.is_empty() {
        return Err(AppError::Validation("Page order cannot be empty".into()));
    }
    let doc = Document::load(input_path)
        .map_err(|e| AppError::Pdf(format!("Failed to load PDF: {e}")))?;

    let page_map = doc.get_pages();
    let mut new_page_ids = Vec::new();

    for &page_num in page_order {
        match page_map.get(&page_num) {
            Some(&id) => new_page_ids.push(id),
            None => return Err(AppError::Validation(format!("Page {} does not exist", page_num))),
        }
    }

    rebuild_pdf_with_page_order(&doc, &new_page_ids, output_path)?;
    log::info!("Reordered {} pages → {}", page_order.len(), output_path);
    Ok(output_path.to_string())
}

/// Removes the specified pages from a PDF.
pub fn remove_pages(input_path: &str, output_path: &str, pages_to_remove: &[u32]) -> Result<String> {
    let doc = Document::load(input_path)
        .map_err(|e| AppError::Pdf(format!("Failed to load PDF: {e}")))?;

    let page_map = doc.get_pages();
    let total = page_map.len() as u32;

    if pages_to_remove.len() >= total as usize {
        return Err(AppError::Validation("Cannot remove all pages from a PDF".into()));
    }

    let remove_set: std::collections::HashSet<u32> = pages_to_remove.iter().cloned().collect();
    let mut keep_pages: Vec<(u32, lopdf::ObjectId)> = page_map
        .iter()
        .filter(|(&num, _)| !remove_set.contains(&num))
        .map(|(&num, &id)| (num, id))
        .collect();
    keep_pages.sort_by_key(|(num, _)| *num);

    let page_ids: Vec<lopdf::ObjectId> = keep_pages.into_iter().map(|(_, id)| id).collect();
    rebuild_pdf_with_page_order(&doc, &page_ids, output_path)?;

    log::info!("Removed {} pages → {}", pages_to_remove.len(), output_path);
    Ok(output_path.to_string())
}

/// Extracts specific pages from a PDF into a new file.
pub fn extract_pages(input_path: &str, output_path: &str, pages: &[u32]) -> Result<String> {
    let doc = Document::load(input_path)
        .map_err(|e| AppError::Pdf(format!("Failed to load PDF: {e}")))?;

    let page_map = doc.get_pages();
    let mut page_ids = Vec::new();

    for &p in pages {
        match page_map.get(&p) {
            Some(&id) => page_ids.push(id),
            None => return Err(AppError::Validation(format!("Page {} does not exist", p))),
        }
    }

    rebuild_pdf_with_page_order(&doc, &page_ids, output_path)?;
    log::info!("Extracted {} pages → {}", pages.len(), output_path);
    Ok(output_path.to_string())
}

fn rebuild_pdf_with_page_order(
    source: &Document,
    page_ids: &[lopdf::ObjectId],
    output_path: &str,
) -> Result<()> {
    let mut out = Document::with_version("1.5");

    let new_ids: Vec<lopdf::ObjectId> = page_ids
        .iter()
        .map(|&id| {
            let obj = source.get_object(id).unwrap().clone();
            out.add_object(obj)
        })
        .collect();

    let pages_id = out.add_object(lopdf::Object::Dictionary(lopdf::Dictionary::from_iter(vec![
        ("Type",  lopdf::Object::Name(b"Pages".to_vec())),
        ("Kids",  lopdf::Object::Array(new_ids.iter().map(|id| lopdf::Object::Reference(*id)).collect())),
        ("Count", lopdf::Object::Integer(new_ids.len() as i64)),
    ])));

    for &id in &new_ids {
        if let Ok(lopdf::Object::Dictionary(ref mut dict)) = out.get_object_mut(id) {
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
