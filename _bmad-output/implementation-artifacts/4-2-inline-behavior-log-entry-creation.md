# Story 4.2: Inline Behavior Log Entry Creation

Status: done

## Story

As a manager,
I want to log a new behavioral observation directly in the employee's log view,
so that I can capture what I just witnessed in under 30 seconds without leaving context.

## Acceptance Criteria

1. **`createEntry` repository** (`src/main/db/behaviorLog.ts` — UPDATE):
   - `createEntry(db, employeeId, description, competencyIds, entryDate)` inserts the entry row and all competency junction rows in a **single `db.transaction()`** — atomic: all succeed or all fail (NFR7)
   - Returns the newly created `BehaviorLogEntry` (fetched via `BASE_SELECT` JOIN after insert so `competencies[]` is populated)

2. **`behavior-log:create` handler** (`src/main/handlers/behaviorLogHandlers.ts` — UPDATE):
   - Replace the "Not implemented." stub with real validation + delegation
   - Validates: `description` non-empty (trimmed), `competencyIds` is a non-empty array
   - Returns `{ ok: true, data: BehaviorLogEntry }` or `{ ok: false, error: string }` — never throws

3. **`useBehaviorLog.ts` hook** (`src/renderer/src/hooks/useBehaviorLog.ts` — UPDATE):
   - Add `competencies: Competency[]` state + `loadCompetencies()` callback (calls `competency:list` IPC)
   - Add `create(payload: CreateBehaviorLogPayload): Promise<boolean>` — calls `behavior-log:create`, on success **prepends** the returned entry to `entries` state (so it appears immediately at top), returns `true`; on failure sets `error` and returns `false`
   - `create` does NOT set `isLoading` (no view-wide loading flash on save)

4. **`InlineLogRow.tsx` component** (`src/renderer/src/components/log/InlineLogRow.tsx` — NEW):
   - Renders as a `<TableRow>` with 3 cells matching the table column layout: date | description | chips+actions
   - **Date cell:** `DatePicker` from `@mui/x-date-pickers`, pre-filled to today, compact `size="small"`; wrapped in a local `<LocalizationProvider dateAdapter={AdapterDateFns}>` inside this component
   - **Description cell:** `TextField` `multiline` `autoFocus` — Enter inserts line break (textarea default, no `onKeyDown` override needed), Tab moves to next focusable element naturally (DOM order: date → textarea → chips → save → cancel)
   - **Chips+actions cell:** 4 `CompetencyChip` components in `mode="toggle"`, then ✓ `IconButton` (save), ✕ `IconButton` (cancel)
   - **Save disabled** (`disabled` + `sx={{ '&.Mui-disabled': { opacity: 0.4 } }}`) when `description.trim() === ''` OR `selectedCompetencyIds.length === 0` (UX-DR8)
   - **Escape** in description `TextField`: `onKeyDown` handler calls `onCancel()` on `key === 'Escape'`
   - On successful save: `onSave(description.trim(), selectedCompetencyIds, format(date, 'yyyy-MM-dd'))` — use `format` from `date-fns`
   - Props: `{ competencies: Competency[]; onSave: (description: string, competencyIds: number[], entryDate: string) => Promise<boolean>; onCancel: () => void }`

5. **`EmployeeDetail.tsx`** (`src/renderer/src/views/EmployeeDetail.tsx` — UPDATE):
   - Destructure `competencies`, `loadCompetencies`, `create` from `useBehaviorLog()`
   - `useEffect` calls both `load(employee.id)` and `loadCompetencies()` on mount
   - Change empty-state condition from `entries.length === 0` to `entries.length === 0 && !showInlineRow` (so table appears when row is open even with no prior entries)
   - Add "+ Log Behavior" `Button` to the empty state so it matches UX-DR11 (in addition to the existing header button)
   - Remove the `{showInlineRow && null}` line at the bottom
   - Inside `<TableBody>`, render `{showInlineRow && <InlineLogRow ... />}` as the FIRST child (above existing rows)
   - `InlineLogRow` props: `competencies={competencies}`, `onSave={handleSave}`, `onCancel={() => setShowInlineRow(false)}`
   - `handleSave`: calls `create({ employeeId: employee.id, description, competencyIds, entryDate })`; if returns `true`, calls `setShowInlineRow(false)`

