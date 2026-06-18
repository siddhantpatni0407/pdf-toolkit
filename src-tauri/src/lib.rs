mod commands;
mod database;
mod error;
mod models;
mod ocr;
mod pdf;

use database::DbState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data dir");

            std::fs::create_dir_all(&data_dir)
                .expect("Failed to create app data directory");

            let db_path = data_dir.join("pdftoolkit.db");

            let conn = database::initialize_database(&db_path)
                .expect("Failed to initialize SQLite database");

            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // PDF Operations
            commands::pdf_commands::cmd_merge_pdfs,
            commands::pdf_commands::cmd_split_pdf,
            commands::pdf_commands::cmd_compress_pdf,
            commands::pdf_commands::cmd_rotate_pdf,
            commands::pdf_commands::cmd_reorder_pages,
            commands::pdf_commands::cmd_remove_pages,
            commands::pdf_commands::cmd_extract_pages,
            commands::pdf_commands::cmd_repair_pdf,
            commands::pdf_commands::cmd_get_page_count,
            commands::pdf_commands::cmd_convert_pdf_to,
            commands::pdf_commands::cmd_convert_to_pdf,
            commands::pdf_commands::cmd_protect_pdf,
            commands::pdf_commands::cmd_unlock_pdf,
            commands::pdf_commands::cmd_add_watermark,
            commands::pdf_commands::cmd_get_metadata,
            commands::pdf_commands::cmd_set_metadata,
            // OCR
            commands::ocr_commands::cmd_perform_ocr,
            // Settings
            commands::settings_commands::cmd_get_settings,
            commands::settings_commands::cmd_save_settings,
            // History
            commands::history_commands::cmd_get_history,
            commands::history_commands::cmd_delete_history_entry,
            commands::history_commands::cmd_clear_history,
            commands::history_commands::cmd_get_recent_files,
            commands::history_commands::cmd_add_recent_file,
            commands::history_commands::cmd_clear_recent_files,
            // Analytics
            commands::analytics_commands::cmd_get_analytics_summary,
            // File utilities
            commands::file_commands::cmd_open_file,
            commands::file_commands::cmd_open_directory,
            commands::file_commands::cmd_get_default_output_dir,
            commands::file_commands::cmd_generate_thumbnail,
            // Job Queue
            commands::queue_commands::cmd_get_jobs,
            commands::queue_commands::cmd_cancel_job,
            commands::queue_commands::cmd_clear_completed_jobs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
