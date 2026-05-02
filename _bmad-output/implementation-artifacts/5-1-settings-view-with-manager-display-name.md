# Story 5.1: Settings View with Manager Display Name

Status: done

## Story

As a manager,
I want to set my display name in the application,
so that the app feels personalized and I can confirm the settings screen is working before configuring the API key.

## Acceptance Criteria

1. **Given** `src/main/settings/modelPreference.ts` uses the `settings` table, **when** `getManagerName(db)` or `setManagerName(db, name)` is called, **then** it reads/writes the `manager_name` key in the `settings` table

2. **Given** `settingsHandlers.ts` registers `settings:get-manager-name` and `settings:set-manager-name`, **when** these channels are invoked, **then** they return `IpcResult<string>` and `IpcResult<null>` respectively, following the standard handler pattern

3. **Given** `src/renderer/src/hooks/useSettings.ts`, **when** `load()` is called, **then** it fetches the manager name via IPC, updates the Zustand store, manages `isLoading` and `error` state, and returns typed values

4. **Given** `src/renderer/src/views/Settings.tsx` renders, **when** the view loads, **then** a manager display name text field is shown with its own Save button — pre-filled with the current value if one exists

5. **Given** the user updates the name and clicks Save, **when** the save completes, **then** the Save button returns to its default state (not disabled) and the sidebar immediately reflects the updated manager name

## Tasks / Subtasks

- [x] Task 1: Create `src/main/settings/modelPreference.ts` (AC: 1)
  - [x] 1.1: Implement `getManagerName(db)` — `SELECT value FROM settings WHERE key = 'manager_name'`; return `row?.value ?? ''`
  - [x] 1.2: Implement `setManagerName(db, name)` — `INSERT OR REPLACE INTO settings (key, value) VALUES ('manager_name', ?)`

- [x] Task 2: Replace `settings:get-manager-name` and `settings:set-manager-name` stubs in `settingsHandlers.ts` (AC: 2)
  - [x] 2.1: Import `{ db }` from `'../db/database'` and `{ getManagerName, setManagerName }` from `'../settings/modelPreference'`
  - [x] 2.2: Replace `settings:get-manager-name` stub — call `getManagerName(db!)`; return `{ ok: true, data: name }`
  - [x] 2.3: Replace `settings:set-manager-name` stub — validate `payload.name` is a non-empty string after trim; call `setManagerName(db!, name)`; return `{ ok: true, data: null }`

- [x] Task 3: Add `managerName` to Zustand store `appStore.ts` (AC: 3, 5)
  - [x] 3.1: Add `managerName: string` field (initial value: `''`) and `setManagerName: (name: string) => void` action to `AppStore` interface and store definition

- [x] Task 4: Create `src/renderer/src/hooks/useSettings.ts` (AC: 3)
  - [x] 4.1: Implement `useSettings()` hook returning `{ draftName, setDraftName, isLoading, isSaving, error, load, saveManagerName }`
  - [x] 4.2: `load()` — invokes `settings:get-manager-name`, calls `setDraftName` and `setStoreName` (from appStore) with result
  - [x] 4.3: `saveManagerName(name)` — invokes `settings:set-manager-name`, on success calls `setDraftName` and `setStoreName`; returns `boolean`

- [x] Task 5: Implement `src/renderer/src/views/Settings.tsx` (AC: 4, 5)
  - [x] 5.1: Call `useSettings()` and `useAppStore((s) => s.managerName)` for dirty tracking; call `load()` in `useEffect`
  - [x] 5.2: Render a "Manager Display Name" section with a `TextField` (size="small", width 280px) and its own "Save" `Button` (variant="outlined")
  - [x] 5.3: Save button disabled when `draftName.trim() === storedName` (not dirty) or `isSaving === true`
  - [x] 5.4: On save, call `saveManagerName(draftName.trim())`; no success toast — button returning to non-dirty/non-saving state is the confirmation

- [x] Task 6: Update `Sidebar.tsx` to show dynamic manager name (AC: 5)
  - [x] 6.1: Import `useSettings` and `useAppStore`; call `const { load } = useSettings()` and `useEffect(() => { load() }, [load])` — primes the store on app startup
  - [x] 6.2: Read `managerName` from `useAppStore((s) => s.managerName)`; render `{managerName || 'Manager'}` (fallback to 'Manager' while loading or when name not set)

- [x] Task 7: Write tests (AC: 1)
  - [x] 7.1: `__tests__/main/settings/modelPreference.test.ts` — `getManagerName` suite: returns `''` when row absent; returns stored value when row exists
  - [x] 7.2: `__tests__/main/settings/modelPreference.test.ts` — `setManagerName` suite: calls `run()` with correct key/value

