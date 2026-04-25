import Database from 'better-sqlite3'
import { app } from 'electron'
import log from 'electron-log/main'
import { join } from 'path'

export const dbPath = join(app.getPath('userData'), 'sdd.db')
export let db: Database.Database | undefined

export function initializeSchema(): void {
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.transaction(() => {
    db!.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        level TEXT NOT NULL CHECK(level IN ('A','B','C','D')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS competencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS expected_behaviors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        competency_id INTEGER NOT NULL REFERENCES competencies(id),
        level TEXT NOT NULL CHECK(level IN ('A','B','C','D')),
        description TEXT NOT NULL,
        UNIQUE(competency_id, level)
      );

      CREATE TABLE IF NOT EXISTS behavior_log_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        entry_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS behavior_log_entry_competencies (
        entry_id INTEGER NOT NULL REFERENCES behavior_log_entries(id) ON DELETE CASCADE,
        competency_id INTEGER NOT NULL REFERENCES competencies(id),
        PRIMARY KEY (entry_id, competency_id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)

    db!.exec(`
      INSERT OR IGNORE INTO competencies (name) VALUES ('Communication');
      INSERT OR IGNORE INTO competencies (name) VALUES ('Client Focus');
      INSERT OR IGNORE INTO competencies (name) VALUES ('Proactivity');
      INSERT OR IGNORE INTO competencies (name) VALUES ('Teamwork');
    `)
  })()

  log.info('[database] Schema initialized at', dbPath)
}
