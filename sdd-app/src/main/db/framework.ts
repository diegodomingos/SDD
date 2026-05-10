import { db } from './database'
import type { Competency, CompetencyLevel } from '../../shared/ipc-types'

export function listCompetencies(): Competency[] {
  if (!db) throw new Error('Database not initialized')
  return db.prepare('SELECT id, name FROM competencies ORDER BY id').all() as Competency[]
}

export function getExpectedBehavior(competencyId: number, level: CompetencyLevel): string | null {
  if (!db) throw new Error('Database not initialized')
  const row = db
    .prepare('SELECT description FROM expected_behaviors WHERE competency_id = ? AND level = ?')
    .get(competencyId, level) as { description: string } | undefined
  return row?.description ?? null
}

export function getAllExpectedBehaviors(competencyId: number): Record<CompetencyLevel, string> {
  const levels: CompetencyLevel[] = ['A', 'B', 'C', 'D']
  return Object.fromEntries(
    levels.map((level) => [level, getExpectedBehavior(competencyId, level) ?? ''])
  ) as Record<CompetencyLevel, string>
}

export function setExpectedBehavior(
  competencyId: number,
  level: CompetencyLevel,
  description: string
): string {
  if (!db) throw new Error('Database not initialized')
  db.prepare(
    'INSERT OR REPLACE INTO expected_behaviors (competency_id, level, description) VALUES (?, ?, ?)'
  ).run(competencyId, level, description)
  return description
}
