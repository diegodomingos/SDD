# Story 1.5: Wire contextBridge Preload and IPC Handler Scaffold

Status: done

## Story

As a developer,
I want the contextBridge preload wired and all IPC handler files scaffolded,
so that renderer components can call main process functions through `window.electronAPI` and the handler structure is ready for feature implementation.

## Acceptance Criteria

1. `src/preload/index.ts` exposes `contextBridge.exposeInMainWorld('electronAPI', { invoke })` — when the renderer calls `window.electronAPI.invoke('competency:list')` the main process `ipcMain.handle('competency:list', ...)` handler responds with `{ ok: true, data: [...] }` containing the four seeded competencies.
2. `src/main/index.ts` `BrowserWindow` creation sets `webPreferences.contextIsolation: true` explicitly alongside the existing preload path.
3. `src/main/handlers/` directory contains `employeeHandlers.ts`, `behaviorLogHandlers.ts`, `frameworkHandlers.ts`, `aiHandlers.ts`, and `settingsHandlers.ts` — all registered in `src/main/index.ts`.
4. No file under `src/renderer/` imports directly from `electron` — all main process access goes through `window.electronAPI`.

## Tasks / Subtasks

- [x] Task 1: Rewrite `src/preload/index.ts` — expose `window.electronAPI.invoke` (AC: 1)
  - [x] Remove `@electron-toolkit/preload` import and all old `window.electron` / `window.api` exposures
  - [x] Import `contextBridge, ipcRenderer` from `'electron'`
  - [x] `contextBridge.exposeInMainWorld('electronAPI', { invoke: (channel, payload?) => ipcRenderer.invoke(channel, payload) })`
  - [x] Update `src/preload/index.d.ts` — remove stale `window.electron` / `window.api` declarations (window.electronAPI is already typed in `src/renderer/src/env.d.ts`)

- [x] Task 2: Update `src/main/index.ts` BrowserWindow — add `contextIsolation: true` (AC: 2)
  - [x] Add `contextIsolation: true` to `webPreferences` alongside existing `preload` and `sandbox: false`

- [x] Task 3: Create `src/main/db/framework.ts` — `listCompetencies()` for `competency:list` AC (AC: 1)
  - [x] Import `db` from `'./database'` and `Competency` from `'../../shared/ipc-types'`
  - [x] Export `listCompetencies(): Competency[]` — queries `SELECT id, name FROM competencies ORDER BY id`, throws if `db` is undefined
  - [x] Export stub `getExpectedBehavior(competencyId: number, level: CompetencyLevel): string | null` — returns `null` (full impl: Story 3.1)
  - [x] Export stub `setExpectedBehavior(competencyId: number, level: CompetencyLevel, description: string): string` — throws `'Not implemented'` (full impl: Story 3.2)

- [x] Task 4: Create `src/main/handlers/frameworkHandlers.ts` — real `competency:list`, scaffolded rest (AC: 1, 3)
  - [x] Export `registerFrameworkHandlers(): void`
  - [x] Register `ipcMain.handle('competency:list', ...)` — calls `listCompetencies()`, returns `IpcResult<Competency[]>`
  - [x] Register `ipcMain.handle('expected-behavior:get', ...)` — calls `getExpectedBehavior()`, returns `IpcResult<string | null>` (stub returns `{ ok: true, data: null }`)
  - [x] Register `ipcMain.handle('expected-behavior:set', ...)` — returns `{ ok: false, error: 'Not implemented.' }` stub

- [x] Task 5: Create `src/main/handlers/employeeHandlers.ts` — scaffold (AC: 3)
  - [x] Export `registerEmployeeHandlers(): void`
  - [x] Register `employee:list` → returns `{ ok: true, data: [] }`
  - [x] Register `employee:create` → returns `{ ok: false, error: 'Not implemented.' }`
  - [x] Register `employee:update` → returns `{ ok: false, error: 'Not implemented.' }`
  - [x] Register `employee:delete` → returns `{ ok: false, error: 'Not implemented.' }`

- [x] Task 6: Create `src/main/handlers/behaviorLogHandlers.ts` — scaffold (AC: 3)
  - [x] Export `registerBehaviorLogHandlers(): void`
  - [x] Register `behavior-log:list` → returns `{ ok: true, data: [] }`
  - [x] Register `behavior-log:create` → returns `{ ok: false, error: 'Not implemented.' }`
  - [x] Register `behavior-log:update` → returns `{ ok: false, error: 'Not implemented.' }`
  - [x] Register `behavior-log:delete` → returns `{ ok: false, error: 'Not implemented.' }`

