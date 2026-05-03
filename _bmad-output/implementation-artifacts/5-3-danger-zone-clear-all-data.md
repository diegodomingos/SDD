# Story 5.3: Danger Zone — Clear All Data

Status: done

## Story

As a manager,
I want a way to clear all my data from the application,
so that I can reset the tool for a new cycle or hand it to another tester with a clean state.

## Acceptance Criteria

1. **Given** the Settings view danger zone section, **when** it renders, **then** a "Clear all data" button appears with a red outlined style — visually distinct from other actions (UX-DR14)

2. **Given** the user clicks "Clear all data", **when** the confirmation dialog appears, **then** it explains what will be deleted ("All employees, behavior log entries, and expected behaviors will be permanently deleted. This cannot be undone.") and requires explicit confirmation before proceeding

3. **Given** the user confirms, **when** the clear operation executes, **then** all rows are deleted from `employees`, `behavior_log_entries`, `behavior_log_entry_competencies`, and `expected_behaviors` tables — the four competency seed rows in `competencies` and `settings` rows are preserved

4. **Given** the user cancels the confirmation dialog, **when** cancel is clicked, **then** no data is deleted and the Settings view is unchanged

## Tasks / Subtasks

- [x] Task 1: Create `sdd-app/src/main/db/clearAllData.ts` (AC: 3)
  - [x] 1.1: Implement `clearAllData(db)` — wrap in `db.transaction(...)()`: execute `DELETE FROM expected_behaviors` then `DELETE FROM employees`; CASCADE handles `behavior_log_entries` and `behavior_log_entry_competencies` automatically
  - [x] 1.2: Repository signature: first arg is `db: Database.Database` matching all other repository files — import `Database` from `'better-sqlite3'`

- [x] Task 2: Add `settings:clear-all-data` to `sdd-app/src/preload/index.ts` (AC: 3) ⚠️ CRITICAL
  - [x] 2.1: Add `'settings:clear-all-data'` to the `ALLOWED_CHANNELS` Set — without this the renderer invoke will throw "IPC channel not allowed" at runtime

- [x] Task 3: Add `settings:clear-all-data` handler to `sdd-app/src/main/handlers/settingsHandlers.ts` (AC: 3)
  - [x] 3.1: Import `clearAllData` from `'../db/clearAllData'`
  - [x] 3.2: Add `ipcMain.handle('settings:clear-all-data', ...)` — no-arg channel returning `IpcResult<null>`; `if (!db)` guard; calls `clearAllData(db)` inside try; returns `{ ok: true, data: null }` on success

- [x] Task 4: Add `resetUserData()` to `sdd-app/src/renderer/src/store/appStore.ts` (AC: 3)
  - [x] 4.1: Add `resetUserData: () => void` to `AppStore` interface
  - [x] 4.2: Implement: `set({ selectedEmployee: null, selectedCompetency: null })` — do NOT reset `managerName`, `keyConfigured`, or `aiModel` (settings rows are preserved by the clear operation)

- [x] Task 5: Extend `sdd-app/src/renderer/src/hooks/useSettings.ts` (AC: 3)
  - [x] 5.1: Add `isClearingData: boolean` (initial `false`) and `clearDataError: string | null` (initial `null`) state variables
  - [x] 5.2: Add `resetUserData` selector: `const resetUserData = useAppStore((s) => s.resetUserData)`
  - [x] 5.3: Add `clearAllData()` callback — `setIsClearingData(true)`, clears error, invokes `settings:clear-all-data`, on `result.ok` calls `resetUserData()`, on error sets `clearDataError(result.error)`; catch block sets `clearDataError`; `try/finally` resets `isClearingData` flag; returns `boolean`
  - [x] 5.4: Add `isClearingData`, `clearDataError`, `clearAllData` to the return object

