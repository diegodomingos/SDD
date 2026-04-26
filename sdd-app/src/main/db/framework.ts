import { db } from './database'
import type { Competency, CompetencyLevel } from '../../shared/ipc-types'

export function listCompetencies(): Competency[] {
  if (!db) throw new Error('Database not initialized')
  return db.prepare('SELECT id, name FROM competencies ORDER BY id').all() as Competency[]
}

export function getExpectedBehavior(competencyId: number, level: CompetencyLevel): string | null {
  // Full implementation: Story 3.1
  void competencyId
  void level
  return null
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
