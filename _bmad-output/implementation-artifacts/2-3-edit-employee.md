# Story 2.3: Edit Employee

Status: done

## Story

As a manager,
I want to edit an existing employee's name or assigned level,
so that I can correct mistakes or reflect a promotion without losing their logged history.

## Acceptance Criteria

1. `sdd-app/src/main/db/employees.ts` exports `updateEmployee(db: Database.Database, id: number, name: string, level: CompetencyLevel): Employee` — updates the row and returns the updated `Employee` object with camelCase mapping.

2. `sdd-app/src/main/handlers/employeeHandlers.ts` `employee:update` handler validates that `name` is non-empty (after trim) and `level` is one of `'A'|'B'|'C'|'D'`, delegates to `updateEmployee`, and returns `{ ok: true, data: Employee }` or `{ ok: false, error: string }`.

3. Each employee row in `EmployeeList` reveals an edit `IconButton` (`aria-label="Edit employee"`) on hover — minimum 40×40px target (UX-DR12).

4. Clicking the edit icon puts the row in inline edit mode: `TextField` pre-filled with `name`, level `Select` pre-filled with current `level` — with Save (✓) and Cancel (✕) `IconButton` actions visible inline.

5. On successful save the row exits edit mode and displays the updated values immediately — no page reload. If save fails, an error row appears below the editing row and the row stays in edit mode.

## Tasks / Subtasks

- [x] Task 1: Install `@mui/icons-material` (AC: 3, 4)
  - [x] `cd sdd-app && npm install @mui/icons-material`
  - [x] Verify `npx tsc --noEmit -p tsconfig.web.json --composite false` still passes (zero errors)

- [x] Task 2: Add `updateEmployee` to repository and write tests — RED phase (AC: 1)
  - [x] In `sdd-app/__tests__/main/db/employees.test.ts`: add `updateEmployee` to the import; add `createMockDbForUpdate` helper; add `describe('updateEmployee', ...)` block (see Dev Notes for mock pattern)
  - [x] Add `updateEmployee(db, id, name, level)` to `sdd-app/src/main/db/employees.ts` using UPDATE + SELECT by id (injection pattern — NOT global db import; null-guard after SELECT same as createEmployee)
  - [x] Run `npm run test` — new tests must pass, zero regressions

- [x] Task 3: Wire `employee:update` handler (AC: 2)
  - [x] In `sdd-app/src/main/handlers/employeeHandlers.ts`: add `updateEmployee` to the import from `../db/employees` (line 4)
  - [x] Replace `return { ok: false, error: 'Not implemented.' }` stub inside `employee:update` (line 45) with: trim+validate `name`, validate `level`, call `updateEmployee(db!, payload.id, payload.name.trim(), payload.level)`, return `{ ok: true, data: employee }`
  - [x] Leave `employee:delete` handler unchanged (Story 2.4)

- [x] Task 4: Extend `useEmployees` hook with `update` (AC: 5)
  - [x] In `sdd-app/src/renderer/src/hooks/useEmployees.ts`: add `update` function using `useCallback`; clear error, invoke `employee:update`, on success replace matching entry in `employees` via `.map()`; on failure set error; return boolean; do NOT toggle `isLoading`
  - [x] Export `update` from the hook's return object

- [x] Task 5: Add hover-reveal edit button and inline row editing to EmployeeList (AC: 3, 4, 5)
  - [x] Add local state: `hoveredId: number | null`, `editingId: number | null`, `editName: string`, `editLevel: CompetencyLevel | ''`, `isEditSubmitting: boolean`
  - [x] Update `useEmployees` destructure: add `update` (already exports `clearError`)
  - [x] Add 3rd `<TableCell>` header (empty, for the actions column shared with Story 2.4)
  - [x] For each row: render edit row if `editingId === emp.id`, else render read row
  - [x] Read row: `<TableRow onMouseEnter={() => setHoveredId(emp.id)} onMouseLeave={() => setHoveredId(null)}>` — 3 cells: `emp.name` | `emp.level` | actions cell with `IconButton` visible only when `hoveredId === emp.id`
  - [x] Edit row: 3 cells: `<TextField>` for name | `<Select>` for level | action cell with ✓ `IconButton` + ✕ `IconButton`; error Alert row below when error is set (see Dev Notes)
  - [x] Implement `handleEditOpen(emp)`, `handleEditCancel()`, `handleEditSave()` (see Dev Notes)
  - [x] Update top-level early-return condition: `if (error && !dialogOpen && editingId === null)`
  - [x] Add required MUI imports: `IconButton` from `@mui/material`; `EditIcon`, `CheckIcon`, `CloseIcon` from `@mui/icons-material`

