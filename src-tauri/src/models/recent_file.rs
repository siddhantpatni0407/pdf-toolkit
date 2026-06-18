use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentFile {
    pub id:        i64,
    pub path:      String,
    pub name:      String,
    pub operation: String,
    pub opened_at: String,
}
