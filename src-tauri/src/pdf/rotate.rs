use crate::error::{AppError, Result};
use lopdf::{Document, Object};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RotateOptions {
    pub angle: u16, // 90, 180, 270
    pub pages: RotatePages,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(untagged)]
pub enum RotatePages {
    All(String),      // "all"
    Specific(Vec<u32>),
}

/// Rotates pages of a PDF document.
pub fn rotate_pdf(input_path: &str, output_path: &str, options: &RotateOptions) -> Result<String> {
    if ![90, 180, 270].contains(&options.angle) {
        return Err(AppError::Validation(format!("Invalid angle {}; must be 90, 180, or 270", options.angle)));
    }

    let mut doc = Document::load(input_path)
        .map_err(|e| AppError::Pdf(format!("Failed to load PDF: {e}")))?;

    let page_map = doc.get_pages();
    let all_pages: Vec<u32> = page_map.keys().cloned().collect();

    let target_pages: Vec<u32> = match &options.pages {
        RotatePages::All(s) if s == "all" => all_pages.clone(),
        RotatePages::All(_) => all_pages.clone(),
        RotatePages::Specific(ps) => ps.clone(),
    };

    for page_num in &target_pages {
        if let Some(&page_id) = page_map.get(page_num) {
            set_page_rotation(&mut doc, page_id, options.angle as i64)?;
        }
    }

    doc.save(output_path)
        .map_err(|e| AppError::Pdf(format!("Failed to save: {e}")))?;

    log::info!("Rotated {} pages by {}° → {}", target_pages.len(), options.angle, output_path);
    Ok(output_path.to_string())
}

fn set_page_rotation(doc: &mut Document, page_id: lopdf::ObjectId, angle: i64) -> Result<()> {
    match doc.get_object_mut(page_id) {
        Ok(Object::Dictionary(ref mut dict)) => {
            let existing: i64 = dict
                .get(b"Rotate")
                .ok()
                .and_then(|o| o.as_i64().ok())
                .unwrap_or(0);
            let new_angle = (existing + angle) % 360;
            dict.set("Rotate", Object::Integer(new_angle));
            Ok(())
        }
        _ => Err(AppError::Pdf(format!("Page object {:?} is not a dictionary", page_id))),
    }
}
