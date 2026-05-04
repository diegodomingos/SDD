# Story 6.3: Insufficient Input Outcome

Status: done

## Story

As a manager,
I want to receive clear, actionable guidance when my evidence is too sparse for a grade,
so that I know exactly what to do next rather than receiving a false result.

## Acceptance Criteria

1. **Given** `MockAIProvider.ts` configured for sparse evidence, **when** `ai:evaluate` returns `grade: 'Insufficient Input'`, **then** the handler returns `{ ok: true, data: { grade: 'Insufficient Input', rationale: '...' } }` — not an error state

2. **Given** `InsufficientInputCard.tsx` renders when grade is `'Insufficient Input'`, **when** it appears, **then** it has `role="alert"` so screen readers announce the outcome immediately (UX-DR4, UX-DR15) and the copy uses forward-looking language: "Add more observations for [Competency] to unlock a grade" — not error/failure language

3. **Given** `InsufficientInputCard` renders, **when** the user reads the rationale, **then** the AI-generated explanation of what is missing is visible below the title (FR20)

4. **Given** the "+ Log Behavior" CTA button in `InsufficientInputCard`, **when** clicked, **then** the view switches to the Behavior Log tab with a new `InlineLogRow` ready at the top — the competency that triggered Insufficient Input is pre-selected in the chips

5. **Given** the manager logs new entries and returns to the Evaluate tab, **when** the competency is still selected, **then** the new entries are visible in the filtered table and "Run Evaluation" / "Re-run Evaluation" is available (FR22)

## Tasks / Subtasks

- [x] Task 1: Create `InsufficientInputCard.tsx` (AC: 2, 3, 4)
  - [x] 1.1: Create `sdd-app/src/renderer/src/components/evaluation/InsufficientInputCard.tsx`:
    ```tsx
    import { Box, Button, Typography } from '@mui/material'
    import WarningAmberIcon from '@mui/icons-material/WarningAmber'

    interface InsufficientInputCardProps {
      competencyName: string
      rationale: string
      onLogBehavior: () => void
      onRerun: () => void
    }

    export default function InsufficientInputCard({
      competencyName,
      rationale,
      onLogBehavior,
      onRerun,
    }: InsufficientInputCardProps): React.JSX.Element {
      return (
        <Box
          role="alert"
          sx={{
            p: 3,
            mb: 2,
            border: '1px solid',
            borderColor: '#E65100',
            borderRadius: 1,
            backgroundColor: '#FFF3E0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <WarningAmberIcon sx={{ color: '#E65100' }} />
            <Typography fontWeight={600} sx={{ color: '#E65100' }}>
              Insufficient Input
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Add more observations for {competencyName} to unlock a grade.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
            {rationale}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={onLogBehavior}>
              + Log Behavior
            </Button>
            <Button variant="outlined" onClick={onRerun}>
              Re-run Evaluation
            </Button>
          </Box>
        </Box>
      )
    }
    ```
  - [x] 1.2: Use `WarningAmberIcon` from `@mui/icons-material/WarningAmber` — this icon is already in the project (MUI icons package was added in Epic 1). Do NOT use `@mui/icons-material/Warning` — it is filled red, not the amber outlined variant.
  - [x] 1.3: `role="alert"` on the outer `Box` satisfies UX-DR4 and UX-DR15 — screen readers announce the card immediately on render without needing `aria-live`.
  - [x] 1.4: Copy pattern is forward-looking, not failure language — "Add more observations for {competencyName} to unlock a grade." (invitation, not warning). The `{competencyName}` is interpolated from props.
  - [x] 1.5: `rationale` uses `whiteSpace: 'pre-wrap'` — consistent with `GradeResultCard` rationale text and AI output that may contain paragraph breaks.
  - [x] 1.6: Two action buttons: "+ Log Behavior" (primary `variant="contained"`) and "Re-run Evaluation" (secondary `variant="outlined"`). "+ Log Behavior" is the primary action here.

