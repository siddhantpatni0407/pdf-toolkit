use tauri::State;
use crate::database::DbState;
use crate::error::AppError;
use crate::models::history::HistoryEntry;
use crate::models::recent_file::RecentFile;

#[tauri::command]
pub fn cmd_get_history(
    limit: i64,
    offset: i64,
    state: State<'_, DbState>,
) -> Result<Vec<HistoryEntry>, AppError> {
    let db = state.0.lock().map_err(|_| AppError::Database("Lock poisoned".into()))?;

    let mut stmt = db.prepare(
        "SELECT id, operation, input_files, output_files, status,
                file_count, total_size, saved_size, duration_ms, created_at
         FROM processing_history
         ORDER BY created_at DESC
         LIMIT ?1 OFFSET ?2",
    )?;

    let entries = stmt
        .query_map(rusqlite::params![limit, offset], |row| {
            let input_str:  String = row.get(2)?;
            let output_str: String = row.get(3)?;
            Ok(HistoryEntry {
                id:           row.get(0)?,
                operation:    row.get(1)?,
                input_files:  serde_json::from_str(&input_str).unwrap_or_default(),
                output_files: serde_json::from_str(&output_str).unwrap_or_default(),
                status:       row.get(4)?,
                file_count:   row.get(5)?,
                total_size:   row.get(6)?,
                saved_size:   row.get(7)?,
                duration:     row.get(8)?,
                created_at:   row.get(9)?,
            })
        })?
        .flatten()
        .collect();

    Ok(entries)
}

#[tauri::command]
pub fn cmd_delete_history_entry(id: i64, state: State<'_, DbState>) -> Result<(), AppError> {
    let db = state.0.lock().map_err(|_| AppError::Database("Lock poisoned".into()))?;
    db.execute("DELETE FROM processing_history WHERE id = ?1", [id])?;
    Ok(())
}

#[tauri::command]
pub fn cmd_clear_history(state: State<'_, DbState>) -> Result<(), AppError> {
    let db = state.0.lock().map_err(|_| AppError::Database("Lock poisoned".into()))?;
    db.execute("DELETE FROM processing_history", [])?;
    Ok(())
}

#[tauri::command]
pub fn cmd_get_recent_files(limit: i64, state: State<'_, DbState>) -> Result<Vec<RecentFile>, AppError> {
    let db = state.0.lock().map_err(|_| AppError::Database("Lock poisoned".into()))?;

    let mut stmt = db.prepare(
        "SELECT id, path, name, operation, opened_at
         FROM recent_files
         ORDER BY opened_at DESC
         LIMIT ?1",
    )?;

    let files = stmt
        .query_map([limit], |row| {
            Ok(RecentFile {
                id:        row.get(0)?,
                path:      row.get(1)?,
                name:      row.get(2)?,
                operation: row.get(3)?,
                opened_at: row.get(4)?,
            })
        })?
        .flatten()
        .collect();

    Ok(files)
}

#[tauri::command]
pub fn cmd_add_recent_file(
    path: String,
    name: String,
    operation: String,
    state: State<'_, DbState>,
) -> Result<(), AppError> {
    // Validate inputs
    if path.contains("..") || path.contains('\0') {
        return Err(AppError::Validation("Invalid file path".into()));
    }
    let db = state.0.lock().map_err(|_| AppError::Database("Lock poisoned".into()))?;
    // Remove existing entry for the same path+operation
    db.execute(
        "DELETE FROM recent_files WHERE path = ?1 AND operation = ?2",
        rusqlite::params![path, operation],
    )?;
    db.execute(
        "INSERT INTO recent_files (path, name, operation) VALUES (?1, ?2, ?3)",
        rusqlite::params![path, name, operation],
    )?;
    // Keep only last 50
    db.execute(
        "DELETE FROM recent_files WHERE id NOT IN (SELECT id FROM recent_files ORDER BY opened_at DESC LIMIT 50)",
        [],
    )?;
    Ok(())
}

#[tauri::command]
pub fn cmd_clear_recent_files(state: State<'_, DbState>) -> Result<(), AppError> {
    let db = state.0.lock().map_err(|_| AppError::Database("Lock poisoned".into()))?;
    db.execute("DELETE FROM recent_files", [])?;
    Ok(())
}
