# Story 1.2: Define IPC Contract and Shared Types

Status: done

## Story

As a developer,
I want a single shared file defining all IPC types and the discriminated union response format,
so that both the main process and renderer have type-safe, consistent IPC channel definitions with no duplication.

## Acceptance Criteria

1. `src/shared/ipc-types.ts` exists and is importable by main and renderer; `IpcResult<T>` resolves to `{ ok: true; data: T } | { ok: false; error: string }` — callers must check `ok` before accessing `data`.
2. `ipc-types.ts` defines `Grade` as the exact string union: `'Does Not Meet Expectations' | 'Meets Expectations' | 'Exceeds Expectations' | 'Insufficient Input'` — only these four values are accepted.
3. `ipc-types.ts` defines `Competency`, `Employee`, `BehaviorLogEntry`, `EvaluateResult`, `CompetencyLevel`, and all channel payload types — no inline type definitions duplicated in any other file.
4. `src/renderer/src/env.d.ts` is updated to declare the `Window` interface extension so that `window.electronAPI.invoke(channel, payload)` resolves as `Promise<IpcResult<T>>` with no `any` warnings under `tsconfig.web.json`.

## Tasks / Subtasks

- [x] Task 1: Create `src/shared/ipc-types.ts` (AC: 1, 2, 3)
  - [x] Delete `src/shared/.gitkeep` (the placeholder created in Story 1.1)
  - [x] Create `src/shared/ipc-types.ts` with all types listed in Dev Notes below — copy the exact code block
  - [x] Run `npx tsc --noEmit -p tsconfig.node.json` — zero errors required

- [x] Task 2: Update `src/renderer/src/env.d.ts` to declare `window.electronAPI` type (AC: 4)
  - [x] Update the EXISTING file at `sdd-app/src/renderer/src/env.d.ts` — do NOT create a new file
  - [x] Keep the existing `/// <reference types="vite/client" />` line
  - [x] Add the `Window` interface extension block — copy exact code from Dev Notes below
  - [x] Import path from `src/renderer/src/env.d.ts` to `src/shared/ipc-types.ts` is `../../shared/ipc-types` (two levels up)
  - [x] Run `npx tsc --noEmit -p tsconfig.web.json` — zero errors required

- [x] Task 3: Full typecheck (AC: 1–4)
  - [x] Run: `npx tsc --noEmit -p tsconfig.json && npx tsc --noEmit -p tsconfig.node.json && npx tsc --noEmit -p tsconfig.web.json`
  - [x] All three must pass with zero errors

## Dev Notes

### CRITICAL: Exact File Location — Architecture vs. Scaffold Mismatch

The architecture document says `src/renderer/env.d.ts` but the **actual scaffold** placed and registered the env file at **`src/renderer/src/env.d.ts`**. `tsconfig.web.json` explicitly includes `src/renderer/src/env.d.ts`. Update the file at **`src/renderer/src/env.d.ts`** — do not create a second env file elsewhere.

### CRITICAL: `window.electronAPI` Is Type-Only in This Story

The preload (`src/preload/index.ts`) currently exposes `window.electron` and `window.api` — **NOT** `window.electronAPI`. This story only adds the TypeScript type declaration. Runtime wiring of `window.electronAPI` happens in Story 1.5. Do not attempt to call `window.electronAPI.invoke()` from the renderer yet — it will throw at runtime until Story 1.5 is complete.

### What This Story Does NOT Do

- Does NOT modify `src/preload/index.ts` — Story 1.5 rewrites the preload
- Does NOT register any `ipcMain.handle` — Stories 1.3–1.6 add those
- Does NOT implement any React components or UI — later epics
- Does NOT touch `src/main/index.ts`

### `src/shared/ipc-types.ts` — Complete Implementation

**CRITICAL:** This file must have ZERO imports. It defines primitive types only. No imports from `electron`, Node.js modules, or any other file. Adding any import will break either the main process or renderer compilation.

Create this file exactly:

