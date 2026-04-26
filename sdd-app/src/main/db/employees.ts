import type Database from 'better-sqlite3'
import type { Employee, CompetencyLevel } from '../../shared/ipc-types'

interface EmployeeRow {
  id: number
  name: string
  level: string
  created_at: string
}

function mapToEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    name: row.name,
    level: row.level as CompetencyLevel,
    createdAt: row.created_at,
  }
}

export function listEmployees(db: Database.Database): Employee[] {
  return (db.prepare('SELECT id, name, level, created_at FROM employees ORDER BY created_at DESC').all() as EmployeeRow[])
    .map(mapToEmployee)
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