6. **Tests** (`__tests__/` — NEW + UPDATE):
   - `__tests__/main/db/behaviorLog.test.ts` — ADD `createEntry` test suite: mock DB returning correct `lastInsertRowid` + JOIN rows, verify returned entry shape, competencies populated, transaction called
   - `__tests__/renderer/components/InlineLogRow.test.tsx` — NEW: save disabled when description empty, save disabled when no chip selected, save enabled when both filled, cancel button calls onCancel, Escape on textarea calls onCancel

7. **TypeScript clean** — zero errors on both `tsconfig.node.json` and `tsconfig.web.json`; all existing 45 tests + new tests pass

## Tasks / Subtasks

- [x] Task 1: Add `createEntry` to `src/main/db/behaviorLog.ts` (AC: 1)
  - [x] Prepare `insertEntry`, `insertJunction`, `fetchEntry` statements outside the transaction
  - [x] Wrap inserts in `db.transaction()` — returns `entryId`
  - [x] Fetch created entry via `BASE_SELECT WHERE e.id = ?` and return `groupJoinRows(...)[0]`

- [x] Task 2: Implement `behavior-log:create` in `behaviorLogHandlers.ts` (AC: 2)
  - [x] Import `createEntry` from `../db/behaviorLog`
  - [x] Validate: non-empty trimmed description; competencyIds is a non-empty array
  - [x] Delegate to `createEntry(db!, ...)` and return result

- [x] Task 3: Update `useBehaviorLog.ts` (AC: 3)
  - [x] Add `competencies` state + `loadCompetencies` callback
  - [x] Add `create` callback — prepend on success, set error on failure

- [x] Task 4: Create `InlineLogRow.tsx` (AC: 4)
  - [x] Date cell: `LocalizationProvider` + `DatePicker` pre-filled today
  - [x] Description cell: `TextField` multiline autoFocus with Escape handler
  - [x] Chips+actions cell: 4 toggle CompetencyChips, ✓ and ✕ buttons
  - [x] Save disabled logic with 40% opacity

- [x] Task 5: Update `EmployeeDetail.tsx` (AC: 5)
  - [x] Add `competencies`, `loadCompetencies`, `create` from hook
  - [x] Update useEffect to call both `load` and `loadCompetencies`
  - [x] Update empty-state condition
  - [x] Add "+ Log Behavior" to empty state
  - [x] Remove `{showInlineRow && null}`
  - [x] Wire `InlineLogRow` as first TableBody child

- [x] Task 6: Write tests (AC: 6)
  - [x] Add `createEntry` tests to `behaviorLog.test.ts`
  - [x] Create `InlineLogRow.test.tsx`

