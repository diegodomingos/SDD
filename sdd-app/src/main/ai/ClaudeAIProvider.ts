import Anthropic from '@anthropic-ai/sdk'
import log from 'electron-log/main'
import { getApiKey } from '../settings/apiKey'
import { db } from '../db/database'
import type { AIProvider, EvaluationInput, EvaluationResult } from './AIProvider'
import type { Grade } from '../../shared/ipc-types'

const VALID_GRADES: readonly Grade[] = [
  'Does Not Meet Expectations',
  'Meets Expectations',
  'Exceeds Expectations',
  'Insufficient Input',
]

function buildPrompt(input: EvaluationInput): string {
  const entriesText = input.entries
    .map((e, i) => `${i + 1}. [${e.entryDate}] ${e.description}`)
    .join('\n')

  return `You are evaluating an employee's competency performance based on their behavior log entries.

The employee is currently at **Level ${input.employeeLevel}**.

## Behavior Log Entries
${entriesText}

## Competency Framework — Expected Behaviors by Level
**Level A:**
${input.allExpectedBehaviors.A}

**Level B:**
${input.allExpectedBehaviors.B}

**Level C:**
${input.allExpectedBehaviors.C}

**Level D:**
${input.allExpectedBehaviors.D}

## Instructions
Compare the employee's behavior log entries against the competency framework above.
Consider how the observed behaviors align with all levels, keeping in mind that the employee is currently at Level ${input.employeeLevel}.

Assign exactly ONE of these grades (copy the text exactly — spelling and casing must match):
- Does Not Meet Expectations
- Meets Expectations
- Exceeds Expectations
- Insufficient Input

Use "Insufficient Input" if the log entries do not provide enough detail to assess the employee's competency level fairly.

Respond ONLY in this exact format with no other text before or after:
GRADE: <one exact grade from the list above>
RATIONALE: <2–4 sentences referencing specific log entries and how they compare to the framework expectations>`
}

function parseResponse(text: string): EvaluationResult {
  const gradeMatch = text.match(/^GRADE:\s*(.+)/)
  const rationaleMatch = text.match(/^RATIONALE:\s*([\s\S]+)$/m)

  const rawGrade = gradeMatch?.[1]?.trim()
  const rationale = rationaleMatch?.[1]?.trim() ?? ''

  if (!rawGrade || !VALID_GRADES.includes(rawGrade as Grade)) {
    throw new Error(
      `Unexpected AI response format. Received grade: "${rawGrade ?? '(none)'}". ` +
      `Expected one of: ${VALID_GRADES.join(', ')}`
    )
  }

  if (!rationale) {
    throw new Error('Unexpected AI response format: missing or empty RATIONALE.')
  }

  return { grade: rawGrade as Grade, rationale }
}

export class ClaudeAIProvider implements AIProvider {
  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    if (!db) throw new Error('Database not initialized.')
    const apiKey = getApiKey(db)
    if (!apiKey) {
      throw new Error('API key not configured. Please set your Claude API key in Settings.')
    }

    const client = new Anthropic({ apiKey, maxRetries: 0 })
    const prompt = buildPrompt(input)

    log.info('[ClaudeAIProvider] evaluate model=%s entries=%d level=%s',
      input.model, input.entries.length, input.employeeLevel)

    const message = await client.messages.create({
      model: input.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const block = message.content[0]
    if (!block || block.type !== 'text') {
      throw new Error('Unexpected AI response format: no text content in response.')
    }

    return parseResponse(block.text)
  }
}
