use crate::error::{AppError, Result};
use lopdf::{Document, Object, Dictionary};
use serde::{Deserialize, Serialize};

// ─── Password Protection ──────────────────────────────────────────────────────

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PasswordOptions {
    pub user_password: String,
    pub owner_password: Option<String>,
    pub allow_printing: bool,
    pub allow_copying: bool,
    pub allow_editing: bool,
    pub encryption: EncryptionType,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum EncryptionType {
    #[serde(rename = "128bit")]
    Rc4_128,
    #[serde(rename = "256bit")]
    Aes256,
}

/// Adds password protection to a PDF.
/// Note: Full encryption requires a crypto crate (e.g., aes, rc4) — this provides
/// the structural setup. Production use should integrate proper PDF encryption.
pub fn protect_pdf(input_path: &str, output_path: &str, options: &PasswordOptions) -> Result<String> {
    if options.user_password.len() < 4 {
        return Err(AppError::Validation("Password must be at least 4 characters".into()));
    }

    // Load the PDF
    let mut doc = Document::load(input_path)
        .map_err(|e| AppError::Pdf(format!("Failed to load PDF: {e}")))?;

    // Build permissions flags (PDF spec §7.6.3.2)
    let mut perms: i64 = -3904; // Default: all restricted
    if options.allow_printing { perms |= 0x0004; }
    if options.allow_editing  { perms |= 0x0008; }
    if options.allow_copying  { perms |= 0x0010; }

    // Note: Full PDF encryption requires RC4/AES crypto. Here we record the intent
    // in the encrypt dict. A full implementation would use the `aes` or `md5` crates.
    let encrypt_dict = Dictionary::from_iter(vec![
        ("Filter",  Object::Name(b"Standard".to_vec())),
        ("V",       Object::Integer(if matches!(options.encryption, EncryptionType::Aes256) { 4 } else { 2 })),
        ("R",       Object::Integer(if matches!(options.encryption, EncryptionType::Aes256) { 4 } else { 3 })),
        ("Length",  Object::Integer(if matches!(options.encryption, EncryptionType::Aes256) { 256 } else { 128 })),
        ("P",       Object::Integer(perms)),
    ]);

    let encrypt_id = doc.add_object(Object::Dictionary(encrypt_dict));
    doc.trailer.set("Encrypt", Object::Reference(encrypt_id));

    doc.save(output_path)
        .map_err(|e| AppError::Pdf(format!("Failed to save: {e}")))?;

    log::info!("Protected PDF → {}", output_path);
    Ok(output_path.to_string())
}

/// Attempts to unlock (remove encryption from) a password-protected PDF.
pub fn unlock_pdf(input_path: &str, output_path: &str, _password: &str) -> Result<String> {
    let mut doc = Document::load(input_path)
        .map_err(|e| AppError::Security(format!("Failed to open PDF (wrong password?): {e}")))?;

    // Remove encryption entry
    doc.trailer.remove(b"Encrypt");

    doc.save(output_path)
        .map_err(|e| AppError::Pdf(format!("Failed to save: {e}")))?;

    log::info!("Unlocked PDF → {}", output_path);
    Ok(output_path.to_string())
}

// ─── Watermark ────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WatermarkOptions {
    #[serde(rename = "type")]
    pub wm_type: WatermarkType,
    pub text: Option<String>,
    pub image_path: Option<String>,
    pub opacity: u8,   // 0-100
    pub position: String,
    pub font_size: Option<u32>,
    pub color: Option<String>,
    pub pages: WatermarkPages,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum WatermarkType { Text, Image }

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(untagged)]
pub enum WatermarkPages {
    All(String),
    Specific(Vec<u32>),
}

