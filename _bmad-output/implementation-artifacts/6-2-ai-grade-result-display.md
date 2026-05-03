# Story 6.2: AI Grade Result Display

Status: done

## Story

As a manager,
I want to trigger an AI assessment and see the grade and rationale,
so that I receive a trusted, evidence-grounded evaluation result I can act on.

## Acceptance Criteria

1. **Given** `src/main/handlers/aiHandlers.ts` registers `ai:evaluate`, **when** invoked with `{ employeeId, competencyId }`, **then** the handler: (1) fetches filtered log entries via `behaviorLog.listEntries`, (2) fetches expected behaviors via `framework.getExpectedBehavior`, (3) calls `AIProvider.evaluate()` with a 30-second timeout enforced by `Promise.race`, (4) returns `IpcResult<{ grade, rationale }>`

2. **Given** `src/renderer/hooks/useEvaluation.ts`, **when** `evaluate(employeeId, competencyId)` is called, **then** it invokes `ai:evaluate`, manages `isLoading`, `result`, and `error` state — isolating the evaluation state from all other state in the view

3. **Given** the user clicks "Run Evaluation", **when** the AI call is in progress, **then** `GradeResultCard.tsx` shows a loading state: `CircularProgress` spinner with "Running evaluation…" label, Run Evaluation button disabled (UX-DR3, NFR2)

4. **Given** the AI call completes successfully, **when** the result renders, **then** `GradeResultCard` shows: a grade badge using the outcome color for the returned grade, the full rationale text, an entry count ("Based on N observations"), and a "Re-run Evaluation" secondary button (FR18, FR19, FR22)

5. **Given** the grade badge renders, **when** the grade is one of the four valid values, **then** the badge uses the correct outcome color: Exceeds Expectations `#2E7D32`, Meets Expectations `#1565C0`, Does Not Meet Expectations `#C62828`, Insufficient Input `#E65100` (UX-DR7)

6. **Given** the AI call fails (network error or timeout), **when** the error renders, **then** `GradeResultCard` shows a plain-English error message and a "Retry" button (FR23, UX-DR17)

## Tasks / Subtasks

- [x] Task 1: Implement `aiHandlers.ts` — wire real evaluation logic (AC: 1)
  - [x] 1.1: Add imports to `sdd-app/src/main/handlers/aiHandlers.ts`:
    - `import { db } from '../db/database'`
    - `import { listEntries } from '../db/behaviorLog'`
    - `import { getExpectedBehavior } from '../db/framework'`
    - `import { getModel } from '../settings/modelPreference'`
    - `import type { CompetencyLevel } from '../../shared/ipc-types'`
  - [x] 1.2: In the handler body, look up the employee's level via direct DB query:
    ```ts
    const empRow = db!.prepare('SELECT level FROM employees WHERE id = ?').get(payload.employeeId) as { level: CompetencyLevel } | undefined
    if (!empRow) return { ok: false, error: 'Employee not found.' }
    ```
    **Why direct SQL:** `employees.ts` exposes no `getEmployee(db, id)` function — only `listEmployees(db)`. A direct query is the minimal correct approach; no new export needed.
  - [x] 1.3: Fetch entries and expected behaviors:
    ```ts
    const entries = listEntries(db!, payload.employeeId, payload.competencyId)
    const expectedBehaviors = getExpectedBehavior(payload.competencyId, empRow.level) ?? ''
    const model = getModel(db!)
    ```
    **Note:** `getExpectedBehavior` uses the internal `db` singleton (no `db` param) — this is intentional, matching `framework.ts`'s existing pattern (different from `behaviorLog.ts` which takes `db` explicitly).
  - [x] 1.4: Enforce 30-second timeout via `Promise.race`:
    ```ts
    const TIMEOUT_MS = 30_000
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Evaluation timed out. Check your connection and try again.')), TIMEOUT_MS)
    )
    const result = await Promise.race([
      aiProvider.evaluate({ entries, expectedBehaviors, model }),
      timeoutPromise
    ])
    ```
  - [x] 1.5: Return success result and handle errors:
    ```ts
    log.info('[ai:evaluate] grade=%s', result.grade)
    return { ok: true, data: { grade: result.grade, rationale: result.rationale } }
    ```
    In the existing `catch (e)` block: return `{ ok: false, error: e instanceof Error ? e.message : 'AI evaluation failed. Check your connection and try again.' }`
  - [x] 1.6: Remove the `void aiProvider` placeholder line — `aiProvider` is now used in the actual call

