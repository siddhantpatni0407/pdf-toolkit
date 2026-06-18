use crate::error::AppError;
use tauri::Manager;

#[tauri::command]
pub fn cmd_open_file(path: String, _app: tauri::AppHandle) -> Result<(), AppError> {
    // Basic path traversal check
    if path.contains("..") || path.contains('\0') {
        return Err(AppError::Validation("Invalid file path".into()));
    }
    if !std::path::Path::new(&path).exists() {
        return Err(AppError::NotFound(format!("File not found: {path}")));
    }
    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer").arg(&path).spawn().ok();
    #[cfg(target_os = "macos")]
    std::process::Command::new("open").arg(&path).spawn().ok();
    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open").arg(&path).spawn().ok();
    Ok(())
}

#[tauri::command]
pub fn cmd_open_directory(path: String) -> Result<(), AppError> {
    if path.contains('\0') {
        return Err(AppError::Validation("Invalid directory path".into()));
    }
    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer").arg(&path).spawn().ok();
    #[cfg(target_os = "macos")]
    std::process::Command::new("open").arg(&path).spawn().ok();
    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open").arg(&path).spawn().ok();
    Ok(())
}

#[tauri::command]
pub fn cmd_get_default_output_dir(app: tauri::AppHandle) -> Result<String, AppError> {
    let dir = app
        .path()
        .download_dir()
        .map_err(|e| AppError::Io(e.to_string()))?;
    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn cmd_generate_thumbnail(
    input_path: String,
    _page: u32,
    _quality: String,
) -> Result<String, AppError> {
    // Thumbnails require a PDF renderer (Poppler/MuPDF).
    // Returns an empty string as a placeholder; the UI handles missing thumbnails gracefully.
    if !std::path::Path::new(&input_path).exists() {
        return Err(AppError::NotFound(format!("File not found: {input_path}")));
    }
    Ok(String::new())
}
