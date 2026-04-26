# Story 2.2: Add Employee

Status: done

## Story

As a manager,
I want to add a new employee with their name and competency level,
so that I can register team members and begin logging their behaviors.

## Acceptance Criteria

1. `sdd-app/src/main/db/employees.ts` exports `createEmployee(db: Database.Database, name: string, level: CompetencyLevel): Employee` — inserts a new row and returns the created `Employee` object with the generated `id` and `createdAt`.

2. `sdd-app/src/main/handlers/employeeHandlers.ts` `employee:create` handler validates that `name` is non-empty (after trim) and `level` is one of `'A'|'B'|'C'|'D'`, then delegates to `createEmployee` and returns `{ ok: true, data: Employee }`.

3. When the handler is invoked with an empty name, it returns `{ ok: false, error: 'Employee name is required.' }` — without writing to the database.

4. `sdd-app/src/renderer/src/hooks/useEmployees.ts` exports a `create(name: string, level: CompetencyLevel): Promise<boolean>` function — invokes `employee:create` via `window.electronAPI.invoke`, on success prepends the returned `Employee` to the `employees` array and returns `true`; on failure sets `error` and returns `false`. Does NOT set `isLoading` during create (avoids collapsing the dialog into a spinner).

5. In `sdd-app/src/renderer/src/views/EmployeeList.tsx`, clicking any "+ Add Employee" button (both the empty-state button and the table-header button) opens an MUI `Dialog` containing a name `TextField` (autofocused) and a level `Select` with options A/B/C/D. The primary "Save" button (`variant="contained"`) is disabled when name is empty OR level is unselected (UX-DR8).

6. On successful save the dialog closes, name/level fields reset, and the new employee appears immediately at the top of the table — no page reload, no success toast (UX-DR17). If save fails, the dialog stays open and the error message renders inside the dialog.

## Tasks / Subtasks

- [x] Task 1: Add `createEmployee` to repository and write tests — RED phase (AC: 1)
  - [x] In `sdd-app/__tests__/main/db/employees.test.ts`: add `describe('createEmployee', ...)` block with mock DB — test returns camelCase `Employee` with correct id, name, level, createdAt
  - [x] Implement `createEmployee(db, name, level)` in `sdd-app/src/main/db/employees.ts` using INSERT + SELECT by lastInsertRowid (injection pattern, not global db import)
  - [x] Run tests: new tests must pass

- [x] Task 2: Wire `employee:create` handler (AC: 2, 3)
  - [x] In `sdd-app/src/main/handlers/employeeHandlers.ts`: add `createEmployee` to the import from `../db/employees`
  - [x] Replace the `return { ok: false, error: 'Not implemented.' }` stub inside `employee:create` (lines 26-35) with: trim+validate `name`, validate `level`, call `createEmployee(db!, ...)`, return `{ ok: true, data: employee }`
  - [x] Leave `employee:update` and `employee:delete` handlers unchanged (Stories 2.3, 2.4)

- [x] Task 3: Extend `useEmployees` hook with `create` (AC: 4)
  - [x] In `sdd-app/src/renderer/src/hooks/useEmployees.ts`: add `create` function using `useCallback`; clear error, invoke `employee:create`, on success prepend to `employees` via `setEmployees(prev => [result.data, ...prev])`; on failure set error; return boolean result; do NOT toggle `isLoading`
  - [x] Export `create` from the hook's return object

- [x] Task 4: Add dialog UI to EmployeeList (AC: 5, 6)
  - [x] In `sdd-app/src/renderer/src/views/EmployeeList.tsx`: add local state `dialogOpen`, `name`, `level`
  - [x] Wire both "+ Add Employee" buttons to open the dialog (replace `onClick={() => {}}` no-ops)
  - [x] Add MUI `Dialog` with `DialogTitle`, `DialogContent`, `DialogActions`; inside: autofocused `TextField` for name, `FormControl`+`Select`+`MenuItem` for level (A/B/C/D)
  - [x] Save button: `variant="contained"`, `disabled={!name.trim() || !level}`; onClick calls `create()`, on `true` → close+reset dialog
  - [x] Cancel button: `variant="outlined"`, closes and resets dialog
  - [x] If `error` is set while dialog is open, render `<Alert severity="error">{error}</Alert>` inside `DialogContent`; suppress the top-level error alert while dialog is open

