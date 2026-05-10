# Story 6.6: Real Claude API Integration

Status: done

## Story

As a manager,
I want the AI evaluation to use the real Claude API with my configured key,
so that I receive genuine, evidence-grounded grades and rationales from the AI.

## Acceptance Criteria

1. **Given** `src/main/ai/ClaudeAIProvider.ts` implements the `AIProvider` interface using `@anthropic-ai/sdk`
   **When** `evaluate(input)` is called
   **Then** it constructs a prompt that includes the employee's log entries, expected behaviors for **all four levels (A, B, C, D)**, and the employee's current level — then calls the Claude API and parses the response into `{ grade: Grade, rationale: string }`

2. **Given** the Claude prompt design
   **When** the AI responds
   **Then** the grade is constrained to one of the four valid values — the prompt explicitly lists the allowed grade strings and instructs the AI to select exactly one

3. **Given** the evidence is insufficient for a fair assessment (as judged by the AI)
   **When** the AI responds
   **Then** the grade returned is `'Insufficient Input'` with a rationale — the prompt instructs the AI to use this grade if the entries don't provide enough detail, without imposing a numeric threshold

4. **Given** a competency is selected and the user clicks "Run Evaluation"
   **When** any of the four levels (A, B, C, D) has no expected behaviors configured for that competency
   **Then** the IPC handler returns `{ ok: false, error: '...' }` prompting the user to configure all levels in the Competency Framework before evaluating

5. **Given** a competency is selected in the Evaluate tab
   **When** there are no behavior log entries tagged to that competency
   **Then** the "Run Evaluation" button is disabled (in addition to the empty-state message already shown)

6. **Given** the real API integration is active
   **When** an evaluation is run with real log entries and framework data
   **Then** the returned rationale references specific behaviors from the log entries — not a generic statement

## Tasks / Subtasks

- [x] Task 1: Extend `AIProvider.ts` interface — update `EvaluationInput` (AC: 1)
  - [x] 1.1: Remove `expectedBehaviors: string`
  - [x] 1.2: Add `allExpectedBehaviors: Record<CompetencyLevel, string>` (all four levels)
  - [x] 1.3: Add `employeeLevel: CompetencyLevel`
  - [x] 1.4: Import `CompetencyLevel` from `'../../shared/ipc-types'` (it is already in that file)

- [x] Task 2: Add `getAllExpectedBehaviors()` to `framework.ts` (AC: 1, 4)
  - [x] 2.1: Add `getAllExpectedBehaviors(competencyId: number): Record<CompetencyLevel, string>` using existing `getExpectedBehavior()` for each level
  - [x] 2.2: Export the new function (it will be imported by `aiHandlers.ts`)

- [x] Task 3: Update `aiHandlers.ts` (AC: 1, 4)
  - [x] 3.1: Replace import of `getExpectedBehavior` with `getAllExpectedBehaviors` from `'../db/framework'`
  - [x] 3.2: After fetching `empRow`, call `getAllExpectedBehaviors(payload.competencyId)`
  - [x] 3.3: Check all four levels: if any level has an empty string, return `{ ok: false, error: '...' }` immediately (before calling the AI)
  - [x] 3.4: Pass `allExpectedBehaviors` and `employeeLevel: empRow.level` instead of `expectedBehaviors` to `aiProvider.evaluate()`

- [x] Task 4: Create `src/main/ai/ClaudeAIProvider.ts` (AC: 1, 2, 3, 6)
  - [x] 4.1: Import `Anthropic` from `@anthropic-ai/sdk`, `db` singleton from `'../db/database'`, `getApiKey` from `'../settings/apiKey'`
  - [x] 4.2: Implement no-arg constructor (matches `MockAIProvider` swap API)
  - [x] 4.3: In `evaluate()`, call `getApiKey(db!)` and throw if null
  - [x] 4.4: Instantiate `new Anthropic({ apiKey, maxRetries: 0 })` per call
  - [x] 4.5: Build multi-level prompt using the exact structure in Dev Notes
  - [x] 4.6: Call `client.messages.create({ model: input.model, max_tokens: 1024, messages: [...] })`
  - [x] 4.7: Guard `block.type === 'text'`, parse `GRADE:` / `RATIONALE:` with regex
  - [x] 4.8: Validate parsed grade against `VALID_GRADES`; throw on parse or validation failure

