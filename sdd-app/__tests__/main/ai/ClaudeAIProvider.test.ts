import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { EvaluationInput } from '../../../src/main/ai/AIProvider'

const { mockCreate, mockGetApiKey } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockGetApiKey: vi.fn(),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: mockCreate }
  },
}))

vi.mock('../../../src/main/settings/apiKey', () => ({ getApiKey: mockGetApiKey }))

vi.mock('../../../src/main/db/database', () => ({ db: {} }))

import { ClaudeAIProvider } from '../../../src/main/ai/ClaudeAIProvider'

const sampleInput: EvaluationInput = {
  entries: [
    {
      id: 1,
      employeeId: 1,
      description: 'Led team standup effectively, surfacing blockers clearly.',
      entryDate: '2026-05-01',
      createdAt: '2026-05-01T10:00:00',
      competencies: [],
    },
  ],
  allExpectedBehaviors: {
    A: 'Participates in team communication when prompted.',
    B: 'Communicates clearly and proactively with peers.',
    C: 'Facilitates team discussions and removes blockers.',
    D: 'Drives org-wide communication strategies.',
  },
  employeeLevel: 'B',
  model: 'claude-haiku-4-5-20251001',
}

describe('ClaudeAIProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetApiKey.mockReturnValue('test-api-key')
  })

  it('returns grade and rationale when API responds with valid formatted text', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'GRADE: Meets Expectations\nRATIONALE: The employee led the standup on May 1, surfacing blockers clearly — consistent with Level B expectations.',
        },
      ],
    })

    const result = await new ClaudeAIProvider().evaluate(sampleInput)
    expect(result.grade).toBe('Meets Expectations')
    expect(result.rationale).toContain('standup')
  })

  it('parses Exceeds Expectations grade correctly', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'GRADE: Exceeds Expectations\nRATIONALE: Demonstrated Level C behaviors consistently.' }],
    })

    const result = await new ClaudeAIProvider().evaluate(sampleInput)
    expect(result.grade).toBe('Exceeds Expectations')
  })

  it('parses Does Not Meet Expectations grade correctly', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'GRADE: Does Not Meet Expectations\nRATIONALE: Entries show passive participation only.' }],
    })

    const result = await new ClaudeAIProvider().evaluate(sampleInput)
    expect(result.grade).toBe('Does Not Meet Expectations')
  })

  it('parses Insufficient Input grade correctly', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'GRADE: Insufficient Input\nRATIONALE: A single entry is not enough to assess communication competency fairly.',
        },
      ],
    })

    const result = await new ClaudeAIProvider().evaluate(sampleInput)
    expect(result.grade).toBe('Insufficient Input')
    expect(result.rationale.length).toBeGreaterThan(0)
  })

  it('throws when getApiKey returns null (no key configured)', async () => {
    mockGetApiKey.mockReturnValue(null)

    await expect(new ClaudeAIProvider().evaluate(sampleInput)).rejects.toThrow('API key not configured')
  })

  it('throws when messages.create rejects (network failure propagates)', async () => {
    mockCreate.mockRejectedValue(new Error('Connection refused'))

    await expect(new ClaudeAIProvider().evaluate(sampleInput)).rejects.toThrow('Connection refused')
  })

  it('throws when response contains a grade not in VALID_GRADES', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'GRADE: Outstanding\nRATIONALE: Great job.' }],
    })

    await expect(new ClaudeAIProvider().evaluate(sampleInput)).rejects.toThrow('Unexpected AI response format')
  })

  it('throws when response has no text content block', async () => {
    mockCreate.mockResolvedValue({ content: [] })

    await expect(new ClaudeAIProvider().evaluate(sampleInput)).rejects.toThrow(
      'Unexpected AI response format: no text content'
    )
  })

  it('throws when response content block is not type text', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'tool_use', id: 'tu_1', name: 'some_tool', input: {} }],
    })

    await expect(new ClaudeAIProvider().evaluate(sampleInput)).rejects.toThrow(
      'Unexpected AI response format: no text content'
    )
  })
})
