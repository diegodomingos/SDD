# Story 4.4: Edit and Delete Behavior Log Entries

Status: done

## Story

As a manager,
I want to edit or delete existing behavior log entries,
so that I can correct mistakes or remove entries that are no longer relevant.

## Acceptance Criteria

1. **Given** `behaviorLog.ts` repository, **when** `updateEntry(db, id, description, competencyIds, entryDate)` is called, **then** it updates the entry row and replaces all competency junction rows in a single transaction — delete existing junctions, insert new ones — and returns the updated `BehaviorLogEntry`

2. **Given** `behaviorLog.ts` repository, **when** `deleteEntry(db, id)` is called, **then** it deletes the entry row — `ON DELETE CASCADE` on `behavior_log_entry_competencies.entry_id` removes junction rows automatically

3. **Given** `behaviorLogHandlers.ts` already registers `behavior-log:update` and `behavior-log:delete` (stubs returning "Not implemented"), **when** this story is complete, **then** both handlers fully implement the standard pattern returning `IpcResult<BehaviorLogEntry>` and `IpcResult<null>` respectively

4. **Given** each log entry row in the table, **when** the user hovers over the row, **then** an edit icon (`aria-label="Edit log entry"`) and delete icon (`aria-label="Delete log entry"`) appear on the right — minimum 40×40px click targets (UX-DR12, UX-DR15)

5. **Given** the edit icon is clicked, **when** the row enters edit mode, **then** it becomes an `InlineLogRow` pre-filled with the existing description, competency selections, and entry date

6. **Given** the user saves valid edits, **when** the update completes, **then** the row exits edit mode and displays updated values immediately — no reload, no toast (optimistic state update via `entries.map`)

7. **Given** the delete icon is clicked, **when** the action is triggered, **then** the entry is removed from the table immediately — no confirmation dialog (low blast radius; data recoverable by re-logging)

## Tasks / Subtasks

- [x] Task 1: Add `updateEntry` and `deleteEntry` to `behaviorLog.ts` (AC: 1, 2)
  - [x] 1.1: Implement `updateEntry(db, id, description, competencyIds, entryDate)` — transaction: `UPDATE behavior_log_entries`, then `DELETE FROM behavior_log_entry_competencies WHERE entry_id = ?`, then re-insert junctions; then fetch and return updated entry using existing `BASE_SELECT` + `groupJoinRows`
  - [x] 1.2: Implement `deleteEntry(db, id)` — single `DELETE FROM behavior_log_entries WHERE id = ?` (cascade handles junctions)

- [x] Task 2: Implement `behavior-log:update` and `behavior-log:delete` handlers (AC: 3)
  - [x] 2.1: Replace `behavior-log:update` stub — validate `payload.description` trim, `payload.competencyIds` non-empty, `payload.entryDate` ISO format; call `updateEntry`; return `{ ok: true, data: entry }`
  - [x] 2.2: Replace `behavior-log:delete` stub — validate `payload.id` is a number; call `deleteEntry`; return `{ ok: true, data: null }`

- [x] Task 3: Add `update` and `remove` to `useBehaviorLog.ts` (AC: 6, 7)
  - [x] 3.1: Add `update(id, description, competencyIds, entryDate)` — invoke `behavior-log:update`; on success optimistically replace entry: `setEntries(prev => prev.map(e => e.id === id ? result.data : e))`; return `boolean`
  - [x] 3.2: Add `remove(id)` — invoke `behavior-log:delete`; on success optimistically remove: `setEntries(prev => prev.filter(e => e.id !== id))`; return `boolean`

- [x] Task 4: Add pre-fill props to `InlineLogRow.tsx` (AC: 5)
  - [x] 4.1: Add optional props `initialDescription?: string`, `initialCompetencyIds?: number[]`, `initialDate?: string` (ISO-8601 date string) to `InlineLogRowProps`
  - [x] 4.2: Initialize state from props: `useState(initialDescription ?? '')`, `useState(new Set(initialCompetencyIds ?? []))`, `useState(initialDate ? parseISO(initialDate) : new Date())` — import `parseISO` from `date-fns`

