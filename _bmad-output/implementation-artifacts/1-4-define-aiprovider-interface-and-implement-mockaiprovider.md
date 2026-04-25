# Story 1.4: Define AIProvider Interface and Implement MockAIProvider

Status: done

## Story

As a developer,
I want the AIProvider interface defined and a mock implementation wired in,
so that the full application can be built and tested end-to-end without depending on the real Claude API.

## Acceptance Criteria

1. `src/main/ai/AIProvider.ts` defines `evaluate(input: EvaluationInput): Promise<EvaluationResult>` where `EvaluationInput` has `entries: BehaviorLogEntry[]`, `expectedBehaviors: string`, and `model: string` fields, and `EvaluationResult` has `grade: Grade` and `rationale: string`.
2. `src/main/ai/MockAIProvider.ts` `evaluate()` returns `{ grade: 'Meets Expectations', rationale: '<non-empty string>' }` by default — no network calls made.
3. `MockAIProvider.ts` accepts an optional constructor parameter (`Grade`) to override the returned grade — enabling tests to cover all four Grade variants including `'Insufficient Input'`.
4. `src/main/index.ts` imports and instantiates `MockAIProvider` as the active `AIProvider` instance — swappable to `ClaudeAIProvider` by changing a single import and instantiation line with no other file changes.
5. `__tests__/main/ai/MockAIProvider.test.ts` passes with Vitest, covering all four Grade variants and verifying `EvaluationResult` shape.

## Tasks / Subtasks

- [x] Task 1: Create `src/main/ai/AIProvider.ts` — interface definitions (AC: 1)
  - [x] Import `Grade` and `BehaviorLogEntry` from `'../../shared/ipc-types'`
  - [x] Export `EvaluationInput` interface with `entries: BehaviorLogEntry[]`, `expectedBehaviors: string`, `model: string`
  - [x] Export `EvaluationResult` interface with `grade: Grade`, `rationale: string`
  - [x] Export `AIProvider` interface with `evaluate(input: EvaluationInput): Promise<EvaluationResult>`

- [x] Task 2: Create `src/main/ai/MockAIProvider.ts` — mock implementation (AC: 2, 3)
  - [x] Import `AIProvider`, `EvaluationInput`, `EvaluationResult` from `'./AIProvider'`
  - [x] Import `Grade` from `'../../shared/ipc-types'`
  - [x] Implement `class MockAIProvider implements AIProvider`
  - [x] Constructor accepts optional `grade: Grade = 'Meets Expectations'` parameter
  - [x] `evaluate()` returns `Promise.resolve({ grade: this.grade, rationale: '...' })` — no await, no network

- [x] Task 3: Set up Vitest and create first test (AC: 5)
  - [x] Create `vitest.config.ts` at `sdd-app/` root (see Dev Notes for exact config)
  - [x] Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to `package.json`
  - [x] Update `tsconfig.node.json` `include` array to add `"__tests__/main/**/*"`
  - [x] Create `__tests__/main/ai/MockAIProvider.test.ts` covering: default grade, all 4 variants, non-empty rationale, no network call

- [x] Task 4: Wire `MockAIProvider` in `src/main/index.ts` (AC: 4)
  - [x] Add at top of imports: `import type { AIProvider } from './ai/AIProvider'` and `import { MockAIProvider } from './ai/MockAIProvider'`
  - [x] Declare module-level constant before `createWindow` function: `const aiProvider: AIProvider = new MockAIProvider()`
  - [x] Add inside `app.whenReady()` after schema init success: `log.info('[ai] Provider:', aiProvider.constructor.name)`

- [x] Task 5: Typecheck and run tests (AC: 1–5)
  - [x] Run `npx tsc --noEmit -p tsconfig.node.json --composite false` from `sdd-app/` — zero errors
  - [x] Run `npm run test` from `sdd-app/` — all 5 tests pass

## Dev Notes

### CRITICAL: Import `Grade` and `BehaviorLogEntry` from `ipc-types.ts` — Do NOT Redefine

Both types are already exported from `src/shared/ipc-types.ts`. The `AIProvider` interface MUST import from there. Creating duplicate type definitions violates the shared contract.

```ts
// AIProvider.ts — exact imports
import type { Grade, BehaviorLogEntry } from '../../shared/ipc-types'
```

`BehaviorLogEntry` in `ipc-types.ts`:
```ts
interface BehaviorLogEntry {
  id: number; employeeId: number; description: string
  entryDate: string; createdAt: string; competencies: Competency[]
}
```