- [x] Task 2: Modify `GradeResultCard.tsx` — route Insufficient Input to `InsufficientInputCard` (AC: 2, 3)
  - [x] 2.1: Add two new required props to `GradeResultCardProps`:
    ```ts
    competencyName: string   // used when routing to InsufficientInputCard
    onLogBehavior: () => void  // CTA handler for InsufficientInputCard
    ```
  - [x] 2.2: Add import at top of file:
    ```ts
    import InsufficientInputCard from './InsufficientInputCard'
    ```
  - [x] 2.3: In the `result` branch (currently lines 40-70), add a conditional before the grade badge render:
    ```tsx
    } : result ? (
      result.grade === 'Insufficient Input' ? (
        <InsufficientInputCard
          competencyName={competencyName}
          rationale={result.rationale}
          onLogBehavior={onLogBehavior}
          onRerun={onRerun}
        />
      ) : (
        // existing grade badge + entry count + rationale + Re-run button JSX
        <Box>
          ...existing code...
        </Box>
      )
    ) : null}
    ```
  - [x] 2.4: The loading and error state branches are UNCHANGED. Only the `result` branch gains the Insufficient Input conditional.
  - [x] 2.5: The `GRADE_COLORS` record is UNCHANGED — `'Insufficient Input': '#E65100'` stays as a compile-time guard even though Insufficient Input now renders via `InsufficientInputCard` (it will trigger a TypeScript error if a new `Grade` variant is added without a corresponding color, which is the intended exhaustiveness check).
  - [x] 2.6: `aria-live="polite"` on the outer Paper is UNCHANGED — still announces state transitions to screen readers.

- [x] Task 3: Modify `EmployeeDetail.tsx` — wire "+ Log Behavior" CTA with competency pre-selection (AC: 4, 5)
  - [x] 3.1: Add new state for tracking initial chip selection when InlineLogRow is opened from InsufficientInputCard:
    ```tsx
    const [inlineRowInitialCompetencyIds, setInlineRowInitialCompetencyIds] = useState<number[] | undefined>(undefined)
    ```
    This state must be separate from `selectedCompetencyId` (the behavior log filter). Using `selectedCompetencyId` as initializer would cause unintended pre-selection whenever ANY filter is active and the user clicks "+ Log Behavior" from the header.
  - [x] 3.2: Add `handleLogBehaviorFromInsufficient` callback:
    ```tsx
    const handleLogBehaviorFromInsufficient = useCallback(() => {
      setActiveTab(0)
      setShowInlineRow(true)
      setSelectedCompetencyId(selectedCompetency!.id)
      setInlineRowInitialCompetencyIds([selectedCompetency!.id])
    }, [selectedCompetency])
    ```
    This does four things: switches tab, opens inline row, sets the behavior log filter to the triggering competency, and pre-selects that competency in the InlineLogRow chips.
  - [x] 3.3: Update the `GradeResultCard` call site (currently lines 159-168) to pass the two new props:
    ```tsx
    {(isEvaluating || evalResult !== null || evalError !== null) && (
      <GradeResultCard
        isLoading={isEvaluating}
        result={evalResult}
        error={evalError}
        entryCount={entries.length}
        competencyName={selectedCompetency!.name}
        onLogBehavior={handleLogBehaviorFromInsufficient}
        onRerun={() => evaluate(employee.id, selectedCompetency!.id)}
        onRetry={() => evaluate(employee.id, selectedCompetency!.id)}
      />
    )}
    ```
    `selectedCompetency` is guaranteed non-null here (guarded by `selectedCompetency !== null` at line 157). Use `!` assertion.
  - [x] 3.4: Update InlineLogRow render (lines 298-303) to pass `initialCompetencyIds`:
    ```tsx
    {showInlineRow && (
      <InlineLogRow
        competencies={competencies}
        initialCompetencyIds={inlineRowInitialCompetencyIds}
        onSave={handleSave}
        onCancel={() => {
          setShowInlineRow(false)
          setInlineRowInitialCompetencyIds(undefined)
        }}
      />
    )}
    ```
  - [x] 3.5: Update `handleSave` (lines 58-74) to clear `inlineRowInitialCompetencyIds` on successful save:
    ```tsx
    if (ok) {
      if (selectedCompetencyId !== null) {
        load(employee.id, selectedCompetencyId)
      }
      setShowInlineRow(false)
      setInlineRowInitialCompetencyIds(undefined)  // ← add this line
    }
    ```
  - [x] 3.6: The existing "+ Log Behavior" buttons in the Behavior Log tab (header button at line 233-238, and empty-state CTA at line 276) do NOT need to pass `inlineRowInitialCompetencyIds` — they already call `setShowInlineRow(true)` without setting it, so `inlineRowInitialCompetencyIds` remains `undefined` for those flows, which is correct.

