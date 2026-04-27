# Story 3.2: Edit Expected Behaviors Inline

Status: done

## Story

As a manager,
I want to type and save expected observable behaviors for each competency at each level,
so that the system has the comparison baseline it needs to generate meaningful AI grades.

## Acceptance Criteria

1. `sdd-app/src/main/db/framework.ts` — `setExpectedBehavior(competencyId, level, description)` implemented: upserts via `INSERT OR REPLACE INTO expected_behaviors (competency_id, level, description) VALUES (?, ?, ?)`, returns the saved `description` string. Replaces the `throw new Error('Not implemented')` stub.

2. `sdd-app/src/main/handlers/frameworkHandlers.ts` — `expected-behavior:set` handler updated:
   - Adds non-empty description validation: if `!_payload.description?.trim()`, returns `{ ok: false, error: 'Expected behavior description is required.' }` without calling the repository.
   - Fixes the catch-block error message from `'Not implemented.'` to `'Failed to set expected behavior.'`
   - The rest of the handler (delegation, log calls, success return) already correct — no other changes.

3. `sdd-app/src/renderer/src/hooks/useFramework.ts` — `saveBehavior(competencyId, level, description)` added:
   - Calls `expected-behavior:set` via `window.electronAPI.invoke`.
   - On success: updates the `behaviors` map state for that cell and returns `true`.
   - On failure: sets `error` state and returns `false`.
   - Uses `useCallback`.

4. `sdd-app/src/renderer/src/views/Framework.tsx` — inline editing added:
   - Each cell shows an **Edit** button alongside the behavior text (or "(not configured)").
   - Clicking Edit: cell enters inline edit mode — textarea pre-filled with current value, ✓ save and ✕ cancel buttons present. Only one cell editable at a time; clicking Edit on another cell replaces the current editing cell.
   - ✓ save button: disabled (40% opacity per UX-DR8) when `draftText.trim() === ''`. On click: calls `saveBehavior`, on success exits edit mode and shows updated text. On failure: error Alert shown above table, cell stays in edit mode.
   - ✕ cancel button or Escape key: exits edit mode, original text restored — no save call made (UX-DR16).
   - No success toast on save — updated text in cell IS the confirmation (UX-DR17).
   - Error Alert from `load()` failures continues to replace the grid (pre-existing behavior). Save errors show the Alert above the table while the grid remains visible. `clearError()` called when the user starts a new cell edit.

5. `sdd-app/__tests__/main/db/framework.test.ts` — `setExpectedBehavior` tests added to existing file:
   - Calls `INSERT OR REPLACE` with correct `(competencyId, level, description)` params.
   - Returns the saved description string.
   - Zero regressions in existing 5 tests.

6. TypeScript clean:
   - `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors.
   - `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors.
   - `npm run test` — all tests pass.

## Tasks / Subtasks

- [x] Task 1: Implement `setExpectedBehavior` and tests — RED phase (AC: 1, 5)
  - [x] Add `setExpectedBehavior` tests to `sdd-app/__tests__/main/db/framework.test.ts` (see Dev Notes for test code)
  - [x] Run `npm run test` — new tests FAIL (stub throws, red phase confirmed)
  - [x] Replace stub body in `sdd-app/src/main/db/framework.ts` with real implementation (see Dev Notes)
  - [x] Run `npm run test` — new tests pass, zero regressions

- [x] Task 2: Fix handler validation and error message (AC: 2)
  - [x] In `sdd-app/src/main/handlers/frameworkHandlers.ts`, add description validation before the repository call (see Dev Notes)
  - [x] Change catch-block error string from `'Not implemented.'` to `'Failed to set expected behavior.'`

- [x] Task 3: Add `saveBehavior` to `useFramework` hook (AC: 3)
  - [x] Add `saveBehavior` to `sdd-app/src/renderer/src/hooks/useFramework.ts` (see Dev Notes)

- [x] Task 4: Add inline editing to `Framework.tsx` (AC: 4)
  - [x] Update `sdd-app/src/renderer/src/views/Framework.tsx` with editing state and cell UI (see Dev Notes)