- [x] Task 5: Update `EmployeeDetail.tsx` — disable Run Evaluation button when no entries (AC: 5)
  - [x] 5.1: On the Run Evaluation `<Button>`, change `disabled={isEvaluating}` to `disabled={isEvaluating || entries.length === 0}`

- [x] Task 6: Swap provider in `src/main/index.ts` (architectural boundary)
  - [x] 6.1: Replace `import { MockAIProvider } from './ai/MockAIProvider'` with `import { ClaudeAIProvider } from './ai/ClaudeAIProvider'`
  - [x] 6.2: Replace `new MockAIProvider()` with `new ClaudeAIProvider()`
  - [x] 6.3: Update the inline comment from "Story 6.5" to "Story 6.6"

- [x] Task 7: Create `__tests__/main/ai/ClaudeAIProvider.test.ts` (AC: 1, 2, 3)
  - [x] 7.1: Mock `@anthropic-ai/sdk`, `getApiKey`, and the `db` singleton
  - [x] 7.2: Test: returns `{ grade, rationale }` for a valid formatted API response
  - [x] 7.3: Test: throws when `getApiKey` returns null
  - [x] 7.4: Test: throws when `messages.create` rejects (propagates to `aiHandlers.ts` catch)
  - [x] 7.5: Test: parses `'Insufficient Input'` grade correctly
  - [x] 7.6: Test: throws when response contains a grade not in `VALID_GRADES`

- [x] Task 8: Update CSP in `src/renderer/index.html` (Deferred from Story 1.1)
  - [x] 8.1: Add `connect-src https://api.anthropic.com` to the CSP `content` attribute

### Review Findings

- [x] [Review][Patch] Whitespace-only expected behaviors bypass unconfigured level guard [aiHandlers.ts, unconfigured filter]
- [x] [Review][Patch] Empty rationale accepted silently — parseResponse does not validate rationale is non-empty [ClaudeAIProvider.ts, parseResponse]
- [x] [Review][Dismiss] RATIONALE regex over-captures — dismissed, low probability in practice
- [x] [Review][Patch] GRADE regex can match embedded `GRADE:` lines in rationale (multiline `^` match) [ClaudeAIProvider.ts, parseResponse]
- [x] [Review][Dismiss] rawGrade not normalized — dismissed, model reliably follows casing/format instructions
- [x] [Review][Patch] `db!` non-null assertion gives opaque TypeError if ClaudeAIProvider called before DB init [ClaudeAIProvider.ts:76]
- [x] [Review][Patch] Button enabled with stale entries during async competency switch — isLoading not in disabled condition [EmployeeDetail.tsx:183]
- [x] [Review][Patch] No test for non-text content block (tool_use) — type !== 'text' guard path untested [ClaudeAIProvider.test.ts]
- [x] [Review][Defer] getAllExpectedBehaviors null→'' coercion loses null/empty distinction [framework.ts] — deferred, pre-existing
- [x] [Review][Defer] listEntries/getAllExpectedBehaviors called when db is null — caught by outer try/catch [aiHandlers.ts] — deferred, pre-existing
- [x] [Review][Defer] listEntries called before behavior config validation — performance only [aiHandlers.ts] — deferred, pre-existing
- [x] [Review][Defer] buildPrompt prompt injection via raw entry descriptions [ClaudeAIProvider.ts] — deferred, trusted-user design decision
- [x] [Review][Defer] Entries with empty description silently included in prompt [ClaudeAIProvider.ts] — deferred, pre-existing data quality concern
- [x] [Review][Defer] Competency switch does not clear entries before new fetch completes [EmployeeDetail.tsx] — deferred, pre-existing UX pattern
- [x] [Review][Defer] timeoutHandle potentially uninitialized per TypeScript strict mode [aiHandlers.ts] — deferred, pre-existing, not changed in this story
- [x] [Review][Defer] Test mock binds messages as instance property — low severity fragility [ClaudeAIProvider.test.ts] — deferred, pre-existing pattern

## Dev Notes

### AIProvider.ts — Updated EvaluationInput

**File**: `src/main/ai/AIProvider.ts` (MODIFY)

```typescript
import type { Grade, BehaviorLogEntry, CompetencyLevel } from '../../shared/ipc-types'

export interface EvaluationInput {
  entries: BehaviorLogEntry[]
  allExpectedBehaviors: Record<CompetencyLevel, string>  // behaviors for levels A, B, C, D
  employeeLevel: CompetencyLevel                          // employee's current level
  model: string
}

export interface EvaluationResult {
  grade: Grade
  rationale: string
}

export interface AIProvider {
  evaluate(input: EvaluationInput): Promise<EvaluationResult>
}
```

