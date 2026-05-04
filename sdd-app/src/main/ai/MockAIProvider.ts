import type { Grade } from '../../shared/ipc-types'
import type { AIProvider, EvaluationInput, EvaluationResult } from './AIProvider'

export class MockAIProvider implements AIProvider {
  private readonly grade: Grade
  private readonly shouldThrow: boolean

  constructor(grade: Grade = 'Meets Expectations', shouldThrow: boolean = false) {
    this.grade = grade
    this.shouldThrow = shouldThrow
  }

  async evaluate(_input: EvaluationInput): Promise<EvaluationResult> {
    if (this.shouldThrow) {
      throw new Error('Mock network error: Connection refused')
    }
    return {
      grade: this.grade,
      rationale: `Mock evaluation: placeholder rationale for grade "${this.grade}".`
    }
  }
}
