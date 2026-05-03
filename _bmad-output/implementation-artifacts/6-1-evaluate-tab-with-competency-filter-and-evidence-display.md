# Story 6.1: Evaluate Tab with Competency Filter and Evidence Display

Status: done

## Story

As a manager,
I want to select a competency in the Evaluate tab and see the filtered log entries that will inform the AI assessment,
so that I can review the evidence before triggering the evaluation.

## Acceptance Criteria

1. **Given** `EmployeeDetail.tsx` renders, **when** the Evaluate tab is clicked, **then** the tab becomes active and the Behavior Log tab state (selected competency, scroll position) is preserved on tab switch back (UX-DR10)

2. **Given** the Evaluate tab renders with no competency selected, **when** the view loads, **then** the instructional empty state displays: "Select a competency above to begin" — no "All" chip, no Run Evaluation button visible (UX-DR9, UX-DR11)

3. **Given** four competency filter chips render in the Evaluate tab, **when** the user clicks a chip, **then** the table below filters to show only log entries tagged to that competency — the chip shows active state

4. **Given** a competency is selected and entries exist, **when** the table renders, **then** entries are shown in reverse-chronological order with date, description excerpt, and competency chips visible — identical to the Behavior Log view but read-only (no edit/delete hover actions)

5. **Given** a competency is selected but no entries are tagged to it, **when** the table renders, **then** the empty state displays: "No entries tagged to [Competency] for [Name]" with a "+ Log Behavior" CTA (UX-DR11)

6. **Given** a competency is selected and entries exist, **when** the "Run Evaluation" button renders, **then** it is visible as a primary filled button — present only when a competency is selected, not visible in the instructional (no-competency) state

## Tasks / Subtasks

- [x] Task 1: Connect Evaluate tab competency state to Zustand store (AC: 1, UX-DR10)
  - [x] 1.1: In `sdd-app/src/renderer/src/views/EmployeeDetail.tsx`, add `selectedCompetency` and `setCompetency` from `useAppStore` (already defined in store — `selectedCompetency: Competency | null` and `setCompetency`)
  - [x] 1.2: The `setEmployee` action already resets `selectedCompetency: null` when a new employee is selected — no store changes needed, just consume the existing state

- [x] Task 2: Update the `entries` loading useEffect to handle both tabs (AC: 3, 4, 5)
  - [x] 2.1: Replace the existing `useEffect` that calls `load(employee.id, selectedCompetencyId ?? undefined)` with a unified effect that branches on `activeTab`:
    - If `activeTab === 0` (Behavior Log): load with `selectedCompetencyId ?? undefined`
    - If `activeTab === 1` (Evaluate) AND `selectedCompetency !== null`: load with `selectedCompetency.id`
    - If `activeTab === 1` AND `selectedCompetency === null`: do NOT call load (show instructional state, no fetch needed)
  - [x] 2.2: Dependency array: `[load, employee.id, selectedCompetencyId, selectedCompetency, activeTab]`

- [x] Task 3: Implement the Evaluate tab content in `EmployeeDetail.tsx` (AC: 2, 3, 4, 5, 6)
  - [x] 3.1: Replace the placeholder block (`activeTab === 1` → "AI evaluation — coming in Epic 6.") with the full Evaluate tab implementation
  - [x] 3.2: Render four competency filter chips (from `competencies` list already loaded) in `mode="filter"` using `CompetencyChip`. `selected` = `selectedCompetency?.id === c.id`. `onClick` = `() => setCompetency(selectedCompetency?.id === c.id ? null : c)` (toggling off deselects)
  - [x] 3.3: When `selectedCompetency === null`: render instructional empty state — `Typography` "Select a competency above to begin" centered, no Run Evaluation button
  - [x] 3.4: When `selectedCompetency !== null` AND `isLoading`: render `CircularProgress` centered
  - [x] 3.5: When `selectedCompetency !== null` AND `!isLoading` AND `entries.length === 0`: render empty state "No entries tagged to [selectedCompetency.name] for [employee.name]" + `Button variant="contained"` "+ Log Behavior" (onClick: `setActiveTab(0); setShowInlineRow(true)`)
  - [x] 3.6: When `selectedCompetency !== null` AND `!isLoading` AND `entries.length > 0`: render the entries `TableContainer`/`Table` (same structure as Behavior Log tab but WITHOUT hover actions — no `IconButton` edit/delete, no `hoveredId` state needed)
  - [x] 3.7: Render "Run Evaluation" button when `selectedCompetency !== null` — `Button variant="contained"` (primary), no `onClick` handler yet (Story 6.2 wires the AI call). Place button in a flex row above the table alongside the competency chips OR below the chips in a header row aligned right

