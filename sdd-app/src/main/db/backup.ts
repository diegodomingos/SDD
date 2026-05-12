import type Database from 'better-sqlite3'
import type { BackupPayload } from '../../shared/ipc-types'

interface EmployeeRow {
  id: number
  name: string
  level: string
  created_at: string
}
interface ExpectedBehaviorRow {
  competency_id: number
  level: string
  description: string
}
interface BehaviorLogRow {
  id: number
  employee_id: number
  description: string
  entry_date: string
  created_at: string
}
interface JunctionRow {
  entry_id: number
  competency_id: number
}
interface SettingsRow {
  key: string
  value: string
}

export function exportData(db: Database.Database): BackupPayload {
  const employees = (
    db
      .prepare('SELECT id, name, level, created_at FROM employees ORDER BY id')
      .all() as EmployeeRow[]
  ).map((r) => ({ id: r.id, name: r.name, level: r.level, createdAt: r.created_at }))

  const expectedBehaviors = (
    db
      .prepare(
        'SELECT competency_id, level, description FROM expected_behaviors ORDER BY competency_id, level'
      )
      .all() as ExpectedBehaviorRow[]
  ).map((r) => ({ competencyId: r.competency_id, level: r.level, description: r.description }))

  const behaviorLogEntries = (
    db
      .prepare(
        'SELECT id, employee_id, description, entry_date, created_at FROM behavior_log_entries ORDER BY id'
      )
      .all() as BehaviorLogRow[]
  ).map((r) => ({
    id: r.id,
    employeeId: r.employee_id,
    description: r.description,
    entryDate: r.entry_date,
    createdAt: r.created_at
  }))

  const behaviorLogEntryCompetencies = (
    db
      .prepare(
        'SELECT entry_id, competency_id FROM behavior_log_entry_competencies ORDER BY entry_id, competency_id'
      )
      .all() as JunctionRow[]
  ).map((r) => ({ entryId: r.entry_id, competencyId: r.competency_id }))

  const settingsRows = db
    .prepare("SELECT key, value FROM settings WHERE key IN ('manager_name', 'model')")
    .all() as SettingsRow[]
  const settings: Record<string, string> = {}
  for (const row of settingsRows) settings[row.key] = row.value

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    employees,
    expectedBehaviors,
    behaviorLogEntries,
    behaviorLogEntryCompetencies,
    settings
  }
}

export function importData(db: Database.Database, backup: BackupPayload): void {
  db.transaction(() => {
    db.prepare('DELETE FROM expected_behaviors').run()
    db.prepare('DELETE FROM behavior_log_entries').run()
    db.prepare('DELETE FROM employees').run()

    const insertEmployee = db.prepare(
      'INSERT INTO employees (id, name, level, created_at) VALUES (?, ?, ?, ?)'
    )
    for (const e of backup.employees) {
      insertEmployee.run(e.id, e.name, e.level, e.createdAt)
    }

    const insertEntry = db.prepare(
      'INSERT INTO behavior_log_entries (id, employee_id, description, entry_date, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    for (const e of backup.behaviorLogEntries) {
      insertEntry.run(e.id, e.employeeId, e.description, e.entryDate, e.createdAt)
    }

    const insertJunction = db.prepare(
      'INSERT INTO behavior_log_entry_competencies (entry_id, competency_id) VALUES (?, ?)'
    )
    for (const j of backup.behaviorLogEntryCompetencies) {
      insertJunction.run(j.entryId, j.competencyId)
    }

    const insertBehavior = db.prepare(
      'INSERT INTO expected_behaviors (competency_id, level, description) VALUES (?, ?, ?)'
    )
    for (const b of backup.expectedBehaviors) {
      insertBehavior.run(b.competencyId, b.level, b.description)
    }

    const SAFE_SETTINGS_KEYS = new Set(['manager_name', 'model'])
    const upsertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    for (const [key, value] of Object.entries(backup.settings)) {
      if (SAFE_SETTINGS_KEYS.has(key)) upsertSetting.run(key, value)
    }
  })()
}