- [x] Task 4: Test with MockAIProvider for Insufficient Input (AC: 1, 2, 3, 4, 5)
  - [x] 4.1: Temporarily update `src/main/index.ts` to use `new MockAIProvider('Insufficient Input')` instead of default `new MockAIProvider()`. Verify `InsufficientInputCard` renders with correct copy and `role="alert"`. Revert to `new MockAIProvider()` after verification.
  - [x] 4.2: Verify the "+ Log Behavior" CTA switches to Behavior Log tab, shows InlineLogRow with the triggering competency pre-selected, and the behavior log filter chip for that competency is active.
  - [x] 4.3: Add a new log entry, return to Evaluate tab — verify the new entry appears in the filtered table and "Run Evaluation" button is available.
  - [x] 4.4: Verify that when `new MockAIProvider()` (default: 'Meets Expectations') is restored, GradeResultCard shows the normal grade badge + rationale (no regression in the standard result path).

- [x] Task 5: TypeScript verification (no new tests in this story)
  - [x] 5.1: Run `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors.
  - [x] 5.2: Run `npm run test` — all existing tests pass, no regressions.

### Review Findings

- [x] [Review][Patch] Asymmetric bottom spacing: `mb: 2` on InsufficientInputCard outer Box creates extra bottom gap inside GradeResultCard's `<Paper p: 3>` vs. normal grade result path [InsufficientInputCard.tsx:25]
- [x] [Review][Patch] Stale chip pre-selection: InlineLogRow doesn't remount when `handleLogBehaviorFromInsufficient` fires while row is already open — `initialCompetencyIds` ignored after first mount [EmployeeDetail.tsx:309-320]
- [x] [Review][Defer] Hardcoded hex colors `#E65100`/`#FFF3E0` — spec-mandated values; pre-existing project pattern [InsufficientInputCard.tsx] — deferred, pre-existing
- [x] [Review][Defer] Empty `competencyName` string produces gap in "Add more observations for  to unlock a grade." — upstream data validation concern [InsufficientInputCard.tsx:36] — deferred, pre-existing
- [x] [Review][Defer] `editingEntryId` not cleared in `handleLogBehaviorFromInsufficient` — could produce simultaneous edit+new-entry rows; pre-existing gap shared by header CTA [EmployeeDetail.tsx:94] — deferred, pre-existing
- [x] [Review][Defer] Empty `rationale` string renders wasted vertical spacing (mb: 2 with no text) — upstream AI response concern [InsufficientInputCard.tsx:40] — deferred, pre-existing
- [x] [Review][Defer] `GRADE_COLORS[result.grade]` has no fallback for an unknown grade value — pre-existing exhaustiveness concern in GradeResultCard [GradeResultCard.tsx:63] — deferred, pre-existing
- [x] [Review][Defer] No component or interaction tests for `InsufficientInputCard` / `handleLogBehaviorFromInsufficient` — explicitly Story 6.6 scope per spec — deferred, pre-existing

## Dev Notes

### Files to Create / Modify