- [x] Task 6: Add Danger Zone section to `sdd-app/src/renderer/src/views/Settings.tsx` (AC: 1, 2, 3, 4)
  - [x] 6.1: Import `Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions` from `'@mui/material'`
  - [x] 6.2: Add `const [confirmOpen, setConfirmOpen] = useState(false)` state
  - [x] 6.3: Destructure `isClearingData, clearDataError, clearAllData: clearAllDataFn` from `useSettings()` (alias to avoid name collision with the IPC channel string)
  - [x] 6.4: Add `handleClearConfirm` async handler — calls `clearAllDataFn()`, then `setConfirmOpen(false)` regardless of result
  - [x] 6.5: Add Danger Zone `Box` section below the model selector card — red border (`borderColor: 'error.main'`), section title "Danger Zone", subtitle, and `Button color="error" variant="outlined"` labeled "Clear all data" with `onClick={() => setConfirmOpen(true)}` and `disabled={isClearingData}`
  - [x] 6.6: Add `Dialog open={confirmOpen}` with: title "Clear all data?", `DialogContentText` with the exact confirmation text, "Cancel" button (`onClick={() => setConfirmOpen(false)}`), and destructive "Delete all data" `Button color="error"` that calls `handleClearConfirm`
  - [x] 6.7: Show `clearDataError` below the trigger button if non-null

- [x] Task 7: Write tests (AC: 3)
  - [x] 7.1: Create `sdd-app/__tests__/main/db/clearAllData.test.ts` — mock `transaction` and `prepare`; verify `DELETE FROM expected_behaviors` SQL executed; verify `DELETE FROM employees` SQL executed; verify SQL never targets `competencies` or `settings` tables

- [x] Task 8: TypeScript + test suite
  - [x] `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] `npm run test` — all existing 77 tests pass + new tests pass (81 total)

## Dev Notes

### Files to Create / Modify

| File | Action | Notes |
|---|---|---|
| `sdd-app/src/main/db/clearAllData.ts` | CREATE | `clearAllData(db)` — cross-table delete in a transaction |
| `sdd-app/src/preload/index.ts` | MODIFY | Add `'settings:clear-all-data'` to ALLOWED_CHANNELS — REQUIRED or runtime throw |
| `sdd-app/src/main/handlers/settingsHandlers.ts` | MODIFY | Add `settings:clear-all-data` handler only — do NOT touch existing handlers |
| `sdd-app/src/renderer/src/store/appStore.ts` | MODIFY | Add `resetUserData()` action — do NOT remove/rename existing fields |
| `sdd-app/src/renderer/src/hooks/useSettings.ts` | MODIFY | Add `clearAllData` callback + `isClearingData`/`clearDataError` state — do NOT modify existing callbacks |
| `sdd-app/src/renderer/src/views/Settings.tsx` | MODIFY | Add Danger Zone section + Dialog — do NOT touch existing sections |
| `sdd-app/__tests__/main/db/clearAllData.test.ts` | CREATE | Mock `db.transaction` and `db.prepare` |

**DO NOT touch:**
- `sdd-app/src/shared/ipc-types.ts` — `settings:clear-all-data` takes no payload; no new type needed
- `sdd-app/src/renderer/src/env.d.ts` — `invoke<T>(channel: string, ...)` already accepts any string; no changes needed
- `sdd-app/src/main/settings/apiKey.ts` — `clearApiKey` is NOT called here; `settings` rows are preserved per AC3
- `sdd-app/src/main/db/database.ts` — schema and CASCADE are already correct
- `sdd-app/src/main/index.ts` — `registerSettingsHandlers()` already called; no change needed

---

### Task 1: `clearAllData.ts` — New Repository File

```ts
import Database from 'better-sqlite3'