`CompetencyLevel` is already defined in `ipc-types.ts` as `'A' | 'B' | 'C' | 'D'`.

### framework.ts — New getAllExpectedBehaviors Function

**File**: `src/main/db/framework.ts` (MODIFY — add one function)

Add below `getExpectedBehavior`:

```typescript
export function getAllExpectedBehaviors(competencyId: number): Record<CompetencyLevel, string> {
  const levels: CompetencyLevel[] = ['A', 'B', 'C', 'D']
  return Object.fromEntries(
    levels.map((level) => [level, getExpectedBehavior(competencyId, level) ?? ''])
  ) as Record<CompetencyLevel, string>
}
```

No new DB connection or imports needed — reuses existing `getExpectedBehavior()` and the `CompetencyLevel` import already at the top of the file.

### aiHandlers.ts — Updated Evaluation Handler

**File**: `src/main/handlers/aiHandlers.ts` (MODIFY)

Replace import:
```typescript
// REMOVE:
import { getExpectedBehavior } from '../db/framework'
// ADD:
import { getAllExpectedBehaviors } from '../db/framework'
```

Replace the behavior-fetching and AI-call block inside the `'ai:evaluate'` handler:
```typescript
// REMOVE:
const expectedBehaviors = getExpectedBehavior(payload.competencyId, empRow.level) ?? ''
// ...
const result = await Promise.race([
  aiProvider.evaluate({ entries, expectedBehaviors, model }),
  timeoutPromise
])

// ADD:
const allExpectedBehaviors = getAllExpectedBehaviors(payload.competencyId)
const unconfigured = (['A', 'B', 'C', 'D'] as const).filter((l) => !allExpectedBehaviors[l])
if (unconfigured.length > 0) {
  return {
    ok: false,
    error: `Expected behaviors not configured for level(s): ${unconfigured.join(', ')}. ` +
           `Please configure all levels in the Competency Framework before evaluating.`
  }
}
// ...
const result = await Promise.race([
  aiProvider.evaluate({ entries, allExpectedBehaviors, employeeLevel: empRow.level, model }),
  timeoutPromise
])
```

The `entries`, `model`, timeout setup, catch block, and all other handler logic remain unchanged.

### ClaudeAIProvider — Full Implementation Spec

**File**: `src/main/ai/ClaudeAIProvider.ts` (NEW — parallel to `MockAIProvider.ts`)

**Why no constructor args**: same `db` singleton pattern as `aiHandlers.ts` — keeps the `index.ts` swap to import + instantiation lines only.

```typescript
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

export class ClaudeAIProvider implements AIProvider {
  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const apiKey = getApiKey(db!)
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
```

**Why `maxRetries: 0`**: the 30-second `Promise.race` in `aiHandlers.ts` owns failure timing. SDK retries with exponential backoff would silently extend the effective timeout beyond 30 seconds.

### Prompt Structure (exact format the parser depends on)

```typescript
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
RATIONALE: <2–4 sentences justifying your grade, indicating how the logged behaviors compare to the framework expectations>`
}
```

**Key design decisions**:
- No defensive fallbacks in the prompt — entries are guaranteed non-empty (button disabled otherwise) and all level behaviors are guaranteed non-empty (handler validates before calling AI). The prompt can trust the data it receives.
- The AI decides independently whether evidence is sufficient — no numeric threshold is imposed.
- All four levels are shown so the AI can determine if the employee is operating below, at, or above their current level.
- The employee's level is stated twice (intro + instructions) so the AI keeps it in focus while reading the framework.

### Response Parsing

```typescript
function parseResponse(text: string): EvaluationResult {
  const gradeMatch = text.match(/^GRADE:\s*(.+)$/m)
  const rationaleMatch = text.match(/^RATIONALE:\s*([\s\S]+)$/m)

  const rawGrade = gradeMatch?.[1]?.trim()
  const rationale = rationaleMatch?.[1]?.trim() ?? ''

  if (!rawGrade || !VALID_GRADES.includes(rawGrade as Grade)) {
    throw new Error(
      `Unexpected AI response format. Received grade: "${rawGrade ?? '(none)'}". ` +
      `Expected one of: ${VALID_GRADES.join(', ')}`
    )
  }

  return { grade: rawGrade as Grade, rationale }
}
```

### EmployeeDetail.tsx — Button Disable Change

**File**: `src/renderer/src/views/EmployeeDetail.tsx` (MODIFY — one prop change)

Line ~183, the Run Evaluation button:
```tsx
// BEFORE:
disabled={isEvaluating}

