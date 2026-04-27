# Story 3.1: Framework View with Expected Behavior Display

Status: done

## Story

As a manager,
I want to see the competency framework organized by competency and level,
so that I can understand what behaviors are currently configured as the standard for each combination.

## Acceptance Criteria

1. `sdd-app/src/main/db/database.ts` schema already creates `expected_behaviors` table on startup: `id`, `competency_id`, `level CHECK(level IN ('A','B','C','D'))`, `description TEXT NOT NULL`, `UNIQUE(competency_id, level)`. **No schema changes needed** — table exists from Story 1.3.

2. `sdd-app/src/main/db/framework.ts` exports `getExpectedBehavior(competencyId: number, level: CompetencyLevel): string | null` — queries `expected_behaviors` for that `(competency_id, level)` pair and returns the `description` string, or `null` if no row exists. (Currently a stub that always returns `null` — implement it.)

3. `sdd-app/src/main/handlers/frameworkHandlers.ts` handlers `competency:list` and `expected-behavior:get` are **already fully implemented** — no changes required in this story.

4. `sdd-app/src/renderer/src/hooks/useFramework.ts` (NEW) exports `useFramework()` hook:
   - State: `competencies: Competency[]`, `behaviors: ExpectedBehaviorMap`, `isLoading: boolean`, `error: string | null`
   - `load()`: calls `competency:list`, then calls `expected-behavior:get` for all 16 cells (4 competencies × 4 levels) in parallel via `Promise.all`, builds the behavior map, sets state.
   - `clearError()`: sets `error` to `null`.

5. `sdd-app/src/renderer/src/views/Framework.tsx` renders a 4×4 grid:
   - Rows = four competencies (Communication, Client Focus, Proactivity, Teamwork), Columns = levels A, B, C, D.
   - Each cell shows the current expected behavior description text, or `"(not configured)"` in secondary text color if `null`.
   - Calls `load()` on mount via `useEffect`.
   - Shows `CircularProgress` while `isLoading`.
   - Shows `Alert severity="error"` if `error` is set.
   - **No Edit button or editing in this story** — that is Story 3.2.

## Tasks / Subtasks

- [x] Task 1: Implement `getExpectedBehavior` and write tests — RED phase (AC: 2)
  - [x] Create `sdd-app/__tests__/main/db/framework.test.ts` (see Dev Notes for test code — uses `vi.mock`)
  - [x] In `sdd-app/src/main/db/framework.ts`: replace the stub body of `getExpectedBehavior` with the real DB query (see Dev Notes for exact code)
  - [x] Run `npm run test` — new tests must pass, zero regressions

- [x] Task 2: Create `useFramework` hook (AC: 4)
  - [x] Create `sdd-app/src/renderer/src/hooks/useFramework.ts` (see Dev Notes for full implementation)

- [x] Task 3: Build Framework view 4×4 grid (AC: 5)
  - [x] Replace `sdd-app/src/renderer/src/views/Framework.tsx` stub with full 4×4 grid implementation (see Dev Notes)
  - [x] Verify: MUI `Table` with column headers A/B/C/D, rows per competency, cells show description or "(not configured)"