- [x] Task 4: TypeScript verification (no new tests needed for this story)
  - [x] 4.1: `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] 4.2: `npm run test` — all 81 existing tests pass (no new tests added in this story)

### Review Findings

- [x] [Review][Defer] AC1 scroll position preservation — AC1 text mentions scroll position but Scope Boundary explicitly excludes it; UX-DR10 scroll requirement is out of scope for Story 6.1 [sdd-app/src/renderer/src/views/EmployeeDetail.tsx] — deferred, out of scope

- [x] [Review][Patch] No error state in Evaluate tab — added `error` branch before `isLoading` check rendering `<Alert severity="error">` [sdd-app/src/renderer/src/views/EmployeeDetail.tsx]

- [x] [Review][Patch] Competency chip row renders empty while `loadCompetencies` is in flight — added `competencies.length > 0` guard matching Behavior Log tab pattern [sdd-app/src/renderer/src/views/EmployeeDetail.tsx]

- [x] [Review][Patch] `"+ Log Behavior"` CTA does not guard `editingEntryId` — added `if (!editingEntryId)` guard before switching tabs [sdd-app/src/renderer/src/views/EmployeeDetail.tsx]

- [x] [Review][Defer] `selectedCompetency` persists across non-`setEmployee` navigation paths [sdd-app/src/renderer/src/views/EmployeeDetail.tsx] — deferred, pre-existing: current paths always call `setEmployee` which resets the value; latent risk only for future navigation bypassing `setEmployee`
- [x] [Review][Defer] Shared `entries`/`isLoading` causes brief stale-data flash on tab switch [sdd-app/src/renderer/src/hooks/useBehaviorLog.ts] — deferred, pre-existing: inherent to shared-hook design from prior stories; requires per-tab isolation to fix
- [x] [Review][Defer] Rapid competency switching race condition — no abort controller in `useBehaviorLog` [sdd-app/src/renderer/src/hooks/useBehaviorLog.ts] — deferred, pre-existing: hook-level fix; out of scope for view-only story
- [x] [Review][Defer] Reverse-chronological order relies on hook/DB ordering — no explicit sort in Evaluate tab render [sdd-app/src/renderer/src/views/EmployeeDetail.tsx] — deferred, pre-existing: consistent with Behavior Log tab
- [x] [Review][Defer] Description renders in full, not excerpted — AC4 says "description excerpt" but full text renders [sdd-app/src/renderer/src/views/EmployeeDetail.tsx] — deferred, pre-existing: consistent with Behavior Log tab
- [x] [Review][Defer] Table header/cell associations for multi-chip competency column — screen-reader navigation fragile [sdd-app/src/renderer/src/views/EmployeeDetail.tsx] — deferred, pre-existing: consistent with Behavior Log tab; address in accessibility pass
- [x] [Review][Defer] `entry.entryDate` rendered as raw string without locale formatting [sdd-app/src/renderer/src/views/EmployeeDetail.tsx] — deferred, pre-existing: consistent with Behavior Log tab

## Dev Notes

### Files to Create / Modify

| File | Action | Notes |
|---|---|---|
| `sdd-app/src/renderer/src/views/EmployeeDetail.tsx` | MODIFY | Replace Evaluate tab placeholder with full implementation; connect to Zustand `selectedCompetency` |

**DO NOT touch:**
- `sdd-app/src/shared/ipc-types.ts` — no new IPC channels; all required types already exist
- `sdd-app/src/preload/index.ts` — `ai:evaluate` already in ALLOWED_CHANNELS (added in Story 1.5 scaffold)
- `sdd-app/src/main/handlers/aiHandlers.ts` — stub already returns `{ ok: false, error: 'Not implemented.' }`; Story 6.2 implements it
- `sdd-app/src/renderer/src/store/appStore.ts` — `selectedCompetency: Competency | null`, `setCompetency`, and `setEmployee` (resets selectedCompetency) already exist and are correct
- `sdd-app/src/renderer/src/hooks/useBehaviorLog.ts` — no changes; `load(employeeId, competencyId?)` already supports filtering; `useEvaluation.ts` is NOT created in this story (Story 6.2)

---

### Task 1: Zustand Store — Already Wired

The store (`appStore.ts`) already has everything needed:

```ts
interface AppStore {
  selectedCompetency: Competency | null      // Evaluate tab chip selection
  setCompetency: (c: Competency | null) => void
  setEmployee: (employee: Employee | null) => void  // already resets selectedCompetency: null
  resetUserData: () => void                  // also resets selectedCompetency: null
}
```

In `EmployeeDetail.tsx`, add these two selectors alongside the existing ones:
```tsx
const selectedCompetency = useAppStore((s) => s.selectedCompetency)
const setCompetency = useAppStore((s) => s.setCompetency)
```

The `setEmployee(null)` call (breadcrumb back link) already resets `selectedCompetency` — UX-DR10 "resets when a different employee is selected" is satisfied by existing store logic.

---

### Task 2: Unified Loading useEffect

**CURRENT (lines 43–46 in EmployeeDetail.tsx):**
```tsx
useEffect(() => {
  load(employee.id, selectedCompetencyId ?? undefined)
}, [load, employee.id, selectedCompetencyId])
```

**REPLACE WITH:**
```tsx
useEffect(() => {
  if (activeTab === 0) {
    load(employee.id, selectedCompetencyId ?? undefined)
  } else if (activeTab === 1 && selectedCompetency !== null) {
    load(employee.id, selectedCompetency.id)
  }
  // activeTab === 1 && selectedCompetency === null: skip — instructional empty state, no fetch
}, [load, employee.id, selectedCompetencyId, selectedCompetency, activeTab])
```

**Why this approach (not two separate effects):** Two effects with overlapping deps cause double-fires. One branched effect is explicit about intent and avoids racing between Behavior Log and Evaluate loads.

**UX implication:** Switching tabs triggers a reload if the filter differs from the last loaded state. The `isLoading` spinner in each tab covers the transition — no stale data visible.

---

### Task 3: Evaluate Tab Implementation

**Layout structure for `activeTab === 1`:**

```tsx
{activeTab === 1 && (
  <>
    {/* Competency chips + Run Evaluation button row */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {competencies.map((c) => (
          <CompetencyChip
            key={c.id}
            competency={c}
            mode="filter"
            selected={selectedCompetency?.id === c.id}
            onClick={() => setCompetency(selectedCompetency?.id === c.id ? null : c)}
          />
        ))}
      </Box>
      {selectedCompetency !== null && (
        <Button variant="contained" sx={{ ml: 2, whiteSpace: 'nowrap' }}>
          Run Evaluation
        </Button>
      )}
    </Box>

    {/* Content area based on state */}
    {selectedCompetency === null ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <Typography color="text.secondary">
          Select a competency above to begin
        </Typography>
      </Box>
    ) : isLoading ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    ) : entries.length === 0 ? (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, gap: 2 }}>
        <Typography color="text.secondary">
          No entries tagged to {selectedCompetency.name} for {employee.name}
        </Typography>
        <Button
          variant="contained"
          onClick={() => { setActiveTab(0); setShowInlineRow(true) }}
        >
          + Log Behavior
        </Button>
      </Box>
    ) : (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell component="th" scope="col" sx={{ width: 110 }}>Date</TableCell>
              <TableCell component="th" scope="col">Description</TableCell>
              <TableCell component="th" scope="col" sx={{ width: 280 }}>Competencies</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </>
)}
```

**Key differences from Behavior Log table:**
- No `hoveredId` state used (no hover-reveal edit/delete icons)
- Table has 3 columns (no actions column)
- No `InlineLogRow` rendering
- `CompetencyChip` in `mode="read-only"` for row chips (same as Behavior Log)

**Note on Run Evaluation button:** No `onClick` handler is added in this story. Story 6.2 adds `useEvaluation.ts`, `GradeResultCard.tsx`, and wires the button to `useEvaluation.evaluate()`. For this story, the button is present and visually correct but inert.

---

### Architecture Compliance

| Rule | Applied here |
|---|---|
| Competency state in Zustand | `selectedCompetency` from `useAppStore` — tab persistence satisfied by store persistence |
| No direct IPC in components | Evaluate tab entries fetched via `useBehaviorLog.load()` — no `window.electronAPI.invoke` in component |
| Components call hooks, not IPC | `useBehaviorLog` hook already supports `competencyId` filter parameter |
| `setEmployee` resets competency | `setEmployee` in store sets `selectedCompetency: null` — new employee = clean Evaluate tab |
| `ai:evaluate` preload allowlist | Already present in `ALLOWED_CHANNELS` from Story 1.5 scaffold |
| Read-only evaluate table | No edit/delete actions in Evaluate table — behavior log is the edit surface |

---

### Previous Story Intelligence (Stories 5.x and 4.x)

- **Shared `entries` state across tabs:** The `useBehaviorLog` hook owns `entries`, `isLoading`, and `error`. Both tabs share this state. Only one tab is visible at a time, so switching tabs triggers a reload via the unified `useEffect`. This is the correct pattern — no duplicate hook instances needed.
- **`selectedCompetency` resets on `setEmployee`:** `appStore.ts` `setEmployee` sets `selectedCompetency: null`. When navigating back to the employee list and selecting a new employee, the Evaluate tab starts fresh.
- **ABI mismatch prevents real SQLite in Vitest:** This story adds no new DB code, so no new mock infrastructure needed.
- **`try/finally` pattern not needed here:** No new hook callbacks in this story — only view-layer changes.
- **`setKeyConfigured` typo in appStore:** Story 5.3 deferred work notes a pre-existing typo where `setKeyConfigured` may reference wrong identifier. Do NOT call `setKeyConfigured` in this story; it is unused in the Evaluate tab.
- **Import list in EmployeeDetail.tsx:** All needed MUI components (`Box`, `Button`, `CircularProgress`, `Table`, `TableBody`, `TableCell`, `TableContainer`, `TableHead`, `TableRow`, `Typography`, `Paper`) are already imported. No new imports from `@mui/material` required.

---

### Scope Boundary Notes

- **Do NOT implement Run Evaluation click handler:** Story 6.1 is UI scaffolding for the Evaluate tab. The actual AI call (`useEvaluation.evaluate()`) and `GradeResultCard.tsx` are Story 6.2 scope.
- **Do NOT create `useEvaluation.ts`:** This hook is created in Story 6.2 when the AI call handler is implemented. Story 6.1 does not need it.
- **Do NOT create `GradeResultCard.tsx` or `InsufficientInputCard.tsx`:** These are Story 6.2 and 6.3 respectively.
- **Do NOT persist `activeTab` in Zustand:** The spec (UX-DR10) requires competency chip selection to persist — not the active tab itself. `activeTab` stays as local React state.
- **Do NOT add scroll position persistence:** UX-DR10 mentions scroll position, but this is not in the ACs and is out of scope for this story.
- **Do NOT add hover-reveal actions to Evaluate table rows:** The Evaluate table is read-only. Edit/delete belongs only in the Behavior Log tab.
- **Behavior Log tab filter unchanged:** `selectedCompetencyId` local state and its filter behavior are untouched. Only the Evaluate tab is new.
- **`+ Log Behavior` CTA in Evaluate empty state:** The button switches to tab 0 and opens the inline row. It does NOT pre-select the competency in InlineLogRow — that is Story 6.3 (InsufficientInputCard) behavior.

---

### UX Requirements Mapping

| Requirement | Implementation |
|---|---|
| UX-DR9: Evaluate tab with competency filter chips, no "All" chip | 4 `CompetencyChip` in `mode="filter"`, no "All" option |
| UX-DR9: "Run Evaluation" button | `Button variant="contained"` rendered only when `selectedCompetency !== null` |
| UX-DR10: Tab persistence via Zustand | `selectedCompetency` from `useAppStore` — survives tab switches; resets on `setEmployee(null)` |
| UX-DR11: Evaluate tab, no competency selected | "Select a competency above to begin" — no CTA (chips ARE the action) |
| UX-DR11: Evaluate tab, no entries | "No entries tagged to [Competency] for [Name]" + "+ Log Behavior" CTA |
| UX-DR15: `aria-pressed` on filter chips | `CompetencyChip` filter mode already implements `aria-pressed` on the MUI `Chip` |

---

### References

- [Source: epics.md — Story 6.1 Acceptance Criteria]
- [Source: architecture.md — Frontend Architecture, Zustand store shape, useBehaviorLog hook pattern]
- [Source: ux-design-specification.md — UX-DR9, UX-DR10, UX-DR11, Empty States table]
- [Source: sdd-app/src/renderer/src/views/EmployeeDetail.tsx — current implementation being modified]
- [Source: sdd-app/src/renderer/src/store/appStore.ts — existing selectedCompetency state]
- [Source: sdd-app/src/renderer/src/hooks/useBehaviorLog.ts — load(employeeId, competencyId?) pattern]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- All 4 tasks completed; all 6 ACs satisfied.
- `EmployeeDetail.tsx`: Added `selectedCompetency` and `setCompetency` Zustand selectors alongside existing store selectors (Task 1).
- `EmployeeDetail.tsx`: Replaced the single-tab `useEffect` with a branched version that loads entries for the active tab's filter — Behavior Log uses `selectedCompetencyId` (local state), Evaluate uses `selectedCompetency.id` (Zustand), and skips the fetch entirely when Evaluate tab has no competency selected (Task 2).
- `EmployeeDetail.tsx`: Replaced the "AI evaluation — coming in Epic 6." placeholder with the full Evaluate tab implementation: 4 `CompetencyChip` filter chips (filter mode, toggling sets/clears Zustand `selectedCompetency`), "Run Evaluation" primary button (rendered only when competency selected, no onClick — Story 6.2 wires the call), "Select a competency above to begin" instructional state, `CircularProgress` loading state, empty state with "+ Log Behavior" CTA (navigates to Behavior Log tab and opens inline row), and read-only entries table with 3 columns (no edit/delete hover actions) (Task 3).
- TypeScript: `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors.
- Tests: `npm run test` — 81 tests across 10 files, all passing. No regressions. No new tests added (no new IPC handlers or custom components in this story).

## File List

**Modified:**
- `sdd-app/src/renderer/src/views/EmployeeDetail.tsx`

## Change Log

- 2026-05-02: Story 6.1 implemented — Evaluate tab with competency filter chips, filtered evidence table, and Run Evaluation button scaffold. Single file modified: EmployeeDetail.tsx.
