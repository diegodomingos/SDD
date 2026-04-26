# Story 2.4: Remove Employee

Status: done

## Story

As a manager,
I want to remove an employee from the system,
so that I can keep my employee list accurate as my team changes.

## Acceptance Criteria

1. `sdd-app/src/main/db/employees.ts` exports `deleteEmployee(db: Database.Database, id: number): void` — executes `DELETE FROM employees WHERE id = ?`. `foreign_keys = ON` (already set in `database.ts:12`) ensures `behavior_log_entries` and `behavior_log_entry_competencies` rows cascade-delete automatically.

2. `sdd-app/src/main/handlers/employeeHandlers.ts` `employee:delete` handler validates that `id` is a positive integer, delegates to `deleteEmployee`, and returns `{ ok: true, data: null }` or `{ ok: false, error: string }`.

3. Each employee row in `EmployeeList` reveals a delete `IconButton` (`aria-label="Delete employee"`) on hover alongside the existing edit icon — minimum 40×40px target (UX-DR12).

4. Clicking the delete icon opens a `Dialog` confirmation: warns "All associated behavior log entries will also be deleted." — requires explicit "Delete" button confirmation before proceeding.

5. On confirmed deletion the employee row is removed from the list immediately. If no employees remain, the empty state renders automatically (existing `employees.length === 0` branch covers this — no special code needed).

## Tasks / Subtasks

- [x] Task 1: Add `deleteEmployee` to repository and write tests — RED phase (AC: 1)
  - [x] In `sdd-app/__tests__/main/db/employees.test.ts`: add `deleteEmployee` to the import; add `describe('deleteEmployee', ...)` block (see Dev Notes for exact mock and test code)
  - [x] Add `deleteEmployee(db, id): void` to `sdd-app/src/main/db/employees.ts` after `updateEmployee` (see Dev Notes for exact code)
  - [x] Run `npm run test` — new tests must pass, zero regressions

- [x] Task 2: Wire `employee:delete` handler (AC: 2)
  - [x] In `sdd-app/src/main/handlers/employeeHandlers.ts`: add `deleteEmployee` to the import from `../db/employees` (line 4)
  - [x] Replace `return { ok: false, error: 'Not implemented.' }` stub inside `employee:delete` (line 62) with: validate id → call `deleteEmployee(db!, payload.id)` → return `{ ok: true, data: null }` (see Dev Notes)

- [x] Task 3: Extend `useEmployees` hook with `remove` (AC: 5)
  - [x] In `sdd-app/src/renderer/src/hooks/useEmployees.ts`: add `remove` function using `useCallback` after `update`; clear error, invoke `employee:delete`, on success filter out deleted id from state; on failure set error; return boolean; do NOT set `isLoading` (see Dev Notes)
  - [x] Export `remove` from the return object

- [x] Task 4: Add delete icon and confirmation dialog to EmployeeList (AC: 3, 4, 5)
  - [x] Add `deleteConfirmId` state (`number | null`, initialized to `null`)
  - [x] Import `DeleteIcon` from `@mui/icons-material/Delete` and add `DialogContentText` to the `@mui/material` import block
  - [x] Add `remove` to `useEmployees` destructure
  - [x] Widen actions column header: `sx={{ width: 120 }}` (was `80` — two 40×40px buttons need more room)
  - [x] In the read row actions cell: render both edit icon AND delete icon when `hoveredId === emp.id` (see Dev Notes for exact JSX)
  - [x] Add `handleDeleteConfirm` async handler (see Dev Notes)
  - [x] Update top-level early-return error condition: add `&& deleteConfirmId === null` guard
  - [x] Add confirmation `Dialog` after the existing Add Employee Dialog (see Dev Notes for full JSX)

- [x] Task 5: Typecheck (AC: 1–5)
  - [x] `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] `npm run test` — all tests pass, zero regressions

## Dev Notes

### CRITICAL: Repository Injection Pattern — Same as Stories 2.2 and 2.3

`employees.ts` functions accept `db: Database.Database` as the first parameter. Do NOT import `db` from `database.ts` inside `employees.ts`.

```ts
// employees.ts — ADD after updateEmployee (line 43)
export function deleteEmployee(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM employees WHERE id = ?').run(id)
}
```

No SELECT after delete — returns `void`. `PRAGMA foreign_keys = ON` is set in `database.ts:12`, enabling the two `ON DELETE CASCADE` constraints:
- `behavior_log_entries.employee_id` → `database.ts:38` — deletes all log entries for the employee
- `behavior_log_entry_competencies.entry_id` → `database.ts:45` — deletes junction rows for each deleted entry

A single `DELETE FROM employees WHERE id = ?` cleans up everything. No manual cleanup code needed.

### CRITICAL: Handler Stub Location

The `employee:delete` stub is at `sdd-app/src/main/handlers/employeeHandlers.ts:57–68`. Replace only the stub body at line 62:

```ts
// BEFORE (line 62):
return { ok: false, error: 'Not implemented.' }

