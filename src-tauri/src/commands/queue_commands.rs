use tauri::State;
use crate::database::DbState;
use crate::error::AppError;

#[tauri::command]
pub fn cmd_get_jobs(state: State<'_, DbState>) -> Result<Vec<crate::models::job::Job>, AppError> {
    let db = state.0.lock().map_err(|_| AppError::Database("Lock poisoned".into()))?;
    let mut stmt = db.prepare(
        "SELECT id, operation, input_files, output_path, params,
                status, progress, created_at, started_at, completed_at, error, result_files
         FROM job_queue
         ORDER BY created_at DESC
         LIMIT 100",
    )?;

    let jobs = stmt
        .query_map([], |row| {
            let inputs: String = row.get(2)?;
            let results: Option<String> = row.get(11)?;
            Ok(crate::models::job::Job {
                id:           row.get(0)?,
                operation:    row.get(1)?,
                input_files:  serde_json::from_str(&inputs).unwrap_or_default(),
                output_path:  row.get(3)?,
                params:       serde_json::from_str(&row.get::<_, String>(4)?).unwrap_or(serde_json::Value::Object(Default::default())),
                status:       row.get(5)?,
                progress:     row.get(6)?,
                created_at:   row.get(7)?,
                started_at:   row.get(8)?,
                completed_at: row.get(9)?,
                error:        row.get(10)?,
                result_files: results.and_then(|s| serde_json::from_str(&s).ok()),
            })
        })?
        .flatten()
        .collect();

    Ok(jobs)
}

#[tauri::command]
pub fn cmd_cancel_job(job_id: String, state: State<'_, DbState>) -> Result<(), AppError> {
    let db = state.0.lock().map_err(|_| AppError::Database("Lock poisoned".into()))?;
    db.execute(
        "UPDATE job_queue SET status='cancelled' WHERE id=?1 AND status IN ('queued','running')",
        [job_id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn cmd_clear_completed_jobs(state: State<'_, DbState>) -> Result<(), AppError> {
    let db = state.0.lock().map_err(|_| AppError::Database("Lock poisoned".into()))?;
    db.execute(
        "DELETE FROM job_queue WHERE status IN ('completed','failed','cancelled')",
        [],
    )?;
    Ok(())
}
