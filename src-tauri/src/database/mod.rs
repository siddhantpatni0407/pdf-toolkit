pub mod migrations;

use rusqlite::Connection;
use std::path::Path;
use std::sync::Mutex;

use crate::error::AppError;

/// Managed Tauri state wrapping the SQLite connection.
pub struct DbState(pub Mutex<Connection>);

/// Opens (or creates) the SQLite database and runs all migrations.
pub fn initialize_database(path: &Path) -> Result<Connection, AppError> {
    let conn = Connection::open(path)?;

    conn.execute_batch(
        "PRAGMA journal_mode=WAL;\
         PRAGMA synchronous=NORMAL;\
         PRAGMA foreign_keys=ON;\
         PRAGMA cache_size=-32000;\
         PRAGMA temp_store=MEMORY;",
    )?;

    migrations::run_migrations(&conn)?;

    Ok(conn)
}