export function clearAllData(db: Database.Database): void {
  db.transaction(() => {
    db.prepare('DELETE FROM expected_behaviors').run()
    db.prepare('DELETE FROM employees').run()
    // behavior_log_entries and behavior_log_entry_competencies are deleted
    // automatically via ON DELETE CASCADE from employees (foreign_keys = ON)
  })()
}
```

**Why transaction:** Atomicity — if either delete fails, neither is committed.

**Why only 2 DELETE statements:** The schema in `database.ts` defines:
- `behavior_log_entries.employee_id → employees(id) ON DELETE CASCADE`
- `behavior_log_entry_competencies.entry_id → behavior_log_entries(id) ON DELETE CASCADE`

So `DELETE FROM employees` cascades to `behavior_log_entries`, which cascades to `behavior_log_entry_competencies`. `foreign_keys = ON` is set via pragma at startup — CASCADE is active.

**Why NOT delete `competencies`:** The four seed rows (`Communication`, `Client Focus`, `Proactivity`, `Teamwork`) are inserted via `INSERT OR IGNORE` at schema init. Deleting them would break the framework view and require re-seeding.

**Why NOT delete `settings`:** API key and model preference are user configuration, not data. AC3 explicitly says settings rows are preserved.

---

### Task 2: `preload/index.ts` — Add to ALLOWED_CHANNELS

```ts
const ALLOWED_CHANNELS = new Set([
  // ... existing channels ...
  'settings:clear-all-data',   // ADD this line
])
```

The preload enforces a strict allowlist. Calling `window.electronAPI.invoke('settings:clear-all-data', ...)` without this entry throws `Error: IPC channel not allowed: settings:clear-all-data` in the renderer at runtime — the app will not crash but the clear operation will silently fail with an uncaught rejection. **This is the most common miss in adding new IPC channels.**

---

### Task 3: `settingsHandlers.ts` — Add One Handler

Add import at top:
```ts
import { clearAllData } from '../db/clearAllData'
```

Add handler inside `registerSettingsHandlers()`, after the `settings:set-model` handler:
```ts
ipcMain.handle('settings:clear-all-data', async (): Promise<IpcResult<null>> => {
  log.info('[settings:clear-all-data]')
  try {
    if (!db) return { ok: false, error: 'Database not ready.' }
    clearAllData(db)
    return { ok: true, data: null }
  } catch (e) {
    log.error('[settings:clear-all-data] error: %s', e instanceof Error ? e.message : String(e))
    return { ok: false, error: 'Failed to clear data.' }
  }
})
```

No payload: the channel takes no argument. No `_event` needed (same as `settings:get-manager-name` pattern).

---

### Task 4: `appStore.ts` — Add resetUserData

Add to `AppStore` interface (do NOT modify existing fields):
```ts
resetUserData: () => void
```

Add to store definition:
```ts
resetUserData: () => set({ selectedEmployee: null, selectedCompetency: null }),
```

This resets the in-memory selected state so that views (BehaviorLog, Evaluate) that depend on `selectedEmployee` show the empty/placeholder state rather than referencing a deleted employee. `managerName`, `keyConfigured`, `aiModel` are untouched — they come from the `settings` table which is preserved.

---

### Task 5: `useSettings.ts` — Add clearAllData Callback

Extend (do NOT replace — add alongside existing state and callbacks):

New state variables (add below `isSavingModel`):
```ts
const [isClearingData, setIsClearingData] = useState(false)
const [clearDataError, setClearDataError] = useState<string | null>(null)
```

New selector (add below `setStoreAiModel`):
```ts
const resetUserData = useAppStore((s) => s.resetUserData)
```

New callback (add below `saveModel`):
```ts
const clearAllData = useCallback(async (): Promise<boolean> => {
  setIsClearingData(true)
  setClearDataError(null)
  try {
    const result = await window.electronAPI.invoke<null>('settings:clear-all-data')
    if (result.ok) {
      resetUserData()
    } else {
      setClearDataError(result.error)
    }
    return result.ok
  } catch {
    setClearDataError('Unexpected error clearing data.')
    return false
  } finally {
    setIsClearingData(false)
  }
}, [resetUserData])
```

Update return object — add these three:
```ts
isClearingData, clearDataError, clearAllData,
```

**Notes:**
- `resetUserData` is a Zustand setter — stable reference, safe in `useCallback` deps array
- `try/finally` pattern matches all other save callbacks (Story 5.2 lesson: missing finally causes flag stuck in true)
- The callback does NOT navigate to the employees view — navigation is the responsibility of the view layer via `useAppStore((s) => s.setView)` if desired; for this story the nav is not required by ACs

---

### Task 6: `Settings.tsx` — Danger Zone Section and Dialog

New import (add to existing `@mui/material` import line):
```tsx
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, MenuItem, Select, TextField, Typography
} from '@mui/material'
```

Add state (after existing `useState` calls):
```tsx
const [confirmOpen, setConfirmOpen] = useState(false)
```

Extend destructuring from `useSettings()` (add to existing destructure):
```tsx
isClearingData, clearDataError, clearAllData: clearAllDataFn,
```

Add handler (after `handleSaveModel`):
```tsx
const handleClearConfirm = async () => {
  await clearAllDataFn()
  setConfirmOpen(false)
}
```

Add Danger Zone section (after the Claude Model `Box` block, before the closing `</Box>` of the page):
```tsx
{/* Danger Zone */}
<Box
  sx={{
    mb: 3,
    p: 2.5,
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: 'error.main',
    borderRadius: 1,
  }}