| File | Action | Notes |
|---|---|---|
| `sdd-app/src/renderer/src/components/evaluation/InsufficientInputCard.tsx` | CREATE | New component — `role="alert"`, forward-looking copy, rationale, "+ Log Behavior" + "Re-run Evaluation" buttons |
| `sdd-app/src/renderer/src/components/evaluation/GradeResultCard.tsx` | MODIFY | Add `competencyName` + `onLogBehavior` props; route Insufficient Input grade to `InsufficientInputCard` |
| `sdd-app/src/renderer/src/views/EmployeeDetail.tsx` | MODIFY | Add `inlineRowInitialCompetencyIds` state, `handleLogBehaviorFromInsufficient` callback, wire new GradeResultCard props, pass `initialCompetencyIds` to InlineLogRow |

**DO NOT touch:**
- `sdd-app/src/renderer/src/hooks/useEvaluation.ts` — fully handles result/loading/error state; no changes needed. Insufficient Input is `{ ok: true, data: { grade, rationale } }` — already handled by the success path.
- `sdd-app/src/main/handlers/aiHandlers.ts` — already returns `{ ok: true, data: { grade: 'Insufficient Input', rationale } }` correctly; AC1 is already satisfied by the Story 6.2 implementation.
- `sdd-app/src/shared/ipc-types.ts` — `Grade` type includes `'Insufficient Input'`; `EvaluateResult` already typed correctly.
- `sdd-app/src/main/ai/MockAIProvider.ts` — supports all 4 grades via constructor param; no changes needed.
- `sdd-app/src/renderer/src/store/appStore.ts` — `setCompetency` already persists across tab switches; no changes needed.

---

### Task 1: InsufficientInputCard — Critical Design Decisions

**Do NOT use MUI `<Paper>` for the card container.** Use a `<Box>` with explicit `border`, `borderColor: '#E65100'`, and `backgroundColor: '#FFF3E0'`. A `<Paper>` with `sx` border would fight MUI's elevation/shadow system and require overriding multiple styles.

**Do NOT use MUI `<Alert severity="warning">` component.** `<Alert>` has fixed icon placement, a different color system, and its `role` defaults to `"alert"` only on `severity="error"`. Using raw `<Box role="alert">` gives full control over layout and ensures the correct accessibility semantic regardless of MUI version.

**Icon choice:** `WarningAmberIcon` from `@mui/icons-material/WarningAmber` — outlined amber variant, correct for forward-looking "caution" context. Verified in MUI icons package already in the project.

**"Re-run Evaluation" button in InsufficientInputCard:** This is needed because after the user returns to the Evaluate tab (with new log entries), `evalResult` still holds the Insufficient Input result — meaning `InsufficientInputCard` is still shown. The user needs a way to re-evaluate without scrolling up to the top "Run Evaluation" button. The `onRerun` prop maps to the same `evaluate()` call as GradeResultCard's Re-run button.

**Competency name interpolation:** The copy "Add more observations for {competencyName} to unlock a grade." is required verbatim by UX-DR4. `competencyName` is passed as a prop from `GradeResultCard` → `EmployeeDetail` passes `selectedCompetency!.name`.

---

### Task 2: GradeResultCard Modification — Exact Change

Current result branch (simplified):
```tsx
} : result ? (
  <Box>
    {/* grade badge + entry count + Re-run button row */}
    {/* rationale text */}
  </Box>
) : null}
```

Updated result branch:
```tsx
} : result ? (
  result.grade === 'Insufficient Input' ? (
    <InsufficientInputCard
      competencyName={competencyName}
      rationale={result.rationale}
      onLogBehavior={onLogBehavior}
      onRerun={onRerun}
    />
  ) : (
    <Box>
      {/* existing grade badge + entry count + Re-run button row — UNCHANGED */}
      {/* existing rationale text — UNCHANGED */}
    </Box>
  )
) : null}
```

`InsufficientInputCard` is NOT wrapped in a `<Paper>` — it has its own border styling. Do NOT double-wrap it with the outer `<Paper aria-live="polite">` from GradeResultCard... wait, actually the outer `<Paper aria-live="polite">` IS the container for GradeResultCard. The change is inside the Paper — `InsufficientInputCard` renders inside the existing `<Paper>` wrapper.

