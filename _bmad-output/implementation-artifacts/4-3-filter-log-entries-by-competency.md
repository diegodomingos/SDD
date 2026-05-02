# Story 4.3: Filter Log Entries by Competency

Status: done

## Story

As a manager,
I want to filter the behavior log to show only entries tagged to a specific competency,
So that I can review concentrated evidence before triggering an AI evaluation.

## Acceptance Criteria

1. **Filter chip row renders above the log table** (`EmployeeDetail.tsx` — UPDATE):
   - Four `CompetencyChip` components in `mode="filter"` appear between the "Behavior Log" header and the table/empty state
   - Rendered only when `competencies.length > 0` — avoids empty-space flash before `loadCompetencies()` resolves
   - Active chip: full background color + white label. Inactive chip: outlined + competency color label. Uses existing `CompetencyChip` `filter` mode (UX-DR1)

2. **Default state — no chip active** (`EmployeeDetail.tsx`):
   - `selectedCompetencyId` initializes as `null` — all entries for the employee shown on load
   - No chip appears active on initial render

3. **Filter activates on chip click** (`EmployeeDetail.tsx`):
   - Clicking an inactive chip sets `selectedCompetencyId` to that competency's `id`
   - `load(employee.id, selectedCompetencyId)` fires — entries reload from backend with filter applied
   - Entries tagged to multiple competencies appear when they include the filtered competency (handled by existing SQL: `IN (SELECT entry_id FROM behavior_log_entry_competencies WHERE competency_id = ?)`)

4. **Filter clears on active chip re-click** (`EmployeeDetail.tsx`):
   - Clicking the currently-active chip sets `selectedCompetencyId` to `null`
   - `load(employee.id, undefined)` fires — all entries reload

5. **Filtered empty state** (`EmployeeDetail.tsx`):
   - When `entries.length === 0 && !showInlineRow && selectedCompetencyId !== null`:
     displays "No entries tagged to [Competency name] for [Employee name]" + `+ Log Behavior` button (UX-DR11)
   - When `entries.length === 0 && !showInlineRow && selectedCompetencyId === null`:
     existing unfiltered empty state preserved: "No behaviors logged for [Name] yet" + `+ Log Behavior`

6. **`handleSave` is filter-aware** (`EmployeeDetail.tsx`):
   - When filter is active (`selectedCompetencyId !== null`) and `create` returns `true`: call `load(employee.id, selectedCompetencyId)` before `setShowInlineRow(false)` — reload ensures filtered list reflects actual tag match (new entry shows only if tagged with filtered competency)
   - When filter is inactive: existing optimistic-prepend behavior preserved — Story 4.2's "entry appearing IS the confirmation" UX (UX-DR17)

7. **Tests** (`__tests__/` — UPDATE):
   - `__tests__/renderer/components/CompetencyChip.test.tsx` — ADD `filter` mode suite: `aria-pressed` correct for both states, `onClick` called on click
   - `__tests__/main/db/behaviorLog.test.ts` — ADD `listEntries` with `competencyId` filter test if not already present

8. **TypeScript clean** — zero errors on both `tsconfig.node.json` and `tsconfig.web.json`; all existing 55 tests + new tests pass

## Tasks / Subtasks

- [x] Task 1: Add filter state, effects, and chip row to `EmployeeDetail.tsx` (AC: 1, 2, 3, 4)
  - [x] Add `const [selectedCompetencyId, setSelectedCompetencyId] = useState<number | null>(null)`
  - [x] Split existing single `useEffect` into two (see Task 1 dev notes below)
  - [x] Add filter chip `Box` between page header and the loading/empty/table conditional
  - [x] Wire `CompetencyChip mode="filter"` with toggle handler

- [x] Task 2: Update `handleSave` for filter-awareness (AC: 6)
  - [x] Add `selectedCompetencyId` and `load` to `handleSave` deps array
  - [x] After successful create with active filter, call `load(employee.id, selectedCompetencyId)` before closing row

- [x] Task 3: Update empty-state branch (AC: 5)
  - [x] Replace single empty-state with conditional: filtered vs unfiltered message
  - [x] Competency name lookup: `competencies.find((c) => c.id === selectedCompetencyId)?.name`

- [x] Task 4: Write tests (AC: 7)
  - [x] Add `describe('filter mode')` block to `CompetencyChip.test.tsx`
  - [x] Verify / add `listEntries` filtered path in `behaviorLog.test.ts`

