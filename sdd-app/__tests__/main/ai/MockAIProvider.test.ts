import { describe, it, expect } from 'vitest'
import { MockAIProvider } from '../../../src/main/ai/MockAIProvider'
import type { EvaluationInput } from '../../../src/main/ai/AIProvider'

const sampleInput: EvaluationInput = {
  entries: [],
  allExpectedBehaviors: {
    A: 'Shows clear communication in meetings.',
    B: 'Shows clear communication in meetings.',
    C: 'Shows clear communication in meetings.',
    D: 'Shows clear communication in meetings.',
  },
  employeeLevel: 'B',
  model: 'claude-haiku-4-5-20251001'
}

describe('MockAIProvider', () => {
  it('returns Meets Expectations by default', async () => {
    const result = await new MockAIProvider().evaluate(sampleInput)
    expect(result.grade).toBe('Meets Expectations')
    expect(result.rationale.length).toBeGreaterThan(0)
  })

  it('returns Does Not Meet Expectations when configured', async () => {
    const result = await new MockAIProvider('Does Not Meet Expectations').evaluate(sampleInput)
    expect(result.grade).toBe('Does Not Meet Expectations')
  })

  it('returns Exceeds Expectations when configured', async () => {
    const result = await new MockAIProvider('Exceeds Expectations').evaluate(sampleInput)
    expect(result.grade).toBe('Exceeds Expectations')
  })

  it('returns Insufficient Input when configured', async () => {
    const result = await new MockAIProvider('Insufficient Input').evaluate(sampleInput)
    expect(result.grade).toBe('Insufficient Input')
    expect(result.rationale.length).toBeGreaterThan(0)
  })

  it('makes no network calls — resolves in under 50ms', async () => {
    const start = Date.now()
    await new MockAIProvider().evaluate(sampleInput)
    expect(Date.now() - start).toBeLessThan(50)
  })

  it('throws when shouldThrow is true', async () => {
    await expect(
      new MockAIProvider('Meets Expectations', true).evaluate(sampleInput)
    ).rejects.toThrow('Mock network error: Connection refused')
  })
})