>
  <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 0.5, color: 'error.main' }}>
    Danger Zone
  </Typography>
  <Typography sx={{ fontSize: '13px', color: 'text.secondary', mb: 2 }}>
    Permanently delete all employees, behavior log entries, and expected behaviors.
  </Typography>
  <Button
    variant="outlined"
    color="error"
    onClick={() => setConfirmOpen(true)}
    disabled={isClearingData}
  >
    {isClearingData ? 'Clearing…' : 'Clear all data'}
  </Button>
  {clearDataError && (
    <Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>
      {clearDataError}
    </Typography>
  )}
</Box>

{/* Confirmation Dialog */}
<Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
  <DialogTitle>Clear all data?</DialogTitle>
  <DialogContent>
    <DialogContentText>
      All employees, behavior log entries, and expected behaviors will be permanently
      deleted. This cannot be undone.
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
    <Button color="error" onClick={handleClearConfirm} disabled={isClearingData}>
      Delete all data
    </Button>
  </DialogActions>
</Dialog>
```

**UX notes:**
- Dialog is placed outside the page `Box` at the root of the return — standard MUI Dialog placement
- `onClose` on the Dialog itself handles backdrop click / Escape key → closes without deleting (AC4)
- Trigger button disabled during the async clear operation to prevent double-submit
- No success toast (consistent with UX-DR17, matching existing Settings sections)
- `clearDataError` displayed under the trigger button, not in the dialog (dialog is closed by the time the error is known)
- The "Delete all data" button text is more explicit than "Confirm" to make the destructive intent unambiguous

---

### Task 7: `clearAllData.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { clearAllData } from '../../../src/main/db/clearAllData'

function mockDb(): { db: Database.Database; executedSql: string[] } {
  const executedSql: string[] = []
  const db = {
    prepare: (sql: string) => ({
      run: () => {
        executedSql.push(sql)
        return { changes: 0 }
      },
    }),
    transaction: (fn: () => void) => fn,
  } as unknown as Database.Database
  return { db, executedSql }
}