`Grade` in `ipc-types.ts`:
```ts
type Grade = 'Does Not Meet Expectations' | 'Meets Expectations' | 'Exceeds Expectations' | 'Insufficient Input'
```

### AIProvider.ts — Exact Implementation

Derived verbatim from `architecture.md` Gap Analysis — Gap 2:

```ts
import type { Grade, BehaviorLogEntry } from '../../shared/ipc-types'

export interface EvaluationInput {
  entries: BehaviorLogEntry[]    // behavior log entries filtered to one competency
  expectedBehaviors: string      // configured expected behavior text for this competency + level
  model: string                  // 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6'
}

export interface EvaluationResult {
  grade: Grade                   // 'Insufficient Input' is a valid outcome, NOT an error
  rationale: string
}

export interface AIProvider {
  evaluate(input: EvaluationInput): Promise<EvaluationResult>
  // Throws on API failure — aiHandlers.ts catches and wraps as { ok: false, error }
  // 'Insufficient Input' returned as EvaluationResult.grade, never thrown
}
```

### MockAIProvider.ts — Exact Implementation

```ts
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
```

### CRITICAL: index.ts Modification — Module-Level Declaration Pattern

Declare `aiProvider` at **module level** (before `createWindow`), not inside `app.whenReady()`. Story 1.5 will call `registerAiHandlers(aiProvider)` from inside `app.whenReady()`, so module-level scope makes it available there. The explicit `AIProvider` type annotation enforces interface compliance at compile time for both `MockAIProvider` and future `ClaudeAIProvider`.

Add these two imports at the top of `index.ts` (after existing imports):
```ts
import type { AIProvider } from './ai/AIProvider'
import { MockAIProvider } from './ai/MockAIProvider'
```

Add this constant at module level, before the `createWindow` function definition:
```ts
// Swap MockAIProvider → ClaudeAIProvider here at Story 6.5 integration time — no other files change
const aiProvider: AIProvider = new MockAIProvider()
```

Add inside `app.whenReady()`, immediately after the `initializeSchema()` try/catch block:
```ts
log.info('[ai] Provider:', aiProvider.constructor.name)
```

This line both documents which provider is active and prevents the TypeScript "unused variable" warning until handlers use `aiProvider` in Story 1.5.

**Current `src/main/index.ts` state** (from Story 1.3): imports `app`, `shell`, `BrowserWindow`, `electronApp`, `optimizer`, `is`, `icon`, `electron-log/main`, `initializeSchema`, `db` — calls `initializeSchema()` in `app.whenReady()` before `createWindow()`, closes db on `before-quit`.

### Vitest Config — First Test in Project

Vitest `^4.1.5` is already installed but has no config. This story creates the project-wide config.

**`sdd-app/vitest.config.ts`** (create at root alongside `electron.vite.config.ts`):
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // renderer tests add // @vitest-environment jsdom per-file when needed (Story 6.6)
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
  }
})
```

**`package.json` scripts** — add alongside existing scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**`tsconfig.node.json` include** — add `__tests__/main/**/*` so TypeScript covers test files:
```json
"include": [
  "electron.vite.config.*",
  "src/main/**/*",
  "src/preload/**/*",
  "src/shared/**/*",
  "__tests__/main/**/*"
]
```

### MockAIProvider.test.ts — Exact Test Structure

```ts
import { describe, it, expect } from 'vitest'
import { MockAIProvider } from '../../../src/main/ai/MockAIProvider'
import type { EvaluationInput } from '../../../src/main/ai/AIProvider'