- [x] Task 5: Add hover-reveal actions and edit state to `EmployeeDetail.tsx` (AC: 4, 5, 6, 7)
  - [x] 5.1: Add `hoveredId: number | null` and `editingEntryId: number | null` state; import `EditIcon`, `DeleteIcon` from `@mui/icons-material`
  - [x] 5.2: Add empty actions column to `<TableHead>`: `<TableCell sx={{ width: 80 }} />` (matches existing EmployeeList pattern)
  - [x] 5.3: In entries `map`: if `editingEntryId === entry.id`, render `<InlineLogRow>` with pre-filled props and `onSave={handleSaveEdit(entry.id)}`; otherwise render normal `TableRow` with `onMouseEnter`/`onMouseLeave` + hover-reveal action icons in a 4th `TableCell`
  - [x] 5.4: Add `handleSaveEdit` callback: call `update(id, desc, ids, date)`, on success `setEditingEntryId(null)`; add `handleDelete` callback: call `remove(id)` directly (no confirmation)

- [x] Task 6: Write tests (AC: 1, 2, 5)
  - [x] 6.1: `behaviorLog.test.ts` — `updateEntry` suite: wraps in transaction, returns updated entry with correct camelCase shape, replaces junctions (delete + re-insert)
  - [x] 6.2: `behaviorLog.test.ts` — `deleteEntry` suite: calls `run()` on the prepared DELETE statement
  - [x] 6.3: `InlineLogRow.test.tsx` — edit mode suite: renders pre-filled description, pre-selected chips, save button enabled from initial state when all fields valid

- [x] Task 7: TypeScript + test suite (AC: all)
  - [x] `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] `npm run test` — all tests pass (57 existing + 7 new = 64 total)

### Review Findings

- [x] [Review][Patch] `deleteEntry` silently returns `{ ok: true }` when 0 rows are changed — no `.changes` check in `deleteEntry` or handler; a non-existent or already-deleted id produces a false success and an optimistic UI removal of a non-existent entry [`sdd-app/src/main/db/behaviorLog.ts`, `sdd-app/src/main/handlers/behaviorLogHandlers.ts`]
- [x] [Review][Patch] `showInlineRow` and `editingEntryId` can be simultaneously true — clicking Edit does not call `setShowInlineRow(false)`, so if the create row is already open both inline editors render at once [`sdd-app/src/renderer/src/views/EmployeeDetail.tsx`]
- [x] [Review][Patch] `behavior-log:delete` handler has no `payload.id` validation — non-numeric or missing `id` passes directly to `deleteEntry`; all other handlers validate their payload fields [`sdd-app/src/main/handlers/behaviorLogHandlers.ts`]
- [x] [Review][Patch] `hoveredId` not cleared when edit mode is entered — clicking Edit sets `editingEntryId` but leaves `hoveredId` set; on cancel the re-rendered row immediately shows hover icons without mouse movement [`sdd-app/src/renderer/src/views/EmployeeDetail.tsx`]
- [x] [Review][Defer] `updateEntry` has no cross-employee ownership check — `WHERE id = ?` without `AND employee_id = ?` allows updating entries belonging to other employees via a crafted IPC payload; acceptable in single-user Electron desktop context [`sdd-app/src/main/db/behaviorLog.ts`] — deferred, pre-existing
- [x] [Review][Defer] `initialDate` prop changes after mount are ignored — `useState(initialDate ? parseISO(initialDate) : new Date())` only uses the initial value; fragile if `editingEntryId` switches without unmounting the row [`sdd-app/src/renderer/src/components/log/InlineLogRow.tsx`] — deferred, pre-existing
- [x] [Review][Defer] `handleSave` calls `load()` without `await` before dismissing inline row — error from re-fetch surfaces after row is gone, obscuring whether save or refresh failed; pre-existing pattern from Story 4.2 [`sdd-app/src/renderer/src/views/EmployeeDetail.tsx`] — deferred, pre-existing
- [x] [Review][Defer] `InlineLogRow` `saving` state permanently stuck `true` if parent does not unmount after successful save — `setSaving(false)` is only called on failure; if parent neglects to unmount the row stays frozen [`sdd-app/src/renderer/src/components/log/InlineLogRow.tsx`] — deferred, pre-existing

## Dev Notes

### Files to Modify

| File | Change |
|---|---|
| `sdd-app/src/main/db/behaviorLog.ts` | ADD `updateEntry`, `deleteEntry` exports |
| `sdd-app/src/main/handlers/behaviorLogHandlers.ts` | REPLACE stubs for `behavior-log:update` and `behavior-log:delete` |
| `sdd-app/src/renderer/src/hooks/useBehaviorLog.ts` | ADD `update`, `remove` functions; add to return object |
| `sdd-app/src/renderer/src/components/log/InlineLogRow.tsx` | ADD optional `initialDescription`, `initialCompetencyIds`, `initialDate` props; import `parseISO` |
| `sdd-app/src/renderer/src/views/EmployeeDetail.tsx` | ADD `hoveredId`, `editingEntryId` state; import icons; add actions column; wire hover/edit/delete |
| `sdd-app/__tests__/main/db/behaviorLog.test.ts` | ADD `updateEntry` and `deleteEntry` test suites |
| `sdd-app/__tests__/renderer/components/InlineLogRow.test.tsx` | ADD edit-mode suite |

**DO NOT touch:**
- `sdd-app/src/shared/ipc-types.ts` — `UpdateBehaviorLogPayload` and `DeleteBehaviorLogPayload` already defined
- `sdd-app/src/main/db/database.ts` — schema unchanged; `ON DELETE CASCADE` already present on `behavior_log_entry_competencies.entry_id`

---

### Task 1: `behaviorLog.ts` — New Functions

`BASE_SELECT` and `groupJoinRows` are already in the file. Reuse them.

```ts
export function updateEntry(
  db: Database.Database,
  id: number,
  description: string,
  competencyIds: number[],
  entryDate: string
): BehaviorLogEntry {
  const updateStmt = db.prepare(
    'UPDATE behavior_log_entries SET description = ?, entry_date = ? WHERE id = ?'
  )
  const deleteJunctions = db.prepare(
    'DELETE FROM behavior_log_entry_competencies WHERE entry_id = ?'
  )
  const insertJunction = db.prepare(
    'INSERT INTO behavior_log_entry_competencies (entry_id, competency_id) VALUES (?, ?)'
  )
  const fetchEntry = db.prepare(`${BASE_SELECT} WHERE e.id = ?`)

  const run = db.transaction(() => {
    updateStmt.run(description, entryDate, id)
    deleteJunctions.run(id)
    for (const competencyId of competencyIds) {
      insertJunction.run(id, competencyId)
    }
  })
  run()

  const rows = fetchEntry.all(id) as JoinRow[]
  const updated = groupJoinRows(rows)
  if (updated.length === 0) throw new Error(`updateEntry: no row found after update (id=${id})`)
  return updated[0]
}