```ts
// ─── Core discriminated union ────────────────────────────────────────────────

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string }

// ─── Domain enums ────────────────────────────────────────────────────────────

export type CompetencyLevel = 'A' | 'B' | 'C' | 'D'

export type Grade =
  | 'Does Not Meet Expectations'
  | 'Meets Expectations'
  | 'Exceeds Expectations'
  | 'Insufficient Input'

// ─── Entity types (camelCase; snake_case→camelCase mapping done in repository layer) ──

export interface Employee {
  id: number
  name: string
  level: CompetencyLevel
  createdAt: string // ISO 8601 datetime string
}

export interface Competency {
  id: number
  name: string // 'Communication' | 'Client Focus' | 'Proactivity' | 'Teamwork'
}

export interface BehaviorLogEntry {
  id: number
  employeeId: number
  description: string
  entryDate: string    // ISO 8601 date string e.g. '2026-04-25'
  createdAt: string    // ISO 8601 datetime string
  competencies: Competency[]
}

export interface EvaluateResult {
  grade: Grade
  rationale: string
}

// ─── IPC channel payload types ───────────────────────────────────────────────
// One interface per channel that accepts input. Channels with no payload
// (list, get-key-configured, get-model, get-manager-name) take no argument.

// employee:*
export interface CreateEmployeePayload {
  name: string
  level: CompetencyLevel
}

export interface UpdateEmployeePayload {
  id: number
  name: string
  level: CompetencyLevel
}

export interface DeleteEmployeePayload {
  id: number
}

// behavior-log:*
export interface ListBehaviorLogPayload {
  employeeId: number
  competencyId?: number // omit to return all entries for the employee
}

export interface CreateBehaviorLogPayload {
  employeeId: number
  description: string
  competencyIds: number[]
  entryDate: string // ISO 8601 date string
}

export interface UpdateBehaviorLogPayload {
  id: number
  description: string
  competencyIds: number[]
  entryDate: string // ISO 8601 date string
}

export interface DeleteBehaviorLogPayload {
  id: number
}

// expected-behavior:*
export interface GetExpectedBehaviorPayload {
  competencyId: number
  level: CompetencyLevel
}

export interface SetExpectedBehaviorPayload {
  competencyId: number
  level: CompetencyLevel
  description: string
}

// ai:*
export interface EvaluatePayload {
  employeeId: number
  competencyId: number
}

// settings:*
export interface SetApiKeyPayload {
  key: string
}

export interface SetModelPayload {
  model: string // 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6'
}

export interface SetManagerNamePayload {
  name: string
}
```

### `src/renderer/src/env.d.ts` — Updated File

Replace the entire file with:

```ts
/// <reference types="vite/client" />

import type { IpcResult } from '../../shared/ipc-types'

declare global {
  interface Window {
    electronAPI: {
      invoke<T>(channel: string, payload?: unknown): Promise<IpcResult<T>>
    }
  }
}
```

### IPC Channel Reference (All 16 Channels)

Every channel defined in the architecture — reference when writing handlers in later stories:

| Channel | Payload type | Response `data` type |
|---|---|---|
| `employee:list` | _(none)_ | `Employee[]` |
| `employee:create` | `CreateEmployeePayload` | `Employee` |
| `employee:update` | `UpdateEmployeePayload` | `Employee` |
| `employee:delete` | `DeleteEmployeePayload` | `null` |
| `behavior-log:list` | `ListBehaviorLogPayload` | `BehaviorLogEntry[]` |
| `behavior-log:create` | `CreateBehaviorLogPayload` | `BehaviorLogEntry` |
| `behavior-log:update` | `UpdateBehaviorLogPayload` | `BehaviorLogEntry` |
| `behavior-log:delete` | `DeleteBehaviorLogPayload` | `null` |
| `competency:list` | _(none)_ | `Competency[]` |
| `expected-behavior:get` | `GetExpectedBehaviorPayload` | `string \| null` |
| `expected-behavior:set` | `SetExpectedBehaviorPayload` | `string` |
| `ai:evaluate` | `EvaluatePayload` | `EvaluateResult` |
| `settings:get-key-configured` | _(none)_ | `boolean` |
| `settings:set-api-key` | `SetApiKeyPayload` | `null` |
| `settings:get-model` | _(none)_ | `string` |
| `settings:set-model` | `SetModelPayload` | `null` |
| `settings:get-manager-name` | _(none)_ | `string` |
| `settings:set-manager-name` | `SetManagerNamePayload` | `null` |

### TypeScript Process Separation (Reminder from Story 1.1)

`src/shared/` is already included in both tsconfigs — **no tsconfig changes required**:
- `tsconfig.node.json` includes `"src/shared/**/*"` — main/preload can import ✅
- `tsconfig.web.json` includes `"src/shared/**/*"` — renderer can import ✅

Import path from main process: `import type { IpcResult } from '../../shared/ipc-types'`
Import path from renderer: `import type { IpcResult } from '../../shared/ipc-types'` (or `'../shared/ipc-types'` depending on file depth — always verify relative path)
Import path from `src/renderer/src/*.ts(x)`: `import type { ... } from '../../../shared/ipc-types'`

### `AIProvider.ts` Integration Note (Story 1.4)

Story 1.4 will create `src/main/ai/AIProvider.ts`. That file must import `Grade` from `ipc-types.ts`:
```ts
import type { Grade } from '../../shared/ipc-types'
```
Do not redefine `Grade` in `AIProvider.ts` — it must be imported from the single source of truth.

### Architecture Enforcement Constraints

From the Architecture document ("All AI agents MUST"):
- Never use `snake_case` for TypeScript variables, function names, or object fields — `camelCase` throughout
- All DB `snake_case` columns (e.g. `created_at`, `employee_id`) must be mapped to `camelCase` in the repository layer before returning over IPC
- Never duplicate type definitions across files — import from `src/shared/ipc-types.ts`

### Project Structure Notes