// AFTER:
disabled={isEvaluating || entries.length === 0}
```

`entries` comes from `useBehaviorLog()` and is already filtered to the selected competency when `activeTab === 1`. When `entries.length === 0` and the competency is selected, the empty-state card is already shown below the chip row — this change additionally disables the button, preventing a click that would immediately return an error from `aiHandlers.ts`.

Note: `entries` starts as `[]` before the data loads, so the button is also briefly disabled during initial load. This is acceptable — it enables as soon as entries arrive.

### index.ts Swap — Only These Lines Change

```typescript
// BEFORE:
import { MockAIProvider } from './ai/MockAIProvider'
// Swap MockAIProvider → ClaudeAIProvider here at Story 6.5 integration time — no other files change
const aiProvider: AIProvider = new MockAIProvider()

// AFTER:
import { ClaudeAIProvider } from './ai/ClaudeAIProvider'
// ClaudeAIProvider wired in Story 6.6
const aiProvider: AIProvider = new ClaudeAIProvider()
```

### Error Handling Contract

`ClaudeAIProvider.evaluate()` throws on:
- No API key → `Error('API key not configured. Please set your Claude API key in Settings.')`
- SDK network/auth error → SDK error propagates unchanged
- Response parse/validate failure → `Error('Unexpected AI response format...')`

`aiHandlers.ts` catches all throws and returns `{ ok: false, error: message }`.

`aiHandlers.ts` itself returns `{ ok: false, error: '...' }` (without calling AI) when any expected behavior level is unconfigured.

**Never** return `'Insufficient Input'` as an error — it must always be `{ grade: 'Insufficient Input', rationale: '...' }` inside a successful `EvaluationResult`.

### Test File

**File**: `__tests__/main/ai/ClaudeAIProvider.test.ts` (NEW — parallel to `MockAIProvider.test.ts`)

Follow vitest conventions from `MockAIProvider.test.ts`. The `sampleInput` must use the new `EvaluationInput` shape:

```typescript
const sampleInput: EvaluationInput = {
  entries: [
    { id: 1, employeeId: 1, description: 'Led team standup', entryDate: '2026-05-01',
      createdAt: '2026-05-01T10:00:00', competencies: [] }
  ],
  allExpectedBehaviors: {
    A: 'Participates in communication.',
    B: 'Communicates clearly.',
    C: 'Facilitates team discussions.',
    D: 'Drives org-wide communication initiatives.',
  },
  employeeLevel: 'B',
  model: 'claude-haiku-4-5-20251001',
}
```

Mock setup (three modules):
```typescript
vi.mock('@anthropic-ai/sdk', () => {
  const create = vi.fn()
  const Anthropic = vi.fn(() => ({ messages: { create } }))
  return { default: Anthropic }
})
vi.mock('../../../src/main/settings/apiKey', () => ({ getApiKey: vi.fn() }))
vi.mock('../../../src/main/db/database', () => ({ db: {} }))
```

Happy-path mock response:
```typescript
{
  content: [{ type: 'text', text: 'GRADE: Meets Expectations\nRATIONALE: The employee led the standup effectively.' }]
}
```

### Anthropic SDK API (`@anthropic-ai/sdk` v0.91.x — already in package.json)

```typescript
import Anthropic from '@anthropic-ai/sdk'  // default export is the client class

const client = new Anthropic({ apiKey: string, maxRetries: number })
const message = await client.messages.create({
  model: string,   // 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6'
  max_tokens: number,
  messages: [{ role: 'user', content: string }]
})
// message.content: Array<{ type: 'text', text: string } | { type: 'tool_use', ... }>
// For plain text requests, content[0].type is always 'text'
```

Do NOT add `@anthropic-ai/sdk` to `package.json` — it is already installed.

### CSP Current State

`src/renderer/index.html` currently:
```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:
```

Add `connect-src https://api.anthropic.com`:
```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src https://api.anthropic.com
```

Note: API calls are main-process only, so this does not gate actual requests — it documents the external connection and prevents future renderer-direct calls from being invisible.

