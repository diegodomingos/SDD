import Database from 'better-sqlite3'

export function getManagerName(db: Database.Database): string {
  const row = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get('manager_name') as { value: string } | undefined
  return row?.value ?? ''
}

export function setManagerName(db: Database.Database, name: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('manager_name', name)
}