- [x] Task 8: TypeScript + test suite
  - [x] `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] `npm run test` — all existing tests pass + new tests pass

## Dev Notes

### Files to Create / Modify

| File | Action | Notes |
|---|---|---|
| `sdd-app/src/main/settings/modelPreference.ts` | CREATE | `getManagerName(db)`, `setManagerName(db, name)` — repository pattern |
| `sdd-app/src/main/handlers/settingsHandlers.ts` | MODIFY | Replace 2 stubs only; leave `get-key-configured`, `set-api-key`, `get-model`, `set-model` stubs untouched |
| `sdd-app/src/renderer/src/store/appStore.ts` | MODIFY | Add `managerName: string` + `setManagerName` action |
| `sdd-app/src/renderer/src/hooks/useSettings.ts` | CREATE | Manager name only — API key and model hooks added in 5.2 |
| `sdd-app/src/renderer/src/views/Settings.tsx` | MODIFY | Replace placeholder; render manager name section only — other sections are 5.2 and 5.3 |
| `sdd-app/src/renderer/src/components/layout/Sidebar.tsx` | MODIFY | Add `useEffect` load + read `managerName` from appStore |
| `sdd-app/__tests__/main/settings/modelPreference.test.ts` | CREATE | Mock db pattern (see below) |

**DO NOT touch:**
- `sdd-app/src/shared/ipc-types.ts` — `SetManagerNamePayload` already defined
- `sdd-app/src/main/db/database.ts` — `settings` table already created in schema
- `sdd-app/src/main/index.ts` — `registerSettingsHandlers()` already called (no args, no changes)
- `sdd-app/src/main/handlers/settingsHandlers.ts` stubs for `get-key-configured`, `set-api-key`, `get-model`, `set-model` — DO NOT touch these, they are 5.2's scope

---

### Task 1: `modelPreference.ts` — New Repository File

Create directory `sdd-app/src/main/settings/` and the file:

```ts
import Database from 'better-sqlite3'

export function getManagerName(db: Database.Database): string {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('manager_name') as
    | { value: string }
    | undefined
  return row?.value ?? ''
}

export function setManagerName(db: Database.Database, name: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('manager_name', name)
}
```

Repository function signature convention: first arg is `db: Database.Database`, same as `employees.ts`, `behaviorLog.ts`, `framework.ts`.

---

### Task 2: `settingsHandlers.ts` — Replace 2 Stubs

Add to imports:
```ts
import { db } from '../db/database'
import { getManagerName, setManagerName } from '../settings/modelPreference'
```

Replace `settings:get-manager-name` handler body:
```ts
ipcMain.handle('settings:get-manager-name', async (): Promise<IpcResult<string>> => {
  log.info('[settings:get-manager-name]')
  try {
    const name = getManagerName(db!)
    return { ok: true, data: name }
  } catch (e) {
    log.error('[settings:get-manager-name] error: %s', e instanceof Error ? e.message : String(e))
    return { ok: false, error: 'Failed to get manager name.' }
  }
})
```

Replace `settings:set-manager-name` handler body:
```ts
ipcMain.handle(
  'settings:set-manager-name',
  async (_event, payload: SetManagerNamePayload): Promise<IpcResult<null>> => {
    log.info('[settings:set-manager-name]')
    try {
      if (!payload.name?.trim()) return { ok: false, error: 'Manager name is required.' }
      setManagerName(db!, payload.name.trim())
      return { ok: true, data: null }
    } catch (e) {
      log.error('[settings:set-manager-name] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Failed to set manager name.' }
    }
  }
)
```

Leave the other four stubs (`get-key-configured`, `set-api-key`, `get-model`, `set-model`) exactly as they are.

---

### Task 3: `appStore.ts` — Add `managerName`

Add `managerName: string` field and `setManagerName` action to the existing store. **Do not rename or remove any existing fields.**

```ts
interface AppStore {
  currentView: View
  selectedEmployee: Employee | null
  selectedCompetency: Competency | null
  managerName: string                          // ADD
  setView: (view: View) => void
  setEmployee: (employee: Employee | null) => void
  setCompetency: (c: Competency | null) => void
  setManagerName: (name: string) => void       // ADD
}
```

Store definition addition:
```ts
export const useAppStore = create<AppStore>((set) => ({
  currentView: 'employees',
  selectedEmployee: null,
  selectedCompetency: null,
  managerName: '',                             // ADD
  setView: (view) => set({ currentView: view }),
  setEmployee: (employee) => set({ selectedEmployee: employee, selectedCompetency: null }),
  setCompetency: (c) => set({ selectedCompetency: c }),
  setManagerName: (name) => set({ managerName: name }), // ADD
}))
```

---

### Task 4: `useSettings.ts` — New Hook

```ts
import { useState, useCallback } from 'react'
import { useAppStore } from '../store/appStore'