- [x] Task 2: Create `useEvaluation.ts` hook (AC: 2)
  - [x] 2.1: Create `sdd-app/src/renderer/src/hooks/useEvaluation.ts`:
    ```ts
    import { useCallback, useState } from 'react'
    import type { EvaluateResult } from '../../../shared/ipc-types'

    interface UseEvaluationReturn {
      isLoading: boolean
      result: EvaluateResult | null
      error: string | null
      evaluate: (employeeId: number, competencyId: number) => Promise<void>
      reset: () => void
    }

    export function useEvaluation(): UseEvaluationReturn {
      const [isLoading, setIsLoading] = useState(false)
      const [result, setResult] = useState<EvaluateResult | null>(null)
      const [error, setError] = useState<string | null>(null)

      const evaluate = useCallback(async (employeeId: number, competencyId: number): Promise<void> => {
        setIsLoading(true)
        setError(null)
        setResult(null)
        try {
          const res = await window.electronAPI.invoke('ai:evaluate', { employeeId, competencyId })
          if (res.ok) {
            setResult(res.data as EvaluateResult)
          } else {
            setError(res.error)
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Unexpected error during evaluation.')
        } finally {
          setIsLoading(false)
        }
      }, [])

      const reset = useCallback(() => {
        setIsLoading(false)
        setResult(null)
        setError(null)
      }, [])

      return { isLoading, result, error, evaluate, reset }
    }
    ```
  - [x] 2.2: `evaluate()` state lifecycle: `isLoading=true` on call → clears `result` and `error` → sets `result` on success or `error` on failure → `isLoading=false` in finally. This prevents stale state across re-runs.
  - [x] 2.3: `reset()` clears all three state values — called from `EmployeeDetail.tsx` when the user switches to a different competency chip (so old results don't persist)

- [x] Task 3: Create `GradeResultCard.tsx` component (AC: 3, 4, 5, 6)
  - [x] 3.1: Create directory `sdd-app/src/renderer/src/components/evaluation/` (new — matches architecture spec)
  - [x] 3.2: Create `sdd-app/src/renderer/src/components/evaluation/GradeResultCard.tsx`:
    ```tsx
    import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
    import type { EvaluateResult, Grade } from '../../../../shared/ipc-types'

    const GRADE_COLORS: Record<Grade, string> = {
      'Exceeds Expectations': '#2E7D32',
      'Meets Expectations': '#1565C0',
      'Does Not Meet Expectations': '#C62828',
      'Insufficient Input': '#E65100',
    }

    interface GradeResultCardProps {
      isLoading: boolean
      result: EvaluateResult | null
      error: string | null
      entryCount: number
      onRerun: () => void
      onRetry: () => void
    }

    export default function GradeResultCard({
      isLoading,
      result,
      error,
      entryCount,
      onRerun,
      onRetry,
    }: GradeResultCardProps): React.JSX.Element {
      return (
        <Paper sx={{ p: 3, mb: 2 }} aria-live="polite" aria-label="Evaluation result">
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography color="text.secondary">Running evaluation…</Typography>
            </Box>
          ) : error ? (
            <Box>
              <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
              <Button variant="outlined" onClick={onRetry}>Retry</Button>
            </Box>
          ) : result ? (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: GRADE_COLORS[result.grade],
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '14px',
                      alignSelf: 'flex-start',
                    }}
                  >
                    {result.grade}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Based on {entryCount} observation{entryCount !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Button variant="outlined" onClick={onRerun} sx={{ ml: 2, whiteSpace: 'nowrap' }}>
                  Re-run Evaluation
                </Button>
              </Box>
              <Typography sx={{ fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {result.rationale}
              </Typography>
            </Box>
          ) : null}
        </Paper>
      )
    }
    ```
  - [x] 3.3: State priority: `isLoading` checked first (before `error` and `result`), since a re-run clears both `result` and `error` before the new call completes
  - [x] 3.4: `aria-live="polite"` on the Paper container satisfies UX-DR15 (AI loading state announces to screen readers)
  - [x] 3.5: `GRADE_COLORS` record covers all four valid `Grade` values — TypeScript will error if a new grade is ever added without updating this map (exhaustiveness check via `Record<Grade, string>`)

- [x] Task 4: Wire `EmployeeDetail.tsx` — connect hook and component (AC: 3, 4, 6)
  - [x] 4.1: Add imports:
    ```tsx
    import { useEvaluation } from '../hooks/useEvaluation'
    import GradeResultCard from '../components/evaluation/GradeResultCard'
    ```
  - [x] 4.2: Add `useEvaluation()` hook destructuring after the existing hook calls:
    ```tsx
    const { isLoading: isEvaluating, result: evalResult, error: evalError, evaluate, reset } = useEvaluation()
    ```
  - [x] 4.3: In the Evaluate tab's competency chip `onClick`, call `reset()` when switching competencies so stale results don't persist:
    ```tsx
    onClick={() => {
      setCompetency(selectedCompetency?.id === c.id ? null : c)
      reset()
    }}
    ```
  - [x] 4.4: Wire the "Run Evaluation" button:
    ```tsx
    {selectedCompetency !== null && (
      <Button
        variant="contained"
        sx={{ ml: 2, whiteSpace: 'nowrap' }}
        onClick={() => evaluate(employee.id, selectedCompetency.id)}
        disabled={isEvaluating}
      >
        Run Evaluation
      </Button>
    )}
    ```
  - [x] 4.5: In the Evaluate tab content area (after the `selectedCompetency === null` instructional check), add `GradeResultCard` ABOVE the entries table/empty-state. Show it only when evaluation has been triggered:
    ```tsx
    {selectedCompetency !== null && (isEvaluating || evalResult !== null || evalError !== null) && (
      <GradeResultCard
        isLoading={isEvaluating}
        result={evalResult}
        error={evalError}
        entryCount={entries.length}
        onRerun={() => evaluate(employee.id, selectedCompetency.id)}
        onRetry={() => evaluate(employee.id, selectedCompetency.id)}
      />
    )}
    ```
  - [x] 4.6: The existing entries content area (error Alert → isLoading spinner → empty state → table) remains BELOW GradeResultCard, unchanged. Evidence stays visible alongside the result (trust principle from UX spec: "Never present a grade in isolation").

- [x] Task 5: TypeScript and test verification (no new tests in this story)
  - [x] 5.1: `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] 5.2: `npm run test` — all 81 existing tests pass, no regressions

### Review Findings

- [x] [Review][Patch] Timeout promise leaks live setTimeout handle on success — when `aiProvider.evaluate` resolves before the 30s timeout, the timer keeps running until it fires on a dead promise; fix by capturing the handle and calling `clearTimeout` in a `.finally` on the race [sdd-app/src/main/handlers/aiHandlers.ts:22]
- [x] [Review][Patch] `res.error` not guarded for undefined before `setError` — if the IPC layer returns `{ ok: false }` without an `error` field, `setError(undefined)` is called, making `GradeResultCard` render nothing (falsy error branch) with no feedback to the user; fix: `setError(res.error ?? 'Evaluation failed.')` [sdd-app/src/renderer/src/hooks/useEvaluation.ts:26]
- [x] [Review][Defer] `entryCount` mismatch — `entries.length` from the renderer reflects the current hook snapshot, not the exact entries the main process evaluated; a narrow race (entries added/deleted during the 30s evaluation) can cause a wrong "Based on N observations" caption — deferred, pre-existing [sdd-app/src/renderer/src/views/EmployeeDetail.tsx:168]
- [x] [Review][Defer] `getExpectedBehavior` null coerced to empty string sent silently to AI — when expected behaviors are unconfigured, the AI receives no behavioral context and produces a grade with zero guidance; no warning logged or surfaced to the user — deferred, pre-existing [sdd-app/src/main/handlers/aiHandlers.ts:18]

## Dev Notes

### Files to Create / Modify

| File | Action | Notes |
|---|---|---|
| `sdd-app/src/main/handlers/aiHandlers.ts` | MODIFY | Implement stub — add repo imports, employee level lookup, 30s timeout, real evaluate call |
| `sdd-app/src/renderer/src/hooks/useEvaluation.ts` | CREATE | New hook — isLoading/result/error state, evaluate(), reset() |
| `sdd-app/src/renderer/src/components/evaluation/GradeResultCard.tsx` | CREATE | New component — 3 states (loading/result/error), grade badge with outcome colors |
| `sdd-app/src/renderer/src/views/EmployeeDetail.tsx` | MODIFY | Import useEvaluation + GradeResultCard, wire Run Evaluation button onClick, add reset() to chip onClick |

**DO NOT touch:**
- `sdd-app/src/shared/ipc-types.ts` — `EvaluateResult`, `EvaluatePayload`, `Grade` already defined correctly
- `sdd-app/src/preload/index.ts` — `ai:evaluate` already in `ALLOWED_CHANNELS`
- `sdd-app/src/main/index.ts` — `MockAIProvider` stays active (real Claude API is Story 6.5)
- `sdd-app/src/main/ai/MockAIProvider.ts` — used as-is; Story 6.2 uses mock by default
- `sdd-app/src/main/db/employees.ts` — no `getEmployee(db, id)` export needed; use direct SQL in aiHandlers
- `sdd-app/src/renderer/src/store/appStore.ts` — no changes; `selectedCompetency` is already correct
- `sdd-app/src/renderer/src/hooks/useBehaviorLog.ts` — no changes; entries/isLoading state is separate from evaluation state

---

### Task 1: aiHandlers.ts — Critical Implementation Details

**Current state (stub):**
```ts
export function registerAiHandlers(aiProvider: AIProvider): void {
  ipcMain.handle('ai:evaluate', async (_event, payload) => {
    log.info('[ai:evaluate] employeeId=%d competencyId=%d', payload.employeeId, payload.competencyId)
    void aiProvider // used in Story 6.2  ← REMOVE this line
    try {
      return { ok: false, error: 'Not implemented.' }  ← REPLACE with real implementation
    } catch (e) {
      log.error('[ai:evaluate] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Failed to evaluate.' }
    }
  })
}
```

**`framework.ts` import pattern (CRITICAL):**
```ts
import { getExpectedBehavior } from '../db/framework'
```
`getExpectedBehavior(competencyId, level)` takes NO `db` parameter — it uses the internal singleton from `'./database'`. This is different from `listEntries(db!, employeeId, competencyId)` which takes `db` explicitly. Match the existing pattern exactly.

**Employee level lookup — no `getEmployee` export exists:**
`employees.ts` exports only: `listEmployees`, `createEmployee`, `updateEmployee`, `deleteEmployee`. There is no `getEmployee(db, id)`. Use direct SQL:
```ts
const empRow = db!.prepare('SELECT level FROM employees WHERE id = ?').get(payload.employeeId) as { level: CompetencyLevel } | undefined
if (!empRow) return { ok: false, error: 'Employee not found.' }
```

**Complete implemented handler:**
```ts
import { ipcMain } from 'electron'
import log from 'electron-log/main'
import type { AIProvider } from '../ai/AIProvider'
import { db } from '../db/database'
import { listEntries } from '../db/behaviorLog'
import { getExpectedBehavior } from '../db/framework'
import { getModel } from '../settings/modelPreference'
import type { IpcResult, EvaluateResult, EvaluatePayload, CompetencyLevel } from '../../shared/ipc-types'

const TIMEOUT_MS = 30_000

export function registerAiHandlers(aiProvider: AIProvider): void {
  ipcMain.handle(
    'ai:evaluate',
    async (_event, payload: EvaluatePayload): Promise<IpcResult<EvaluateResult>> => {
      log.info('[ai:evaluate] employeeId=%d competencyId=%d', payload.employeeId, payload.competencyId)
      try {
        const empRow = db!.prepare('SELECT level FROM employees WHERE id = ?').get(payload.employeeId) as { level: CompetencyLevel } | undefined
        if (!empRow) return { ok: false, error: 'Employee not found.' }

        const entries = listEntries(db!, payload.employeeId, payload.competencyId)
        const expectedBehaviors = getExpectedBehavior(payload.competencyId, empRow.level) ?? ''
        const model = getModel(db!)

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Evaluation timed out. Check your connection and try again.')), TIMEOUT_MS)
        )

        const result = await Promise.race([
          aiProvider.evaluate({ entries, expectedBehaviors, model }),
          timeoutPromise
        ])

        log.info('[ai:evaluate] grade=%s', result.grade)
        return { ok: true, data: { grade: result.grade, rationale: result.rationale } }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'AI evaluation failed. Check your connection and try again.'
        log.error('[ai:evaluate] error: %s', message)
        return { ok: false, error: message }
      }
    }
  )
}
```

---

### Task 2: useEvaluation.ts — Isolation Guarantee

This hook MUST be independent of `useBehaviorLog`. Do not share state, refs, or effects. The evaluation lifecycle is completely separate from the behavior log lifecycle:
- `useBehaviorLog`: loads entries for display (triggered on tab/competency change)
- `useEvaluation`: triggers AI call and holds AI result (triggered only on button click or retry)

**`window.electronAPI` TypeScript declaration:** The global `window.electronAPI.invoke` is typed via the preload's `contextBridge` exposure. It accepts `(channel: string, payload?: unknown) => Promise<unknown>`. The cast `res.data as EvaluateResult` is required since the return type is `unknown` — this is consistent with other hooks in the project.

---

### Task 3: GradeResultCard — Design Decisions

**Grade badge vs. MUI Chip:** Do NOT use `<Chip>` for the grade badge. MUI Chip color customization is constrained to the palette. Use an inline `<Box>` with `backgroundColor: GRADE_COLORS[result.grade]` and `color: '#fff'` for full control over the 4-value outcome colors (UX-DR7).

**`GRADE_COLORS` uses `Record<Grade, string>`** (not a partial): TypeScript will flag it at compile time if a new Grade variant is added without a corresponding color. This is intentional exhaustiveness checking.

**Layout: grade badge + entry count + Re-run button row:**
- Left: grade badge (bold, colored) stacked above entry count caption
- Right: "Re-run Evaluation" `variant="outlined"` secondary button (AC4 specifies secondary)

**Rationale text:** Use `whiteSpace: 'pre-wrap'` — AI rationale may contain structured text or paragraph breaks.

**`aria-live="polite"` on Paper container:** When the card's state transitions (loading → result, loading → error), assistive technology announces the change without interrupting other speech (UX-DR15).

**The `null` render branch:** When `!isLoading && !error && !result` (initial state before any evaluation triggered), the component renders nothing (`null`). The parent controls visibility via the `(isEvaluating || evalResult !== null || evalError !== null)` gate.

**`InsufficientInputCard` is Story 6.3 scope:** When `result.grade === 'Insufficient Input'`, Story 6.2 renders it as a normal grade in `GradeResultCard` with the amber `#E65100` color. Story 6.3 replaces this with `InsufficientInputCard` for that specific grade variant. Do NOT create `InsufficientInputCard.tsx` in this story.