- [x] Task 5: Typecheck (AC: 1–6)
  - [x] `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] `npm run test` — all tests pass, zero regressions

### Review Findings

- [x] [Review][Patch] `mapToEmployee` called unconditionally on potentially-undefined `.get()` result — INSERT succeeds but SELECT returns undefined if row is missing; crash propagates as generic 'Failed to create employee.' [`sdd-app/src/main/db/employees.ts`]
- [x] [Review][Patch] Error not cleared on dialog close — after a failed save, canceling the dialog leaves `error` set; `!dialogOpen` makes `if (error && !dialogOpen)` true and renders a full-page error screen instead of the employee list; violates AC6 [`sdd-app/src/renderer/src/views/EmployeeList.tsx`, `sdd-app/src/renderer/src/hooks/useEmployees.ts`]
- [x] [Review][Patch] `handleSave` allows double-submission — no in-flight guard; rapid double-click calls `create` twice before first resolves, potentially inserting duplicate employees [`sdd-app/src/renderer/src/views/EmployeeList.tsx`]
- [x] [Review][Defer] `db!` non-null assertion — pre-existing pattern across all handlers [`sdd-app/src/main/handlers/employeeHandlers.ts`] — deferred, pre-existing
- [x] [Review][Defer] `payload.name` logged before null/undefined payload check — IPC boundary integrity assumed by preload setup [`sdd-app/src/main/handlers/employeeHandlers.ts`] — deferred, pre-existing
- [x] [Review][Defer] Test mock SQL matching fragility — `trimStart().startsWith('INSERT')` breaks on lower-case or prefixed SQL [`sdd-app/__tests__/main/db/employees.test.ts`] — deferred, pre-existing
- [x] [Review][Defer] No `maxLength` on name `TextField` — DB schema should enforce; out of story scope [`sdd-app/src/renderer/src/views/EmployeeList.tsx`] — deferred, pre-existing

## Dev Notes

### CRITICAL: Repository Injection Pattern — Do NOT Import Global `db`

`employees.ts` functions accept `db: Database.Database` as the first parameter. Do NOT import `db` from `database.ts` inside `employees.ts`. The handler already has the `db` import and passes it via `createEmployee(db!, ...)`.

```ts
// employees.ts — ADD this function (EmployeeRow and mapToEmployee are already defined)
export function createEmployee(db: Database.Database, name: string, level: CompetencyLevel): Employee {
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO employees (name, level) VALUES (?, ?)'
  ).run(name, level)
  const row = db.prepare(
    'SELECT id, name, level, created_at FROM employees WHERE id = ?'
  ).get(Number(lastInsertRowid)) as EmployeeRow
  return mapToEmployee(row)
}
```

`Number(lastInsertRowid)` handles both `number` and `BigInt` return from better-sqlite3.

### CRITICAL: Handler Stub Location

The `employee:create` handler stub is at [sdd-app/src/main/handlers/employeeHandlers.ts:26-35]. Replace only the stub body inside the `try` block:

```ts
// BEFORE (lines 28-29):
return { ok: false, error: 'Not implemented.' }

// AFTER:
if (!payload.name?.trim()) return { ok: false, error: 'Employee name is required.' }
if (!['A', 'B', 'C', 'D'].includes(payload.level)) return { ok: false, error: 'Invalid level.' }
const employee = createEmployee(db!, payload.name.trim(), payload.level)
return { ok: true, data: employee }
```

Also update the import at line 5:
```ts
// BEFORE:
import { listEmployees } from '../db/employees'

// AFTER:
import { listEmployees, createEmployee } from '../db/employees'
```

### CRITICAL: Renderer Source Root — Double `src/`

All renderer files live under `sdd-app/src/renderer/src/` (double `src/` — electron-vite convention). Confirmed by Story 2.1.

### CRITICAL: No `isLoading` During Create

If `isLoading = true` is set during `create()`, EmployeeList returns `<CircularProgress />` which unmounts the Dialog. The SQLite insert is near-instantaneous over IPC, so loading state for create is unnecessary. `create()` must NOT touch `isLoading`.

### Hook Extension — Exact Pattern

```ts
// src/renderer/src/hooks/useEmployees.ts
import { useState, useCallback } from 'react'
import type { Employee, CompetencyLevel } from '../../../shared/ipc-types'

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.invoke<Employee[]>('employee:list')
      if (result.ok) setEmployees(result.data)
      else setError(result.error)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const create = useCallback(async (name: string, level: CompetencyLevel): Promise<boolean> => {
    setError(null)
    try {
      const result = await window.electronAPI.invoke<Employee>('employee:create', { name, level })
      if (result.ok) {
        setEmployees(prev => [result.data, ...prev])
        return true
      }
      setError(result.error)
      return false
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
      return false
    }
  }, [])

  return { employees, isLoading, error, load, create }
}
```

### Dialog UI — Required MUI Imports

```ts
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, InputLabel, MenuItem,
  Paper, Select, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import type { CompetencyLevel } from '../../../shared/ipc-types'