describe('clearAllData', () => {
  it('deletes expected_behaviors', () => {
    const { db, executedSql } = mockDb()
    clearAllData(db)
    expect(executedSql.some((s) => s.includes('expected_behaviors'))).toBe(true)
  })

  it('deletes employees', () => {
    const { db, executedSql } = mockDb()
    clearAllData(db)
    expect(executedSql.some((s) => s.includes('employees'))).toBe(true)
  })

  it('does not delete competencies', () => {
    const { db, executedSql } = mockDb()
    clearAllData(db)
    expect(executedSql.every((s) => !s.toLowerCase().includes('competencies'))).toBe(true)
  })

  it('does not delete settings', () => {
    const { db, executedSql } = mockDb()
    clearAllData(db)
    expect(executedSql.every((s) => !s.toLowerCase().includes('settings'))).toBe(true)
  })
})
```

**Mock pattern rationale:** `db.transaction(fn)` returns `fn` itself — calling the result `fn()` directly executes the callback synchronously. This mirrors how the real `better-sqlite3` transaction works without needing a real SQLite file. The ABI mismatch (Electron ABI 140 vs Node ABI 137) makes real `better-sqlite3` unusable in Vitest — always use `mockDb`.

---

### Architecture Compliance

| Rule | Applied here |
|---|---|
| No SQL in handlers | SQL in `clearAllData.ts` (repository); handler delegates |
| `IpcResult<T>` discriminated union | `settings:clear-all-data` → `IpcResult<null>` |
| Handler `db` guard | `if (!db) return { ok: false, error: 'Database not ready.' }` |
| Repository pattern (first arg = db) | `clearAllData(db)` matches `employees.ts`, `behaviorLog.ts`, `apiKey.ts` |
| Components use hooks, not IPC directly | `Settings.tsx` calls `useSettings()`; never calls `window.electronAPI` directly |
| Preload allowlist | `'settings:clear-all-data'` added to `ALLOWED_CHANNELS` |
| `try/finally` in hooks | `clearAllData` callback wraps in `try/finally` to reset `isClearingData` flag |

---

### Previous Story Intelligence (Story 5.2)

- **Preload ALLOWED_CHANNELS:** Story 5.1/5.2 had all channels already in the list. Story 5.3 introduces a new channel — `'settings:clear-all-data'` MUST be added to `sdd-app/src/preload/index.ts` before the renderer can invoke it.
- **ABI mismatch pattern:** Use `mockDb()` factory with mocked `transaction` for DB tests. Do NOT import real `better-sqlite3` in Vitest tests.
- **`try/finally` in hook callbacks:** Story 5.1 review found missing finally caused loading flags to get stuck. All callbacks (`saveApiKey`, `saveModel`) now use `try/finally` — `clearAllData` must follow the same pattern.
- **Per-section error state:** Story 5.2 upgraded from shared `error` to `nameError`/`keyError`/`modelError`. Follow the same pattern: add `clearDataError` as its own state variable.
- **`void payload` removal:** Not applicable here — `clear-all-data` takes no payload.
- **Handler `db` guard:** `if (!db) return { ok: false, error: 'Database not ready.' }` — use in the new handler, same as all existing handlers.
- **Test count baseline:** 77 tests across 9 files. Story 5.3 adds 4 tests in `clearAllData.test.ts`. Expected final count: 81+ tests.
- **Zustand selector style:** `useAppStore((s) => s.someField)` — follow for `resetUserData` selector.

---

### Scope Boundary Notes

- **Do NOT clear `settings` rows:** API key, model preference, and manager name are configuration — not user data. AC3 explicitly preserves them.
- **Do NOT call `clearApiKey(db)`:** The API key (stored encrypted in `settings` table) must be preserved. Do NOT import or call `clearApiKey` in this story.
- **Do NOT navigate after clear:** ACs do not require navigation. The view stays on Settings. In-memory selected state is reset via `resetUserData()` so dependent views won't crash if the user navigates there.
- **Do NOT add a success toast:** Consistent with UX-DR17. The "Clear all data" button returning to its default state is the confirmation.
- **Dialog placement:** MUI `Dialog` must be a sibling of the page `Box`, not nested inside it — render it adjacent to, not inside, the Danger Zone `Box`.
- **`clearAllData` naming collision:** The hook exports a function named `clearAllData`. Import it aliased in `Settings.tsx` as `clearAllDataFn` to avoid collision with the IPC channel string or any other identifier.

---

### UX Requirements Mapping

| Requirement | Implementation |
|---|---|
| UX-DR14: "Clear all data" red outlined button | `Button color="error" variant="outlined"` |
| UX-DR14: Visually distinct danger zone | Red border `borderColor: 'error.main'`, red section title |
| AC2: Exact confirmation text | `DialogContentText` with exact AC2 string |
| AC4: Cancel = no delete | Dialog `onClose`, Cancel button both close without deleting |
| UX-DR17: No success toast | Button returns to default state = confirmation |

### References

- [Source: epics.md — Story 5.3 Acceptance Criteria]
- [Source: architecture.md — IPC Handler Pattern, Database Schema]
- [Source: sdd-app/src/preload/index.ts — ALLOWED_CHANNELS Set]
- [Source: sdd-app/src/main/db/database.ts — ON DELETE CASCADE schema definition]
- [Source: 5-2-claude-api-key-configuration-and-model-selection.md — Previous Story Intelligence]

### Review Findings

- [x] [Review][Decision] Dialog backdrop/Escape close not guarded during in-progress clear — `onClose={() => setConfirmOpen(false)}` fires on backdrop click/Escape even while `isClearingData` is true; the async operation continues but the dialog vanishes mid-flight. UX choice: should backdrop/Escape be blocked while clearing? [`sdd-app/src/renderer/src/views/Settings.tsx`]

- [x] [Review][Patch] `handleClearConfirm` closes dialog unconditionally on failure — `await clearAllDataFn(); setConfirmOpen(false)` runs regardless of result; on failure the dialog closes, the error renders in the Danger Zone box with no way to retry from context [`sdd-app/src/renderer/src/views/Settings.tsx`]
- [x] [Review][Patch] `clearDataError` not reset when dialog is reopened — stale error from a previous failed attempt is visible immediately on re-open; `setClearDataError(null)` only runs inside `clearAllData`, not when `setConfirmOpen(true)` is called [`sdd-app/src/renderer/src/views/Settings.tsx`]
- [x] [Review][Patch] Dialog rendered inside outer page `<Box>` — violates spec Scope Boundary constraint ("MUI Dialog must be a sibling of the page Box, not nested inside it") [`sdd-app/src/renderer/src/views/Settings.tsx`]
- [x] [Review][Patch] `result.error` may be `undefined`, renders blank error Typography — `setClearDataError(result.error)` has no fallback; if IPC returns `{ ok: false }` without `error` field, `clearDataError` is set to `undefined` (truthy), rendering empty `<Typography>` [`sdd-app/src/renderer/src/hooks/useSettings.ts`]
- [x] [Review][Patch] Test SQL assertions too weak — `s.includes('expected_behaviors')` passes for any SQL containing the table name, not just DELETE; also applies to `employees` test [`sdd-app/__tests__/main/db/clearAllData.test.ts`]
- [x] [Review][Patch] Test mock transaction pattern fragile — `transaction: (fn) => fn` works coincidentally because caller invokes the return value; doesn't match real better-sqlite3 contract and atomicity/rollback is not tested [`sdd-app/__tests__/main/db/clearAllData.test.ts`]

- [x] [Review][Defer] `setKeyConfigured` typo `confused` instead of `configured` [`sdd-app/src/renderer/src/store/appStore.ts`] — deferred, pre-existing
- [x] [Review][Defer] CASCADE relies on `foreign_keys = ON` pragma — spec-approved; pragma set in `database.ts` at startup; acceptable design — deferred, pre-existing
- [x] [Review][Defer] Tests cannot verify cascade-deleted tables (`behavior_log_entries`, `behavior_log_entry_competencies`) — ABI mock limitation; spec explicitly documents CASCADE as the deletion mechanism — deferred, pre-existing
- [x] [Review][Defer] `resetUserData` limited to `selectedEmployee`/`selectedCompetency` — spec intentionally scopes this; views reload from DB on navigation — deferred, pre-existing
- [x] [Review][Defer] No integration/E2E test for dialog confirmation flow — out of story scope; unit tests cover the DB layer — deferred, pre-existing

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- All 8 tasks completed; all 4 ACs satisfied.
- `clearAllData.ts`: Created `sdd-app/src/main/db/clearAllData.ts`. Wraps two DELETE statements in a `db.transaction()()` call: `DELETE FROM expected_behaviors` then `DELETE FROM employees`. The `ON DELETE CASCADE` on `behavior_log_entries.employee_id` and `behavior_log_entry_competencies.entry_id` handles those tables automatically. `competencies` and `settings` tables are untouched per AC3.
- `preload/index.ts`: Added `'settings:clear-all-data'` to `ALLOWED_CHANNELS` Set. Without this, the renderer invoke would throw `"IPC channel not allowed"` at runtime.
- `settingsHandlers.ts`: Added import for `clearAllData` from `'../db/clearAllData'`. Added `settings:clear-all-data` handler after `settings:set-model`. No-arg channel returning `IpcResult<null>`, with `if (!db)` guard and standard error logging pattern.
- `appStore.ts`: Added `resetUserData: () => void` to `AppStore` interface and store definition. Sets `{ selectedEmployee: null, selectedCompetency: null }` — does not reset `managerName`, `keyConfigured`, or `aiModel` since settings rows are preserved.
- `useSettings.ts`: Added `isClearingData` and `clearDataError` state variables. Added `resetUserData` Zustand selector. Added `clearAllData` callback wrapped in `try/finally`, calling `resetUserData()` on success. Extended return object.
- `Settings.tsx`: Imported `useState` and Dialog components. Added `confirmOpen` state. Destructured `isClearingData`, `clearDataError`, `clearAllDataFn` from hook. Added `handleClearConfirm`. Added Danger Zone `Box` with red border and error-colored title, "Clear all data" `Button color="error" variant="outlined"`, error display. Added MUI `Dialog` with exact AC2 confirmation text, Cancel button (closes dialog), and "Delete all data" destructive button.
- Tests: `clearAllData.test.ts` — 4 tests using `mockDb` pattern with mocked `transaction` and `prepare`. Verifies `expected_behaviors` deleted, `employees` deleted, `competencies` and `settings` untouched.
- Final test count: 81 tests across 10 files, all passing. Zero TypeScript errors on both `tsconfig.node.json` and `tsconfig.web.json`.

### File List

**Created:**
- `sdd-app/src/main/db/clearAllData.ts`
- `sdd-app/__tests__/main/db/clearAllData.test.ts`

**Modified:**
- `sdd-app/src/preload/index.ts`
- `sdd-app/src/main/handlers/settingsHandlers.ts`
- `sdd-app/src/renderer/src/store/appStore.ts`
- `sdd-app/src/renderer/src/hooks/useSettings.ts`
- `sdd-app/src/renderer/src/views/Settings.tsx`
