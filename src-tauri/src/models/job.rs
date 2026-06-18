use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Job {
    pub id:           String,
    pub operation:    String,
    pub input_files:  Vec<String>,
    pub output_path:  String,
    pub params:       serde_json::Value,
    pub status:       String,
    pub progress:     i64,
    pub created_at:   String,
    pub started_at:   Option<String>,
    pub completed_at: Option<String>,
    pub error:        Option<String>,
    pub result_files: Option<Vec<String>>,
}
