import type { Grade, BehaviorLogEntry, CompetencyLevel } from '../../shared/ipc-types'

export interface EvaluationInput {
  entries: BehaviorLogEntry[]
  allExpectedBehaviors: Record<CompetencyLevel, string>  // behaviors for levels A, B, C, D
  employeeLevel: CompetencyLevel                          // employee's current level
  model: string                                          // 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6'
}

export interface EvaluationResult {
  grade: Grade    // 'Insufficient Input' is a valid outcome, NOT an error
  rationale: string
}

export interface AIProvider {
  evaluate(input: EvaluationInput): Promise<EvaluationResult>
  // Throws on API failure — aiHandlers.ts catches and wraps as { ok: false, error }
  // 'Insufficient Input' returned as EvaluationResult.grade, never thrown
}