- [x] Task 4: Typecheck (AC: 1–5)
  - [x] `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] `npm run test` — all tests pass, zero regressions

### Review Findings

- [x] [Review][Patch] `load()` silently swallows per-cell IPC errors [sdd-app/src/renderer/src/hooks/useFramework.ts:31-36]
- [x] [Review][Patch] `Promise.all` has no try/catch; `isLoading` stuck permanently on IPC throw [sdd-app/src/renderer/src/hooks/useFramework.ts:27-37]
- [x] [Review][Defer] `load()` has no concurrent-call guard; re-invocations can corrupt state [sdd-app/src/renderer/src/hooks/useFramework.ts:14-48] — deferred, pre-existing
- [x] [Review][Defer] `getExpectedBehavior` null guard inconsistent with `listCompetencies` [sdd-app/src/main/db/framework.ts:10] — deferred, pre-existing
- [x] [Review][Defer] SQLite result cast `as { description: string }` hides schema drift [sdd-app/src/main/db/framework.ts:12-13] — deferred, pre-existing
- [x] [Review][Defer] Row header cells in `<TableBody>` lack `scope="row"` [sdd-app/src/renderer/src/views/Framework.tsx] — deferred, pre-existing
- [x] [Review][Defer] Empty-competency list renders no empty state [sdd-app/src/renderer/src/views/Framework.tsx] — deferred, pre-existing
- [x] [Review][Defer] Test suite does not verify SQL string in `listCompetencies` [sdd-app/__tests__/main/db/framework.test.ts:41-57] — deferred, pre-existing
- [x] [Review][Defer] `ExpectedBehaviorMap` type not exported from hook file [sdd-app/src/renderer/src/hooks/useFramework.ts:3] — deferred, pre-existing

## Dev Notes

### CRITICAL: `framework.ts` Uses Singleton DB — Different from `employees.ts`

`employees.ts` uses injection (`db` as first param). **`framework.ts` does NOT** — it imports the singleton:

```ts
import { db } from './database'
```

`listCompetencies()` already calls `db` directly (no param). **Do NOT change this pattern** for `getExpectedBehavior`. The handler calls both functions without passing `db`.

### CRITICAL: Test ABI Mismatch — Must Use `vi.mock` + `vi.hoisted`

Electron Node ABI 140 vs system Node ABI 137. Real `better-sqlite3` cannot load in Vitest. Since `framework.ts` uses singleton `db` (not injection), mock the entire database module with `vi.mock`. Because `vi.mock` is hoisted by Vitest, the mock variable must also be hoisted with `vi.hoisted()` to avoid "cannot access before initialization":

```ts
const mockDb = vi.hoisted(() => ({ prepare: vi.fn() }))
vi.mock('../../../src/main/db/database', () => ({ db: mockDb }))
```

### Task 1: `getExpectedBehavior` Implementation

Replace lines 9–14 in `sdd-app/src/main/db/framework.ts`:

```ts
// BEFORE (stub):
export function getExpectedBehavior(competencyId: number, level: CompetencyLevel): string | null {
  void competencyId
  void level
  return null
}

// AFTER:
export function getExpectedBehavior(competencyId: number, level: CompetencyLevel): string | null {
  if (!db) throw new Error('Database not initialized')
  const row = db
    .prepare('SELECT description FROM expected_behaviors WHERE competency_id = ? AND level = ?')
    .get(competencyId, level) as { description: string } | undefined
  return row?.description ?? null
}
```

No change to `setExpectedBehavior` — that is Story 3.2.

### Task 1: Test File — `framework.test.ts`

Create `sdd-app/__tests__/main/db/framework.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockDb = vi.hoisted(() => ({ prepare: vi.fn() }))
vi.mock('../../../src/main/db/database', () => ({ db: mockDb }))

import { getExpectedBehavior, listCompetencies } from '../../../src/main/db/framework'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getExpectedBehavior', () => {
  it('returns description string when row exists', () => {
    mockDb.prepare.mockReturnValue({
      get: () => ({ description: 'Communicates clearly in writing.' }),
    })
    const result = getExpectedBehavior(1, 'A')
    expect(result).toBe('Communicates clearly in writing.')
  })

  it('returns null when no row exists for that combination', () => {
    mockDb.prepare.mockReturnValue({
      get: () => undefined,
    })
    const result = getExpectedBehavior(2, 'C')
    expect(result).toBeNull()
  })

  it('queries with correct competencyId and level params', () => {
    const mockGet = vi.fn().mockReturnValue(undefined)
    mockDb.prepare.mockReturnValue({ get: mockGet })
    getExpectedBehavior(3, 'B')
    expect(mockGet).toHaveBeenCalledWith(3, 'B')
  })
})

describe('listCompetencies', () => {
  it('returns all competency rows', () => {
    mockDb.prepare.mockReturnValue({
      all: () => [
        { id: 1, name: 'Communication' },
        { id: 2, name: 'Client Focus' },
        { id: 3, name: 'Proactivity' },
        { id: 4, name: 'Teamwork' },
      ],
    })
    const result = listCompetencies()
    expect(result).toHaveLength(4)
    expect(result[0]).toEqual({ id: 1, name: 'Communication' })
  })

  it('returns empty array when no competencies', () => {
    mockDb.prepare.mockReturnValue({ all: () => [] })
    expect(listCompetencies()).toEqual([])
  })
})
```

### Task 2: `useFramework` Hook

Create `sdd-app/src/renderer/src/hooks/useFramework.ts`:

```ts
import { useState, useCallback } from 'react'
import type { Competency, CompetencyLevel } from '../../../shared/ipc-types'