- [x] Task 7: Create `src/main/handlers/aiHandlers.ts` — scaffold (AC: 3)
  - [x] Export `registerAiHandlers(aiProvider: AIProvider): void`
  - [x] Register `ipcMain.handle('ai:evaluate', ...)` — returns `{ ok: false, error: 'Not implemented.' }` stub
  - [x] `aiProvider` parameter declared (not used yet — Story 6.2 wires the real logic)

- [x] Task 8: Create `src/main/handlers/settingsHandlers.ts` — scaffold (AC: 3)
  - [x] Export `registerSettingsHandlers(): void`
  - [x] Register `settings:get-manager-name` → returns `{ ok: true, data: '' }`
  - [x] Register `settings:set-manager-name` → returns `{ ok: false, error: 'Not implemented.' }`
  - [x] Register `settings:get-key-configured` → returns `{ ok: true, data: false }`
  - [x] Register `settings:set-api-key` → returns `{ ok: false, error: 'Not implemented.' }`
  - [x] Register `settings:get-model` → returns `{ ok: true, data: 'claude-haiku-4-5-20251001' }`
  - [x] Register `settings:set-model` → returns `{ ok: false, error: 'Not implemented.' }`

- [x] Task 9: Register all handlers in `src/main/index.ts` (AC: 3)
  - [x] Add 5 handler imports (registerEmployeeHandlers, registerBehaviorLogHandlers, registerFrameworkHandlers, registerAiHandlers, registerSettingsHandlers)
  - [x] Call all register functions inside `app.whenReady()` after schema init, before `createWindow()`
  - [x] Pass `aiProvider` to `registerAiHandlers(aiProvider)`

- [x] Task 10: Update `src/renderer/src/App.tsx` — remove `window.electron` usage (AC: 4)
  - [x] Remove the `ipcHandle` function and the `onClick={ipcHandle}` link element
  - [x] Keep the rest of the placeholder UI (will be replaced in Story 1.6)

- [x] Task 11: Typecheck (AC: 1–4)
  - [x] Run `npx tsc --noEmit -p tsconfig.node.json --composite false` from `sdd-app/` — zero errors
  - [x] Run `npx tsc --noEmit -p tsconfig.web.json --composite false` from `sdd-app/` — zero errors
  - [x] Run `npm run test` — all existing tests still pass (no regressions in MockAIProvider tests)

## Dev Notes

### CRITICAL: Preload Rewrite — What Changes and Why

The electron-vite template scaffold exposed `window.electron` via `@electron-toolkit/preload`. This story replaces that with the project's canonical `window.electronAPI.invoke` pattern. The old exposure is completely removed.

**`src/preload/index.ts` — exact new implementation:**
```ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, payload?: unknown) => ipcRenderer.invoke(channel, payload)
})
```