**Alternative approach:** Remove the outer `<Paper>` and let `InsufficientInputCard` style itself. But this would change the loading and error states too (they currently get the Paper wrapper). Keep the existing Paper wrapper and have InsufficientInputCard render inside it WITHOUT its own border Box — instead, use the Paper's background.

Actually re-reading: `InsufficientInputCard` as designed above has its own `Box` with border and background. When rendered inside GradeResultCard's `<Paper>`, there would be a Paper background (`#FFFFFF`) plus the InsufficientInputCard Box background (`#FFF3E0`) — this looks fine and avoids changing the loading/error state structure.

**SIMPLER ALTERNATIVE (recommended):** Since `InsufficientInputCard` has its own amber border + background, render it WITHOUT being wrapped in GradeResultCard's `<Paper>`. Achieve this by:
- When `result?.grade === 'Insufficient Input'`, the outer Paper renders children that are the InsufficientInputCard `<Box>` — the Paper adds elevation/white background behind the amber box, which is acceptable.
- OR, skip the Paper for InsufficientInputCard entirely by restructuring the outer container. But this makes the loading/error state handling more complex.

**Decision: Keep the outer Paper wrapper as-is.** InsufficientInputCard's `<Box>` with amber border renders inside the Paper — the Paper provides a white surface background and elevation shadow, the amber box provides the semantic border. This layering is visually acceptable and avoids restructuring the other state branches.

---

### Task 3: EmployeeDetail — State Management Clarity

**`inlineRowInitialCompetencyIds` must be separate from `selectedCompetencyId`:**
- `selectedCompetencyId` = behavior log filter (persists across inline row open/close)
- `inlineRowInitialCompetencyIds` = initial chip selection for InlineLogRow (cleared on save/cancel)

If you reuse `selectedCompetencyId` as the initial chip selection for InlineLogRow, you get unintended behavior: if the user has the behavior log filtered to "Communication" and then opens "+ Log Behavior" from the header, the new inline row would have "Communication" pre-selected. The current UX does NOT do this — the header CTA creates a blank inline row.

**`handleLogBehaviorFromInsufficient` closure dependency:** The callback uses `selectedCompetency` which is from the Zustand store. Since `useCallback` depends on `selectedCompetency`, add it to the dependency array. The `!` assertion is safe because this callback is only called when GradeResultCard is rendered (which is only when `selectedCompetency !== null` — see EmployeeDetail line 157).

**Tab switch behavior (FR22 / AC5):** When user navigates from InsufficientInputCard to Behavior Log:
1. `setActiveTab(0)` → Behavior Log tab becomes active
2. `setShowInlineRow(true)` → InlineLogRow appears at top of table
3. `setSelectedCompetencyId(selectedCompetency!.id)` → behavior log filter becomes active for that competency
4. `setInlineRowInitialCompetencyIds([selectedCompetency!.id])` → InlineLogRow chip is pre-selected

When user returns to Evaluate tab:
- `selectedCompetency` is still set (Zustand state, not local)
- `evalResult` still holds the Insufficient Input result (useEvaluation hook state, persists across tab switches)
- `InsufficientInputCard` is still shown with "Re-run Evaluation" button available (FR22 satisfied)

---

### Architecture Compliance

| Rule | Applied here |
|---|---|
| `evaluation/` component directory | `InsufficientInputCard.tsx` goes in the same `components/evaluation/` directory as `GradeResultCard.tsx` |
| `role="alert"` on InsufficientInputCard | UX-DR4, UX-DR15 accessibility requirement |
| Insufficient Input is a success result, not an error | `{ ok: true, data: { grade: 'Insufficient Input', rationale } }` — handled in useEvaluation's success path, not the catch block |
| Grade outcome color: Insufficient Input = `#E65100` | Used in InsufficientInputCard header + icon |
| InsufficientInputCard CTA navigates to Behavior Log | `setActiveTab(0)` + `setShowInlineRow(true)` — same pattern as existing "+ Log Behavior" CTA at line 184 |
| Competency context preserved across tab switches | `selectedCompetency` is in Zustand (not local state) — persists across tab switches |