---

### Task 4: EmployeeDetail.tsx — Structural Changes

**`reset()` on chip click (CRITICAL):** Without `reset()`, switching from competency A's result to competency B would briefly show competency A's result while the new entries load. The chip `onClick` handler must call `reset()` alongside `setCompetency()`.

**`isEvaluating` vs `isLoading` naming:** These are different loading states:
- `isLoading` (from `useBehaviorLog`) = entries data loading from DB
- `isEvaluating` (from `useEvaluation`) = AI call in progress

The Run Evaluation button is `disabled={isEvaluating}` — NOT `disabled={isLoading}`. The button should be disabled only during the AI call, not during entry table reloads.

**GradeResultCard placement in the content tree:**
```
activeTab === 1
  └── [chips row + Run Evaluation button]
  └── if selectedCompetency === null: [instructional text]
  └── if selectedCompetency !== null:
        ├── [GradeResultCard] ← only when (isEvaluating || evalResult || evalError)
        └── [entries content: error Alert | CircularProgress | empty state | table]
```

**Evidence stays visible:** The entries table (or empty state) renders BELOW GradeResultCard when both exist. This satisfies the UX trust principle: "Never present a grade in isolation. The logged entries that informed the AI comparison should be visible in the same view as the result."

**No new MUI imports:** All components used in Task 4 (`Button`) are already imported in `EmployeeDetail.tsx`.

