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

export function setExpectedBehavior(
  competencyId: number,
  level: CompetencyLevel,
  description: string
): never {
  // Full implementation: Story 3.2
  void competencyId
  void level
  void description
  throw new Error('Not implemented')
}