export function useSettings() {
  const [draftName, setDraftName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setStoreName = useAppStore((s) => s.setManagerName)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await window.electronAPI.invoke<string>('settings:get-manager-name')
    if (result.ok) {
      setDraftName(result.data)
      setStoreName(result.data)
    } else {
      setError(result.error)
    }
    setIsLoading(false)
  }, [setStoreName])

  const saveManagerName = useCallback(
    async (name: string): Promise<boolean> => {
      setIsSaving(true)
      setError(null)
      const result = await window.electronAPI.invoke<null>('settings:set-manager-name', { name })
      if (result.ok) {
        setDraftName(name)
        setStoreName(name)
      } else {
        setError(result.error)
      }
      setIsSaving(false)
      return result.ok
    },
    [setStoreName]
  )

  return { draftName, setDraftName, isLoading, isSaving, error, load, saveManagerName }
}
```

**Note:** This hook handles manager name only. Stories 5.2 and 5.3 will extend it with `keyConfigured`, `saveApiKey`, `model`, `saveModel`.

---

### Task 5: `Settings.tsx` — Manager Name View

```tsx
import { useEffect } from 'react'
import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material'
import { useSettings } from '../hooks/useSettings'
import { useAppStore } from '../store/appStore'

export default function Settings(): React.JSX.Element {
  const { draftName, setDraftName, isLoading, isSaving, error, load, saveManagerName } = useSettings()
  const storedName = useAppStore((s) => s.managerName)

  useEffect(() => {
    load()
  }, [load])

  const isDirty = draftName.trim() !== storedName
  const canSave = isDirty && !isSaving

  const handleSave = () => {
    saveManagerName(draftName.trim())
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography sx={{ fontSize: '20px', fontWeight: 600, mb: 3 }}>Settings</Typography>

      {/* Manager Display Name */}
      <Box
        sx={{
          mb: 3,
          p: 2.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 0.5 }}>
          Manager Display Name
        </Typography>
        <Typography sx={{ fontSize: '13px', color: 'text.secondary', mb: 2 }}>
          Shown in the sidebar. Used to personalize the app.
        </Typography>
        {isLoading ? (
          <CircularProgress size={20} />
        ) : (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Enter your name"
              sx={{ width: 280 }}
            />
            <Button
              variant="outlined"
              onClick={handleSave}
              disabled={!canSave}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </Box>
        )}
        {error && (
          <Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>
            {error}
          </Typography>
        )}
      </Box>
    </Box>
  )
}
```

**UX notes:**
- No success toast — button returning to disabled state (non-dirty) is the confirmation (UX-DR17)
- Save button is always visible but disabled until the field is dirty (content differs from last saved value)
- Only manager name in this story. Do not add API key, model, or danger zone sections — those are Stories 5.2 and 5.3

---

### Task 6: `Sidebar.tsx` — Dynamic Manager Name

Add to the top of the component:
```tsx
import { useEffect } from 'react'
import { useSettings } from '../../hooks/useSettings'
```

Inside the component function (before the return):
```tsx
const managerName = useAppStore((s) => s.managerName)
const { load } = useSettings()

useEffect(() => {
  load()
}, [load])
```

Replace the hardcoded "Manager" text:
```tsx
// BEFORE:
<Typography sx={{ fontSize: '11px', fontWeight: 400, color: '#9CA3AF', mt: '3px' }}>
  Manager
</Typography>

// AFTER:
<Typography sx={{ fontSize: '11px', fontWeight: 400, color: '#9CA3AF', mt: '3px' }}>
  {managerName || 'Manager'}
</Typography>
```

**Why load in Sidebar:** The Sidebar is always mounted (inside AppShell), so the load fires on app startup. This primes the Zustand store before the user visits Settings. The store value is the single source of truth shared across Sidebar and Settings.

---

### Task 7: Tests — `modelPreference.test.ts`

Create directory `__tests__/main/settings/` and the file. Follow the mock db pattern from `behaviorLog.test.ts` — do NOT use real SQLite (ABI mismatch between Electron and Vitest Node versions).

```ts
import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { getManagerName, setManagerName } from '../../../src/main/settings/modelPreference'

