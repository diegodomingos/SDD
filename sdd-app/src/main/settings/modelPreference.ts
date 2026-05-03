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

export function getModel(db: Database.Database): string {
  const row = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get('model') as { value: string } | undefined
  return row?.value ?? 'claude-haiku-4-5-20251001'
}

export function setModel(db: Database.Database, model: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('model', model)
}