- [x] Task 5: TypeScript + test suite (AC: 8)
  - [x] `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] `npm run test` — all tests pass

### Review Findings

- [x] [Review][Decision] Optimistic prepend causes filtered-save flash — resolved: added `skipPrepend` option to `create()`; `handleSave` passes `{ skipPrepend: true }` when filter is active.

- [x] [Review][Patch] `competencies.find(...)?.name` renders literal "undefined" in filtered empty state — fixed: added `?? 'this competency'` fallback [EmployeeDetail.tsx]
- [x] [Review][Patch] `selectedCompetencyId` stale after employee navigation — fixed: added `key={selectedEmployee.id}` to `<EmployeeDetail />` [App.tsx:15]

- [x] [Review][Defer] `load`'s `setError(null)` silently clears concurrent `loadCompetencies` errors [useBehaviorLog.ts:12] — deferred, pre-existing
- [x] [Review][Defer] `afterEach(cleanup)` placed before imports in test file [CompetencyChip.test.tsx:6] — deferred, pre-existing
- [x] [Review][Defer] `aria-pressed` asserted via `getAttribute` instead of `toHaveAttribute` [CompetencyChip.test.tsx] — deferred, pre-existing

## Dev Notes

### Scope: Files

**MODIFIED:**
- `sdd-app/src/renderer/src/views/EmployeeDetail.tsx` — add filter state, split useEffect, add chip row, update empty-state logic, update handleSave

**NOT touched:**
- `sdd-app/src/main/db/behaviorLog.ts` — `listEntries(db, employeeId, competencyId?)` fully implemented; SQL filtering path present
- `sdd-app/src/main/handlers/behaviorLogHandlers.ts` — `behavior-log:list` already accepts `{ employeeId, competencyId? }` and passes through
- `sdd-app/src/renderer/src/hooks/useBehaviorLog.ts` — `load(employeeId, competencyId?)` already implemented
- `sdd-app/src/renderer/src/components/common/CompetencyChip.tsx` — `filter` mode fully implemented (lines 64–82)
- `sdd-app/src/shared/ipc-types.ts` — `behavior-log:list` payload already typed with `competencyId?`

---

### Task 1: `EmployeeDetail.tsx` — Key Changes

**State to add (alongside existing `activeTab` and `showInlineRow`):**
```tsx
const [selectedCompetencyId, setSelectedCompetencyId] = useState<number | null>(null)
```

**Replace the existing single `useEffect` with two:**
```tsx
// Load competencies once on mount
useEffect(() => {
  loadCompetencies()
}, [loadCompetencies])

// Reload entries whenever employee or active filter changes
useEffect(() => {
  load(employee.id, selectedCompetencyId ?? undefined)
}, [load, employee.id, selectedCompetencyId])
```

Why two: `loadCompetencies()` only needs to run once — calling it on every filter change is wasteful. The entries effect correctly fires on mount (with `selectedCompetencyId === null`) and again on every filter toggle.

**Filter chip row — insert between the page header `Box` and `{error && ...}`:**
```tsx
{/* Filter chips */}
{competencies.length > 0 && (
  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
    {competencies.map((c) => (
      <CompetencyChip
        key={c.id}
        competency={c}
        mode="filter"
        selected={selectedCompetencyId === c.id}
        onClick={() =>
          setSelectedCompetencyId((prev) => (prev === c.id ? null : c.id))
        }
      />
    ))}
  </Box>
)}
```

---

### Task 2: Updated `handleSave`

```tsx
const handleSave = useCallback(
  async (description: string, competencyIds: number[], entryDate: string): Promise<boolean> => {
    const ok = await create({ employeeId: employee.id, description, competencyIds, entryDate })
    if (ok) {
      if (selectedCompetencyId !== null) {
        // Reload filtered view — prevents prepended entry from showing when it doesn't match the filter
        load(employee.id, selectedCompetencyId)
      }
      setShowInlineRow(false)
    }
    return ok
  },
  [create, employee.id, selectedCompetencyId, load]
)
```

Why `load` on filter active: `create` in `useBehaviorLog` always optimistically prepends the new entry to `entries` state. When a filter is active, `entries` contains only filtered entries — prepending an entry that doesn't match the filter would show a wrong row. Reloading produces the correct filtered list. When no filter, the optimistic prepend is preserved (Story 4.2 behavior).

---

### Task 3: Empty-state update

**Replace** the current empty-state JSX block:
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
```

**With:**
```tsx
entries.length === 0 && !showInlineRow ? (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, gap: 2 }}>
    <Typography color="text.secondary">
      {selectedCompetencyId !== null
        ? `No entries tagged to ${competencies.find((c) => c.id === selectedCompetencyId)?.name} for ${employee.name}`
        : `No behaviors logged for ${employee.name} yet`}
    </Typography>
    <Button variant="contained" onClick={() => setShowInlineRow(true)}>
      + Log Behavior
    </Button>
  </Box>
```

---

### Task 4: CompetencyChip filter mode tests

Add to `__tests__/renderer/components/CompetencyChip.test.tsx` (use the existing `comm` / `Competency` fixture already in the file, or define `const comm: Competency = { id: 1, name: 'Communication' }`):

