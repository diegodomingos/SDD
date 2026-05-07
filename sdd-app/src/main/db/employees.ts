import type Database from 'better-sqlite3'
import type { Employee, CompetencyLevel } from '../../shared/ipc-types'

interface EmployeeRow {
  id: number
  name: string
  level: string
  created_at: string
  entry_count?: number
  last_entry_date?: string | null
}

function mapToEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    name: row.name,
    level: row.level as CompetencyLevel,
    createdAt: row.created_at,
    entryCount: row.entry_count,
    lastEntryDate: row.last_entry_date ?? null,
  }
}

export function listEmployees(db: Database.Database): Employee[] {
  return (db.prepare(`
    SELECT e.id, e.name, e.level, e.created_at,
           COUNT(ble.id) AS entry_count,
           MAX(ble.entry_date) AS last_entry_date
    FROM employees e
    LEFT JOIN behavior_log_entries ble ON ble.employee_id = e.id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `).all() as EmployeeRow[]).map(mapToEmployee)
}

export function createEmployee(db: Database.Database, name: string, level: CompetencyLevel): Employee {
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO employees (name, level) VALUES (?, ?)'
  ).run(name, level)
  const row = db.prepare(
    'SELECT id, name, level, created_at FROM employees WHERE id = ?'
  ).get(Number(lastInsertRowid)) as EmployeeRow | undefined
  if (!row) throw new Error(`Employee row not found after insert (id=${Number(lastInsertRowid)})`)
  return mapToEmployee(row)
}

export function updateEmployee(db: Database.Database, id: number, name: string, level: CompetencyLevel): Employee {
  db.prepare('UPDATE employees SET name = ?, level = ? WHERE id = ?').run(name, level, id)
  const row = db.prepare(
    'SELECT id, name, level, created_at FROM employees WHERE id = ?'
  ).get(id) as EmployeeRow | undefined
  if (!row) throw new Error(`Employee row not found after update (id=${id})`)
  return mapToEmployee(row)
}

export function deleteEmployee(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM employees WHERE id = ?').run(id)
}
