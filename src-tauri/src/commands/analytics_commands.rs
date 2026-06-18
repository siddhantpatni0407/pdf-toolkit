use tauri::State;
use crate::database::DbState;
use crate::error::AppError;
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationStat {
    pub operation:              String,
    pub label:                  String,
    pub count:                  i64,
    pub total_files_processed:  i64,
    pub total_saved:            i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyActivity {
    pub date:  String,
    pub count: i64,
    pub saved: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsSummary {
    pub total_operations:       i64,
    pub total_files_processed:  i64,
    pub total_storage_saved:    i64,
    pub most_used_operation:    Option<String>,
    pub operation_stats:        Vec<OperationStat>,
    pub daily_activity:         Vec<DailyActivity>,
}

fn operation_label(op: &str) -> String {
    match op {
        "merge"          => "Merge PDF",
        "split"          => "Split PDF",
        "compress"       => "Compress",
        "rotate"         => "Rotate",
        "reorder"        => "Reorder",
        "remove-pages"   => "Remove Pages",
        "extract-pages"  => "Extract Pages",
        "repair"         => "Repair",
        "pdf-to-word"    => "PDF→Word",
        "pdf-to-excel"   => "PDF→Excel",
        "pdf-to-ppt"     => "PDF→PPT",
        "pdf-to-image"   => "PDF→Image",
        "pdf-to-text"    => "PDF→Text",
        "word-to-pdf"    => "Word→PDF",
        "excel-to-pdf"   => "Excel→PDF",
        "ppt-to-pdf"     => "PPT→PDF",
        "image-to-pdf"   => "Image→PDF",
        "text-to-pdf"    => "Text→PDF",
        "protect"        => "Protect",
        "unlock"         => "Unlock",
        "watermark"      => "Watermark",
        "metadata"       => "Metadata",
        "ocr"            => "OCR",
        _                => op,
    }.to_string()
}

#[tauri::command]
pub fn cmd_get_analytics_summary(
    days: i64,
    state: State<'_, DbState>,
) -> Result<AnalyticsSummary, AppError> {
    let db = state.0.lock().map_err(|_| AppError::Database("Lock poisoned".into()))?;

    // Total operations
    let total_operations: i64 = db.query_row(
        "SELECT COUNT(*) FROM processing_history WHERE created_at >= datetime('now', ?1)",
        [format!("-{days} days")],
        |row| row.get(0),
    ).unwrap_or(0);

    // Total files processed
    let total_files: i64 = db.query_row(
        "SELECT COALESCE(SUM(file_count), 0) FROM processing_history WHERE created_at >= datetime('now', ?1)",
        [format!("-{days} days")],
        |row| row.get(0),
    ).unwrap_or(0);

    // Total storage saved
    let total_saved: i64 = db.query_row(
        "SELECT COALESCE(SUM(saved_size), 0) FROM processing_history WHERE created_at >= datetime('now', ?1)",
        [format!("-{days} days")],
        |row| row.get(0),
    ).unwrap_or(0);

    // Operation stats
    let mut stmt = db.prepare(
        "SELECT operation, COUNT(*) as cnt, COALESCE(SUM(file_count),0), COALESCE(SUM(saved_size),0)
         FROM processing_history
         WHERE created_at >= datetime('now', ?1)
         GROUP BY operation
         ORDER BY cnt DESC
         LIMIT 10",
    )?;

    let stats: Vec<OperationStat> = stmt
        .query_map([format!("-{days} days")], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, i64>(2)?,
                row.get::<_, i64>(3)?,
            ))
        })?
        .flatten()
        .map(|(op, count, files, saved)| OperationStat {
            label:                 operation_label(&op),
            operation:             op,
            count,
            total_files_processed: files,
            total_saved:           saved,
        })
        .collect();

    let most_used = stats.first().map(|s| s.operation.clone());

    // Daily activity
    let mut daily_stmt = db.prepare(
        "SELECT date(created_at) as day, COUNT(*) as cnt, COALESCE(SUM(saved_size), 0)
         FROM processing_history
         WHERE created_at >= datetime('now', ?1)
         GROUP BY day
         ORDER BY day ASC",
    )?;

    let daily: Vec<DailyActivity> = daily_stmt
        .query_map([format!("-{days} days")], |row| {
            Ok(DailyActivity {
                date:  row.get(0)?,
                count: row.get(1)?,
                saved: row.get(2)?,
            })
        })?
        .flatten()
        .collect();

    Ok(AnalyticsSummary {
        total_operations,
        total_files_processed: total_files,
        total_storage_saved:   total_saved,
        most_used_operation:   most_used,
        operation_stats:       stats,
        daily_activity:        daily,
    })
}
