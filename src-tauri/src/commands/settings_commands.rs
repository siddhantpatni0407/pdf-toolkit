use tauri::State;
use crate::database::DbState;
use crate::error::AppError;
use crate::models::settings::AppSettings;

#[tauri::command]
pub fn cmd_get_settings(state: State<'_, DbState>) -> Result<AppSettings, AppError> {
    let db = state.0.lock().map_err(|_| AppError::Database("Lock poisoned".into()))?;
    let mut settings = AppSettings::default();

    let mut stmt = db.prepare("SELECT key, value FROM application_settings")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;

    for row in rows.flatten() {
        match row.0.as_str() {
            "theme"                => settings.theme               = row.1,
            "accent_color"         => settings.accent_color        = row.1,
            "auto_open_output"     => settings.auto_open_output     = row.1 == "true",
            "show_thumbnails"      => settings.show_thumbnails      = row.1 == "true",
            "thumbnail_quality"    => settings.thumbnail_quality    = row.1,
            "compression_level"    => settings.compression_level    = row.1,
            "ocr_language"         => settings.ocr_language         = row.1,
            "max_concurrent_jobs"  => settings.max_concurrent_jobs  = row.1.parse().unwrap_or(2),
            "log_retention_days"   => settings.log_retention_days   = row.1.parse().unwrap_or(30),
            "check_updates"        => settings.check_updates        = row.1 == "true",
            "default_output_folder"=> settings.default_output_folder= row.1,
            _ => {}
        }
    }

    Ok(settings)
}

#[tauri::command]
pub fn cmd_save_settings(settings: AppSettings, state: State<'_, DbState>) -> Result<(), AppError> {
    let db = state.0.lock().map_err(|_| AppError::Database("Lock poisoned".into()))?;

    let pairs: &[(&str, String)] = &[
        ("theme",                settings.theme.clone()),
        ("accent_color",         settings.accent_color.clone()),
        ("auto_open_output",     settings.auto_open_output.to_string()),
        ("show_thumbnails",      settings.show_thumbnails.to_string()),
        ("thumbnail_quality",    settings.thumbnail_quality.clone()),
        ("compression_level",    settings.compression_level.clone()),
        ("ocr_language",         settings.ocr_language.clone()),
        ("max_concurrent_jobs",  settings.max_concurrent_jobs.to_string()),
        ("log_retention_days",   settings.log_retention_days.to_string()),
        ("check_updates",        settings.check_updates.to_string()),
        ("default_output_folder",settings.default_output_folder.clone()),
    ];

    for (key, value) in pairs {
        db.execute(
            "INSERT INTO application_settings (key, value, updated_at)
             VALUES (?1, ?2, datetime('now'))
             ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
            rusqlite::params![key, value],
        )?;
    }

    Ok(())
}