---

### Architecture Compliance

| Rule | Applied here |
|---|---|
| AI call only via IPC, never direct in renderer | `useEvaluation` calls `window.electronAPI.invoke('ai:evaluate', ...)` — no direct `aiProvider` reference in renderer |
| AI state isolated from behavior log state | `useEvaluation` is a separate hook; `isEvaluating`, `evalResult`, `evalError` are not mixed with `isLoading`/`entries` from `useBehaviorLog` |
| `MockAIProvider` remains active | `src/main/index.ts` unchanged — `ClaudeAIProvider` is Story 6.5 scope |
| Grade colors from UX spec | `GRADE_COLORS` record uses exact hex values from UX-DR7 |
| `evaluation/` component directory | New `evaluation/` subdirectory in `components/` matches architecture project structure spec |
| `aria-live="polite"` on result card | UX-DR15 accessibility requirement satisfied |
| 30-second timeout via `Promise.race` | Architecture NFR: "AI < 15s; 30s timeout" |

---

### Previous Story Intelligence (Story 6.1 Learnings)

- **`EmployeeDetail.tsx` imports already include all needed MUI components** (`Box`, `Button`, `CircularProgress`, `Typography`, `Paper`, `Table*`, `Alert`) — no new MUI imports needed for Task 4
- **`selectedCompetency` in Zustand:** `setEmployee(null)` resets `selectedCompetency: null` — the `reset()` call in chip onClick handles in-session competency switches; cross-employee resets are already handled by the store
- **`editingEntryId` guard pattern:** The `+ Log Behavior` CTA in the Evaluate empty state already guards `if (!editingEntryId)`. This pattern need not be replicated for the Run Evaluation button (Run Evaluation is independent of inline editing state)
- **ABI mismatch prevents real SQLite in Vitest:** New main-process logic in `aiHandlers.ts` cannot be directly unit tested via Vitest in this story. Manual verification via app run is the validation path. Full test coverage is Story 6.6 scope.
- **TypeScript strict mode:** `tsconfig.web.json` enforces strict mode. All props must be typed, no implicit `any`. `res.data as EvaluateResult` is the required cast pattern (consistent with other hooks).
- **`void aiProvider` placeholder:** This line exists in the current stub to suppress the "unused variable" TypeScript warning. Remove it in Task 1.6 — `aiProvider` is used directly in the `Promise.race` call.