- [x] Task 7: TypeScript + test suite (AC: 7)
  - [x] `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] `npm run test` — all tests pass

### Review Findings

- [x] [Review][Patch] `groupJoinRows(rows)[0]` can return `undefined` when fetch result is empty [sdd-app/src/main/db/behaviorLog.ts:102]
- [x] [Review][Patch] `entryDate` not validated in handler — invalid/missing date silently reaches the DB [sdd-app/src/main/handlers/behaviorLogHandlers.ts:45]
- [x] [Review][Patch] `loadCompetencies` silently swallows IPC failures — empty chip list with no user feedback [sdd-app/src/renderer/src/hooks/useBehaviorLog.ts:27]
- [x] [Review][Patch] `canSave` missing `date !== null` guard — save button appears enabled when date is cleared [sdd-app/src/renderer/src/components/log/InlineLogRow.tsx:24]
- [x] [Review][Patch] Double-click race condition on Save triggers two concurrent IPC calls [sdd-app/src/renderer/src/components/log/InlineLogRow.tsx:35]
- [x] [Review][Patch] `handleSave` stuck in `saving=true` on `onSave` throw — no `finally` block [sdd-app/src/renderer/src/components/log/InlineLogRow.tsx:38]
- [x] [Review][Patch] Escape key not guarded by `saving` state — can dismiss row while IPC call is in-flight [sdd-app/src/renderer/src/components/log/InlineLogRow.tsx:70]
- [x] [Review][Patch] `lastInsertRowid as number` TypeScript cast does not coerce at runtime — use `Number()` [sdd-app/src/main/db/behaviorLog.ts:93]
- [x] [Review][Defer] Two "Log Behavior" buttons (header + empty state) visible simultaneously when entries exist [sdd-app/src/renderer/src/views/EmployeeDetail.tsx:85] — deferred, spec-compliant; header button pre-exists from Story 4.1
- [x] [Review][Defer] Optimistic prepend puts past-dated entries above newer entries until next reload [sdd-app/src/renderer/src/hooks/useBehaviorLog.ts:37] — deferred, spec-mandated "prepend so it appears immediately at top" behavior
- [x] [Review][Defer] `competencyIds` element type/FK validation not done in handler — internal IPC only, transaction rollback handles invalid IDs correctly [sdd-app/src/main/handlers/behaviorLogHandlers.ts:37] — deferred, acceptable for single-user internal IPC
- [x] [Review][Defer] `mockDbForCreate` mock returns same `lastInsertRowid` for all `run()` calls — cannot distinguish entry vs junction insert rowid [sdd-app/__tests__/main/db/behaviorLog.test.ts:16] — deferred, test quality improvement only

## Dev Notes

### Scope: Files

**NEW:**
- `sdd-app/src/renderer/src/components/log/InlineLogRow.tsx`
- `sdd-app/__tests__/renderer/components/InlineLogRow.test.tsx`

**MODIFIED:**
- `sdd-app/src/main/db/behaviorLog.ts` — add `createEntry` (append to existing file)
- `sdd-app/src/main/handlers/behaviorLogHandlers.ts` — implement `behavior-log:create` stub only; leave `update` and `delete` stubs unchanged
- `sdd-app/src/renderer/src/hooks/useBehaviorLog.ts` — add `competencies`, `loadCompetencies`, `create`
- `sdd-app/src/renderer/src/views/EmployeeDetail.tsx` — wire `InlineLogRow`, update empty-state condition

**NOT touched:**
- `ipc-types.ts` — `CreateBehaviorLogPayload` already fully defined
- `CompetencyChip.tsx` — `toggle` mode already complete
- `database.ts` — schema already has `behavior_log_entries` + `behavior_log_entry_competencies`
- `behavior-log:update`, `behavior-log:delete` handlers — remain stubs

---

### Task 1: `createEntry` in `behaviorLog.ts`

Append to the existing file (after `listEntries`). Reuse `BASE_SELECT` and `groupJoinRows` already defined in the module.

```ts
export function createEntry(
  db: Database.Database,
  employeeId: number,
  description: string,
  competencyIds: number[],
  entryDate: string
): BehaviorLogEntry {
  const insertEntry = db.prepare(
    'INSERT INTO behavior_log_entries (employee_id, description, entry_date) VALUES (?, ?, ?)'
  )
  const insertJunction = db.prepare(
    'INSERT INTO behavior_log_entry_competencies (entry_id, competency_id) VALUES (?, ?)'
  )
  const fetchEntry = db.prepare(
    `${BASE_SELECT} WHERE e.id = ?`
  )

  const run = db.transaction((): number => {
    const { lastInsertRowid } = insertEntry.run(employeeId, description, entryDate)
    const entryId = lastInsertRowid as number
    for (const competencyId of competencyIds) {
      insertJunction.run(entryId, competencyId)
    }
    return entryId
  })

  const entryId = run()
  const rows = fetchEntry.all(entryId) as JoinRow[]
  return groupJoinRows(rows)[0]
}
```

Key points:
- Statements prepared **outside** the transaction function (best practice — avoids re-preparation on each call)
- `BASE_SELECT` is the module-level const ending with the `FROM ... LEFT JOIN` clause — `WHERE e.id = ?` appends cleanly
- `lastInsertRowid` is `number | bigint` — cast with `as number` (consistent with existing pattern in the codebase)
- `groupJoinRows(rows)[0]` is safe because the entry was just inserted and the fetch is by primary key

---

### Task 2: `behavior-log:create` handler

Replace the "Not implemented." stub body only. Keep the outer `ipcMain.handle` wrapper and the `log.info` call already present.

```ts
// Inside behavior-log:create handler body (replace stub):
log.info('[behavior-log:create] employeeId=%d competencyIds=%j', payload.employeeId, payload.competencyIds)
try {
  if (!payload.description?.trim()) {
    return { ok: false, error: 'Description is required.' }
  }
  if (!Array.isArray(payload.competencyIds) || payload.competencyIds.length === 0) {
    return { ok: false, error: 'At least one competency must be selected.' }
  }
  const entry = createEntry(
    db!,
    payload.employeeId,
    payload.description.trim(),
    payload.competencyIds,
    payload.entryDate
  )
  return { ok: true, data: entry }
} catch (e) {
  log.error('[behavior-log:create] error: %s', e instanceof Error ? e.message : String(e))
  return { ok: false, error: 'Failed to create behavior log entry.' }
}
```

Add `createEntry` to the import from `'../db/behaviorLog'`.

---

### Task 3: `useBehaviorLog.ts` — Full Updated File

```ts
import { useState, useCallback } from 'react'
import type { BehaviorLogEntry, Competency, CreateBehaviorLogPayload } from '../../../shared/ipc-types'

