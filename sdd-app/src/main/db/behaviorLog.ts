import type Database from 'better-sqlite3'
import type { BehaviorLogEntry, Competency } from '../../shared/ipc-types'

interface BehaviorLogRow {
  id: number
  employee_id: number
  description: string
  entry_date: string
  created_at: string
}

interface JoinRow extends BehaviorLogRow {
  comp_id: number | null
  comp_name: string | null
}

function groupJoinRows(rows: JoinRow[]): BehaviorLogEntry[] {
  const map = new Map<number, BehaviorLogEntry>()
  const order: number[] = []
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        employeeId: row.employee_id,
        description: row.description,
        entryDate: row.entry_date,
        createdAt: row.created_at,
        competencies: [],
      })
      order.push(row.id)
    }
    if (row.comp_id !== null && row.comp_name !== null) {
      map.get(row.id)!.competencies.push({ id: row.comp_id, name: row.comp_name } as Competency)
    }
  }
  return order.map((id) => map.get(id)!)
}

const BASE_SELECT = `
  SELECT e.id, e.employee_id, e.description, e.entry_date, e.created_at,
         c.id AS comp_id, c.name AS comp_name
  FROM behavior_log_entries e
  LEFT JOIN behavior_log_entry_competencies ec ON ec.entry_id = e.id
  LEFT JOIN competencies c ON c.id = ec.competency_id
`

export function listEntries(
  db: Database.Database,
  employeeId: number,
  competencyId?: number
): BehaviorLogEntry[] {
  let rows: JoinRow[]
  if (competencyId !== undefined) {
    rows = db
      .prepare(
        `${BASE_SELECT}
       WHERE e.employee_id = ?
         AND e.id IN (SELECT entry_id FROM behavior_log_entry_competencies WHERE competency_id = ?)
       ORDER BY e.entry_date DESC, e.id DESC`
      )
      .all(employeeId, competencyId) as JoinRow[]
  } else {
    rows = db
      .prepare(
        `${BASE_SELECT}
       WHERE e.employee_id = ?
       ORDER BY e.entry_date DESC, e.id DESC`
      )
      .all(employeeId) as JoinRow[]
  }
  return groupJoinRows(rows)
}