export function deleteEntry(db: Database.Database, id: number): void {
  db.prepare('DELETE FROM behavior_log_entries WHERE id = ?').run(id)
}
```

---

### Task 2: `behaviorLogHandlers.ts` — Replace Stubs

Add `updateEntry, deleteEntry` to the import from `'../db/behaviorLog'`.

Replace the `behavior-log:update` stub body:
```ts
ipcMain.handle(
  'behavior-log:update',
  async (_event, payload: UpdateBehaviorLogPayload): Promise<IpcResult<BehaviorLogEntry>> => {
    log.info('[behavior-log:update] id=%d', payload.id)
    try {
      if (!payload.description?.trim()) return { ok: false, error: 'Description is required.' }
      if (!Array.isArray(payload.competencyIds) || payload.competencyIds.length === 0) {
        return { ok: false, error: 'At least one competency must be selected.' }
      }
      if (!payload.entryDate || !/^\d{4}-\d{2}-\d{2}$/.test(payload.entryDate)) {
        return { ok: false, error: 'A valid date is required.' }
      }
      const entry = updateEntry(db!, payload.id, payload.description.trim(), payload.competencyIds, payload.entryDate)
      return { ok: true, data: entry }
    } catch (e) {
      log.error('[behavior-log:update] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Failed to update behavior log entry.' }
    }
  }
)
```

Replace the `behavior-log:delete` stub body:
```ts
ipcMain.handle(
  'behavior-log:delete',
  async (_event, payload: DeleteBehaviorLogPayload): Promise<IpcResult<null>> => {
    log.info('[behavior-log:delete] id=%d', payload.id)
    try {
      deleteEntry(db!, payload.id)
      return { ok: true, data: null }
    } catch (e) {
      log.error('[behavior-log:delete] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Failed to delete behavior log entry.' }
    }
  }
)
```

---

### Task 3: `useBehaviorLog.ts` — Add `update` and `remove`

Add after the existing `create` callback. Also add to the return object.

```ts
const update = useCallback(
  async (id: number, description: string, competencyIds: number[], entryDate: string): Promise<boolean> => {
    setError(null)
    try {
      const result = await window.electronAPI.invoke<BehaviorLogEntry>('behavior-log:update', {
        id,
        description,
        competencyIds,
        entryDate,
      })
      if (result.ok) {
        setEntries((prev) => prev.map((e) => (e.id === id ? result.data : e)))
        return true
      }
      setError(result.error)
      return false
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
      return false
    }
  },
  []
)