---

### Scope Boundary Notes

- **Do NOT create `InsufficientInputCard.tsx`:** Story 6.3 scope. For Story 6.2, `Insufficient Input` renders as a normal grade in `GradeResultCard` (amber badge, rationale text).
- **Do NOT implement `ClaudeAIProvider.ts`:** Story 6.5 scope. Story 6.2 continues to use `MockAIProvider` (returns `'Meets Expectations'` with placeholder rationale).
- **Do NOT add `GradeResultCard.test.tsx`:** Test file listed in architecture but not required for this story. Full component test coverage is Story 6.6 scope.
- **Do NOT modify `src/main/index.ts`:** No `aiProvider` swap needed. `MockAIProvider` remains the active provider.
- **Do NOT modify `employees.ts`:** No `getEmployee` export needed. Direct SQL query in `aiHandlers.ts` is the correct approach.
- **Do NOT add a `Snackbar` for AI errors:** UX-DR17 mentions Snackbar for AI network errors, but that applies to persistent error messages outside the result card. For Story 6.2, the error is contained within `GradeResultCard`'s error state (which is already dismissible via Retry). Snackbar integration is deferred.
- **Run Evaluation button text does NOT change to "Running…":** The button is `disabled` during evaluation. The loading state text ("Running evaluation…") is shown inside `GradeResultCard`. Do not change the button label.

