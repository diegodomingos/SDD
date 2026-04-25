import type { Grade } from '../../shared/ipc-types'
import type { AIProvider, EvaluationInput, EvaluationResult } from './AIProvider'

export class MockAIProvider implements AIProvider {
  private readonly grade: Grade

  constructor(grade: Grade = 'Meets Expectations') {
    this.grade = grade
  }

  async evaluate(_input: EvaluationInput): Promise<EvaluationResult> {
    return {
      grade: this.grade,
      rationale: `Mock evaluation: placeholder rationale for grade "${this.grade}".`
    }
  }
}