// AFTER:
if (!payload.id || !Number.isInteger(payload.id) || payload.id < 1) return { ok: false, error: 'Invalid employee id.' }
deleteEmployee(db!, payload.id)
return { ok: true, data: null }
```

Update import at line 4:
```ts
// BEFORE:
import { listEmployees, createEmployee, updateEmployee } from '../db/employees'

// AFTER:
import { listEmployees, createEmployee, updateEmployee, deleteEmployee } from '../db/employees'
```

`DeleteEmployeePayload` is ALREADY imported at line 10 — no change needed there.

### CRITICAL: No `isLoading` During `remove`

Same reasoning as `create` and `update`: setting `isLoading = true` would trigger the `<CircularProgress />` early-return, unmounting the table. SQLite delete is sub-millisecond over IPC. Do NOT touch `isLoading` in `remove()`.

### Hook Extension — `remove` Function

```ts
// Add in useEmployees.ts after the update useCallback
const remove = useCallback(async (id: number): Promise<boolean> => {
  setError(null)
  try {
    const result = await window.electronAPI.invoke<null>('employee:delete', { id })
    if (result.ok) {
      setEmployees(prev => prev.filter(e => e.id !== id))
      return true
    }
    setError(result.error)
    return false
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Unexpected error')
    return false
  }
}, [])
```

Add `remove` to the return object:
```ts
return { employees, isLoading, error, load, create, update, remove, clearError }
```

### EmployeeList — Required New Imports

```ts
// ADD to @mui/icons-material imports:
import DeleteIcon from '@mui/icons-material/Delete'

// ADD DialogContentText to the @mui/material import block (currently not imported):
// Find the existing import block and add DialogContentText to it
```

`@mui/icons-material` is ALREADY installed (Story 2.3 — do NOT reinstall). `DialogContentText` is in `@mui/material` but not currently imported in `EmployeeList.tsx` — add it to the existing destructured import.

### EmployeeList — New State and Handlers

```tsx
// ADD to useEmployees destructure (line 34):
const { employees, isLoading, error, load, create, update, remove, clearError } = useEmployees()

// ADD new state after existing state declarations:
const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

// ADD handler:
const handleDeleteConfirm = async () => {
  if (deleteConfirmId === null) return
  const ok = await remove(deleteConfirmId)
  if (ok) setDeleteConfirmId(null)
}
```

### EmployeeList — Updated Error Early-Return (line 120)

```tsx
// BEFORE:
if (error && !dialogOpen && editingId === null) {
  return <Alert severity="error">{error}</Alert>
}

// AFTER:
if (error && !dialogOpen && editingId === null && deleteConfirmId === null) {
  return <Alert severity="error">{error}</Alert>
}
```

### EmployeeList — Updated Actions Column Header

```tsx
// BEFORE (line 152):
<TableCell sx={{ width: 80 }} />

// AFTER:
<TableCell sx={{ width: 120 }} />
```

### EmployeeList — Updated Read Row Actions Cell

Replace the existing actions cell in the non-editing row (currently lines 219–229 — shows only EditIcon on hover):

```tsx
<TableCell>
  {hoveredId === emp.id && (
    <>
      <IconButton
        aria-label="Edit employee"
        size="medium"
        onClick={() => handleEditOpen(emp)}
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        aria-label="Delete employee"
        size="medium"
        onClick={() => setDeleteConfirmId(emp.id)}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </>
  )}
</TableCell>
```

### EmployeeList — Confirmation Dialog

Add after the existing Add Employee `<Dialog>` block (before the closing `</Box>`):

```tsx
<Dialog
  open={deleteConfirmId !== null}
  onClose={() => { setDeleteConfirmId(null); clearError() }}
  maxWidth="xs"
  fullWidth
>
  <DialogTitle>Delete Employee</DialogTitle>
  <DialogContent>
    <DialogContentText>
      All associated behavior log entries will also be deleted. This cannot be undone.
    </DialogContentText>
    {error && deleteConfirmId !== null && (
      <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>
    )}
  </DialogContent>
  <DialogActions>
    <Button variant="outlined" onClick={() => { setDeleteConfirmId(null); clearError() }}>
      Cancel
    </Button>
    <Button
      variant="outlined"
      color="error"
      onClick={handleDeleteConfirm}
    >
      Delete
    </Button>
  </DialogActions>