```tsx
describe('filter mode', () => {
  it('renders aria-pressed=false when not selected', () => {
    render(
      <ThemeProvider theme={theme}>
        <CompetencyChip competency={comm} mode="filter" selected={false} onClick={vi.fn()} />
      </ThemeProvider>
    )
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false')
  })

  it('renders aria-pressed=true when selected', () => {
    render(
      <ThemeProvider theme={theme}>
        <CompetencyChip competency={comm} mode="filter" selected={true} onClick={vi.fn()} />
      </ThemeProvider>
    )
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(
      <ThemeProvider theme={theme}>
        <CompetencyChip competency={comm} mode="filter" selected={false} onClick={onClick} />
      </ThemeProvider>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

**`listEntries` with competencyId** — if `behaviorLog.test.ts` has no test covering the `competencyId !== undefined` SQL branch, add:

```ts
describe('listEntries with competency filter', () => {
  it('returns entries filtered to competency when competencyId provided', () => {
    const rows = [{
      id: 1, employee_id: 1, description: 'Spoke clearly',
      entry_date: '2026-05-01', created_at: '2026-05-01',
      comp_id: 1, comp_name: 'Communication',
    }]
    const db = mockDbWithRows(rows)
    const result = listEntries(db, 1, 1) // competencyId = 1
    expect(result).toHaveLength(1)
    expect(result[0].competencies[0].name).toBe('Communication')
  })
})
```

(Use the existing `mockDbWithRows` helper already defined in the test file.)

---

### Architecture Compliance

| Rule | Applied here |
|---|---|
| No SQL in handlers / components | No handler changes; SQL path unchanged in `behaviorLog.ts` |
| Components use hooks, not IPC directly | Filter triggers `useBehaviorLog().load()` — not `window.electronAPI` |
| `IpcResult<T>` discriminated union | No new handlers — existing pattern unchanged |
| `camelCase` TypeScript | `selectedCompetencyId`, `setSelectedCompetencyId` |
| No direct `electron` import in renderer | Confirmed — filter state is pure React local state |

---

### Previous Story Intelligence (Story 4.2)

- **`load(employeeId, competencyId?)`** is already in `useBehaviorLog.ts` line 10 — do NOT add a new load variant.
- **`competencies` state** is already loaded via `loadCompetencies()` added in Story 4.2 — already destructured in `EmployeeDetail.tsx` line 28. Do NOT call `loadCompetencies()` inside the filter change handler.
- **`CompetencyChip` filter mode** is complete in `CompetencyChip.tsx` lines 64–82 — full background when `selected=true`, outlined when `selected=false`, `aria-pressed` set, `onClick` wired. Do NOT reimplement.
- **`handleSave` deps warning**: current deps are `[create, employee.id]` — must add `selectedCompetencyId` and `load` or React will warn about stale closure.
- **ABI mismatch reminder**: `better-sqlite3` (Electron ABI 140) vs Vitest (Node ABI 137) — use `mockDbWithRows` helper (already defined in `behaviorLog.test.ts`) for any new DB tests, not real SQLite.
- **Test count: 55 tests** across 7 files — all must pass after this story.
- **Review finding from 4.2**: `loadCompetencies` previously had a silent failure; current code in `useBehaviorLog.ts` sets `error` state on IPC failure — do NOT regress this.

---

### UX Requirements Mapping

| Requirement | Implementation |
|---|---|
| UX-DR1: `CompetencyChip` filter variant — full background active, outlined inactive | `mode="filter"` with `selected={selectedCompetencyId === c.id}` |
| UX-DR11: Filtered empty state | Conditional: "No entries tagged to [Competency] for [Name]" when `selectedCompetencyId !== null` |
| UX-DR11: No-entries empty state | Existing "No behaviors logged for [Name] yet" preserved for unfiltered case |
| UX-DR17: No success toast — entry appearing IS confirmation | Preserved for no-filter saves; filter-active saves do a reload (brief `isLoading` acceptable since result is accurate) |

---

### Tab Persistence Note (Scope Boundary)

UX-DR10 requires that switching between Behavior Log and Evaluate tabs retains `selectedCompetency`. That persistence (via Zustand store) is **Story 6.1's responsibility**. For Story 4.3, `selectedCompetencyId` is local state in `EmployeeDetail` — it resets when tabs are switched or a different employee is selected. Do NOT lift to Zustand in this story.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- All 5 tasks completed; all 8 ACs satisfied.
- `EmployeeDetail.tsx` updated: single `useEffect` split into two (competencies on mount, entries on employee/filter change); `selectedCompetencyId: number | null` state added; filter chip row renders above the table using existing `CompetencyChip` `filter` mode; `handleSave` reloads filtered list after create when filter is active; empty state now shows competency-specific message when filter is active.
- `CompetencyChip.test.tsx` extended with 2 new filter mode tests: `aria-pressed=false` when not selected, `onClick` called on click. `fireEvent` and `vi` added to imports.
- `behaviorLog.test.ts` already had a test covering the filtered args path (`passes both employeeId and competencyId args to .all()`); no new test needed.
- Final test count: 57 tests, 7 test files, all passing (55 existing + 2 new).
- TypeScript: zero errors on both `tsconfig.node.json` and `tsconfig.web.json`.

### File List

**Modified:**
- `sdd-app/src/renderer/src/views/EmployeeDetail.tsx`
- `sdd-app/__tests__/renderer/components/CompetencyChip.test.tsx`