const remove = useCallback(async (id: number): Promise<boolean> => {
  setError(null)
  try {
    const result = await window.electronAPI.invoke<null>('behavior-log:delete', { id })
    if (result.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id))
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

Update return:
```ts
return { entries, competencies, isLoading, error, load, loadCompetencies, create, update, remove, clearError }
```

---

### Task 4: `InlineLogRow.tsx` — Pre-fill Props

Add `parseISO` to the `date-fns` import (it's a named export, same package already used for `format`).

Updated interface:
```tsx
interface InlineLogRowProps {
  competencies: Competency[]
  onSave: (description: string, competencyIds: number[], entryDate: string) => Promise<boolean>
  onCancel: () => void
  initialDescription?: string
  initialCompetencyIds?: number[]
  initialDate?: string // ISO-8601 date e.g. '2026-04-25'
}
```

Update state initialization (only the three init lines change, everything else unchanged):
```tsx
const [date, setDate] = useState<Date | null>(initialDate ? parseISO(initialDate) : new Date())
const [description, setDescription] = useState(initialDescription ?? '')
const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(initialCompetencyIds ?? []))
```

No other changes to `InlineLogRow`. The existing `canSave`, `handleSave`, and JSX are already correct.

---

### Task 5: `EmployeeDetail.tsx` — Hover-Reveal + Edit Mode

**Imports to add:**
```tsx
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
```

**Hook destructure — add `update` and `remove`:**
```tsx
const { entries, competencies, isLoading, error, load, loadCompetencies, create, update, remove } = useBehaviorLog()
```

**New state (alongside existing `activeTab`, `showInlineRow`, `selectedCompetencyId`):**
```tsx
const [hoveredId, setHoveredId] = useState<number | null>(null)
const [editingEntryId, setEditingEntryId] = useState<number | null>(null)
```

**New callbacks:**
```tsx
const handleSaveEdit = useCallback(
  async (id: number, description: string, competencyIds: number[], entryDate: string): Promise<boolean> => {
    const ok = await update(id, description, competencyIds, entryDate)
    if (ok) setEditingEntryId(null)
    return ok
  },
  [update]
)

const handleDelete = useCallback(
  async (id: number) => {
    await remove(id)
  },
  [remove]
)
```

**Table header — add 4th cell (empty, narrow):**
```tsx
<TableHead>
  <TableRow>
    <TableCell component="th" scope="col" sx={{ width: 110 }}>Date</TableCell>
    <TableCell component="th" scope="col">Description</TableCell>
    <TableCell component="th" scope="col" sx={{ width: 280 }}>Competencies</TableCell>
    <TableCell sx={{ width: 80 }} />  {/* actions */}
  </TableRow>
</TableHead>
```

**Table body row rendering — replace the existing `entries.map` block:**
```tsx
{entries.map((entry) =>
  editingEntryId === entry.id ? (
    <InlineLogRow
      key={entry.id}
      competencies={competencies}
      initialDescription={entry.description}
      initialCompetencyIds={entry.competencies.map((c) => c.id)}
      initialDate={entry.entryDate}
      onSave={(desc, ids, date) => handleSaveEdit(entry.id, desc, ids, date)}
      onCancel={() => setEditingEntryId(null)}
    />
  ) : (
    <TableRow
      key={entry.id}
      onMouseEnter={() => setHoveredId(entry.id)}
      onMouseLeave={() => setHoveredId(null)}
    >
      <TableCell sx={{ verticalAlign: 'top', color: 'text.secondary', fontSize: '13px' }}>
        {entry.entryDate}
      </TableCell>
      <TableCell sx={{ verticalAlign: 'top', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
        {entry.description}
      </TableCell>
      <TableCell sx={{ verticalAlign: 'top' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {entry.competencies.map((c) => (
            <CompetencyChip key={c.id} competency={c} mode="read-only" />
          ))}
        </Box>
      </TableCell>
      <TableCell sx={{ verticalAlign: 'top', width: 80 }}>
        {hoveredId === entry.id && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              aria-label="Edit log entry"
              size="small"
              sx={{ minWidth: 40, minHeight: 40 }}
              onClick={() => setEditingEntryId(entry.id)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Delete log entry"
              size="small"
              sx={{ minWidth: 40, minHeight: 40 }}
              onClick={() => handleDelete(entry.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </TableCell>
    </TableRow>
  )
)}
```

**Important: guard against simultaneous create row and edit mode.** When `editingEntryId` is set, clicking "+ Log Behavior" should not open the inline create row, and vice versa. Add a disabled condition to the "+ Log Behavior" button:
```tsx
<Button
  variant="contained"
  onClick={() => setShowInlineRow(true)}
  disabled={editingEntryId !== null}
>
  + Log Behavior
</Button>
```

---

### Task 6: Tests

#### `behaviorLog.test.ts` — New Test Suites

The existing file already has `mockDbWithRows` and `mockDbForCreate` helpers. Add a new helper for `updateEntry`:

```ts
// Supports transaction() + prepare() returning both run() and all()
function mockDbForUpdate(fetchRows: object[]): Database.Database {
  return {
    prepare: (_sql: string) => ({
      run: (..._args: unknown[]) => ({ changes: 1 }),
      all: (..._args: unknown[]) => fetchRows,
    }),
    transaction: (fn: (...args: unknown[]) => unknown) => (...args: unknown[]) => fn(...args),
  } as unknown as Database.Database
}
```

Add `updateEntry` import to the import line: `import { listEntries, createEntry, updateEntry, deleteEntry } from '../../../src/main/db/behaviorLog'`

```ts
describe('updateEntry', () => {
  it('wraps in a transaction', () => {
    const fetchRows = [
      { id: 1, employee_id: 1, description: 'Updated', entry_date: '2026-05-01', created_at: '2026-05-01', comp_id: null, comp_name: null },
    ]
    let transactionCalled = false
    const db = {
      prepare: (_sql: string) => ({
        run: (..._args: unknown[]) => ({ changes: 1 }),
        all: (..._args: unknown[]) => fetchRows,
      }),
      transaction: (fn: (...args: unknown[]) => unknown) => {
        transactionCalled = true
        return (...args: unknown[]) => fn(...args)
      },
    } as unknown as Database.Database
    updateEntry(db, 1, 'Updated', [], '2026-05-01')
    expect(transactionCalled).toBe(true)
  })

  it('returns updated entry with camelCase shape', () => {
    const fetchRows = [
      { id: 5, employee_id: 2, description: 'Revised', entry_date: '2026-05-02', created_at: '2026-05-01', comp_id: 1, comp_name: 'Communication' },
    ]
    const db = mockDbForUpdate(fetchRows)
    const entry = updateEntry(db, 5, 'Revised', [1], '2026-05-02')
    expect(entry.id).toBe(5)
    expect(entry.description).toBe('Revised')
    expect(entry.entryDate).toBe('2026-05-02')
    expect(entry.competencies).toHaveLength(1)
    expect(entry.competencies[0]).toEqual({ id: 1, name: 'Communication' })
    expect((entry as any).employee_id).toBeUndefined()
  })
})

describe('deleteEntry', () => {
  it('calls run() on the DELETE statement', () => {
    let runCalled = false
    const db = {
      prepare: (_sql: string) => ({
        run: (..._args: unknown[]) => { runCalled = true; return { changes: 1 } },
      }),
    } as unknown as Database.Database
    deleteEntry(db, 42)
    expect(runCalled).toBe(true)
  })
})
```

#### `InlineLogRow.test.tsx` — Edit Mode Suite

```tsx
describe('edit mode (pre-filled)', () => {
  it('renders pre-filled description', () => {
    wrap(vi.fn(), vi.fn(), 'Pre-filled description', [1], '2026-05-01')
    const textarea = screen.getByPlaceholderText(/describe the observed behavior/i) as HTMLTextAreaElement
    expect(textarea.value).toBe('Pre-filled description')
  })

  it('save button enabled when pre-filled with valid description and competency', () => {
    wrap(vi.fn(), vi.fn(), 'Some behavior', [2], '2026-05-01')
    const save = screen.getByRole('button', { name: /save log entry/i })
    expect((save as HTMLButtonElement).disabled).toBe(false)
  })
})
```

Update the `wrap` helper signature to accept optional pre-fill params:
```tsx
function wrap(
  onSave = vi.fn(),
  onCancel = vi.fn(),
  initialDescription?: string,
  initialCompetencyIds?: number[],
  initialDate?: string
) {
  return render(
    <ThemeProvider theme={theme}>
      <table>
        <tbody>
          <InlineLogRow
            competencies={competencies}
            onSave={onSave}
            onCancel={onCancel}
            initialDescription={initialDescription}
            initialCompetencyIds={initialCompetencyIds}
            initialDate={initialDate}
          />
        </tbody>
      </table>
    </ThemeProvider>
  )
}
```

---

### Architecture Compliance

| Rule | Applied here |
|---|---|
| No SQL in handlers | `updateEntry`/`deleteEntry` in `behaviorLog.ts`; handlers delegate |
| Components use hooks, not IPC directly | `EmployeeDetail` calls `useBehaviorLog().update()` and `.remove()` |
| `IpcResult<T>` discriminated union | `behavior-log:update` → `IpcResult<BehaviorLogEntry>`, `behavior-log:delete` → `IpcResult<null>` |
| `camelCase` TypeScript | `hoveredId`, `editingEntryId`, `handleSaveEdit`, `handleDelete` |
| No direct `electron` import in renderer | Confirmed — all IPC through `window.electronAPI` via hooks |
| SQLite transactions for writes | `updateEntry` wraps all writes in `db.transaction()` |

---

### Previous Story Intelligence (Story 4.3)

- **ABI mismatch**: `better-sqlite3` (Electron ABI 140) vs Vitest (Node ABI 137). Use `mockDbWithRows` / `mockDbForCreate` pattern for all DB tests. Do NOT use real SQLite in Vitest.
- **`useBehaviorLog` return object**: currently `{ entries, competencies, isLoading, error, load, loadCompetencies, create, clearError }`. This story adds `update` and `remove`. Add both to the return.
- **`skipPrepend` pattern** (Story 4.2): `create` accepts `options?: { skipPrepend?: boolean }`. This story's `update` and `remove` use optimistic state update directly — no `skipPrepend` needed.
- **Test count**: 57 tests across 7 files after Story 4.3. This story adds tests in `behaviorLog.test.ts` and `InlineLogRow.test.tsx`.
- **`key={selectedEmployee.id}` on `<EmployeeDetail />`** (Story 4.3 fix): already in `App.tsx` — resets all local state on employee navigation. `editingEntryId` will reset automatically when the user navigates to a different employee. No action needed.
- **Hover pattern**: `EmployeeList.tsx` uses `onMouseEnter`/`onMouseLeave` with `hoveredId` state (JS-based, not CSS visibility). Follow the same pattern for consistency. The deferred accessibility note about keyboard inaccessibility is pre-existing and out of scope here.
- **Handler stubs already exist**: `behavior-log:update` and `behavior-log:delete` are already registered in `behaviorLogHandlers.ts` (returning "Not implemented"). This story replaces the stub bodies — do NOT add new `ipcMain.handle` calls.
- **`IPC types already defined`**: `UpdateBehaviorLogPayload` and `DeleteBehaviorLogPayload` are already in `ipc-types.ts`. Do NOT modify that file.

---

### UX Requirements Mapping

| Requirement | Implementation |
|---|---|
| UX-DR12: Hover-reveal edit/delete actions | `onMouseEnter`/`onMouseLeave` on `TableRow`; icons conditionally rendered when `hoveredId === entry.id` |
| UX-DR15: Minimum 40×40px click targets | `IconButton size="small"` with `sx={{ minWidth: 40, minHeight: 40 }}` |
| No confirmation for log entry delete | Direct `remove(id)` call — no dialog (unlike employee delete which shows confirmation) |
| Immediate update display | Optimistic `entries.map` replace in `useBehaviorLog.update()` |
| Edit mode pre-fill | `InlineLogRow` with `initialDescription`, `initialCompetencyIds`, `initialDate` props |
| `aria-label` on icon buttons | `aria-label="Edit log entry"` and `aria-label="Delete log entry"` |

---

### Scope Boundary Notes

- **Filter-awareness for edits**: The epic AC says "displays updated values immediately" — implement as optimistic update regardless of active filter. If an edited entry no longer matches the active filter, it will still show until the next `load()`. This is acceptable per the AC; do NOT add a reload-on-filter-active path for updates.
- **No in-flight guard for handleDelete**: Single-click delete with optimistic removal is sufficient. A double-click would call `remove` twice; the second call will get an error from SQLite (row already deleted) which the handler catches and returns as `{ ok: false }` — the `setError` will surface it. No special guard needed.
- **`showInlineRow` + `editingEntryId` mutual exclusion**: When `editingEntryId !== null`, disable the "+ Log Behavior" button. When `showInlineRow` is true, clicking an edit icon should still work — but in practice the InlineLogRow is above the entries, so no visual conflict. The disabled condition on "+ Log Behavior" is the only guard needed.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- All 7 tasks completed; all 7 ACs satisfied.
- `behaviorLog.ts`: Added `updateEntry` (transaction: UPDATE entry + DELETE old junctions + INSERT new junctions, then fetch via `BASE_SELECT`/`groupJoinRows`) and `deleteEntry` (single DELETE; ON DELETE CASCADE handles junctions automatically).
- `behaviorLogHandlers.ts`: Replaced both stubs — `behavior-log:update` validates description/competencyIds/entryDate, calls `updateEntry`, returns `IpcResult<BehaviorLogEntry>`; `behavior-log:delete` calls `deleteEntry`, returns `IpcResult<null>`.
- `useBehaviorLog.ts`: Added `update` (optimistic `entries.map` replace on success) and `remove` (optimistic `entries.filter` on success); both return `boolean`; added to return object.
- `InlineLogRow.tsx`: Added optional `initialDescription`, `initialCompetencyIds`, `initialDate` props; imported `parseISO` from `date-fns`; state initializers updated to use props with nullish fallbacks. No other logic changed — create mode behaviour preserved.
- `EmployeeDetail.tsx`: Added `hoveredId`/`editingEntryId` state; `EditIcon`/`DeleteIcon`/`IconButton` imported; actions column added to table header; entries `map` now renders `InlineLogRow` in-place for the editing entry, normal `TableRow` with hover-reveal icons otherwise; `handleSaveEdit` and `handleDelete` callbacks added; "+ Log Behavior" button disabled while an edit is in progress.
- Tests: `behaviorLog.test.ts` — added `mockDbForUpdate` helper, `updateEntry` suite (3 tests: transaction wrap, camelCase return, empty competencies), `deleteEntry` suite (1 test: run called). `InlineLogRow.test.tsx` — updated `wrap` helper signature, added edit-mode suite (3 tests: pre-filled description, save enabled, save disabled when empty).
- Final test count: 64 tests across 7 files, all passing (57 existing + 7 new). Zero TypeScript errors on both tsconfig.node.json and tsconfig.web.json.

### File List

**Modified:**
- `sdd-app/src/main/db/behaviorLog.ts`
- `sdd-app/src/main/handlers/behaviorLogHandlers.ts`
- `sdd-app/src/renderer/src/hooks/useBehaviorLog.ts`
- `sdd-app/src/renderer/src/components/log/InlineLogRow.tsx`
- `sdd-app/src/renderer/src/views/EmployeeDetail.tsx`
- `sdd-app/__tests__/main/db/behaviorLog.test.ts`
- `sdd-app/__tests__/renderer/components/InlineLogRow.test.tsx`