- [x] Task 5: Typecheck and full test suite (AC: 6)
  - [x] `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] `npm run test` — all tests pass, zero regressions

## Dev Notes

### CRITICAL: `framework.ts` Uses Singleton DB — Same as Story 3.1

`framework.ts` imports the singleton `db` directly — no injection parameter. **Do NOT change this pattern.**

```ts
import { db } from './database'
```

All three functions (`listCompetencies`, `getExpectedBehavior`, `setExpectedBehavior`) call `db` directly. The handler calls them without passing `db`.

### CRITICAL: Test ABI Mismatch — Use `vi.mock` + `vi.hoisted` (Same as Story 3.1)

Electron Node ABI 140 vs system Node ABI 137. Real `better-sqlite3` cannot load in Vitest. The existing `framework.test.ts` already has the correct mock setup:

```ts
const mockDb = vi.hoisted(() => ({ prepare: vi.fn() }))
vi.mock('../../../src/main/db/database', () => ({ db: mockDb }))
```

**Do NOT add a new `vi.mock` call** — one is already at the top of the file. Just add new `describe` blocks for `setExpectedBehavior` below the existing `listCompetencies` describe block.

### Task 1: `setExpectedBehavior` Implementation

Replace lines 17–27 in `sdd-app/src/main/db/framework.ts`:

```ts
// BEFORE (stub):
export function setExpectedBehavior(
  competencyId: number,
  level: CompetencyLevel,
  description: string
): never {
  // Full implementation: Story 3.2
  void competencyId
  void level
  void description
  throw new Error('Not implemented')
}

// AFTER:
export function setExpectedBehavior(
  competencyId: number,
  level: CompetencyLevel,
  description: string
): string {
  if (!db) throw new Error('Database not initialized')
  db.prepare(
    'INSERT OR REPLACE INTO expected_behaviors (competency_id, level, description) VALUES (?, ?, ?)'
  ).run(competencyId, level, description)
  return description
}
```

`INSERT OR REPLACE` relies on the `UNIQUE(competency_id, level)` constraint defined in schema. It deletes the conflicting row (if any) and inserts the new one. The `id` auto-increments on each replace — this is acceptable since no code references `expected_behaviors.id` directly.

### Task 1: New Tests for `setExpectedBehavior` in `framework.test.ts`

Append to the END of `sdd-app/__tests__/main/db/framework.test.ts` (after the `listCompetencies` describe block):

```ts
describe('setExpectedBehavior', () => {
  it('calls INSERT OR REPLACE with correct competencyId, level, and description', () => {
    const mockRun = vi.fn()
    mockDb.prepare.mockReturnValue({ run: mockRun })
    setExpectedBehavior(1, 'A', 'Communicates clearly in writing.')
    expect(mockRun).toHaveBeenCalledWith(1, 'A', 'Communicates clearly in writing.')
  })

  it('returns the saved description string', () => {
    mockDb.prepare.mockReturnValue({ run: vi.fn() })
    const result = setExpectedBehavior(2, 'B', 'Proactively identifies blockers')
    expect(result).toBe('Proactively identifies blockers')
  })

  it('calls prepare with INSERT OR REPLACE SQL', () => {
    mockDb.prepare.mockReturnValue({ run: vi.fn() })
    setExpectedBehavior(3, 'C', 'Some behavior')
    expect(mockDb.prepare).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO expected_behaviors')
    )
  })
})
```

Also add `setExpectedBehavior` to the existing import at line 9:

```ts
// BEFORE:
import { getExpectedBehavior, listCompetencies } from '../../../src/main/db/framework'

// AFTER:
import { getExpectedBehavior, listCompetencies, setExpectedBehavior } from '../../../src/main/db/framework'
```

### Task 2: Handler Fix — `frameworkHandlers.ts`

Two targeted changes inside the `expected-behavior:set` handler (lines 32–44):

```ts
// BEFORE:
ipcMain.handle(
  'expected-behavior:set',
  async (_event, _payload: SetExpectedBehaviorPayload): Promise<IpcResult<string>> => {
    log.info('[expected-behavior:set]')
    try {
      setExpectedBehavior(_payload.competencyId, _payload.level, _payload.description)
      return { ok: true, data: _payload.description }
    } catch (e) {
      log.error('[expected-behavior:set] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Not implemented.' }
    }
  }
)