export function useBehaviorLog() {
  const [entries, setEntries] = useState<BehaviorLogEntry[]>([])
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (employeeId: number, competencyId?: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.invoke<BehaviorLogEntry[]>(
        'behavior-log:list',
        { employeeId, competencyId }
      )
      if (result.ok) setEntries(result.data)
      else setError(result.error)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadCompetencies = useCallback(async () => {
    const result = await window.electronAPI.invoke<Competency[]>('competency:list')
    if (result.ok) setCompetencies(result.data)
    // silent failure — InlineLogRow just won't render chips if this fails
  }, [])

  const create = useCallback(async (payload: CreateBehaviorLogPayload): Promise<boolean> => {
    setError(null)
    try {
      const result = await window.electronAPI.invoke<BehaviorLogEntry>('behavior-log:create', payload)
      if (result.ok) {
        setEntries((prev) => [result.data, ...prev])
        return true
      }
      setError(result.error)
      return false
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
      return false
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { entries, competencies, isLoading, error, load, loadCompetencies, create, clearError }
}
```

Note: `create` does NOT touch `isLoading` — the saving spinner is local to `InlineLogRow`, not the view.

---

### Task 4: `InlineLogRow.tsx` — Full Implementation

File location: `sdd-app/src/renderer/src/components/log/InlineLogRow.tsx`

```tsx
import { useState, useRef } from 'react'
import { Box, IconButton, TableCell, TableRow, TextField } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format } from 'date-fns'
import CompetencyChip from '../common/CompetencyChip'
import type { Competency } from '../../../../shared/ipc-types'

interface InlineLogRowProps {
  competencies: Competency[]
  onSave: (description: string, competencyIds: number[], entryDate: string) => Promise<boolean>
  onCancel: () => void
}

export default function InlineLogRow({ competencies, onSave, onCancel }: InlineLogRowProps): React.JSX.Element {
  const [date, setDate] = useState<Date | null>(new Date())
  const [description, setDescription] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)

  const canSave = description.trim().length > 0 && selectedIds.size > 0

  const toggleCompetency = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (!canSave || !date) return
    setSaving(true)
    const ok = await onSave(description.trim(), [...selectedIds], format(date, 'yyyy-MM-dd'))
    if (!ok) setSaving(false) // keep row open on failure
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <TableRow sx={{ backgroundColor: '#F0F4FF' }}>
        {/* Date cell */}
        <TableCell sx={{ verticalAlign: 'top', width: 110, pt: 1.5 }}>
          <DatePicker
            value={date}
            onChange={(d) => setDate(d)}
            slotProps={{
              textField: {
                size: 'small',
                sx: { width: 130 },
              },
            }}
          />
        </TableCell>

        {/* Description cell */}
        <TableCell sx={{ verticalAlign: 'top', pt: 1.5 }}>
          <TextField
            multiline
            autoFocus
            minRows={2}
            fullWidth
            size="small"
            placeholder="Describe the observed behavior…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onCancel()
            }}
            disabled={saving}
          />
        </TableCell>

        {/* Chips + actions cell */}
        <TableCell sx={{ verticalAlign: 'top', width: 280, pt: 1.5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {competencies.map((c) => (
              <CompetencyChip
                key={c.id}
                competency={c}
                mode="toggle"
                selected={selectedIds.has(c.id)}
                onClick={() => toggleCompetency(c.id)}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              color="primary"
              aria-label="Save log entry"
              onClick={handleSave}
              disabled={!canSave || saving}
              sx={{
                '&.Mui-disabled': { opacity: 0.4 },
              }}
            >
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Cancel log entry"
              onClick={onCancel}
              disabled={saving}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
    </LocalizationProvider>
  )
}
```

Key notes:
- `@mui/icons-material` is already installed (`^9.0.0`)
- `LocalizationProvider` is local to this component — no app-level setup needed
- `AdapterDateFns` works with `date-fns ^4.1.x`
- `format(date, 'yyyy-MM-dd')` produces ISO date string for `entryDate` storage
- `saving` state keeps row open (with disabled inputs) if `onSave` returns `false`
- `{...selectedIds}` spread as array to pass `competencyIds: number[]`

---

### Task 5: `EmployeeDetail.tsx` — Key Changes

Updated destructuring from hook:
```ts
const { entries, competencies, isLoading, error, load, loadCompetencies, create } = useBehaviorLog()
```

Updated useEffect:
```ts
useEffect(() => {
  load(employee.id)
  loadCompetencies()
}, [load, loadCompetencies, employee.id])
```

`handleSave` callback:
```ts
const handleSave = useCallback(async (
  description: string,
  competencyIds: number[],
  entryDate: string
): Promise<boolean> => {
  const ok = await create({ employeeId: employee.id, description, competencyIds, entryDate })
  if (ok) setShowInlineRow(false)
  return ok
}, [create, employee.id])
```

Updated empty-state condition — change `entries.length === 0` check to:
```tsx
entries.length === 0 && !showInlineRow ? (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, gap: 2 }}>
    <Typography color="text.secondary">
      No behaviors logged for {employee.name} yet
    </Typography>
    <Button variant="contained" onClick={() => setShowInlineRow(true)}>
      + Log Behavior
    </Button>
  </Box>
) : (
```

Inside `<TableBody>` (FIRST child, before `entries.map`):
```tsx
{showInlineRow && (
  <InlineLogRow
    competencies={competencies}
    onSave={handleSave}
    onCancel={() => setShowInlineRow(false)}
  />
)}
```

Remove the `{showInlineRow && null}` line at the bottom of the component.

Add `InlineLogRow` import:
```ts
import InlineLogRow from '../components/log/InlineLogRow'
```

Also add `useCallback` to the React import.

---

### Task 6: Tests

#### ABI mismatch — mock DB (same pattern as existing `behaviorLog.test.ts`)

`better-sqlite3` ABI 140 (Electron) vs Node ABI 137 (Vitest) — use mock DB. The transaction mock must be callable:

```ts
function mockDbForCreate(fetchRows: object[], lastInsertRowid: number = 1): Database.Database {
  return {
    prepare: (_sql: string) => ({
      run: (..._args: unknown[]) => ({ lastInsertRowid }),
      all: (..._args: unknown[]) => fetchRows,
    }),
    transaction: (fn: (...args: unknown[]) => unknown) => (...args: unknown[]) => fn(...args),
  } as unknown as Database.Database
}
```

The `transaction` mock wraps the function and executes it immediately (no actual DB transaction in test).

#### Add to `__tests__/main/db/behaviorLog.test.ts`

```ts
import { createEntry } from '../../../src/main/db/behaviorLog'

describe('createEntry', () => {
  it('returns a BehaviorLogEntry with correct shape', () => {
    const fetchRows = [{
      id: 1,
      employee_id: 2,
      description: 'Presented well',
      entry_date: '2026-05-01',
      created_at: '2026-05-01 10:00:00',
      comp_id: 1,
      comp_name: 'Communication',
    }]
    const db = mockDbForCreate(fetchRows, 1)
    const entry = createEntry(db, 2, 'Presented well', [1], '2026-05-01')
    expect(entry.id).toBe(1)
    expect(entry.employeeId).toBe(2)
    expect(entry.entryDate).toBe('2026-05-01')
    expect(entry.competencies).toHaveLength(1)
    expect(entry.competencies[0].name).toBe('Communication')
  })

  it('returns entry with multiple competencies', () => {
    const fetchRows = [
      { id: 5, employee_id: 1, description: 'X', entry_date: '2026-05-01', created_at: '2026-05-01', comp_id: 1, comp_name: 'Communication' },
      { id: 5, employee_id: 1, description: 'X', entry_date: '2026-05-01', created_at: '2026-05-01', comp_id: 3, comp_name: 'Proactivity' },
    ]
    const db = mockDbForCreate(fetchRows, 5)
    const entry = createEntry(db, 1, 'X', [1, 3], '2026-05-01')
    expect(entry.competencies).toHaveLength(2)
  })

  it('uses transaction (calls db.transaction)', () => {
    const fetchRows = [{ id: 1, employee_id: 1, description: 'Y', entry_date: '2026-05-01', created_at: '2026-05-01', comp_id: null, comp_name: null }]
    let transactionCalled = false
    const db = {
      ...mockDbForCreate(fetchRows, 1),
      transaction: (fn: (...args: unknown[]) => unknown) => {
        transactionCalled = true
        return (...args: unknown[]) => fn(...args)
      },
    } as unknown as Database.Database
    createEntry(db, 1, 'Y', [], '2026-05-01')
    expect(transactionCalled).toBe(true)
  })
})
```

Note: add `mockDbForCreate` helper alongside the existing `mockDbWithRows` helper.

#### `__tests__/renderer/components/InlineLogRow.test.tsx` — NEW

```tsx
// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../src/renderer/src/theme/theme'
import InlineLogRow from '../../../src/renderer/src/components/log/InlineLogRow'
import type { Competency } from '../../../src/shared/ipc-types'

afterEach(() => cleanup())

const competencies: Competency[] = [
  { id: 1, name: 'Communication' },
  { id: 2, name: 'Client Focus' },
  { id: 3, name: 'Proactivity' },
  { id: 4, name: 'Teamwork' },
]

const noop = vi.fn()

function wrap(onSave = noop, onCancel = noop) {
  return render(
    <ThemeProvider theme={theme}>
      <table><tbody>
        <InlineLogRow competencies={competencies} onSave={onSave} onCancel={onCancel} />
      </tbody></table>
    </ThemeProvider>
  )
}

describe('InlineLogRow', () => {
  it('save button disabled when description is empty', () => {
    wrap()
    const save = screen.getByRole('button', { name: /save log entry/i })
    expect(save).toBeDisabled()
  })

  it('save button disabled when description filled but no chip selected', () => {
    wrap()
    const textarea = screen.getByPlaceholderText(/describe/i)
    fireEvent.change(textarea, { target: { value: 'Handled client well' } })
    const save = screen.getByRole('button', { name: /save log entry/i })
    expect(save).toBeDisabled()
  })

  it('save button enabled when description filled and at least one chip selected', () => {
    wrap()
    fireEvent.change(screen.getByPlaceholderText(/describe/i), { target: { value: 'Handled client well' } })
    fireEvent.click(screen.getByText('Communication'))
    const save = screen.getByRole('button', { name: /save log entry/i })
    expect(save).not.toBeDisabled()
  })

  it('onCancel called when cancel button clicked', () => {
    const onCancel = vi.fn()
    wrap(noop, onCancel)
    fireEvent.click(screen.getByRole('button', { name: /cancel log entry/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('onCancel called on Escape in description textarea', () => {
    const onCancel = vi.fn()
    wrap(noop, onCancel)
    const textarea = screen.getByPlaceholderText(/describe/i)
    fireEvent.keyDown(textarea, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('renders all four competency chips', () => {
    wrap()
    expect(screen.getByText('Communication')).toBeDefined()
    expect(screen.getByText('Client Focus')).toBeDefined()
    expect(screen.getByText('Proactivity')).toBeDefined()
    expect(screen.getByText('Teamwork')).toBeDefined()
  })
})
```

Wrap `InlineLogRow` inside `<table><tbody>` to avoid React DOM nesting warnings (it renders a `<TableRow>` / `<tr>`).

---

### Architecture Compliance

| Rule | Applied here |
|---|---|
| No SQL in handlers | `behaviorLogHandlers.ts` delegates to `createEntry()` in `behaviorLog.ts` |
| Atomic writes — SQLite transaction (NFR7) | `db.transaction()` wraps entry + junction inserts |
| `snake_case` → `camelCase` at repository layer | `groupJoinRows` already handles the mapping; reused here |
| `IpcResult<T>` discriminated union | Handler returns `{ ok: true, data: BehaviorLogEntry }` or `{ ok: false, error }` |
| No direct IPC in components | `InlineLogRow` receives `onSave` callback from `EmployeeDetail`; `EmployeeDetail` uses `useBehaviorLog.create` |
| `electron-log` format `[channel] key=value` | Handler logs `employeeId=%d competencyIds=%j` |
| No direct `electron` import in renderer | Confirmed — all IPC through `window.electronAPI` via hook |
| Tests in `__tests__/` mirroring `src/` | `__tests__/renderer/components/InlineLogRow.test.tsx` |

---

### Previous Story Intelligence (Story 4.1)

- **`CompetencyChip` toggle mode is complete** — `mode="toggle"`, `selected`, `onClick` props all exist. Do NOT reimplement.
- **ABI mismatch pattern** — `better-sqlite3` compiled for Electron ABI 140, Vitest runs on Node ABI 137. Use mock DB via `{ prepare: () => ({ run, all }), transaction: (fn) => () => fn() }`. Do NOT attempt a real in-memory DB.
- **`showInlineRow` state is already declared** in `EmployeeDetail.tsx:29` and wired to the `+ Log Behavior` button. The `{showInlineRow && null}` line at the bottom is the placeholder that Story 4.2 replaces.
- **Test count: 45 tests** across 6 files — all must continue to pass after this story.
- **`useCallback` not yet imported** in `EmployeeDetail.tsx` — add it to the React import when adding `handleSave`.
- **`db!` non-null assertion** — consistent with all other handlers; do not add extra null checks.
- **JSDOM cleanup** — add `afterEach(() => cleanup())` in `InlineLogRow.test.tsx` (same fix applied in `CompetencyChip.test.tsx` per Story 4.1 completion notes).

---

### UX Requirements Mapping

| Requirement | Implementation |
|---|---|
| UX-DR2: `InlineLogRow` — date picker, description textarea, 4 chip toggles, ✓/✕ buttons | `InlineLogRow.tsx` column layout: date \| description \| chips+actions |
| UX-DR2: autofocused textarea on mount | `TextField autoFocus` |
| UX-DR2: Enter = line break (not submit) | Default `multiline` textarea behavior — no `onKeyDown` override for Enter |
| UX-DR2: Tab moves focus to chips | Natural DOM tab order: date → textarea → chips → ✓ → ✕ |
| UX-DR2: Escape cancels | `onKeyDown: key === 'Escape' → onCancel()` |
| UX-DR8: Save at 40% opacity when incomplete | `disabled={!canSave}` + `sx={{ '&.Mui-disabled': { opacity: 0.4 } }}` |
| UX-DR17: No success toast — entry appearing in table IS the confirmation | `create()` prepends to `entries` state; no `Snackbar` |
| UX-DR11: Empty state "+ Log Behavior" CTA | Added `Button` to empty state in `EmployeeDetail` |
| NFR7: Atomic multi-table insert | `db.transaction()` wraps both `behavior_log_entries` and `behavior_log_entry_competencies` inserts |

---

### Library Notes

- `@mui/x-date-pickers ^9.0.2` + `date-fns ^4.1.0` — both already installed (verified in `package.json`)
- Import path: `from '@mui/x-date-pickers/DatePicker'`, `from '@mui/x-date-pickers/LocalizationProvider'`, `from '@mui/x-date-pickers/AdapterDateFns'`
- `date-fns` v4: `format(date, 'yyyy-MM-dd')` — API unchanged from v3 for this usage
- `@mui/icons-material ^9.0.0` already installed — use `CheckIcon` and `CloseIcon`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fix: `InlineLogRow.test.tsx` needed `import React from 'react'` (no automatic JSX transform in Vitest without jsxImportSource)
- Fix: `toBeDisabled()` is a jest-dom matcher not available without setup — replaced with `(button as HTMLButtonElement).disabled` property assertion

### Completion Notes List

- All 7 tasks completed; all 7 ACs satisfied.
- `createEntry` uses `db.transaction()` wrapping both `behavior_log_entries` insert and `behavior_log_entry_competencies` junction inserts — NFR7 atomic write satisfied.
- `useBehaviorLog` now exposes `competencies`, `loadCompetencies`, and `create` (prepend-on-success pattern — no view-wide loading flash on save).
- `InlineLogRow.tsx` created at `src/renderer/src/components/log/InlineLogRow.tsx` — `LocalizationProvider` is scoped locally to the component; no app-level date adapter required.
- `EmployeeDetail.tsx` updated: empty-state condition changed to `entries.length === 0 && !showInlineRow`; `InlineLogRow` renders as first `TableBody` child when `showInlineRow` is true.
- Final test count: 55 tests, 7 test files, all passing (45 existing + 10 new).

### File List

**New:**
- `sdd-app/src/renderer/src/components/log/InlineLogRow.tsx`
- `sdd-app/__tests__/renderer/components/InlineLogRow.test.tsx`

**Modified:**
- `sdd-app/src/main/db/behaviorLog.ts` — added `createEntry`
- `sdd-app/src/main/handlers/behaviorLogHandlers.ts` — implemented `behavior-log:create`
- `sdd-app/src/renderer/src/hooks/useBehaviorLog.ts` — added `competencies`, `loadCompetencies`, `create`
- `sdd-app/src/renderer/src/views/EmployeeDetail.tsx` — wired `InlineLogRow`, updated empty-state condition
- `sdd-app/__tests__/main/db/behaviorLog.test.ts` — added `createEntry` test suite