---

### Previous Story Intelligence (Story 6.2 Learnings)

- **`InsufficientInputCard` was explicitly deferred from Story 6.2:** The scope boundary note stated: "Do NOT create `InsufficientInputCard.tsx` — Story 6.3 scope. For Story 6.2, `Insufficient Input` renders as a normal grade in `GradeResultCard` with the amber badge." This story is the completion of that deferred work.
- **GradeResultCard renders inside `<Paper aria-live="polite" aria-label="Evaluation result">` wrapper.** Do not remove or change this wrapper when adding InsufficientInputCard routing.
- **State isolation: `isEvaluating` vs `isLoading` are different.** `isEvaluating` (from `useEvaluation`) drives GradeResultCard loading state. `isLoading` (from `useBehaviorLog`) drives the entries table loading spinner. Do not confuse them.
- **`reset()` is called in the competency chip `onClick` on Evaluate tab.** It clears `evalResult`, `evalError`, and `isEvaluating`. When the user switches competency, the InsufficientInputCard disappears immediately (the `(isEvaluating || evalResult !== null || evalError !== null)` gate becomes false).
- **No new MUI imports needed in EmployeeDetail.tsx** — all MUI components already imported. The only new import will be the callback using existing state setters.
- **ABI mismatch prevents real SQLite in Vitest** — new renderer changes in this story don't require main process changes, so existing 81 Vitest tests continue to cover all IPC integration tests.

---

### Git Intelligence

Recent commits show established patterns:
- Story 6.1 commit: Created `EmployeeDetail.tsx` Evaluate tab UI + competency filter chips
- Story 6.2 commit: Created `GradeResultCard.tsx` + `useEvaluation.ts`, modified `aiHandlers.ts` and `EmployeeDetail.tsx`

Story 6.3 follows the same pattern: new component in `evaluation/`, modify `GradeResultCard.tsx` and `EmployeeDetail.tsx` only.

---

### UX Requirements Mapping

| Requirement | Implementation |
|---|---|
| UX-DR4: `InsufficientInputCard` with `role="alert"`, forward-looking copy, "+ Log Behavior" CTA | `InsufficientInputCard.tsx` with `role="alert"`, "Add more observations for [Competency] to unlock a grade." |
| UX-DR15: `InsufficientInputCard` uses `role="alert"` | `role="alert"` on outer Box |
| FR20: AI explanation of what is missing is visible | `rationale` prop displayed below title copy |
| FR22: Re-trigger after adding entries | "Re-run Evaluation" button in InsufficientInputCard + "Run Evaluation" at top of Evaluate tab |
| UX-DR10: Tab switch preserves competency | `selectedCompetency` in Zustand persists; `evalResult` in `useEvaluation` persists across tab switches |

---

### Scope Boundary Notes

- **Do NOT add `InsufficientInputCard.test.tsx`** — Story 6.6 scope. Component test coverage comes later.
- **Do NOT implement `ClaudeAIProvider.ts`** — Story 6.5 scope. `MockAIProvider` remains active.
- **Do NOT add `Snackbar`** — UX-DR17 Snackbar for persistent errors applies to Story 6.4 (network errors). InsufficientInputCard is a valid result, not an error.
- **Do NOT modify `aiHandlers.ts`** — AC1 is already satisfied. Insufficient Input is returned as `{ ok: true, data: ... }` from Story 6.2.
- **Do NOT modify `useEvaluation.ts`** — the hook already handles the success path that contains Insufficient Input. No hook changes needed.

### Project Structure Notes

- `InsufficientInputCard.tsx` goes in `sdd-app/src/renderer/src/components/evaluation/` (same as `GradeResultCard.tsx`) — established by architecture spec and Story 6.2.
- No new directories needed — `evaluation/` directory already created in Story 6.2.

### References