const sampleInput: EvaluationInput = {
  entries: [],
  expectedBehaviors: 'Shows clear communication in meetings.',
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
})
```

### What This Story Does NOT Do

- Does NOT register `ipcMain.handle('ai:evaluate', ...)` — Story 1.5 scaffolds handler files, Story 6.2 implements the evaluation logic
- Does NOT implement `ClaudeAIProvider.ts` — Story 6.5
- Does NOT create any renderer components, hooks, or UI
- Does NOT modify `src/preload/index.ts` — Story 1.5 rewrites it
- Does NOT create `src/main/handlers/aiHandlers.ts` — Story 1.5

### Project Structure Notes

- **Working directory for all commands:** `sdd-app/` (`c:\Users\Diego\Documents\Diego\Claude\SDD\sdd-app\`)
- **New directories to create:** `sdd-app/src/main/ai/` and `sdd-app/__tests__/main/ai/`
- **New files:** `src/main/ai/AIProvider.ts`, `src/main/ai/MockAIProvider.ts`, `vitest.config.ts`, `__tests__/main/ai/MockAIProvider.test.ts`
- **Modified files:** `src/main/index.ts`, `package.json`, `tsconfig.node.json`
- Import path from `AIProvider.ts` to `ipc-types.ts`: `'../../shared/ipc-types'`
- Import path from `MockAIProvider.ts` to `AIProvider.ts`: `'./AIProvider'`
- Import path from `index.ts` to `AIProvider.ts`: `'./ai/AIProvider'`
- Import path from test to source: `'../../../src/main/ai/MockAIProvider'`

### References

- [epics.md#Story 1.4] — acceptance criteria source
- [architecture.md#Gap Analysis Results — Gap 2] — exact `AIProvider` interface field names
- [architecture.md#Architectural Boundaries — AIProvider Boundary] — "swap at `index.ts`, no other files change"
- [architecture.md#Project Structure — Complete Directory Structure] — `src/main/ai/` file list
- [architecture.md#Infrastructure & Deployment — Testing] — Vitest setup, `__tests__/` mirroring
- [architecture.md#Implementation Patterns — Naming Patterns] — TypeScript `PascalCase` interface names
- [1-3-initialize-sqlite-database-with-schema-on-startup.md#Dev Notes] — `electron-log/main` pattern, log format, working directory, typecheck commands
- [src/shared/ipc-types.ts] — `Grade`, `BehaviorLogEntry`, `Competency` already defined here
- AR4 (epics.md) — scope: AIProvider interface + MockAIProvider with fixed-response returns for all four Grade variants
- AR10 (epics.md) — Vitest, `__tests__/` structure

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — clean first pass.

### Completion Notes List

- Created `sdd-app/src/main/ai/AIProvider.ts`: exports `EvaluationInput`, `EvaluationResult`, and `AIProvider` interface, importing `Grade` and `BehaviorLogEntry` from `src/shared/ipc-types.ts` (no duplicate type definitions).
- Created `sdd-app/src/main/ai/MockAIProvider.ts`: implements `AIProvider`, constructor accepts optional `Grade` defaulting to `'Meets Expectations'`, `evaluate()` resolves synchronously with no network calls — all four grade variants testable.
- Created `sdd-app/vitest.config.ts`: project-wide Vitest config with `environment: 'node'`, includes `__tests__/**/*.test.ts` and `.tsx` (renderer tests can override per-file with `@vitest-environment jsdom`).
- Updated `sdd-app/package.json`: added `"test": "vitest run"` and `"test:watch": "vitest"` scripts.
- Updated `sdd-app/tsconfig.node.json`: added `"__tests__/main/**/*"` to `include` so TypeScript type-checks test files.
- Created `sdd-app/__tests__/main/ai/MockAIProvider.test.ts`: 5 tests — default grade, all 4 grade variants, timing assertion. All pass (`5 passed (5)`, 136ms).
- Updated `sdd-app/src/main/index.ts`: added `AIProvider` and `MockAIProvider` imports; declared module-level `const aiProvider: AIProvider = new MockAIProvider()` before `createWindow`; added `log.info('[ai] Provider:', aiProvider.constructor.name)` after schema init.
- TypeScript check (`tsconfig.node.json`) passes with zero errors.

### File List

- `sdd-app/src/main/ai/AIProvider.ts` (created)
- `sdd-app/src/main/ai/MockAIProvider.ts` (created)
- `sdd-app/vitest.config.ts` (created)
- `sdd-app/__tests__/main/ai/MockAIProvider.test.ts` (created)
- `sdd-app/src/main/index.ts` (modified)
- `sdd-app/package.json` (modified)
- `sdd-app/tsconfig.node.json` (modified)

### Review Findings

- [x] [Review][Defer] Timing assertion is environment-sensitive — `Date.now()` delta may be flaky under CI load; spec-mandated pattern, acceptable for in-process mock [`sdd-app/__tests__/main/ai/MockAIProvider.test.ts:34-38`] — deferred, pre-existing
- [x] [Review][Defer] `aiProvider.constructor.name` returns empty string in minified Electron builds — informational log only, low risk [`sdd-app/src/main/index.ts`] — deferred, pre-existing
- [x] [Review][Defer] `EvaluationInput.expectedBehaviors` accepts empty string — no validation at interface boundary; real provider must guard against this [`sdd-app/src/main/ai/AIProvider.ts:4`] — deferred, pre-existing
- [x] [Review][Defer] `aiProvider` instantiated at module-load before `app.whenReady()` — trivially safe with MockAIProvider; risk surfaces at Story 6.5 when ClaudeAIProvider may access `app.getPath()` [`sdd-app/src/main/index.ts:11`] — deferred, pre-existing