- [x] Task 6: Typecheck (AC: 1–5)
  - [x] `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] `npm run test` — all tests pass, zero regressions

### Review Findings

- [x] [Review][Patch] Missing `payload.id` validation — no check that id is a positive integer before calling updateEmployee [`sdd-app/src/main/handlers/employeeHandlers.ts:46`]
- [x] [Review][Patch] AC3/UX-DR12 — `size="small"` on Edit, Save, Cancel IconButtons renders ~30px target, below 40×40px minimum [`sdd-app/src/renderer/src/views/EmployeeList.tsx`]
- [x] [Review][Patch] Multiple rows can enter edit mode simultaneously — handleEditOpen has no guard against editingId already being set [`sdd-app/src/renderer/src/views/EmployeeList.tsx:77`]
- [x] [Review][Patch] Stale inline-edit error shown in Add Employee dialog — handleOpenDialog does not call clearError() [`sdd-app/src/renderer/src/views/EmployeeList.tsx`]
- [x] [Review][Patch] No test for updateEmployee throw path when post-update SELECT returns undefined [`sdd-app/__tests__/main/db/employees.test.ts`]
- [x] [Review][Defer] `db!` non-null assertion in employee:update handler [`sdd-app/src/main/handlers/employeeHandlers.ts:47`] — deferred, pre-existing pattern from Story 2.2
- [x] [Review][Defer] Non-atomic UPDATE+SELECT — no transaction wrapping [`sdd-app/src/main/db/employees.ts`] — deferred, single-user desktop app, no concurrency risk
- [x] [Review][Defer] Employee row id leaked in application log via throw message [`sdd-app/src/main/db/employees.ts:41`] — deferred, local desktop logs only
- [x] [Review][Defer] `editingId!` non-null assertion in handleEditSave — UI gate prevents null path [`sdd-app/src/renderer/src/views/EmployeeList.tsx`] — deferred, pre-existing
- [x] [Review][Defer] `editLevel as CompetencyLevel` cast without runtime re-check in handleEditSave [`sdd-app/src/renderer/src/views/EmployeeList.tsx`] — deferred, guarded by editSaveDisabled + IPC server-side validation
- [x] [Review][Defer] `setError(null)` in update() clears unrelated concurrent errors [`sdd-app/src/renderer/src/hooks/useEmployees.ts`] — deferred, pre-existing hook pattern
- [x] [Review][Defer] Edit icon uses JS conditional rendering instead of CSS-only hover visibility [`sdd-app/src/renderer/src/views/EmployeeList.tsx`] — deferred, AC doesn't specify mechanism

## Dev Notes

### CRITICAL: Repository Injection Pattern — Same as Story 2.2

`employees.ts` functions accept `db: Database.Database` as the first parameter. Do NOT import `db` from `database.ts` inside `employees.ts`.

```ts
// employees.ts — ADD after createEmployee (EmployeeRow, mapToEmployee already defined)
export function updateEmployee(db: Database.Database, id: number, name: string, level: CompetencyLevel): Employee {
  db.prepare('UPDATE employees SET name = ?, level = ? WHERE id = ?').run(name, level, id)
  const row = db.prepare(
    'SELECT id, name, level, created_at FROM employees WHERE id = ?'
  ).get(id) as EmployeeRow | undefined
  if (!row) throw new Error(`Employee row not found after update (id=${id})`)
  return mapToEmployee(row)
}
```

### CRITICAL: Handler Stub Location

The `employee:update` stub is at `sdd-app/src/main/handlers/employeeHandlers.ts:40-51`. Replace only the stub body inside the `try` block (line 45):

```ts
// BEFORE (line 45):
return { ok: false, error: 'Not implemented.' }

// AFTER:
if (!payload.name?.trim()) return { ok: false, error: 'Employee name is required.' }
if (!['A', 'B', 'C', 'D'].includes(payload.level)) return { ok: false, error: 'Invalid level.' }
const employee = updateEmployee(db!, payload.id, payload.name.trim(), payload.level)
return { ok: true, data: employee }
```

Update import at line 4:
```ts
// BEFORE:
import { listEmployees, createEmployee } from '../db/employees'

