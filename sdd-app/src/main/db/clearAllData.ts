import Database from 'better-sqlite3'

export function clearAllData(db: Database.Database): void {
  db.transaction(() => {
    db.prepare('DELETE FROM expected_behaviors').run()
    db.prepare('DELETE FROM employees').run()
    // behavior_log_entries and behavior_log_entry_competencies deleted via
    // ON DELETE CASCADE from employees (foreign_keys = ON at startup)
  })()
}
