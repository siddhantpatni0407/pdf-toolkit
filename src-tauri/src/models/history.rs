use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub id:           i64,
    pub operation:    String,
    pub input_files:  Vec<String>,
    pub output_files: Vec<String>,
    pub status:       String,
    pub file_count:   i64,
    pub total_size:   i64,
    pub saved_size:   Option<i64>,
    pub duration:     i64,
    pub created_at:   String,
}
