use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme:               String,
    pub accent_color:        String,
    pub default_output_folder: String,
    pub auto_open_output:    bool,
    pub show_thumbnails:     bool,
    pub thumbnail_quality:   String,
    pub compression_level:   String,
    pub ocr_language:        String,
    pub ocr_engine:          String,
    pub max_concurrent_jobs: i64,
    pub log_retention_days:  i64,
    pub check_updates:       bool,
    pub language:            String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme:                "dark".into(),
            accent_color:         "rose".into(),
            default_output_folder:"".into(),
            auto_open_output:     false,
            show_thumbnails:      true,
            thumbnail_quality:    "medium".into(),
            compression_level:    "medium".into(),
            ocr_language:         "eng".into(),
            ocr_engine:           "tesseract".into(),
            max_concurrent_jobs:  2,
            log_retention_days:   30,
            check_updates:        true,
            language:             "en".into(),
        }
    }
}