type ExpectedBehaviorMap = Record<number, Record<CompetencyLevel, string | null>>

const LEVELS: CompetencyLevel[] = ['A', 'B', 'C', 'D']

function useFramework() {
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [behaviors, setBehaviors] = useState<ExpectedBehaviorMap>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const compResult = await window.electronAPI.invoke<Competency[]>('competency:list')
    if (!compResult.ok) {
      setError(compResult.error)
      setIsLoading(false)
      return
    }
    setCompetencies(compResult.data)

    // Load all 16 cells in parallel — 4 competencies × 4 levels
    const entries = await Promise.all(
      compResult.data.flatMap((comp) =>
        LEVELS.map(async (level) => {
          const res = await window.electronAPI.invoke<string | null>('expected-behavior:get', {
            competencyId: comp.id,
            level,
          })
          return { competencyId: comp.id, level, description: res.ok ? res.data : null }
        })
      )
    )

    const map: ExpectedBehaviorMap = {}
    for (const { competencyId, level, description } of entries) {
      if (!map[competencyId]) map[competencyId] = { A: null, B: null, C: null, D: null }
      map[competencyId][level] = description
    }
    setBehaviors(map)
    setIsLoading(false)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { competencies, behaviors, isLoading, error, load, clearError }
}

export default useFramework
```

**`ExpectedBehaviorMap` is local to the hook file** — do NOT put it in `ipc-types.ts` (it is a renderer-only concern).

### Task 3: `Framework.tsx` — 4×4 Grid

Replace the entire stub file:

```tsx
import { useEffect } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import useFramework from '../hooks/useFramework'

const LEVELS = ['A', 'B', 'C', 'D'] as const

