use tauri::State;
use crate::database::DbState;
use crate::error::AppError;
use crate::ocr::{self, OcrOptions};

#[tauri::command]
pub fn cmd_perform_ocr(
    input_path: String,
    output_dir: String,
    options: OcrOptions,
    state: State<'_, DbState>,
) -> Result<Vec<String>, AppError> {
    let results = ocr::perform_ocr(&input_path, &output_dir, &options)?;

    // Log to history
    {
        let db = state.0.lock().map_err(|_| AppError::Database("Lock poisoned".into()))?;
        let inputs_json = serde_json::to_string(&[&input_path])?;
        let outputs_json = serde_json::to_string(&results)?;
        db.execute(
            "INSERT INTO processing_history (operation, input_files, output_files, status, file_count, total_size, duration_ms)
             VALUES ('ocr', ?1, ?2, 'success', 1, 0, 0)",
            rusqlite::params![inputs_json, outputs_json],
        )?;
    }

    Ok(results)
}
