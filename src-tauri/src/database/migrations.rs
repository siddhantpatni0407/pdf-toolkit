use rusqlite::Connection;
use crate::error::AppError;

/// Schema version — increment when adding new migrations.
const CURRENT_VERSION: i64 = 1;

/// Runs all pending database migrations.
pub fn run_migrations(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);")?;

    let version: i64 = conn
        .query_row("SELECT version FROM schema_version LIMIT 1", [], |row| row.get(0))
        .unwrap_or(0);

    if version < 1 {
        migrate_v1(conn)?;
        set_version(conn, CURRENT_VERSION)?;
    }

    // Add future migrations: if version < 2 { migrate_v2(conn)?; set_version(conn, 2)?; }

    Ok(())
}

fn set_version(conn: &Connection, v: i64) -> Result<(), AppError> {
    conn.execute("DELETE FROM schema_version", [])?;
    conn.execute("INSERT INTO schema_version (version) VALUES (?1)", [v])?;
    Ok(())
}

fn migrate_v1(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch("
        -- User preferences
        CREATE TABLE IF NOT EXISTS user_preferences (
            key   TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Recent files
        CREATE TABLE IF NOT EXISTS recent_files (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            path       TEXT NOT NULL,
            name       TEXT NOT NULL,
            operation  TEXT NOT NULL,
            opened_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_recent_files_opened_at
            ON recent_files(opened_at DESC);

        -- Processing history
        CREATE TABLE IF NOT EXISTS processing_history (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            operation       TEXT NOT NULL,
            input_files     TEXT NOT NULL,   -- JSON array
            output_files    TEXT NOT NULL,   -- JSON array
            status          TEXT NOT NULL CHECK(status IN ('success','failed')),
            file_count      INTEGER NOT NULL DEFAULT 0,
            total_size      INTEGER NOT NULL DEFAULT 0,
            saved_size      INTEGER,
            duration_ms     INTEGER NOT NULL DEFAULT 0,
            created_at      TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_history_created_at
            ON processing_history(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_history_operation
            ON processing_history(operation);

        -- Job queue (persisted jobs across restarts)
        CREATE TABLE IF NOT EXISTS job_queue (
            id           TEXT PRIMARY KEY NOT NULL,
            operation    TEXT NOT NULL,
            input_files  TEXT NOT NULL,   -- JSON array
            output_path  TEXT NOT NULL,
            params       TEXT NOT NULL DEFAULT '{}',
            status       TEXT NOT NULL DEFAULT 'queued'
                             CHECK(status IN ('queued','running','completed','failed','cancelled')),
            progress     INTEGER NOT NULL DEFAULT 0,
            created_at   TEXT NOT NULL DEFAULT (datetime('now')),
            started_at   TEXT,
            completed_at TEXT,
            error        TEXT,
            result_files TEXT   -- JSON array
        );
        CREATE INDEX IF NOT EXISTS idx_job_queue_status
            ON job_queue(status);

        -- Application settings
        CREATE TABLE IF NOT EXISTS application_settings (
            key        TEXT PRIMARY KEY NOT NULL,
            value      TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Audit logs
        CREATE TABLE IF NOT EXISTS audit_logs (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            event      TEXT NOT NULL,
            details    TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
            ON audit_logs(created_at DESC);

        -- Saved workflows (batch presets)
        CREATE TABLE IF NOT EXISTS saved_workflows (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            description TEXT,
            operations  TEXT NOT NULL,   -- JSON array of operations
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Default settings
        INSERT OR IGNORE INTO application_settings (key, value)
        VALUES
            ('theme',               'dark'),
            ('accent_color',        'rose'),
            ('compression_level',   'medium'),
            ('ocr_language',        'eng'),
            ('max_concurrent_jobs', '2'),
            ('log_retention_days',  '30'),
            ('show_thumbnails',     'true'),
            ('auto_open_output',    'false');
    ")?;
    Ok(())
}