---

### UX Requirements Mapping

| Requirement | Implementation |
|---|---|
| UX-DR3: `GradeResultCard` with loading/result/error states | `GradeResultCard.tsx` — 3 explicit render branches |
| UX-DR3: Run Evaluation button disabled during AI call | `disabled={isEvaluating}` on the Button |
| UX-DR7: Grade outcome colors (4 values) | `GRADE_COLORS` record in `GradeResultCard.tsx` |
| UX-DR15: `aria-live="polite"` on AI loading state | `aria-live="polite"` on GradeResultCard's Paper |
| UX-DR17: Clear error message + Retry button | GradeResultCard error state with `{error}` text + "Retry" button |
| FR18: Display AI-generated grade | Grade badge with text |
| FR19: Display AI-generated rationale | `result.rationale` in Typography |
| FR22: Re-trigger assessment | "Re-run Evaluation" secondary button calling `onRerun` → `evaluate()` |
| FR23: Clear error on AI failure | GradeResultCard error branch |
| NFR2: AI call with loading indicator | `CircularProgress` + "Running evaluation…" label |

---

### References

- [Source: epics.md — Story 6.2 Acceptance Criteria]
- [Source: architecture.md — FR17–FR23, AIProvider interface, useEvaluation hook, GradeResultCard component spec]
- [Source: ux-design-specification.md — UX-DR3, UX-DR7, UX-DR15, UX-DR17, GradeResultCard anatomy]
- [Source: sdd-app/src/main/handlers/aiHandlers.ts — current stub being replaced]
- [Source: sdd-app/src/main/handlers/behaviorLogHandlers.ts — import pattern for `listEntries` and `db`]
- [Source: sdd-app/src/main/db/behaviorLog.ts — `listEntries(db, employeeId, competencyId?)`]
- [Source: sdd-app/src/main/db/framework.ts — `getExpectedBehavior(competencyId, level)` — NO db param]
- [Source: sdd-app/src/main/db/employees.ts — no `getEmployee(db, id)` — confirmed, direct SQL needed]
- [Source: sdd-app/src/main/ai/AIProvider.ts — `evaluate(input: EvaluationInput): Promise<EvaluationResult>`]
- [Source: sdd-app/src/main/ai/MockAIProvider.ts — returns `'Meets Expectations'` with placeholder rationale]
- [Source: sdd-app/src/main/settings/modelPreference.ts — `getModel(db): string`]
- [Source: sdd-app/src/shared/ipc-types.ts — `EvaluateResult`, `EvaluatePayload`, `Grade` type]
- [Source: sdd-app/src/renderer/src/views/EmployeeDetail.tsx — current Evaluate tab implementation from Story 6.1]
- [Source: sdd-app/src/renderer/src/store/appStore.ts — `selectedCompetency`, `setCompetency`]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- All 5 tasks completed; all 6 ACs satisfied.
- `aiHandlers.ts`: Replaced "Not implemented" stub with full evaluation logic — employee level lookup via direct SQL, `listEntries` for filtered behavior log entries, `getExpectedBehavior` for competency+level expected behaviors, `getModel` for model preference, `Promise.race` with 30-second timeout, proper `IpcResult<EvaluateResult>` return on success and error (Task 1).
- `useEvaluation.ts`: Created new hook at `sdd-app/src/renderer/src/hooks/useEvaluation.ts` — manages `isLoading`, `result`, `error` state independently from `useBehaviorLog`; `evaluate()` calls `window.electronAPI.invoke('ai:evaluate', ...)` with try/finally pattern; `reset()` clears all state when user switches competency (Task 2).
- `GradeResultCard.tsx`: Created new component at `sdd-app/src/renderer/src/components/evaluation/GradeResultCard.tsx` (new `evaluation/` directory) — 3 state branches (loading/result/error), `GRADE_COLORS` `Record<Grade, string>` for exhaustive type-safe color mapping, grade badge as styled `Box`, entry count, "Re-run Evaluation" outlined button, "Retry" button on error, `aria-live="polite"` for accessibility (Task 3).
- `EmployeeDetail.tsx`: Added `useEvaluation` and `GradeResultCard` imports; added `useEvaluation()` hook destructuring; wired "Run Evaluation" button `onClick` and `disabled={isEvaluating}`; added `reset()` call to competency chip `onClick`; restructured Evaluate tab content area to show `GradeResultCard` above entries table when evaluation triggered (Task 4).
- TypeScript: `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors.
- Tests: `npm run test` — 81 tests across 10 files, all passing. No regressions. No new tests added (main process changes not unit-testable via Vitest due to ABI mismatch; Story 6.6 scope).

### File List

**Created:**
- `sdd-app/src/renderer/src/hooks/useEvaluation.ts`
- `sdd-app/src/renderer/src/components/evaluation/GradeResultCard.tsx`

**Modified:**
- `sdd-app/src/main/handlers/aiHandlers.ts`
- `sdd-app/src/renderer/src/views/EmployeeDetail.tsx`

## Change Log

- 2026-05-03: Story 6.2 created — AI grade result display with GradeResultCard, useEvaluation hook, and implemented aiHandlers stub.
- 2026-05-03: Story 6.2 implemented — aiHandlers.ts wired with real evaluation logic (employee level lookup, listEntries, getExpectedBehavior, 30s timeout); useEvaluation.ts hook created; GradeResultCard.tsx component created with 3 states and grade colors; EmployeeDetail.tsx wired with hook and component.
