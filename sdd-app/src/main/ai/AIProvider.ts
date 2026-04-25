import type { Grade, BehaviorLogEntry } from '../../shared/ipc-types'

export interface EvaluationInput {
  entries: BehaviorLogEntry[]  // behavior log entries filtered to one competency
  expectedBehaviors: string    // configured expected behavior text for this competency + level
  model: string                // 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6'
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