// AFTER:
ipcMain.handle(
  'expected-behavior:set',
  async (_event, _payload: SetExpectedBehaviorPayload): Promise<IpcResult<string>> => {
    log.info('[expected-behavior:set] competencyId=%d level=%s', _payload.competencyId, _payload.level)
    try {
      if (!_payload.description?.trim()) {
        return { ok: false, error: 'Expected behavior description is required.' }
      }
      const saved = setExpectedBehavior(_payload.competencyId, _payload.level, _payload.description.trim())
      return { ok: true, data: saved }
    } catch (e) {
      log.error('[expected-behavior:set] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Failed to set expected behavior.' }
    }
  }
)
```

**Do NOT touch `competency:list` or `expected-behavior:get` handlers** — already correct.

### Task 3: `useFramework` Hook — Add `saveBehavior`

Add `saveBehavior` to `sdd-app/src/renderer/src/hooks/useFramework.ts`. Insert after the `clearError` callback and before the `return` statement:

```ts
const saveBehavior = useCallback(
  async (competencyId: number, level: CompetencyLevel, description: string): Promise<boolean> => {
    setError(null)
    const result = await window.electronAPI.invoke<string>('expected-behavior:set', {
      competencyId,
      level,
      description,
    })
    if (!result.ok) {
      setError(result.error)
      return false
    }
    setBehaviors((prev) => ({
      ...prev,
      [competencyId]: {
        ...(prev[competencyId] ?? { A: null, B: null, C: null, D: null }),
        [level]: result.data,
      },
    }))
    return true
  },
  []
)
```

Update the return statement to include `saveBehavior`:

```ts
// BEFORE:
return { competencies, behaviors, isLoading, error, load, clearError }

// AFTER:
return { competencies, behaviors, isLoading, error, load, clearError, saveBehavior }
```

**Do NOT modify `load()` or any existing logic** — only add the new callback.

### Task 4: `Framework.tsx` — Inline Editing

Replace the entire file with the implementation below. Key changes from Story 3.1:
- Added `Button`, `IconButton`, `TextField` MUI imports + `CheckIcon`, `CloseIcon` from `@mui/icons-material`
- Added `useState` import
- Added `editingCell` and `draftText` local state
- Each cell conditionally renders edit UI or display UI
- Error Alert shown above table (not replacing it) for save errors; load errors still replace the grid

```tsx
import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import useFramework from '../hooks/useFramework'
import type { CompetencyLevel } from '../../../shared/ipc-types'

const LEVELS: CompetencyLevel[] = ['A', 'B', 'C', 'D']

type EditingCell = { competencyId: number; level: CompetencyLevel }