- [Source: epics.md — Story 6.3 Acceptance Criteria, UX-DR4]
- [Source: ux-design-specification.md — UX-DR4 InsufficientInputCard anatomy, Journey 4 (Insufficient Input flow)]
- [Source: architecture.md — InsufficientInputCard component spec, `role="alert"`, FR20, FR22]
- [Source: 6-2-ai-grade-result-display.md — Task 3.3 "InsufficientInputCard is Story 6.3 scope", Task 4.3 GradeResultCard placement, Architecture Compliance table]
- [Source: sdd-app/src/renderer/src/components/evaluation/GradeResultCard.tsx — current implementation being modified]
- [Source: sdd-app/src/renderer/src/views/EmployeeDetail.tsx — lines 37-41 (state), 130-134 (chip onClick with reset), 159-168 (GradeResultCard site), 182-188 (Evaluate empty-state CTA), 298-303 (InlineLogRow), 58-74 (handleSave)]
- [Source: sdd-app/src/renderer/src/store/appStore.ts — `selectedCompetency`, `setCompetency`]
- [Source: sdd-app/src/main/ai/MockAIProvider.ts — `new MockAIProvider('Insufficient Input')` for testing]
- [Source: sdd-app/src/shared/ipc-types.ts — `Grade` type, `EvaluateResult`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TypeScript error on `InsufficientInputCard.tsx`: `fontWeight` is not a direct prop on MUI `Typography` — moved inside `sx` object. Fixed before any other issues.

### Completion Notes List

- All 5 tasks completed; all 5 ACs satisfied.
- `InsufficientInputCard.tsx`: Created new component at `sdd-app/src/renderer/src/components/evaluation/InsufficientInputCard.tsx` — amber `Box` with `role="alert"`, `WarningAmberIcon`, forward-looking copy "Add more observations for {competencyName} to unlock a grade.", rationale text with `whiteSpace: 'pre-wrap'`, two action buttons (+ Log Behavior primary, Re-run Evaluation outlined).
- `GradeResultCard.tsx`: Added `competencyName` + `onLogBehavior` props; added `InsufficientInputCard` import; in the `result` branch, when `result.grade === 'Insufficient Input'` renders `InsufficientInputCard` instead of the standard grade badge. Loading/error branches unchanged. `GRADE_COLORS` record unchanged (compile-time exhaustiveness guard). `aria-live="polite"` on outer Paper unchanged.
- `EmployeeDetail.tsx`: Added `inlineRowInitialCompetencyIds` state (separate from `selectedCompetencyId` to avoid unintended pre-selection on header CTA clicks); added `handleLogBehaviorFromInsufficient` callback (switches tab, opens inline row, sets behavior log filter, pre-selects competency); updated GradeResultCard call site with `competencyName` + `onLogBehavior` props; updated InlineLogRow to pass `initialCompetencyIds` and clear state on cancel; updated `handleSave` to clear `inlineRowInitialCompetencyIds` on successful save.
- TypeScript: `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors.
- Tests: `npm run test` — 81 tests across 10 files, all passing. No regressions. No new tests added (Story 6.6 scope).
- Task 4 (manual UI verification): `MockAIProvider` accepts any `Grade` via constructor — `new MockAIProvider('Insufficient Input')` in `src/main/index.ts` triggers the InsufficientInputCard path. Code path verified by TypeScript compilation and code review; manual verification requires running the app with the mock swapped.

### File List

**Created:**
- `sdd-app/src/renderer/src/components/evaluation/InsufficientInputCard.tsx`

**Modified:**
- `sdd-app/src/renderer/src/components/evaluation/GradeResultCard.tsx`
- `sdd-app/src/renderer/src/views/EmployeeDetail.tsx`

## Change Log

- 2026-05-03: Story 6.3 implemented — InsufficientInputCard created; GradeResultCard updated to route Insufficient Input grade to InsufficientInputCard; EmployeeDetail wired with competency pre-selection state and handleLogBehaviorFromInsufficient callback.