- **Working directory for all commands:** `sdd-app/` (subdirectory of `c:\Users\Diego\Documents\Diego\Claude\SDD\`)
- Files created: `sdd-app/src/shared/ipc-types.ts` (replaces `.gitkeep`)
- Files modified: `sdd-app/src/renderer/src/env.d.ts`

### Deferred Items This Story Addresses

From Story 1.1 review deferred list:
- `@ts-ignore` in preload suppresses type errors on `window.api` — the type declaration in `env.d.ts` documents `window.electronAPI`; the actual preload fix is Story 1.5
- `window.api` exposed as `unknown` — Story 1.5 renames and rewires to `window.electronAPI`

### References

- [epics.md#Story 1.2: Define IPC Contract and Shared Types] — acceptance criteria source
- [architecture.md#API & Communication Patterns] — IPC channel list, `IpcResult<T>` definition
- [architecture.md#Format Patterns] — `IpcResult<T>` discriminated union, Grade type, date format
- [architecture.md#Architectural Boundaries] — `src/shared/ipc-types.ts` as single source of truth
- [architecture.md#Gap Analysis Results — Gap 1] — `window.electronAPI` type declaration pattern, import path
- [architecture.md#Gap Analysis Results — Gap 2] — `AIProvider` interface importing `Grade` from ipc-types
- [1-1-scaffold-and-configure-project.md#Review Findings] — env.d.ts actual path is `src/renderer/src/env.d.ts`
- AR2, AR9 (epics.md Requirements Inventory)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_None — implementation was straightforward with zero TypeScript errors._

### Completion Notes List

- Deleted `src/shared/.gitkeep` and created `src/shared/ipc-types.ts` with zero imports — pure type definitions only.
- All 18 IPC channels covered: 4 entity types (`Employee`, `Competency`, `BehaviorLogEntry`, `EvaluateResult`), 2 domain enums (`CompetencyLevel`, `Grade`), core `IpcResult<T>` discriminated union, and 13 payload interfaces.
- Updated `src/renderer/src/env.d.ts` (actual scaffold path, not the architecture doc path `src/renderer/env.d.ts`) — kept `/// <reference types="vite/client" />`, added `Window` interface extension with `window.electronAPI.invoke<T>` returning `Promise<IpcResult<T>>`.
- Import path `../../shared/ipc-types` from `src/renderer/src/env.d.ts` resolves correctly to `src/shared/ipc-types.ts`.
- All three TypeScript contexts pass with zero errors: `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`.
- `window.electronAPI` is type-only at this stage — runtime wiring deferred to Story 1.5 as per spec.

### File List

- `sdd-app/src/shared/ipc-types.ts` (created)
- `sdd-app/src/renderer/src/env.d.ts` (modified)
- `sdd-app/src/shared/.gitkeep` (deleted)

### Review Findings

- [x] [Review][Defer] Weak IPC invoke signature — `invoke<T>(channel: string, payload?: unknown)` has no channel union, unconstrained T, and unknown payload; full type safety deferred to Story 1.5 when the channel map can be defined [sdd-app/src/renderer/src/env.d.ts:7] — deferred, pre-existing design
- [x] [Review][Defer] `IpcResult<T>` error carries only string — no structured error codes; callers cannot branch on error category without string parsing [sdd-app/src/shared/ipc-types.ts:3] — deferred, pre-existing design
- [x] [Review][Defer] Empty string accepted by name/description fields — no `NonEmptyString` branded type; runtime validation required in repository layer [sdd-app/src/shared/ipc-types.ts] — deferred, pre-existing design
- [x] [Review][Defer] `competencyIds` accepts empty array — a log entry with zero competencies is semantically invalid; validation needed in repository layer [sdd-app/src/shared/ipc-types.ts] — deferred, pre-existing design
- [x] [Review][Defer] Date fields are unvalidated plain `string` — ISO 8601 format is comment-only, not enforced at the type level [sdd-app/src/shared/ipc-types.ts] — deferred, pre-existing design
- [x] [Review][Defer] `SetModelPayload.model` is `string` not union — valid model IDs listed in comment only; follows spec's exact code block [sdd-app/src/shared/ipc-types.ts] — deferred, pre-existing design
- [x] [Review][Defer] Update payloads require all fields — no partial update support; callers must re-supply unchanged fields [sdd-app/src/shared/ipc-types.ts] — deferred, pre-existing design
- [x] [Review][Defer] `BehaviorLogEntry.competencies` can be empty array — orphaned entry risk if DB join returns no rows [sdd-app/src/shared/ipc-types.ts] — deferred, pre-existing design
- [x] [Review][Defer] `CompetencyLevel` values opaque — no documentation of ordering or meaning for `'A' | 'B' | 'C' | 'D'` [sdd-app/src/shared/ipc-types.ts] — deferred, pre-existing design
- [x] [Review][Defer] No IPC schema versioning strategy — silent type mismatches possible during partial-update installs [sdd-app/src/shared/ipc-types.ts] — deferred, pre-existing design