**`src/preload/index.d.ts` — remove stale types:**
```ts
export {}
```
(The renderer's `window.electronAPI` is already typed in `src/renderer/src/env.d.ts` which was created in Story 1.2. The preload d.ts no longer needs to declare Window interface members.)

**`src/renderer/src/env.d.ts` — DO NOT TOUCH.** Already correct from Story 1.2:
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

### CRITICAL: `src/main/index.ts` — contextIsolation + Handler Registration

**Add `contextIsolation: true` to BrowserWindow webPreferences.** Current state has:
```ts
webPreferences: {
  preload: join(__dirname, '../preload/index.js'),
  sandbox: false
}
```
Must become:
```ts
webPreferences: {
  preload: join(__dirname, '../preload/index.js'),
  sandbox: false,
  contextIsolation: true
}
```

**Handler registration order (inside `app.whenReady()`, after schema init, before `createWindow()`):**
```ts
registerEmployeeHandlers()
registerBehaviorLogHandlers()
registerFrameworkHandlers()
registerAiHandlers(aiProvider)
registerSettingsHandlers()
```
`aiProvider` is the module-level constant declared in Story 1.4 — already in scope.

**Full import block to add at the top of `index.ts`:**
```ts
import { registerEmployeeHandlers } from './handlers/employeeHandlers'
import { registerBehaviorLogHandlers } from './handlers/behaviorLogHandlers'
import { registerFrameworkHandlers } from './handlers/frameworkHandlers'
import { registerAiHandlers } from './handlers/aiHandlers'
import { registerSettingsHandlers } from './handlers/settingsHandlers'
```

### IPC Handler Pattern — Follow Exactly

All handlers follow this exact structure (no SQL in handler, log entry+exit, catch all errors):
```ts
ipcMain.handle('channel:name', async (_event, payload: PayloadType): Promise<IpcResult<ReturnType>> => {
  log.info('[channel:name] key=%s', payload.key)
  try {
    const result = repoFunction(payload)
    return { ok: true, data: result }
  } catch (e) {
    log.error('[channel:name] error: %s', e instanceof Error ? e.message : String(e))
    return { ok: false, error: 'Human-readable error message.' }
  }
})
```

Channels with no payload omit the payload parameter:
```ts
ipcMain.handle('competency:list', async (): Promise<IpcResult<Competency[]>> => {
  log.info('[competency:list]')
  try { ... }
})
```

### `src/main/db/framework.ts` — listCompetencies exact implementation

```ts
import { db } from './database'
import type { Competency, CompetencyLevel } from '../../shared/ipc-types'

export function listCompetencies(): Competency[] {
  if (!db) throw new Error('Database not initialized')
  return db.prepare('SELECT id, name FROM competencies ORDER BY id').all() as Competency[]
}

export function getExpectedBehavior(competencyId: number, level: CompetencyLevel): string | null {
  // Story 3.1 implements full logic
  return null
}

export function setExpectedBehavior(competencyId: number, level: CompetencyLevel, description: string): string {
  // Story 3.2 implements full logic
  throw new Error('Not implemented')
}
```

### `src/main/handlers/aiHandlers.ts` — AIProvider parameter pattern

The `aiProvider` parameter is declared now and used in Story 6.2. Do NOT add the parameter to other handler files — only aiHandlers takes it:
```ts
import { ipcMain } from 'electron'
import log from 'electron-log/main'
import type { AIProvider } from '../ai/AIProvider'
import type { IpcResult, EvaluateResult, EvaluatePayload } from '../../shared/ipc-types'

export function registerAiHandlers(aiProvider: AIProvider): void {
  ipcMain.handle('ai:evaluate', async (_event, payload: EvaluatePayload): Promise<IpcResult<EvaluateResult>> => {
    log.info('[ai:evaluate] employeeId=%d competencyId=%d', payload.employeeId, payload.competencyId)
    void aiProvider  // used in Story 6.2
    return { ok: false, error: 'Not implemented.' }
  })
}
```

### App.tsx — Minimum change for AC4

Remove only the `ipcHandle` function and the `<a>` element that calls it. Leave all other placeholder content intact (Story 1.6 replaces the entire component):
```tsx
// Remove these two things from App.tsx:
const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
// ... and the link element:
<a target="_blank" rel="noreferrer" onClick={ipcHandle}>Send IPC</a>
```

### Channel Registry — All Channels This Story Registers

From `architecture.md#API & Communication Patterns`:
```
employee:list, employee:create, employee:update, employee:delete
behavior-log:list, behavior-log:create, behavior-log:update, behavior-log:delete
competency:list
expected-behavior:get, expected-behavior:set
ai:evaluate
settings:get-key-configured, settings:set-api-key
settings:get-model, settings:set-model
settings:get-manager-name, settings:set-manager-name
```

All channels must be registered in this story as stubs. Story 2–6 implement the real logic in their respective files.

### What This Story Does NOT Do

- Does NOT implement `employees.ts`, `behaviorLog.ts` DB repositories — Story 2.1, 4.1
- Does NOT implement `settings/apiKey.ts` or `settings/modelPreference.ts` — Story 5.1, 5.2
- Does NOT implement `ai:evaluate` logic — Story 6.2
- Does NOT implement `expected-behavior:get` or `expected-behavior:set` logic — Story 3.1, 3.2
- Does NOT create Zustand store, renderer hooks, MUI theme, or any UI components — Story 1.6+
- Does NOT create `__tests__/main/db/framework.test.ts` — Story 3.1

### Manual Verification of AC1

After running `npm run dev`, open DevTools console in the Electron window and run:
```js
window.electronAPI.invoke('competency:list').then(console.log)
// Expected: { ok: true, data: [{ id: 1, name: 'Communication' }, { id: 2, name: 'Client Focus' }, { id: 3, name: 'Proactivity' }, { id: 4, name: 'Teamwork' }] }
```

### Project Structure Notes

- **Working directory for all commands:** `sdd-app/` (`c:\Users\Diego\Documents\Diego\Claude\SDD\sdd-app\`)
- **New directory to create:** `sdd-app/src/main/handlers/`
- **New files:** `src/main/db/framework.ts`, `src/main/handlers/employeeHandlers.ts`, `src/main/handlers/behaviorLogHandlers.ts`, `src/main/handlers/frameworkHandlers.ts`, `src/main/handlers/aiHandlers.ts`, `src/main/handlers/settingsHandlers.ts`
- **Modified files:** `src/preload/index.ts`, `src/preload/index.d.ts`, `src/main/index.ts`, `src/renderer/src/App.tsx`
- **DO NOT TOUCH:** `src/renderer/src/env.d.ts` — already correct; `src/shared/ipc-types.ts` — already complete; `src/main/ai/AIProvider.ts` and `MockAIProvider.ts` — done in Story 1.4
- **Renderer source root:** `src/renderer/src/` (electron-vite puts renderer source under `src/` inside `src/renderer/`)
- **Typecheck configs:** `tsconfig.node.json` covers main + preload + shared; `tsconfig.web.json` covers renderer

### References

- [epics.md#Story 1.5] — acceptance criteria source
- [architecture.md#API & Communication Patterns] — channel names, IpcResult format, handler pattern
- [architecture.md#Architectural Boundaries — IPC Boundary] — contextBridge as only legal crossing point
- [architecture.md#Implementation Patterns — Communication Patterns] — IPC handler + hook structure
- [architecture.md#Implementation Patterns — Enforcement Guidelines] — "never import from electron in src/renderer/"
- [architecture.md#Project Structure — Complete Directory Structure] — handler file names, db file names
- [architecture.md#Gap Analysis — Gap 1] — env.d.ts already created in Story 1.2 at `src/renderer/src/env.d.ts`
- [1-4-define-aiprovider-interface-and-implement-mockaiprovider.md#Dev Notes] — `aiProvider` module-level constant pattern, electron-log import style, typecheck commands
- [src/main/index.ts] — current state: has `aiProvider` at module level, schema init in `app.whenReady()`, no handler registrations yet, no `contextIsolation: true`
- [src/preload/index.ts] — current state: exposes `window.electron` via `@electron-toolkit/preload` — full rewrite needed
- [src/preload/index.d.ts] — current state: declares `window.electron: ElectronAPI` and `window.api: unknown` — stale after rewrite
- [src/renderer/src/App.tsx] — current state: `window.electron.ipcRenderer.send('ping')` must be removed for AC4
- AR5 (epics.md) — contextBridge preload exposing all IPC channels is this story's primary scope
- AR6 (epics.md) — handler pattern: log → validate → delegate to repository → return IpcResult<T>

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `Versions.tsx` used `window.electron.process.versions` — same `window.electron` removal scope as `App.tsx`. Fixed by replacing with static placeholder text (Story 1.6 replaces entire renderer UI).

### Completion Notes List

- Rewrote `sdd-app/src/preload/index.ts`: removed `@electron-toolkit/preload`, now exposes only `window.electronAPI.invoke` via `contextBridge.exposeInMainWorld('electronAPI', { invoke })`.
- Updated `sdd-app/src/preload/index.d.ts`: reduced to `export {}` — stale `window.electron`/`window.api` types removed; renderer typing is in `src/renderer/src/env.d.ts`.
- Updated `sdd-app/src/main/index.ts`: added `contextIsolation: true` to `BrowserWindow.webPreferences`; added 5 handler imports; registered all handlers in `app.whenReady()` after schema init (employee, behaviorLog, framework, ai with `aiProvider`, settings).
- Created `sdd-app/src/main/db/framework.ts`: `listCompetencies()` queries DB with `db` null-guard; `getExpectedBehavior()` and `setExpectedBehavior()` stubbed for Stories 3.1/3.2.
- Created `sdd-app/src/main/handlers/frameworkHandlers.ts`: `competency:list` is fully functional (returns four seeded competencies); `expected-behavior:get` and `expected-behavior:set` scaffolded.
- Created `sdd-app/src/main/handlers/employeeHandlers.ts`: all four `employee:*` channels registered as stubs (list returns `[]`; create/update/delete return `Not implemented`).
- Created `sdd-app/src/main/handlers/behaviorLogHandlers.ts`: all four `behavior-log:*` channels scaffolded.
- Created `sdd-app/src/main/handlers/aiHandlers.ts`: `ai:evaluate` scaffolded with `aiProvider: AIProvider` parameter declared; `void aiProvider` suppresses TS unused-param warning until Story 6.2.
- Created `sdd-app/src/main/handlers/settingsHandlers.ts`: all six `settings:*` channels scaffolded (get-manager-name/get-key-configured/get-model return sensible defaults).
- Updated `sdd-app/src/renderer/src/App.tsx`: removed `ipcHandle` function and `Send IPC` link — no renderer file now references `window.electron`.
- Updated `sdd-app/src/renderer/src/components/Versions.tsx`: removed `window.electron.process.versions` — static placeholder text.
- `tsconfig.node.json` check: zero errors. `tsconfig.web.json` check: zero errors. `npm run test`: 5/5 passed, 0 regressions.

### File List

- `sdd-app/src/preload/index.ts` (modified)
- `sdd-app/src/preload/index.d.ts` (modified)
- `sdd-app/src/main/index.ts` (modified)
- `sdd-app/src/main/db/framework.ts` (created)
- `sdd-app/src/main/handlers/frameworkHandlers.ts` (created)
- `sdd-app/src/main/handlers/employeeHandlers.ts` (created)
- `sdd-app/src/main/handlers/behaviorLogHandlers.ts` (created)
- `sdd-app/src/main/handlers/aiHandlers.ts` (created)
- `sdd-app/src/main/handlers/settingsHandlers.ts` (created)
- `sdd-app/src/renderer/src/App.tsx` (modified)
- `sdd-app/src/renderer/src/components/Versions.tsx` (modified)

### Review Findings

- [x] [Review][Decision] No channel allowlist in preload `invoke` — added `ALLOWED_CHANNELS` Set with all 17 known channels; `invoke` now throws on unknown channel. [sdd-app/src/preload/index.ts:4] — resolved: allowlist applied

- [x] [Review][Patch] Missing try/catch in 14 scaffold handlers — `employeeHandlers.ts` (4 handlers), `behaviorLogHandlers.ts` (4 handlers), `aiHandlers.ts` (1 handler), `settingsHandlers.ts` (6 handlers) have no try/catch; `frameworkHandlers.ts:expected-behavior:get` additionally logs `payload.competencyId`/`payload.level` outside the try block (crashes with unhandled rejection on null payload). All must follow the spec pattern: `log.info → try { ... } catch (e) { return { ok: false, error: ... } }`. [sdd-app/src/main/handlers/] — fixed

- [x] [Review][Patch] `setExpectedBehavior` return type should be `never` — function always throws but is declared `: string`, misleading callers and TypeScript. [sdd-app/src/main/db/framework.ts:20] — fixed

- [x] [Review][Defer] `expected-behavior:set` catch block returns `'Not implemented.'` regardless of actual error — will mask real DB errors when Story 3.2 implements the function [sdd-app/src/main/handlers/frameworkHandlers.ts:41] — deferred, pre-existing
- [x] [Review][Defer] No runtime payload validation across all IPC handlers — payloads typed but not validated at runtime; fix is a systemic design decision beyond this story's scope [sdd-app/src/main/handlers/] — deferred, pre-existing
- [x] [Review][Defer] `db` null-guard missing in stub functions `getExpectedBehavior` and `setExpectedBehavior` — needed when Stories 3.1/3.2 implement the functions [sdd-app/src/main/db/framework.ts:9-25] — deferred, pre-existing
- [x] [Review][Defer] `settings:set-api-key` — no API key redaction pattern established before implementation; future implementer may accidentally log sensitive data [sdd-app/src/main/handlers/settingsHandlers.ts:28] — deferred, pre-existing
- [x] [Review][Defer] Double-registration risk on macOS `activate` callback — handler registrations are correctly outside the activate callback today; risk only if refactored incorrectly [sdd-app/src/main/index.ts:62] — deferred, pre-existing