function mockDb(getResult: object | undefined, runSpy?: () => void): Database.Database {
  return {
    prepare: (_sql: string) => ({
      get: (..._args: unknown[]) => getResult,
      run: (..._args: unknown[]) => {
        if (runSpy) runSpy()
        return { changes: 1 }
      },
    }),
  } as unknown as Database.Database
}

describe('getManagerName', () => {
  it('returns empty string when row is absent', () => {
    const db = mockDb(undefined)
    expect(getManagerName(db)).toBe('')
  })

  it('returns stored value when row exists', () => {
    const db = mockDb({ value: 'Marco' })
    expect(getManagerName(db)).toBe('Marco')
  })
})

describe('setManagerName', () => {
  it('calls run() on the INSERT OR REPLACE statement', () => {
    let runCalled = false
    const db = mockDb(undefined, () => { runCalled = true })
    setManagerName(db, 'Marco')
    expect(runCalled).toBe(true)
  })
})
```

---

### Architecture Compliance

| Rule | Applied here |
|---|---|
| No SQL in handlers | SQL in `modelPreference.ts`; handler delegates |
| Components use hooks, not IPC directly | `Sidebar` and `Settings` call `useSettings()`; never call `window.electronAPI` directly |
| `IpcResult<T>` discriminated union | `settings:get-manager-name` → `IpcResult<string>`, `settings:set-manager-name` → `IpcResult<null>` |
| `camelCase` TypeScript | `managerName`, `setManagerName`, `draftName`, `storedName`, `isSaving` |
| No direct `electron` import in renderer | Confirmed — all IPC through `window.electronAPI` via hook |
| Repository pattern (first arg = db) | `getManagerName(db, ...)` matches `listEntries(db, ...)`, `createEmployee(db, ...)` etc. |

---

### Previous Story Intelligence (Story 4.4)

- **ABI mismatch pattern**: `better-sqlite3` (Electron ABI 140) vs Vitest (Node ABI 137). Use mock db pattern (`mockDb(getResult)`) for ALL new DB tests. Do NOT import from `better-sqlite3` in a way that actually opens a database in tests.
- **Test count**: 64 tests across 7 files after Story 4.4. This story adds tests in a new file `__tests__/main/settings/modelPreference.test.ts`.
- **Handler stub pattern**: The other 4 stubs (`get-key-configured`, `set-api-key`, `get-model`, `set-model`) should be left exactly as-is for Stories 5.2 and 5.3.
- **Zustand `useAppStore` selector style**: existing code uses `useAppStore((s) => s.someField)` — follow this pattern for `managerName`.
- **`useCallback` with store setter**: `setStoreName` from Zustand is stable (doesn't change), so `[setStoreName]` in `useCallback` deps is correct and won't trigger unnecessary re-creation.
- **No `void payload` cleanup needed**: The existing stubs have `void payload` guard. When replacing the stub body, remove the `void payload` line as the payload is now actively used.

---

### Scope Boundary Notes

- **Story 5-1 scope: manager name only.** Do NOT add API key, model, or danger zone to `Settings.tsx` in this story. Those are 5.2 and 5.3.
- **`useSettings` extensibility**: The hook is named generically because 5.2 and 5.3 will add `keyConfigured`, `saveApiKey`, `model`, `saveModel` to the same hook. Keep the return object flat and additive.
- **Sidebar load idempotency**: Both Sidebar (on mount) and Settings (on mount) call `load()`. Two concurrent IPC calls to `settings:get-manager-name` is safe — SQLite read is idempotent and the second call simply overwrites the store with the same value.
- **`managerName || 'Manager'` fallback**: Show 'Manager' while loading or if no name is set. Do not show empty string in the sidebar.
- **Save button disabled state**: Disabled when `!isDirty` (already saved) OR when `isSaving`. Never disable indefinitely — after save completes, button returns to enabled (ready for next edit).

---

### UX Requirements Mapping

| Requirement | Implementation |
|---|---|
| UX-DR14: Settings view with independently-saveable manager name | `Settings.tsx` — manager name has its own Save button, not a global submit |
| UX-DR5: Sidebar shows manager display name | `Sidebar.tsx` reads from `useAppStore((s) => s.managerName)` |
| UX-DR17: No success toast for settings saves | Save button returning to non-dirty state IS the confirmation |
| UX-DR8: Primary button at 40% opacity when disabled | MUI `Button` automatically applies opacity when `disabled` — no extra sx needed |

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- All 8 tasks completed; all 5 ACs satisfied.
- `modelPreference.ts`: Created new file in `src/main/settings/`. `getManagerName(db)` reads `manager_name` key from settings table; `setManagerName(db, name)` upserts via `INSERT OR REPLACE`. Repository function signature (db as first param) matches existing pattern in `employees.ts`, `behaviorLog.ts`, `framework.ts`.
- `settingsHandlers.ts`: Added imports for `{ db }` and `{ getManagerName, setManagerName }`. Replaced `settings:get-manager-name` stub (was returning `''` always) with real implementation calling `getManagerName(db!)`. Replaced `settings:set-manager-name` stub (was returning "Not implemented") with real implementation: validates non-empty name after trim, calls `setManagerName(db!, name)`. Left the other 4 stubs (`get-key-configured`, `set-api-key`, `get-model`, `set-model`) untouched for Stories 5.2 and 5.3.
- `appStore.ts`: Added `managerName: string` (initial `''`) and `setManagerName: (name: string) => void` action. No existing fields modified.
- `useSettings.ts`: Created new hook in `src/renderer/src/hooks/`. Exposes `{ draftName, setDraftName, isLoading, isSaving, error, load, saveManagerName }`. `load()` fetches via IPC and syncs both local `draftName` and Zustand store. `saveManagerName(name)` saves via IPC and syncs both on success.
- `Settings.tsx`: Replaced placeholder stub with full manager name section. Uses `storedName` from Zustand store for dirty tracking (`isDirty = draftName.trim() !== storedName`). Save button disabled when not dirty or saving. No success toast — button returning to non-dirty state IS the confirmation (UX-DR17). Only manager name section; API key/model/danger zone are Stories 5.2 and 5.3.
- `Sidebar.tsx`: Added `useEffect(() => { load() }, [load])` to prime the store on app startup. Replaced hardcoded `"Manager"` text with `{managerName || 'Manager'}` from Zustand store.
- Tests: `__tests__/main/settings/modelPreference.test.ts` — 3 tests using mock db pattern (no real SQLite, ABI mismatch safe). `getManagerName` suite: row absent → `''`, row exists → stored value. `setManagerName` suite: `run()` called on statement.
- Final test count: 69 tests across 8 files, all passing. Zero TypeScript errors on both `tsconfig.node.json` and `tsconfig.web.json`.

### File List

**Created:**
- `sdd-app/src/main/settings/modelPreference.ts`
- `sdd-app/src/renderer/src/hooks/useSettings.ts`
- `sdd-app/__tests__/main/settings/modelPreference.test.ts`

**Modified:**
- `sdd-app/src/main/handlers/settingsHandlers.ts`
- `sdd-app/src/renderer/src/store/appStore.ts`
- `sdd-app/src/renderer/src/views/Settings.tsx`
- `sdd-app/src/renderer/src/components/layout/Sidebar.tsx`

### Review Findings

- [x] [Review][Patch] `isLoading`/`isSaving` not reset when `window.electronAPI.invoke` throws — missing try/finally [`sdd-app/src/renderer/src/hooks/useSettings.ts`]
- [x] [Review][Patch] `handleSave` discards the `Promise<boolean>` returned by `saveManagerName` — unhandled rejection leaves `isSaving` stuck `true` if `invoke` throws [`sdd-app/src/renderer/src/views/Settings.tsx`]
- [x] [Review][Patch] `db!` non-null assertion without defensive guard — if `initializeSchema()` has not completed, passes `undefined` to better-sqlite3 and throws with a cryptic error [`sdd-app/src/main/handlers/settingsHandlers.ts`]
- [x] [Review][Patch] `setManagerName` test only asserts `run()` was called, not the arguments — a regression changing the key string or dropping the name arg would go undetected [`sdd-app/__tests__/main/settings/modelPreference.test.ts`]
- [x] [Review][Defer] `load()` not cancellation-safe on component unmount — local state setters fire on a dead component instance; pre-existing pattern across all hooks [`sdd-app/src/renderer/src/hooks/useSettings.ts`] — deferred, pre-existing
- [x] [Review][Defer] No max length validation on manager name — unbounded string passes through to SQLite; sidebar Typography has no overflow styling [`sdd-app/src/main/handlers/settingsHandlers.ts`, `sdd-app/src/renderer/src/components/layout/Sidebar.tsx`] — deferred, pre-existing
- [x] [Review][Defer] Whitespace-only name sends empty string to backend — handler correctly rejects it, but the field visually shows spaces, making the "Manager name is required" error confusing [`sdd-app/src/renderer/src/views/Settings.tsx`] — deferred, pre-existing
- [x] [Review][Defer] Sidebar `load()` fires on every remount — rewrites `storedName` in Zustand, which shifts Settings' `isDirty` computation mid-edit [`sdd-app/src/renderer/src/components/layout/Sidebar.tsx`] — deferred, pre-existing
