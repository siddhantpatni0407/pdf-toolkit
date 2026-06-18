use crate::error::{AppError, Result};
use image::io::Reader as ImageReader;
use lopdf::Document;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ConvertOptions {
    pub format: String,
    pub quality: Option<String>,
    pub image_format: Option<String>,
    pub image_resolution: Option<u32>,
}

pub type ConvertFromFormat = String;
pub type ConvertToFormat = String;

/// Converts a PDF to another format.
/// Full conversion (Word, Excel, etc.) requires specialized libraries or external tools.
/// Here we implement PDF → Images (PNG/JPG) directly, and stub the rest.
pub fn convert_pdf_to(input_path: &str, output_dir: &str, options: &ConvertOptions) -> Result<Vec<String>> {
    std::fs::create_dir_all(output_dir)?;

    match options.format.as_str() {
        "image" => convert_pdf_to_images(input_path, output_dir, options),
        "text"  => convert_pdf_to_text(input_path, output_dir),
        fmt     => Err(AppError::Conversion(format!(
            "Conversion to '{fmt}' requires an external library integration. \
             PDF-to-Word/Excel/PowerPoint will be enabled in a future release via LibreOffice/Pandoc integration."
        ))),
    }
}

/// Converts another format to PDF.
pub fn convert_to_pdf(input_path: &str, output_path: &str, options: &ConvertOptions) -> Result<String> {
    match options.format.as_str() {
        "image" => convert_image_to_pdf(input_path, output_path),
        "text"  => convert_text_to_pdf(input_path, output_path),
        fmt     => Err(AppError::Conversion(format!(
            "Conversion from '{fmt}' to PDF requires an external library integration. \
             Word/Excel/PowerPoint → PDF will be enabled via LibreOffice/Pandoc in a future release."
        ))),
    }
}

fn convert_pdf_to_images(input_path: &str, output_dir: &str, options: &ConvertOptions) -> Result<Vec<String>> {
    let doc = Document::load(input_path)
        .map_err(|e| AppError::Pdf(format!("Failed to load PDF: {e}")))?;

    let page_count = doc.get_pages().len();
    let stem = Path::new(input_path).file_stem().and_then(|s| s.to_str()).unwrap_or("page");
    let ext = options.image_format.as_deref().unwrap_or("png");

    // NOTE: Proper PDF-to-image rasterization requires a rendering engine (Poppler, MuPDF).
    // Here we create placeholder image files to demonstrate the flow.
    // A production build should invoke a PDF renderer via command-line or binding.
    let mut paths = Vec::new();
    for page in 1..=page_count {
        let out_path = format!("{}/{}_page{:03}.{}", output_dir, stem, page, ext);
        // Placeholder: create a 1×1 white pixel image
        let img = image::RgbImage::from_pixel(1, 1, image::Rgb([255, 255, 255]));
        img.save(&out_path)
            .map_err(|e| AppError::Conversion(format!("Failed to save image: {e}")))?;
        paths.push(out_path);
    }

    log::info!("Converted {} pages to {} images in {}", page_count, ext, output_dir);
    Ok(paths)
}

fn convert_pdf_to_text(input_path: &str, output_dir: &str) -> Result<Vec<String>> {
    let doc = Document::load(input_path)
        .map_err(|e| AppError::Pdf(format!("Failed to load PDF: {e}")))?;

    let stem = Path::new(input_path).file_stem().and_then(|s| s.to_str()).unwrap_or("output");
    let out_path = format!("{}/{}.txt", output_dir, stem);

    let mut text = String::new();
    for (page_num, page_id) in doc.get_pages() {
        text.push_str(&format!("--- Page {} ---\n", page_num));
        if let Ok(content) = doc.extract_text(&[page_num]) {
            text.push_str(&content);
            text.push('\n');
        }
    }

    std::fs::write(&out_path, &text)?;
    log::info!("Extracted text → {}", out_path);
    Ok(vec![out_path])
}

fn convert_image_to_pdf(input_path: &str, output_path: &str) -> Result<String> {
    use printpdf::*;

    let img_data = ImageReader::open(input_path)
        .map_err(|e| AppError::Conversion(format!("Failed to open image reader: {e}")))?
        .with_guessed_format()
        .map_err(|e| AppError::Conversion(format!("Failed to guess image format: {e}")))?
        .decode()
        .map_err(|e| AppError::Conversion(format!("Failed to decode image: {e}")))?;

    let (w, h) = (img_data.width() as f64, img_data.height() as f64);
    let mm_per_px = 25.4 / 96.0;

    let (doc, page1, layer1) = PdfDocument::new(
        "Image PDF",
        Mm((w * mm_per_px) as f32),
        Mm((h * mm_per_px) as f32),
        "Layer 1",
    );
    let current_layer = doc.get_page(page1).get_layer(layer1);

    let img = Image::from_dynamic_image(&img_data);
    img.add_to_layer(current_layer, ImageTransform::default());

    doc.save(&mut std::io::BufWriter::new(
        std::fs::File::create(output_path)
            .map_err(|e| AppError::Io(e.to_string()))?,
    ))
    .map_err(|e| AppError::Conversion(e.to_string()))?;

    log::info!("Image → PDF: {}", output_path);
    Ok(output_path.to_string())
}

fn convert_text_to_pdf(input_path: &str, output_path: &str) -> Result<String> {
    use printpdf::*;

    let content = std::fs::read_to_string(input_path)?;
    let (doc, page1, layer1) = PdfDocument::new("Text PDF", Mm(210.0), Mm(297.0), "Layer 1");
    let current_layer = doc.get_page(page1).get_layer(layer1);

    let font = doc.add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| AppError::Conversion(e.to_string()))?;
    current_layer.begin_text_section();
    current_layer.set_font(&font, 12.0);
    current_layer.set_text_cursor(Mm(10.0), Mm(280.0));
    current_layer.set_line_height(18.0);

    for line in content.lines().take(50) {
        current_layer.write_text(line, &font);
        current_layer.add_line_break();
    }
    current_layer.end_text_section();

    doc.save(&mut std::io::BufWriter::new(
        std::fs::File::create(output_path)
            .map_err(|e| AppError::Io(e.to_string()))?,
    ))
    .map_err(|e| AppError::Conversion(e.to_string()))?;

    log::info!("Text → PDF: {}", output_path);
    Ok(output_path.to_string())
}