</Dialog>
```

### Test Pattern for `deleteEmployee` — ABI Workaround Same as Previous Stories

```ts
// In sdd-app/__tests__/main/db/employees.test.ts
// ADD deleteEmployee to the top-level import:
import { listEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../../src/main/db/employees'

// ADD describe block after the updateEmployee tests:
describe('deleteEmployee', () => {
  it('executes DELETE for the given id without throwing', () => {
    const mockDb = {
      prepare: (_sql: string) => ({ run: () => ({ changes: 1 }) }),
    } as unknown as Database.Database
    expect(() => deleteEmployee(mockDb, 3)).not.toThrow()
  })

  it('returns void (undefined)', () => {
    const mockDb = {
      prepare: (_sql: string) => ({ run: () => ({ changes: 0 }) }),
    } as unknown as Database.Database
    const result = deleteEmployee(mockDb, 99)
    expect(result).toBeUndefined()
  })
})
```

### Scope Boundaries

**Implement in this story:**
- `deleteEmployee` repository function in `employees.ts`
- `employee:delete` handler implementation (replace `Not implemented.` stub)
- `remove()` function in `useEmployees` hook
- Delete `IconButton` on each read row in `EmployeeList.tsx` (alongside existing edit icon)
- Confirmation `Dialog` in `EmployeeList.tsx`
- `deleteConfirmId` state and `handleDeleteConfirm` handler

**Do NOT implement:**
- Navigation to employee detail on row click — Story 4.1
- Any changes to `employee:list`, `employee:create`, `employee:update`
- Schema changes — `ON DELETE CASCADE` is already defined in `database.ts`
- `@mui/icons-material` install — already done in Story 2.3

### Files Modified

- `sdd-app/src/main/db/employees.ts` — add `deleteEmployee`
- `sdd-app/src/main/handlers/employeeHandlers.ts` — add import, implement `employee:delete` stub
- `sdd-app/src/renderer/src/hooks/useEmployees.ts` — add `remove`, export it
- `sdd-app/src/renderer/src/views/EmployeeList.tsx` — add delete state, icons, confirm dialog, updated error guard, wider actions column
- `sdd-app/__tests__/main/db/employees.test.ts` — add `deleteEmployee` import and 2 tests

**Do NOT touch:**
- `sdd-app/src/main/db/database.ts` — schema + `foreign_keys = ON` already set
- `sdd-app/src/shared/ipc-types.ts` — `DeleteEmployeePayload` already defined
- `sdd-app/src/preload/index.ts` — `employee:delete` already exposed at line 7
- `sdd-app/src/main/index.ts` — `registerEmployeeHandlers()` already registered
- `sdd-app/package.json` — no new dependencies needed

### Review Findings

- [x] [Review][Decision] Silent success on non-existent id — dismissed: intentional idempotent delete; `{ ok: true }` on ghost delete is acceptable UX

- [x] [Review][Decision] No employee name in confirmation dialog — dismissed: user just clicked delete on the row; context is sufficient

- [x] [Review][Patch] No in-flight guard on Delete button — added `isDeleting` state; Delete button disabled during async operation [`EmployeeList.tsx:handleDeleteConfirm`]

- [x] [Review][Patch] Delete dialog can open during active inline edit — added `editingId === null` guard on Delete `onClick` [`EmployeeList.tsx:244`]

- [x] [Review][Defer] `db!` non-null assertion without runtime null guard [`employeeHandlers.ts:63`] — deferred, pre-existing

- [x] [Review][Defer] `payload` null/undefined check missing before `payload.id` access [`employeeHandlers.ts:62`] — deferred, pre-existing

- [x] [Review][Defer] `result.error` may be `undefined` when `ok === false` — `setError(result.error)` with no fallback string [`useEmployees.ts:63`] — deferred, pre-existing

- [x] [Review][Defer] No test for DB-throws path in `deleteEmployee` — only happy-path mock tested [`employees.test.ts`] — deferred, pre-existing

- [x] [Review][Defer] `payload.id` type validation fragility — no `typeof` guard; relies on `Number.isInteger` incidentally rejecting strings; TypeScript IPC types prevent in practice [`employeeHandlers.ts:62`] — deferred, pre-existing

- [x] [Review][Defer] `async` handler wraps synchronous `deleteEmployee` — consistent with pre-existing handler pattern [`employeeHandlers.ts:58`] — deferred, pre-existing

### All Required Infrastructure Already Exists

- `DeleteEmployeePayload { id: number }` — `src/shared/ipc-types.ts:59–61`, already imported in `employeeHandlers.ts:10`
- `employee:delete` channel — `src/preload/index.ts:7`, already exposed via `contextBridge`
- `employee:delete` handler — `employeeHandlers.ts:57–68`, registered via `registerEmployeeHandlers()` in `src/main/index.ts`
- `@mui/icons-material` package — installed in Story 2.3

### Previous Story Intelligence (from Story 2.3)

- **Applied:** Injection pattern — `deleteEmployee` takes `db: Database.Database` as first parameter; never import `db` inside `employees.ts`
- **Applied:** ABI mismatch — mock `prepare().run()` in tests; no real better-sqlite3 in Vitest
- **Applied:** `isLoading` NOT set during `remove()` — avoids unmounting the table
- **Applied:** `clearError()` called on dialog cancel — prevents stale error on next open
- **Applied:** `size="medium"` on `IconButton` — 40×40px minimum click target (UX-DR12 patch from Story 2.3 review)
- **Applied:** Guard against acting when state is already set (`deleteConfirmId === null` check in `handleDeleteConfirm`)
- **No new package install** — `@mui/icons-material` already in `package.json`

### UX Requirements

- **UX-DR8:** Delete confirms button uses `variant="outlined" color="error"` — Danger button pattern for destructive actions
- **UX-DR12:** Delete icon `size="medium"` on `IconButton` = 40×40px minimum click target
- **UX-DR17:** No success toast — employee disappearing from the list IS the confirmation
- **Confirmation dialog required** — employee delete has high blast radius (cascades to all log entries). This differs from behavior log entry delete in Story 4.4 (no dialog required per epics).

### References

- [epics.md#Story 2.4] — acceptance criteria source
- [database.ts:12] — `db.pragma('foreign_keys = ON')` enables CASCADE behavior
- [database.ts:38] — `behavior_log_entries.employee_id ... ON DELETE CASCADE`
- [database.ts:45] — `behavior_log_entry_competencies.entry_id ... ON DELETE CASCADE`
- [architecture.md#IPC Handler Structure] — validate → delegate → return pattern; SQL never in handler
- [ux-design-specification.md#Button Hierarchy] — UX-DR8: Danger = outlined red, destructive only
- [ux-design-specification.md#Component Strategy] — UX-DR12: hover-reveal, 40×40px click targets
- [2-3-edit-employee.md#Dev Notes] — ABI mismatch workaround, injection pattern, isLoading reasoning

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- ABI mismatch (Electron Node ABI 140 vs system Node ABI 137) prevents real better-sqlite3 in Vitest. `deleteEmployee` tests use a minimal mock that simulates `prepare().run()` for the DELETE statement — same workaround as Stories 2.2 and 2.3.
- `isLoading` intentionally NOT set during `remove()`: setting it would unmount the table (EmployeeList returns `<CircularProgress />` when `isLoading` is true). SQLite delete is sub-millisecond over IPC.

### Completion Notes List

- Added `deleteEmployee(db, id): void` to `sdd-app/src/main/db/employees.ts` using injection pattern (db as parameter). Single `DELETE FROM employees WHERE id = ?` — cascade handled by `PRAGMA foreign_keys = ON` already set in `database.ts:12`.
- Updated `sdd-app/src/main/handlers/employeeHandlers.ts`: added `deleteEmployee` import, implemented `employee:delete` handler replacing `Not implemented.` stub with id validation + delegation + `{ ok: true, data: null }`.
- Extended `sdd-app/src/renderer/src/hooks/useEmployees.ts`: added `remove(id): Promise<boolean>` with `.filter()` state update; does not set `isLoading`; clears error on each call; exported from return object.
- Updated `sdd-app/src/renderer/src/views/EmployeeList.tsx`: added `DeleteIcon` import and `DialogContentText` import; `deleteConfirmId` state; `handleDeleteConfirm` handler; hover-reveal `DeleteIcon` `IconButton` alongside edit icon (`aria-label="Delete employee"`, `size="medium"`); confirmation `Dialog` with cascade-delete warning and outlined red Delete button; actions column widened 80→120px; early-return error guard updated to also exclude `deleteConfirmId !== null`.
- Added 2 tests to `sdd-app/__tests__/main/db/employees.test.ts` covering no-throw and void return for `deleteEmployee`.
- Typecheck: zero errors (tsconfig.node.json + tsconfig.web.json). Tests: 23/23 pass (21 pre-existing + 2 new), zero regressions.

### File List

- `sdd-app/src/main/db/employees.ts` (modified — added `deleteEmployee`)
- `sdd-app/src/main/handlers/employeeHandlers.ts` (modified — added import, implemented `employee:delete`)
- `sdd-app/src/renderer/src/hooks/useEmployees.ts` (modified — added `remove`, exported it)
- `sdd-app/src/renderer/src/views/EmployeeList.tsx` (modified — delete state, icons, confirm dialog, wider actions column, updated error guard)
- `sdd-app/__tests__/main/db/employees.test.ts` (modified — added `deleteEmployee` import and 2 tests)