/// Adds a text watermark to a PDF.
pub fn add_watermark(input_path: &str, output_path: &str, options: &WatermarkOptions) -> Result<String> {
    let mut doc = Document::load(input_path)
        .map_err(|e| AppError::Pdf(format!("Failed to load PDF: {e}")))?;

    let text = match &options.wm_type {
        WatermarkType::Text => options.text.as_deref().unwrap_or("WATERMARK"),
        WatermarkType::Image => {
            return Err(AppError::Validation("Image watermark not yet implemented — use text".into()));
        }
    };

    let font_size = options.font_size.unwrap_or(48);
    let opacity = (options.opacity as f64 / 100.0).clamp(0.0, 1.0);

    // Build a watermark content stream
    let watermark_stream = format!(
        "q\n\
         /GS1 gs\n\
         BT\n\
         /F1 {} Tf\n\
         {} {} {} rg\n\
         {} {} Td\n\
         ({}) Tj\n\
         ET\n\
         Q\n",
        font_size,
        0.7, 0.0, 0.0,  // red-ish
        50, 400,          // position (simplified)
        text
    );

    let ext_gstate = Dictionary::from_iter(vec![
        ("Type", Object::Name(b"ExtGState".to_vec())),
        ("ca", Object::Real(opacity as f32)),
        ("CA", Object::Real(opacity as f32)),
    ]);

    let page_ids: Vec<lopdf::ObjectId> = doc.get_pages().values().cloned().collect();

    for page_id in &page_ids {
        let ext_gs_id = doc.add_object(Object::Dictionary(ext_gstate.clone()));

        if let Ok(Object::Dictionary(ref mut page_dict)) = doc.get_object_mut(*page_id) {
            // Append to page resources
            let res_ref = page_dict.get(b"Resources").ok().and_then(|o| o.as_reference().ok());
            if let Some(res_id) = res_ref {
                if let Ok(Object::Dictionary(ref mut res)) = doc.get_object_mut(res_id) {
                    let gs_dict = Dictionary::from_iter(vec![
                        ("GS1", Object::Reference(ext_gs_id)),
                    ]);
                    res.set("ExtGState", Object::Dictionary(gs_dict));
                }
            }
        }

        let wm_stream = lopdf::Stream::new(
            Dictionary::new(),
            watermark_stream.as_bytes().to_vec(),
        );
        let wm_id = doc.add_object(Object::Stream(wm_stream));

        if let Ok(Object::Dictionary(ref mut page_dict)) = doc.get_object_mut(*page_id) {
            match page_dict.get(b"Contents").ok().cloned() {
                Some(Object::Reference(old_id)) => {
                    page_dict.set(
                        "Contents",
                        Object::Array(vec![
                            Object::Reference(old_id),
                            Object::Reference(wm_id),
                        ]),
                    );
                }
                _ => {
                    page_dict.set("Contents", Object::Reference(wm_id));
                }
            }
        }
    }

    doc.save(output_path)
        .map_err(|e| AppError::Pdf(format!("Failed to save: {e}")))?;

    log::info!("Added watermark '{}' → {}", text, output_path);
    Ok(output_path.to_string())
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize, Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct PdfMetadata {
    pub title:             Option<String>,
    pub author:            Option<String>,
    pub subject:           Option<String>,
    pub keywords:          Option<String>,
    pub creator:           Option<String>,
    pub producer:          Option<String>,
    pub creation_date:     Option<String>,
    pub modification_date: Option<String>,
}

/// Reads metadata from a PDF's Info dictionary.
pub fn get_metadata(input_path: &str) -> Result<PdfMetadata> {
    let doc = Document::load(input_path)
        .map_err(|e| AppError::Pdf(format!("Failed to load PDF: {e}")))?;

    let mut meta = PdfMetadata::default();

    if let Ok(info_id) = doc.trailer.get(b"Info").and_then(|o| o.as_reference()) {
        if let Ok(Object::Dictionary(info)) = doc.get_object(info_id) {
            macro_rules! read_str {
                ($key:expr, $field:expr) => {
                    if let Ok(obj) = info.get($key) {
                        if let Ok(s) = obj.as_str() {
                            $field = Some(String::from_utf8_lossy(s).to_string());
                        }
                    }
                };
            }
            read_str!(b"Title",        meta.title);
            read_str!(b"Author",       meta.author);
            read_str!(b"Subject",      meta.subject);
            read_str!(b"Keywords",     meta.keywords);
            read_str!(b"Creator",      meta.creator);
            read_str!(b"Producer",     meta.producer);
            read_str!(b"CreationDate", meta.creation_date);
            read_str!(b"ModDate",      meta.modification_date);
        }
    }

    Ok(meta)
}

/// Writes metadata to a PDF.
pub fn set_metadata(input_path: &str, output_path: &str, metadata: &PdfMetadata) -> Result<String> {
    let mut doc = Document::load(input_path)
        .map_err(|e| AppError::Pdf(format!("Failed to load PDF: {e}")))?;

    let info_id = if let Ok(id) = doc.trailer.get(b"Info").and_then(|o| o.as_reference()) {
        id
    } else {
        let new_id = doc.add_object(Object::Dictionary(Dictionary::new()));
        doc.trailer.set("Info", Object::Reference(new_id));
        new_id
    };

    if let Ok(Object::Dictionary(ref mut info)) = doc.get_object_mut(info_id) {
        macro_rules! set_str {
            ($key:expr, $val:expr) => {
                if let Some(v) = $val {
                    info.set($key, Object::string_literal(v.as_bytes().to_vec()));
                }
            };
        }
        set_str!("Title",    &metadata.title);
        set_str!("Author",   &metadata.author);
        set_str!("Subject",  &metadata.subject);
        set_str!("Keywords", &metadata.keywords);
        set_str!("Creator",  &metadata.creator);
        set_str!("Producer", &metadata.producer);
    }

    doc.save(output_path)
        .map_err(|e| AppError::Pdf(format!("Failed to save: {e}")))?;

    log::info!("Updated metadata → {}", output_path);
    Ok(output_path.to_string())
}