export default function Framework(): React.JSX.Element {
  const { competencies, behaviors, isLoading, error, load } = useFramework()

  useEffect(() => {
    load()
  }, [load])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Competency Framework
      </Typography>
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
                return (
                  <TableCell key={level} align="left" sx={{ verticalAlign: 'top', minWidth: 180 }}>
                    {description ? (
                      <Typography variant="body2">{description}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        (not configured)
                      </Typography>
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

**No Edit button** — Story 3.2 adds inline editing.

### Handler Status — No Changes Required

`frameworkHandlers.ts` is already fully wired for both channels:
- `competency:list` — fully implemented (line 7–16)
- `expected-behavior:get` — fully implemented (line 18–30), delegates to `getExpectedBehavior` which is the stub we are implementing in Task 1

Once `getExpectedBehavior` is implemented in `framework.ts`, the handler works automatically. **Do NOT touch `frameworkHandlers.ts`.**

### Schema Status — No Changes Required

`expected_behaviors` table created at `database.ts:28-34` with `UNIQUE(competency_id, level)`. `PRAGMA foreign_keys = ON` at `database.ts:12`. No schema work in this story.

### Scope Boundaries

**Implement in this story:**
- `getExpectedBehavior` body in `framework.ts` (replace stub lines 9–14)
- `__tests__/main/db/framework.test.ts` (NEW)
- `useFramework.ts` hook (NEW)
- `Framework.tsx` full 4×4 grid (replace stub)

**Do NOT implement:**
- `setExpectedBehavior` — Story 3.2
- Inline editing / Edit buttons — Story 3.2
- Any changes to `frameworkHandlers.ts` — already complete
- Any changes to `database.ts` — schema already correct
- Any changes to `ipc-types.ts` — all needed types already defined

### Previous Story Intelligence (from Story 2.4)

- **ABI mismatch** — cannot use real `better-sqlite3` in Vitest. For `framework.ts` (singleton pattern), use `vi.mock` + `vi.hoisted()`. (Different from employees.ts tests which use injection mocks.)
- **`isLoading` behavior** — unlike quick mutations where `isLoading` would unmount the component, this is a `load()` call on mount. Setting `isLoading` is correct here and drives the `CircularProgress` guard.
- **`clearError()` in hook** — always expose it even if Framework.tsx doesn't use it yet (Story 3.2 will need it for save errors).
- **`useCallback` for `load`** — required so `useEffect([load])` dep is stable.
- **`component="th" scope="col"` on `TableCell`** — required for `<th>` semantic HTML and WCAG compliance (UX-DR15, architecture accessibility rules).

### UX Requirements

- **No success toast** on data display (UX-DR17 — no toasts for read operations).
- **`<th scope="col">`** on all column headers — architecture accessibility requirement.
- **`(not configured)` text** uses `color="text.secondary"` — secondary text color from theme (`#6B7280`).
- **`size="small"`** on Table — appropriate density for a 4×4 grid in a desktop app.
- MUI `sx` prop for all styling — never inline `style` attributes (architecture rule).

### Files Modified / Created

- `sdd-app/src/main/db/framework.ts` — implement `getExpectedBehavior` (lines 9–14)
- `sdd-app/__tests__/main/db/framework.test.ts` — NEW: 5 tests
- `sdd-app/src/renderer/src/hooks/useFramework.ts` — NEW
- `sdd-app/src/renderer/src/views/Framework.tsx` — replace stub with 4×4 grid

**Do NOT touch:**
- `sdd-app/src/main/db/database.ts` — schema correct
- `sdd-app/src/main/handlers/frameworkHandlers.ts` — already complete
- `sdd-app/src/shared/ipc-types.ts` — all needed types present
- `sdd-app/src/preload/index.ts` — channels already exposed
- `sdd-app/src/main/index.ts` — `registerFrameworkHandlers()` already registered
- `sdd-app/package.json` — no new dependencies

### References

- [epics.md#Story 3.1] — acceptance criteria source
- [architecture.md#Data Architecture] — `expected_behaviors` schema, `UNIQUE(competency_id, level)` constraint
- [architecture.md#Frontend Architecture] — component organization, hook pattern, `useCallback` rule
- [architecture.md#Communication Patterns] — IPC handler structure, hook structure
- [architecture.md#Enforcement Guidelines] — no `electron` imports in renderer, no SQL in handlers, MUI `sx` for styling
- [architecture.md#Project Structure] — `src/renderer/hooks/useFramework.ts`, `src/renderer/views/Framework.tsx`, `__tests__/main/db/framework.test.ts`
- [ux-design-specification.md#UX-DR13] — 4×4 grid, rows=competencies, columns=levels
- [ux-design-specification.md#UX-DR15] — `<th scope="col">` for table column headers
- [2-4-remove-employee.md#Dev Notes] — ABI mismatch workaround

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `vi.mock` factory hoisting: initial test used a top-level `const mockDb` variable referenced inside `vi.mock()` factory. Vitest hoists `vi.mock()` calls above variable declarations, causing "Cannot access 'mockDb' before initialization". Fixed by declaring `mockDb` with `vi.hoisted(() => ({ prepare: vi.fn() }))` so the variable is available when the hoisted factory runs.

### Completion Notes List

- Implemented `getExpectedBehavior(competencyId, level)` in `sdd-app/src/main/db/framework.ts`: single `SELECT description FROM expected_behaviors WHERE competency_id = ? AND level = ?` query, returns `row.description` or `null` when no row. Preserves singleton `db` pattern consistent with `listCompetencies`.
- Created `sdd-app/__tests__/main/db/framework.test.ts`: 5 tests (3 for `getExpectedBehavior`, 2 for `listCompetencies`) using `vi.hoisted` + `vi.mock` to bypass ABI mismatch.
- Created `sdd-app/src/renderer/src/hooks/useFramework.ts`: loads 4 competencies via `competency:list`, then fetches 16 expected-behavior cells in parallel via `Promise.all`, builds `ExpectedBehaviorMap`, exposes `load`, `clearError`.
- Replaced `sdd-app/src/renderer/src/views/Framework.tsx` stub with 4×4 MUI Table grid: `CircularProgress` on load, `Alert` on error, rows per competency, columns A/B/C/D, description text or `"(not configured)"` in secondary color per cell.
- Typecheck: zero errors (tsconfig.node.json + tsconfig.web.json). Tests: 28/28 pass (23 pre-existing + 5 new), zero regressions.

### File List

- `sdd-app/src/main/db/framework.ts` (modified — implemented `getExpectedBehavior`)
- `sdd-app/__tests__/main/db/framework.test.ts` (new — 5 tests with vi.hoisted mock pattern)
- `sdd-app/src/renderer/src/hooks/useFramework.ts` (new — useFramework hook)
- `sdd-app/src/renderer/src/views/Framework.tsx` (modified — replaced stub with 4×4 grid)