```

`SelectChangeEvent` is needed for the `Select` `onChange` handler type.

### Dialog State and Handlers

```tsx
const [dialogOpen, setDialogOpen] = useState(false)
const [name, setName] = useState('')
const [level, setLevel] = useState<CompetencyLevel | ''>('')

const handleOpenDialog = () => setDialogOpen(true)

const handleCloseDialog = () => {
  setDialogOpen(false)
  setName('')
  setLevel('')
}

const handleSave = async () => {
  const ok = await create(name.trim(), level as CompetencyLevel)
  if (ok) handleCloseDialog()
}
```

### Error Rendering — Split Display Logic

When dialog is open, suppress the top-level error view (so the Dialog remains visible):
```tsx
if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
if (error && !dialogOpen) return <Alert severity="error">{error}</Alert>
```

Inside `DialogContent`, below the form fields:
```tsx
{error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
```

### Save Button Disabled State

MUI's `disabled` prop handles visual distinction. Per UX-DR8, primary button should render at 40% opacity when required fields are incomplete. Add `sx` override:
```tsx
<Button
  variant="contained"
  disabled={!name.trim() || !level}
  sx={{ opacity: (!name.trim() || !level) ? 0.4 : 1 }}
  onClick={handleSave}
>
  Save
</Button>
```

### Test Pattern for `createEmployee` — ABI Mismatch Workaround

`better-sqlite3` ABI mismatch (Electron Node 22 ABI 140 vs system Node 20 ABI 137) prevents loading the native module in Vitest. Use a mock DB that simulates `prepare().run()` and `prepare().get()` calls, same approach as Story 2.1.

Add to `sdd-app/__tests__/main/db/employees.test.ts`:

```ts
import { createEmployee } from '../../../src/main/db/employees'

describe('createEmployee', () => {
  it('returns a camelCase Employee with generated id', () => {
    const mockDb = {
      prepare: (sql: string) => {
        if (sql.startsWith('INSERT')) {
          return { run: () => ({ lastInsertRowid: 7, changes: 1 }) }
        }
        // SELECT by id
        return {
          get: () => ({ id: 7, name: 'Alice', level: 'A', created_at: '2026-04-26 10:00:00' })
        }
      }
    } as any

    const emp = createEmployee(mockDb, 'Alice', 'A')
    expect(emp.id).toBe(7)
    expect(emp.name).toBe('Alice')
    expect(emp.level).toBe('A')
    expect(emp.createdAt).toBeDefined()
    expect((emp as any).created_at).toBeUndefined()
  })
})
```

### Scope Boundaries

**Implement in this story:**
- `createEmployee` repository function in `employees.ts`
- `employee:create` handler implementation (replace `Not implemented.` stub)
- `create()` function in `useEmployees` hook
- "+ Add Employee" dialog with name + level fields in `EmployeeList.tsx`
- Save/Cancel actions, disabled Save logic, error display inside dialog

**Do NOT implement:**
- Hover-reveal edit/delete buttons on rows — Stories 2.3 and 2.4
- `employee:update` or `employee:delete` handler stubs — leave as `Not implemented.`
- Navigation to EmployeeDetail on row click — Story 4.1
- Inline row editing for add — the form is a Dialog, not an inline row (inline edit is for Story 2.3)

### All Required Types Already Exist

[sdd-app/src/shared/ipc-types.ts] defines `Employee`, `CompetencyLevel`, `CreateEmployeePayload`, `IpcResult`. Import from there — create no new types.

### Files Modified/Created

**Modified files:**
- `sdd-app/src/main/db/employees.ts` — add `createEmployee` function
- `sdd-app/src/main/handlers/employeeHandlers.ts` — add import, implement `employee:create` stub
- `sdd-app/src/renderer/src/hooks/useEmployees.ts` — add `create` function, export it
- `sdd-app/src/renderer/src/views/EmployeeList.tsx` — add dialog state/handlers, wire buttons, render Dialog
- `sdd-app/__tests__/main/db/employees.test.ts` — add `createEmployee` test block

**Do NOT touch:**
- `sdd-app/src/main/db/database.ts` — schema complete
- `sdd-app/src/shared/ipc-types.ts` — all types defined
- `sdd-app/src/preload/index.ts` — all channels already exposed
- `sdd-app/src/main/index.ts` — all handlers already registered
- `sdd-app/src/renderer/src/store/appStore.ts`
- `sdd-app/src/renderer/src/App.tsx`

### Previous Story Intelligence

From Story 2.1 review findings (applied and deferred):
- **Applied:** `isLoading` must use `try/finally` to reset on errors — confirmed present in current `useEmployees.ts`
- **Applied:** Use explicit column list (`SELECT id, name, level, created_at`) not `SELECT *`
- **Deferred (pre-existing):** `employees` state not cleared before reload — stale data flash. Story 2.2 avoids this by using optimistic prepend instead of calling `load()` after create.
- **Deferred (pre-existing):** Concurrent `load()` calls race condition — Story 2.2 does not add new `load()` triggers (create uses optimistic update), so this is still not triggerable.

### References

- [epics.md#Story 2.2] — acceptance criteria source
- [architecture.md#API & Communication Patterns — IPC Handler Structure] — validate → delegate → return pattern
- [architecture.md#Frontend Architecture — IPC Invocation Hook Structure] — hook pattern
- [architecture.md#Enforcement Guidelines] — "Never write SQL inside IPC handler functions"; "Never import from electron in src/renderer/"
- [architecture.md#Format Patterns] — camelCase over IPC, snake_case in DB only
- [ux-design-specification.md#Button Hierarchy] — UX-DR8: one primary per screen, 40% opacity when disabled
- [ux-design-specification.md#Feedback Patterns] — UX-DR17: no success toasts for data entry
- [2-1-employee-list-view.md#Dev Notes] — ABI mismatch workaround, double src/ renderer path, injection pattern

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- ABI mismatch (Electron Node 22 ABI 140 vs system Node 20 ABI 137) prevents real better-sqlite3 in Vitest. `createEmployee` tests use a mock DB that simulates `prepare().run()` (INSERT) and `prepare().get()` (SELECT by id), testing the mapping logic without the native module.
- `isLoading` intentionally NOT set during `create()`: setting it would unmount the Dialog (EmployeeList returns `<CircularProgress />` when `isLoading` is true). The synchronous SQLite insert over IPC is sub-millisecond; no loading indicator needed for create.

### Completion Notes List

- Added `createEmployee(db, name, level): Employee` to `sdd-app/src/main/db/employees.ts` using injection pattern (db as parameter, not imported from database.ts). Uses INSERT + SELECT by lastInsertRowid with `Number()` cast to handle both `number` and `BigInt` returns from better-sqlite3.
- Updated `sdd-app/src/main/handlers/employeeHandlers.ts`: added `createEmployee` import, implemented `employee:create` handler with name trim+validation and level enum validation; `employee:update` and `employee:delete` stubs unchanged.
- Extended `sdd-app/src/renderer/src/hooks/useEmployees.ts`: added `create(name, level): Promise<boolean>` with optimistic prepend (`setEmployees(prev => [result.data, ...prev])`); does not set `isLoading` to keep dialog visible during the fast IPC call; clears error on each call.
- Rewrote `sdd-app/src/renderer/src/views/EmployeeList.tsx`: added `dialogOpen`/`name`/`level` local state; both "+ Add Employee" buttons (empty state and table) open dialog; MUI Dialog with autofocused TextField + FormControl/Select for level A/B/C/D; Save disabled+40%-opacity when either field empty; on success dialog closes and employee prepends to list; error shown inside dialog when open, in main view when closed.
- Added 2 tests to `sdd-app/__tests__/main/db/employees.test.ts` covering camelCase mapping and name/level passthrough.
- Typecheck: zero errors (tsconfig.node.json + tsconfig.web.json). Tests: 18/18 pass (16 pre-existing + 2 new), zero regressions.

### File List

- `sdd-app/src/main/db/employees.ts` (modified — added `createEmployee`)
- `sdd-app/src/main/handlers/employeeHandlers.ts` (modified — added import, implemented `employee:create`)
- `sdd-app/src/renderer/src/hooks/useEmployees.ts` (modified — added `create`, added `CompetencyLevel` import)
- `sdd-app/src/renderer/src/views/EmployeeList.tsx` (modified — dialog state, MUI Dialog, wired buttons)
- `sdd-app/__tests__/main/db/employees.test.ts` (modified — added `createEmployee` import and 2 tests)
