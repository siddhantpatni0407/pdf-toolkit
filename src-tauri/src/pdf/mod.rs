pub mod merge;
pub mod split;
pub mod compress;
pub mod rotate;
pub mod organize;
pub mod security;
pub mod convert;
pub mod repair;

pub use merge::merge_pdfs;
pub use split::split_pdf;
#[allow(unused_imports)]
pub use compress::{compress_pdf, CompressOptions, CompressResult};
#[allow(unused_imports)]
pub use rotate::{rotate_pdf, RotateOptions};
pub use organize::{reorder_pages, remove_pages, extract_pages};
#[allow(unused_imports)]
pub use security::{protect_pdf, unlock_pdf, add_watermark, get_metadata, set_metadata,
                   PasswordOptions, WatermarkOptions, PdfMetadata};
#[allow(unused_imports)]
pub use convert::{convert_pdf_to, convert_to_pdf, ConvertOptions};
pub use repair::repair_pdf;
