import { safeStorage } from 'electron'
import Database from 'better-sqlite3'

const SETTINGS_KEY = 'api_key'

export function setApiKey(db: Database.Database, key: string): void {
  const encrypted = safeStorage.encryptString(key)
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(
    SETTINGS_KEY,
    encrypted.toString('base64')
  )
}

export function getApiKey(db: Database.Database): string | null {
  const row = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(SETTINGS_KEY) as { value: string } | undefined
  if (!row) return null
  try {
    return safeStorage.decryptString(Buffer.from(row.value, 'base64'))
  } catch {
    return null
  }
}

export function isConfigured(db: Database.Database): boolean {
  const row = db.prepare('SELECT 1 FROM settings WHERE key = ?').get(SETTINGS_KEY)
  return row != null
}

export function clearApiKey(db: Database.Database): void {
  db.prepare('DELETE FROM settings WHERE key = ?').run(SETTINGS_KEY)
}