// AFTER:
import { listEmployees, createEmployee, updateEmployee } from '../db/employees'
```

`employee:delete` stub at lines 53-64 — leave as `Not implemented.` (Story 2.4).

### CRITICAL: No `isLoading` During `update`

Same reasoning as `create` in Story 2.2: setting `isLoading = true` would unmount the table (EmployeeList returns `<CircularProgress />` when `isLoading` is true). The SQLite update is sub-millisecond over IPC. Do NOT touch `isLoading` in `update()`.

### Hook Extension — `update` Function

```ts
// Add in useEmployees.ts after the create useCallback
const update = useCallback(async (id: number, name: string, level: CompetencyLevel): Promise<boolean> => {
  setError(null)
  try {
    const result = await window.electronAPI.invoke<Employee>('employee:update', { id, name, level })
    if (result.ok) {
      setEmployees(prev => prev.map(e => e.id === id ? result.data : e))
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

Add `update` to the return object:
```ts
return { employees, isLoading, error, load, create, update, clearError }
```

### EmployeeList — Required New Imports

```ts
import { IconButton } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
```

### EmployeeList — New State and Handlers

```tsx
const { employees, isLoading, error, load, create, update, clearError } = useEmployees()

// Existing state (unchanged)
const [dialogOpen, setDialogOpen] = useState(false)
const [name, setName] = useState('')
const [level, setLevel] = useState<CompetencyLevel | ''>('')
const [isSubmitting, setIsSubmitting] = useState(false)

// NEW state for inline editing
const [hoveredId, setHoveredId] = useState<number | null>(null)
const [editingId, setEditingId] = useState<number | null>(null)
const [editName, setEditName] = useState('')
const [editLevel, setEditLevel] = useState<CompetencyLevel | ''>('')
const [isEditSubmitting, setIsEditSubmitting] = useState(false)

const handleEditOpen = (emp: import('../../../shared/ipc-types').Employee) => {
  clearError()
  setEditingId(emp.id)
  setEditName(emp.name)
  setEditLevel(emp.level)
}

const handleEditCancel = () => {
  setEditingId(null)
  setEditName('')
  setEditLevel('')
  clearError()
}

const handleEditSave = async () => {
  if (isEditSubmitting) return
  setIsEditSubmitting(true)
  try {
    const ok = await update(editingId!, editName.trim(), editLevel as CompetencyLevel)
    if (ok) {
      setEditingId(null)
      setEditName('')
      setEditLevel('')
    }
  } finally {
    setIsEditSubmitting(false)
  }
}

const editSaveDisabled = !editName.trim() || !editLevel
```

### EmployeeList — Updated Error Early-Return

```tsx
// BEFORE:
if (error && !dialogOpen) {
  return <Alert severity="error">{error}</Alert>
}

// AFTER:
if (error && !dialogOpen && editingId === null) {
  return <Alert severity="error">{error}</Alert>
}
```

### EmployeeList — Updated Table Structure

Add a 3rd empty header cell:
```tsx
<TableHead>
  <TableRow>
    <TableCell><Typography variant="subtitle2">Name</Typography></TableCell>
    <TableCell><Typography variant="subtitle2">Level</Typography></TableCell>
    <TableCell sx={{ width: 80 }} />   {/* actions column — shared with Story 2.4 */}
  </TableRow>
</TableHead>
```

### EmployeeList — Row Rendering Logic

Replace the existing `{employees.map(...)}` body with:

```tsx
{employees.map((emp) =>
  editingId === emp.id ? (
    <React.Fragment key={emp.id}>
      <TableRow>
        <TableCell>
          <TextField
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            size="small"
            autoFocus
            fullWidth
          />
        </TableCell>
        <TableCell>
          <FormControl size="small" fullWidth>
            <Select
              value={editLevel}
              onChange={(e: SelectChangeEvent) => setEditLevel(e.target.value as CompetencyLevel)}
            >
              <MenuItem value="A">A</MenuItem>
              <MenuItem value="B">B</MenuItem>
              <MenuItem value="C">C</MenuItem>
              <MenuItem value="D">D</MenuItem>
            </Select>
          </FormControl>
        </TableCell>
        <TableCell>
          <IconButton
            aria-label="Save edit"
            size="small"
            disabled={editSaveDisabled || isEditSubmitting}
            sx={{ opacity: (editSaveDisabled || isEditSubmitting) ? 0.4 : 1 }}
            onClick={handleEditSave}
          >
            <CheckIcon fontSize="small" />
          </IconButton>
          <IconButton aria-label="Cancel edit" size="small" onClick={handleEditCancel}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>
      {error && (
        <TableRow>
          <TableCell colSpan={3} sx={{ pt: 0, pb: 0.5 }}>
            <Alert severity="error" sx={{ py: 0 }}>{error}</Alert>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  ) : (
    <TableRow
      key={emp.id}
      onMouseEnter={() => setHoveredId(emp.id)}
      onMouseLeave={() => setHoveredId(null)}
    >
      <TableCell>{emp.name}</TableCell>
      <TableCell>{emp.level}</TableCell>
      <TableCell>
        {hoveredId === emp.id && (
          <IconButton
            aria-label="Edit employee"
            size="small"
            onClick={() => handleEditOpen(emp)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  )
)}
```

**Note:** When using `React.Fragment` with a `key`, import `React` or use `<Fragment key={...}>`. Add `import React, { Fragment } from 'react'` at the top if not already present (electron-vite react-ts template uses the new JSX transform, so React may not be imported — use `<Fragment key={emp.id}>` directly).

Actually, the safer approach is to wrap in `<React.Fragment key={emp.id}>` — check if `React` is imported. If the file uses the new JSX transform only, you can use the named import: `import { Fragment } from 'react'` and use `<Fragment key={emp.id}>`.

Looking at the current EmployeeList.tsx — it imports `useEffect, useState` from `react` but not `React` itself. Use:
```ts
import { useEffect, useState, Fragment } from 'react'
```
And then: `<Fragment key={emp.id}>...</Fragment>`

### Test Pattern for `updateEmployee` — Same ABI Workaround as Story 2.2

```ts
import { createEmployee, updateEmployee } from '../../../src/main/db/employees'

function createMockDbForUpdate(updatedRow: object): Database.Database {
  return {
    prepare: (sql: string) => {
      if (sql.trimStart().startsWith('UPDATE')) {
        return { run: () => ({ changes: 1 }) }
      }
      // SELECT by id after update
      return { get: () => updatedRow }
    },
  } as unknown as Database.Database
}

describe('updateEmployee', () => {
  it('returns updated Employee with camelCase mapping', () => {
    const mockDb = createMockDbForUpdate({
      id: 3,
      name: 'Alice Updated',
      level: 'B',
      created_at: '2026-04-26 10:00:00',
    })
    const emp = updateEmployee(mockDb, 3, 'Alice Updated', 'B')
    expect(emp.id).toBe(3)
    expect(emp.name).toBe('Alice Updated')
    expect(emp.level).toBe('B')
    expect(emp.createdAt).toBe('2026-04-26 10:00:00')
    expect((emp as any).created_at).toBeUndefined()
  })

  it('passes updated name and level through to the returned Employee', () => {
    const mockDb = createMockDbForUpdate({
      id: 5,
      name: 'Charlie',
      level: 'C',
      created_at: '2026-04-26 11:00:00',
    })
    const emp = updateEmployee(mockDb, 5, 'Charlie', 'C')
    expect(emp.name).toBe('Charlie')
    expect(emp.level).toBe('C')
  })
})
```

### Scope Boundaries

**Implement in this story:**
- `updateEmployee` repository function in `employees.ts`
- `employee:update` handler implementation (replace `Not implemented.` stub)
- `update()` function in `useEmployees` hook
- Hover-reveal edit `IconButton` on each row in `EmployeeList.tsx`
- Inline edit row (TextField + Select + ✓/✕) in `EmployeeList.tsx`
- 3rd "actions" column header in table (empty header cell)

**Do NOT implement:**
- Delete button on rows — Story 2.4
- `employee:delete` handler stub — leave as `Not implemented.`
- Navigation to EmployeeDetail on row click — Story 4.1
- Any confirmation dialog for edit (no confirmation needed per spec)

### Files Modified/Created

**Modified files:**
- `sdd-app/src/main/db/employees.ts` — add `updateEmployee` function
- `sdd-app/src/main/handlers/employeeHandlers.ts` — add import, implement `employee:update` stub
- `sdd-app/src/renderer/src/hooks/useEmployees.ts` — add `update` function, export it
- `sdd-app/src/renderer/src/views/EmployeeList.tsx` — add hover/edit state, inline edit row, actions column
- `sdd-app/__tests__/main/db/employees.test.ts` — add `updateEmployee` import and 2 tests
- `sdd-app/package.json` — install `@mui/icons-material`

**Do NOT touch:**
- `sdd-app/src/main/db/database.ts` — schema complete
- `sdd-app/src/shared/ipc-types.ts` — `UpdateEmployeePayload` already defined (`{ id, name, level }`)
- `sdd-app/src/preload/index.ts` — `employee:update` channel already exposed
- `sdd-app/src/main/index.ts` — handlers already registered

### All Required Types Already Exist

`sdd-app/src/shared/ipc-types.ts` defines `Employee`, `CompetencyLevel`, `UpdateEmployeePayload`. Import from there — create no new types. `UpdateEmployeePayload` is already imported in `employeeHandlers.ts`.

### Previous Story Intelligence (from Story 2.2)

- **Applied:** `mapToEmployee` must null-guard the SELECT result — `updateEmployee` uses the same pattern: `if (!row) throw new Error(...)` after SELECT by id
- **Applied:** Error must be cleared on cancel — `handleEditCancel()` calls `clearError()`
- **Applied:** Double-submission guard — `isEditSubmitting` flag in `handleEditSave`
- **Applied:** `isLoading` NOT set during update — avoids unmounting the table/dialog
- **Applied:** Explicit column list (`SELECT id, name, level, created_at`) not `SELECT *`
- **Note:** The `clearError` function already exists in `useEmployees` and is exported — use it directly

### References

- [epics.md#Story 2.3] — acceptance criteria source
- [architecture.md#API & Communication Patterns — IPC Handler Structure] — validate → delegate → return pattern
- [architecture.md#Frontend Architecture — IPC Invocation Hook Structure] — hook pattern
- [architecture.md#Enforcement Guidelines] — "Never write SQL inside IPC handler functions"; "Never import from electron in src/renderer/"
- [architecture.md#Format Patterns] — camelCase over IPC, snake_case in DB only
- [ux-design-specification.md#Button Hierarchy] — UX-DR8: primary button 40% opacity when disabled
- [ux-design-specification.md#Component Strategy — Custom Components] — UX-DR12: hover-reveal, 40×40px click targets
- [2-2-add-employee.md#Dev Notes] — ABI mismatch workaround, double src/ renderer path, injection pattern, error-not-cleared-on-close fix

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- ABI mismatch (Electron Node 22 ABI 140 vs system Node 20 ABI 137) prevents real better-sqlite3 in Vitest. `updateEmployee` tests use a mock DB that simulates `prepare().run()` (UPDATE) and `prepare().get()` (SELECT by id), same pattern as `createEmployee`.
- `isLoading` intentionally NOT set during `update()`: setting it would unmount the table (EmployeeList returns `<CircularProgress />` when `isLoading` is true). Inline editing must stay visible during the fast IPC call.
- `Fragment` (named import from 'react') used instead of plain JSX element wrapper because the edit row pattern requires a keyed fragment: one `TableRow` for the fields and an optional second `TableRow` for the inline error alert.

### Completion Notes List

- Added `updateEmployee(db, id, name, level): Employee` to `sdd-app/src/main/db/employees.ts` using injection pattern (db as parameter). Uses UPDATE + SELECT by id with null-guard (throws if row missing post-update, consistent with `createEmployee`).
- Updated `sdd-app/src/main/handlers/employeeHandlers.ts`: added `updateEmployee` import, implemented `employee:update` handler with name trim+validation and level enum validation; `employee:delete` stub unchanged.
- Extended `sdd-app/src/renderer/src/hooks/useEmployees.ts`: added `update(id, name, level): Promise<boolean>` with in-place state replacement via `.map()`; does not set `isLoading`; clears error on each call; exported from return object.
- Rewrote `sdd-app/src/renderer/src/views/EmployeeList.tsx`: added hover state (`hoveredId`) and edit state (`editingId`, `editName`, `editLevel`, `isEditSubmitting`); hover-reveal `EditIcon` `IconButton` with `aria-label="Edit employee"`; inline edit row with `TextField`+`Select` pre-filled from current values; `CheckIcon`/`CloseIcon` save/cancel buttons (disabled+40%-opacity when fields invalid); inline error `Alert` row below editing row via `Fragment`; top-level early-return updated to `error && !dialogOpen && editingId === null`; 3rd empty actions column header added (shared with Story 2.4 delete button).
- Added 2 tests to `sdd-app/__tests__/main/db/employees.test.ts` covering camelCase mapping and name/level passthrough for `updateEmployee`.
- Installed `@mui/icons-material` (1 new package, 0 vulnerabilities).
- Typecheck: zero errors (tsconfig.node.json + tsconfig.web.json). Tests: 20/20 pass (18 pre-existing + 2 new), zero regressions.

### File List

- `sdd-app/src/main/db/employees.ts` (modified — added `updateEmployee`)
- `sdd-app/src/main/handlers/employeeHandlers.ts` (modified — added import, implemented `employee:update`)
- `sdd-app/src/renderer/src/hooks/useEmployees.ts` (modified — added `update`, exported it)
- `sdd-app/src/renderer/src/views/EmployeeList.tsx` (modified — hover/edit state, inline edit row, actions column, updated error condition)
- `sdd-app/__tests__/main/db/employees.test.ts` (modified — added `updateEmployee` import, helper, and 2 tests)
- `sdd-app/package.json` (modified — added `@mui/icons-material`)
- `sdd-app/package-lock.json` (modified — lockfile update)