### Deferred Items — Out of Scope for This Story

These packaging concerns belong in Story 6.7:
- `appId: com.electron.app` template default
- `electronApp.setAppUserModelId('com.electron')` mismatch with appId
- `notarize: false` in `electron-builder.yml`

### Project Structure Notes

**New files:**
- `src/main/ai/ClaudeAIProvider.ts`
- `__tests__/main/ai/ClaudeAIProvider.test.ts`

**Modified files:**
- `src/main/ai/AIProvider.ts` — updated `EvaluationInput` interface
- `src/main/db/framework.ts` — new `getAllExpectedBehaviors()` function
- `src/main/handlers/aiHandlers.ts` — multi-level fetch + unconfigured-levels guard + updated evaluate call
- `src/main/index.ts` — import + instantiation swap
- `src/renderer/src/views/EmployeeDetail.tsx` — button `disabled` prop
- `src/renderer/index.html` — CSP

**Unchanged:** all other files, including `MockAIProvider.ts`, `ipc-types.ts`, all other renderer components.

### References

- [architecture.md — AIProvider interface, boundary, IPC handler pattern](_bmad-output/planning-artifacts/architecture.md)
- [epics.md — Story 6.6 acceptance criteria](_bmad-output/planning-artifacts/epics.md)
- [deferred-work.md — CSP (Story 1.1), ClaudeAIProvider instantiation note (Story 1.4)](_bmad-output/implementation-artifacts/deferred-work.md)
- [AIProvider.ts — current interface](sdd-app/src/main/ai/AIProvider.ts)
- [aiHandlers.ts — timeout, error wrapping, handler structure](sdd-app/src/main/handlers/aiHandlers.ts)
- [framework.ts — getExpectedBehavior() to reuse in getAllExpectedBehaviors()](sdd-app/src/main/db/framework.ts)
- [EmployeeDetail.tsx — Run Evaluation button location (line ~183)](sdd-app/src/renderer/src/views/EmployeeDetail.tsx)
- [MockAIProvider.test.ts — test file pattern to follow](sdd-app/__tests__/main/ai/MockAIProvider.test.ts)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Vitest mock for `@anthropic-ai/sdk`: arrow functions are not constructable with `new`. Fixed by using an anonymous class in the `vi.mock` factory instead of `vi.fn(() => ...)`. Mock functions created via `vi.hoisted` (`mockCreate`, `mockGetApiKey`) are captured at field-assignment time by the class, so they remain writable across `beforeEach` `vi.clearAllMocks()` calls.

### Completion Notes List

- `AIProvider.ts` `EvaluationInput` now carries `allExpectedBehaviors: Record<CompetencyLevel, string>` and `employeeLevel: CompetencyLevel` instead of `expectedBehaviors: string`. All consumers updated.
- `framework.ts` gained `getAllExpectedBehaviors()` reusing existing `getExpectedBehavior()` four times — no new DB connection or imports.
- `aiHandlers.ts` validates all four levels are non-empty before calling the AI; returns a clear error message if any are missing. Employee level is forwarded to `evaluate()`.
- `ClaudeAIProvider.ts` uses `new Anthropic({ apiKey, maxRetries: 0 })` per call (always uses current key; `maxRetries: 0` defers timeout control to the existing 30s `Promise.race` in the handler). Prompt shows all four level descriptions; AI decides independently whether evidence is sufficient.
- `EmployeeDetail.tsx` Run Evaluation button now also disabled when `entries.length === 0`.
- `index.ts` swap: two lines changed (import + instantiation).
- 8 new `ClaudeAIProvider` tests — all 90 tests pass, 0 regressions.

### File List

- `sdd-app/src/main/ai/AIProvider.ts` — modified (EvaluationInput interface)
- `sdd-app/src/main/ai/ClaudeAIProvider.ts` — created
- `sdd-app/src/main/db/framework.ts` — modified (getAllExpectedBehaviors added)
- `sdd-app/src/main/handlers/aiHandlers.ts` — modified (multi-level fetch + validation)
- `sdd-app/src/main/index.ts` — modified (provider swap)
- `sdd-app/src/renderer/src/views/EmployeeDetail.tsx` — modified (button disabled prop)
- `sdd-app/src/renderer/index.html` — modified (CSP connect-src)
- `sdd-app/__tests__/main/ai/ClaudeAIProvider.test.ts` — created