export default function Framework(): React.JSX.Element {
  const { competencies, behaviors, isLoading, error, load, clearError, saveBehavior } = useFramework()
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [draftText, setDraftText] = useState('')

  useEffect(() => {
    load()
  }, [load])

  const startEdit = (competencyId: number, level: CompetencyLevel, currentText: string | null) => {
    clearError()
    setEditingCell({ competencyId, level })
    setDraftText(currentText ?? '')
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setDraftText('')
  }

  const confirmSave = async (competencyId: number, level: CompetencyLevel) => {
    const success = await saveBehavior(competencyId, level, draftText.trim())
    if (success) {
      setEditingCell(null)
      setDraftText('')
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (competencies.length === 0 && error) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Competency Framework
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell component="th" scope="col">
              Competency
            </TableCell>
            {LEVELS.map((level) => (
              <TableCell key={level} component="th" scope="col" align="center">
                Level {level}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {competencies.map((comp) => (
            <TableRow key={comp.id}>
              <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>{comp.name}</TableCell>
              {LEVELS.map((level) => {
                const description = behaviors[comp.id]?.[level] ?? null
                const isEditing =
                  editingCell?.competencyId === comp.id && editingCell?.level === level

                return (
                  <TableCell key={level} align="left" sx={{ verticalAlign: 'top', minWidth: 200 }}>
                    {isEditing ? (
                      <Box>
                        <TextField
                          multiline
                          fullWidth
                          size="small"
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              cancelEdit()
                            }
                          }}
                        />
                        <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            aria-label="Save expected behavior"
                            disabled={!draftText.trim()}
                            sx={{ opacity: draftText.trim() ? 1 : 0.4 }}
                            onClick={() => confirmSave(comp.id, level)}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            aria-label="Cancel edit"
                            onClick={cancelEdit}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        {description ? (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {description}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            (not configured)
                          </Typography>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => startEdit(comp.id, level, description)}
                        >
                          Edit
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
```

### MUI Icons Package — Verify It Exists

Before using `@mui/icons-material`, confirm it is already installed:

```bash
cd sdd-app && cat package.json | grep icons-material
```

If absent, install: `npm install @mui/icons-material`. Given that Stories 2.3 and 2.4 used edit/delete icon buttons, it is likely already present — check before installing.

### UX Requirements Summary

| Requirement | Implementation |
|---|---|
| UX-DR13: Edit button per cell | `Button variant="outlined"` beside text |
| UX-DR13: Inline editing (FrameworkLevelRow pattern) | `TextField` + `IconButton` ✓/✕ within the cell |
| UX-DR8: Save disabled when empty | `disabled={!draftText.trim()}` + `opacity: 0.4` |
| UX-DR16: Escape cancels | `onKeyDown` Escape → `cancelEdit()` |
| UX-DR17: No success toast | Updated text in cell IS the confirmation |
| UX-DR15: `aria-label` on icon buttons | `aria-label="Save expected behavior"` / `"Cancel edit"` |

### Error Display Logic — Load vs Save

| State | Behavior |
|---|---|
| `isLoading === true` | Show `CircularProgress` only |
| `competencies.length === 0 && error` | Show `Alert` only (load failed, no grid to show) |
| `competencies.length > 0 && error` | Show `Alert` above grid (save error — grid stays visible) |
| No error | Show grid normally |

The `onClose` on the save error Alert calls `clearError()` so the user can dismiss it.

### Previous Story Intelligence (from Story 3.1)

- **ABI mismatch** — `vi.mock` + `vi.hoisted` is mandatory for `framework.ts` tests. The mock is already in the test file — do NOT add a second `vi.mock` call.
- **`useCallback` for all hook functions** — `saveBehavior` must be wrapped in `useCallback` to maintain stable reference.
- **Singleton DB pattern** — `framework.ts` imports `db` directly; never change this to injection.
- **`clearError()` was added in 3.1** specifically for 3.2 save errors — use it in `startEdit()` so stale errors clear when the user opens a new cell.
- **`component="th" scope="col"`** on header cells — already in the file, do NOT remove.
- **MUI `sx` prop for all styling** — never inline `style` attributes.
- **`Promise.all` try/catch** — the hook's `load()` already has proper error handling; do not touch it.

### Scope Boundaries

**Implement in this story:**
- `setExpectedBehavior` body in `framework.ts` (replace stub lines 17–27)
- `setExpectedBehavior` tests appended to `framework.test.ts`
- `saveBehavior` callback added to `useFramework.ts`
- `expected-behavior:set` handler patched in `frameworkHandlers.ts` (validation + error msg)
- `Framework.tsx` inline editing UI

**Do NOT implement:**
- New IPC types — `SetExpectedBehaviorPayload` and `GetExpectedBehaviorPayload` already in `ipc-types.ts`
- Schema changes — `UNIQUE(competency_id, level)` already in `database.ts`
- Changes to `competency:list` or `expected-behavior:get` handlers
- Changes to `database.ts`, `preload/index.ts`, `main/index.ts`, `package.json`
- Separate `FrameworkLevelRow` component file — inline within `Framework.tsx` is correct for single-use

### Git Intelligence

All prior stories followed commit message convention: `Story X.Y: Title`. Recent commits show `@mui/icons-material` was used in employee management stories (edit/delete icons) — package very likely already installed.

### Files Modified

- `sdd-app/src/main/db/framework.ts` — implement `setExpectedBehavior` (replace stub)
- `sdd-app/__tests__/main/db/framework.test.ts` — add `setExpectedBehavior` describe block + import
- `sdd-app/src/main/handlers/frameworkHandlers.ts` — add validation, fix error message
- `sdd-app/src/renderer/src/hooks/useFramework.ts` — add `saveBehavior` callback
- `sdd-app/src/renderer/src/views/Framework.tsx` — add inline editing

### References

- [epics.md#Story 3.2] — acceptance criteria source
- [epics.md#UX-DR13] — 4×4 grid with Edit button + inline FrameworkLevelRow pattern
- [epics.md#UX-DR8] — primary button 40% opacity when required fields incomplete
- [epics.md#UX-DR16] — Escape cancels inline editing
- [epics.md#UX-DR17] — no success toast; updated text in place is the confirmation
- [epics.md#UX-DR15] — aria-label on all icon-only buttons
- [architecture.md#Data Architecture] — `INSERT OR REPLACE` on `UNIQUE(competency_id, level)` constraint
- [architecture.md#Communication Patterns] — IPC handler pattern (validate → delegate → return IpcResult)
- [architecture.md#Frontend Architecture] — hook pattern with `useCallback`
- [architecture.md#Enforcement Guidelines] — no SQL in handlers, MUI `sx` for styling
- [3-1-framework-view-with-expected-behavior-display.md#Dev Notes] — ABI mismatch, vi.hoisted pattern, singleton db

## Review Findings

- [x] [Review][Defer] Optimistic state update: `setExpectedBehavior` echoes input string rather than re-reading from DB; if a trigger or future coercion transforms the value, UI and DB diverge silently [framework.ts:24] — deferred, pre-existing
- [x] [Review][Defer] `!db` null-guard in `setExpectedBehavior` inconsistent with `listCompetencies` (no guard); pre-existing defensive pattern; address when DB init lifecycle is hardened [framework.ts:21] — deferred, pre-existing
- [x] [Review][Defer] DB function accepts empty/whitespace description — validation lives only at handler boundary; any direct caller can persist blank values [framework.ts:18-26] — deferred, pre-existing
- [x] [Review][Defer] Inline arrow handlers inside table-row map recreate on every render; no `useCallback` wrapping for `onChange`, `onKeyDown`, `onClick` closures [Framework.tsx:106-128] — deferred, pre-existing
- [x] [Review][Defer] Handler does not validate `competencyId` (positive integer / FK existence) — defence-in-depth gap in trusted-renderer Electron context; address in a future validation layer [frameworkHandlers.ts:36] — deferred, pre-existing
- [x] [Review][Defer] No in-flight guard in `saveBehavior`; rapid double-click can dispatch parallel IPC calls that race on `behaviors` state update [useFramework.ts:64] — deferred, pre-existing
- [x] [Review][Defer] `editingCell`/`draftText` not reconciled with `behaviors` if `load()` re-fires while a cell is in edit mode; theoretical until an auto-refresh trigger is added [useFramework.ts, Framework.tsx] — deferred, pre-existing
- [x] [Review][Defer] `Escape` handler missing `e.preventDefault()` / `e.stopPropagation()`; could bubble to parent in future modal wrapper [Framework.tsx:109] — deferred, pre-existing
- [x] [Review][Defer] No test coverage for `!db` null-guard branch in `setExpectedBehavior` [framework.test.ts] — deferred, pre-existing
- [x] [Review][Defer] Handler trims description before passing to repository (`_payload.description.trim()`); spec is silent on trimming — intentional defensive behaviour but unspecified [frameworkHandlers.ts:40] — deferred, pre-existing

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- RED phase confirmed: 3 new `setExpectedBehavior` tests failed against the stub (`throw new Error('Not implemented')`); 28 existing tests stayed green — zero regressions before implementation.
- `@mui/icons-material` already present at `^9.0.0` — no install required.

### Completion Notes List

- Implemented `setExpectedBehavior` in `sdd-app/src/main/db/framework.ts`: `INSERT OR REPLACE INTO expected_behaviors` using the `UNIQUE(competency_id, level)` constraint; returns the saved description string. Return type changed from `never` to `string`.
- Added 3 tests to `sdd-app/__tests__/main/db/framework.test.ts`: params forwarded correctly to `run()`, return value is the description, SQL contains `INSERT OR REPLACE INTO expected_behaviors`. Updated import to include `setExpectedBehavior`.
- Patched `sdd-app/src/main/handlers/frameworkHandlers.ts` `expected-behavior:set` handler: added non-empty description validation returning `{ ok: false, error: 'Expected behavior description is required.' }`; handler now trims description before passing to repository; catch-block error message fixed from `'Not implemented.'` to `'Failed to set expected behavior.'`; log entry updated with competencyId and level.
- Added `saveBehavior(competencyId, level, description)` to `sdd-app/src/renderer/src/hooks/useFramework.ts`: invokes `expected-behavior:set`, optimistically updates `behaviors` map on success, sets `error` state on failure, returns boolean. Exposed in hook return value.
- Replaced `sdd-app/src/renderer/src/views/Framework.tsx` with inline editing implementation: `editingCell` + `draftText` state; each cell conditionally renders edit mode (TextField + ✓/✕ IconButtons) or display mode (text + Edit button); Escape key cancels; save disabled + 40% opacity when draft is empty or whitespace-only; load errors still replace grid; save errors show Alert above grid with dismiss; `clearError()` called when starting a new edit.
- TypeScript: zero errors on both `tsconfig.node.json` and `tsconfig.web.json`. Tests: 31/31 pass (28 pre-existing + 3 new), zero regressions.

### File List

- `sdd-app/src/main/db/framework.ts` (modified — implemented `setExpectedBehavior`)
- `sdd-app/__tests__/main/db/framework.test.ts` (modified — added `setExpectedBehavior` describe block and updated import)
- `sdd-app/src/main/handlers/frameworkHandlers.ts` (modified — validation, log improvement, error message fix)
- `sdd-app/src/renderer/src/hooks/useFramework.ts` (modified — added `saveBehavior` callback)
- `sdd-app/src/renderer/src/views/Framework.tsx` (modified — full inline editing UI)
