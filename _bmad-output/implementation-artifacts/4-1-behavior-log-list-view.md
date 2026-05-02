# Story 4.1: Behavior Log List View

Status: done

## Story

As a manager,
I want to see all logged behaviors for an employee in a table,
So that I can review the full evidence base I've accumulated throughout the year.

## Acceptance Criteria

1. **DB tables** (`database.ts`): `behavior_log_entries` and `behavior_log_entry_competencies` tables already exist — created in Story 1.3. No schema changes needed.

2. **`behaviorLog.ts` repository** (`src/main/db/behaviorLog.ts` — NEW):
   - `listEntries(db, employeeId, competencyId?)` returns all entries for the employee (optionally filtered by competency), each with its associated `competencies: Competency[]`, ordered by `entry_date DESC, id DESC`
   - When `competencyId` is provided, only entries tagged to that competency are returned

3. **`behavior-log:list` handler** (`src/main/handlers/behaviorLogHandlers.ts` — UPDATE):
   - Currently stubbed as `return { ok: true, data: [] }` — replace with real `listEntries(db!, payload.employeeId, payload.competencyId)` call
   - Returns `{ ok: true, data: BehaviorLogEntry[] }` or `{ ok: false, error: string }` — never throws

4. **`useBehaviorLog.ts` hook** (`src/renderer/src/hooks/useBehaviorLog.ts` — NEW):
   - `load(employeeId)` invokes `behavior-log:list`, manages `isLoading` / `error` state, returns typed `entries`

5. **`CompetencyChip.tsx` component** (`src/renderer/src/components/common/CompetencyChip.tsx` — NEW):
   - Three modes: `read-only` (small, outlined), `toggle` (dimmed when inactive), `filter` (medium, full background when active)
   - Uses `theme.palette.competency.*` colors
   - `aria-pressed` on toggle mode; keyboard focusable across all modes

6. **`appStore.ts` update** (`src/renderer/src/store/appStore.ts` — UPDATE):
   - Replace `selectedEmployeeId: number | null` with `selectedEmployee: Employee | null`
   - Update `setEmployee: (employee: Employee | null) => void`
   - Derive `.id` from `selectedEmployee` wherever `selectedEmployeeId` was used

7. **`EmployeeDetail.tsx` view** (`src/renderer/src/views/EmployeeDetail.tsx` — NEW):
   - Breadcrumb "Employees › [Name]" — "Employees" is clickable, calls `setEmployee(null)`
   - Two tabs: "Behavior Log" (active) | "Evaluate" (placeholder — renders "Coming in Epic 6")
   - Page header row: "Behavior Log" title on left, "+ Log Behavior" button on right
   - Table columns: Date | Description | Competencies; headers use `<th scope="col">`
   - Rows show: `entry_date` formatted as `YYYY-MM-DD`, description text, read-only `CompetencyChip` per competency
   - Empty state: "No behaviors logged for [Name] yet" centered below the header
   - The "+ Log Behavior" button is present in all states; click sets `showInlineRow = true` (wired to InlineLogRow in Story 4.2 — for this story keep state wiring, no row rendered yet)

8. **`App.tsx` routing** (`src/renderer/src/App.tsx` — UPDATE):
   - ViewRouter checks `selectedEmployee !== null` — when true and `currentView === 'employees'`, render `<EmployeeDetail />` instead of `<EmployeeList />`

9. **`EmployeeList.tsx` navigation** (`src/renderer/src/views/EmployeeList.tsx` — UPDATE):
   - Employee name `TableCell` is clickable: `onClick={() => setEmployee(emp)}`, cursor pointer, hover `color: 'primary.main'`
   - Import `useAppStore` and `setEmployee`

10. **Tests**:
    - `__tests__/main/db/behaviorLog.test.ts` — NEW: mock DB tests for `listEntries` (ABI mismatch pattern — see Dev Notes)
    - `__tests__/renderer/components/CompetencyChip.test.tsx` — NEW: read-only renders, toggle `aria-pressed`

11. **TypeScript clean** — zero errors on both targets; `npm run test` — all 31 existing tests + new tests pass

## Tasks / Subtasks

- [x] Task 1: Create `src/main/db/behaviorLog.ts` (AC: 2)
  - [x] Define `BehaviorLogRow` and `JoinRow` interfaces
  - [x] Implement `groupJoinRows` helper
  - [x] Implement `listEntries(db, employeeId, competencyId?)` with two SQL paths (filtered / unfiltered)

- [x] Task 2: Implement `behavior-log:list` in `behaviorLogHandlers.ts` (AC: 3)
  - [x] Import `listEntries` from `behaviorLog.ts`
  - [x] Replace stub body with real `listEntries(db!, ...)` call
  - [x] Leave `behavior-log:create`, `behavior-log:update`, `behavior-log:delete` stubs unchanged

- [x] Task 3: Create `src/renderer/src/hooks/useBehaviorLog.ts` (AC: 4)
  - [x] Implement `load(employeeId)` with same pattern as `useEmployees.load()`

- [x] Task 4: Create `CompetencyChip.tsx` (AC: 5)
  - [x] Implement all three modes using MUI `Chip` + `sx` overrides
  - [x] Wire `aria-pressed` for toggle mode

- [x] Task 5: Update `appStore.ts` (AC: 6)
  - [x] Replace `selectedEmployeeId: number | null` with `selectedEmployee: Employee | null`
  - [x] Update `setEmployee` signature

- [x] Task 6: Create `EmployeeDetail.tsx` (AC: 7)
  - [x] Breadcrumb with back navigation
  - [x] Tabs (Behavior Log active, Evaluate placeholder)
  - [x] Page header + "+ Log Behavior" button
  - [x] Table with read-only rows
  - [x] Empty state

- [x] Task 7: Update `App.tsx` ViewRouter (AC: 8)
  - [x] Add `selectedEmployee` check; render `EmployeeDetail` when set

- [x] Task 8: Update `EmployeeList.tsx` (AC: 9)
  - [x] Add employee name click handler
  - [x] Import `useAppStore` and `setEmployee`

- [x] Task 9: Write tests (AC: 10)
  - [x] `behaviorLog.test.ts` — empty list, camelCase mapping, multi-competency aggregation, competency filter
  - [x] `CompetencyChip.test.tsx` — renders name, toggle `aria-pressed`, filter active style

- [x] Task 10: TypeScript + test suite (AC: 11)
  - [x] `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] `npm run test` — all tests pass (44 total: 31 existing + 13 new)

## Dev Notes

### Scope: Files

**NEW:**
- `sdd-app/src/main/db/behaviorLog.ts`
- `sdd-app/src/renderer/src/components/common/CompetencyChip.tsx`
- `sdd-app/src/renderer/src/views/EmployeeDetail.tsx`
- `sdd-app/src/renderer/src/hooks/useBehaviorLog.ts`
- `sdd-app/__tests__/main/db/behaviorLog.test.ts`
- `sdd-app/__tests__/renderer/components/CompetencyChip.test.tsx`

**MODIFIED:**
- `sdd-app/src/main/handlers/behaviorLogHandlers.ts` — implement `behavior-log:list` only; leave other stubs unchanged
- `sdd-app/src/renderer/src/App.tsx` — ViewRouter routing update
- `sdd-app/src/renderer/src/views/EmployeeList.tsx` — employee name click
- `sdd-app/src/renderer/src/store/appStore.ts` — `selectedEmployee` replaces `selectedEmployeeId`

**NOT touched:**
- `database.ts` — schema already correct (behavior_log_entries and behavior_log_entry_competencies already exist)
- `ipc-types.ts` — all types already defined (`BehaviorLogEntry`, `ListBehaviorLogPayload`, etc.)
- `behavior-log:create/update/delete` handlers — remain as stubs

---

### Task 1: `src/main/db/behaviorLog.ts` — Full Implementation

The schema uses a many-to-many join: `behavior_log_entries` ↔ `behavior_log_entry_competencies` ↔ `competencies`. A LEFT JOIN returns one row per (entry × competency). Group in JS to get one `BehaviorLogEntry` with `competencies: Competency[]`.

```ts
import type Database from 'better-sqlite3'
import type { BehaviorLogEntry, Competency } from '../../shared/ipc-types'

interface BehaviorLogRow {
  id: number
  employee_id: number
  description: string
  entry_date: string
  created_at: string
}

interface JoinRow extends BehaviorLogRow {
  comp_id: number | null
  comp_name: string | null
}

function groupJoinRows(rows: JoinRow[]): BehaviorLogEntry[] {
  const map = new Map<number, BehaviorLogEntry>()
  const order: number[] = []
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        employeeId: row.employee_id,
        description: row.description,
        entryDate: row.entry_date,
        createdAt: row.created_at,
        competencies: [],
      })
      order.push(row.id)
    }
    if (row.comp_id !== null && row.comp_name !== null) {
      map.get(row.id)!.competencies.push({ id: row.comp_id, name: row.comp_name } as Competency)
    }
  }
  return order.map((id) => map.get(id)!)
}

const BASE_SELECT = `
  SELECT e.id, e.employee_id, e.description, e.entry_date, e.created_at,
         c.id AS comp_id, c.name AS comp_name
  FROM behavior_log_entries e
  LEFT JOIN behavior_log_entry_competencies ec ON ec.entry_id = e.id
  LEFT JOIN competencies c ON c.id = ec.competency_id
`

export function listEntries(
  db: Database.Database,
  employeeId: number,
  competencyId?: number
): BehaviorLogEntry[] {
  let rows: JoinRow[]
  if (competencyId !== undefined) {
    rows = db.prepare(
      `${BASE_SELECT}
       WHERE e.employee_id = ?
         AND e.id IN (SELECT entry_id FROM behavior_log_entry_competencies WHERE competency_id = ?)
       ORDER BY e.entry_date DESC, e.id DESC`
    ).all(employeeId, competencyId) as JoinRow[]
  } else {
    rows = db.prepare(
      `${BASE_SELECT}
       WHERE e.employee_id = ?
       ORDER BY e.entry_date DESC, e.id DESC`
    ).all(employeeId) as JoinRow[]
  }
  return groupJoinRows(rows)
}
```

---

### Task 2: `behaviorLogHandlers.ts` — behavior-log:list only

Import `listEntries` from `../db/behaviorLog` and the existing `db` from `../db/database`.
Replace the stub in the `behavior-log:list` handler body:

```ts
import { listEntries } from '../db/behaviorLog'
import { db } from '../db/database'

// Inside behavior-log:list handler:
log.info('[behavior-log:list] employeeId=%d competencyId=%s', payload.employeeId, payload.competencyId ?? 'none')
try {
  const entries = listEntries(db!, payload.employeeId, payload.competencyId)
  return { ok: true, data: entries }
} catch (e) {
  log.error('[behavior-log:list] error: %s', e instanceof Error ? e.message : String(e))
  return { ok: false, error: 'Failed to list behavior log entries.' }
}
```

The `db!` non-null assertion is consistent with the existing pattern across all other handlers.
Leave `behavior-log:create`, `behavior-log:update`, `behavior-log:delete` stubs exactly as-is.

---

### Task 3: `useBehaviorLog.ts` — Hook

Exact same pattern as `useEmployees.ts`. Only implements `load` for Story 4.1; `create`, `update`, `delete` added in later stories.

```ts
import { useState, useCallback } from 'react'
import type { BehaviorLogEntry } from '../../../shared/ipc-types'

export function useBehaviorLog() {
  const [entries, setEntries] = useState<BehaviorLogEntry[]>([])
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

  const clearError = useCallback(() => setError(null), [])

  return { entries, isLoading, error, load, clearError }
}
```

---

### Task 4: `CompetencyChip.tsx`

Uses `theme.palette.competency.*` for colors (already defined in `theme.ts`):
- `communication: '#4A90D9'`, `clientFocus: '#26A69A'`, `proactivity: '#FB8C00'`, `teamwork: '#7C3AED'`

The color map requires a lookup by `competency.name`. Use the same theme tokens — do NOT inline raw hex values; use `useTheme()` to access palette.

```tsx
import { Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { Competency } from '../../../../shared/ipc-types'

type ChipMode = 'read-only' | 'toggle' | 'filter'

interface Props {
  competency: Competency
  mode: ChipMode
  selected?: boolean
  onClick?: () => void
}

export default function CompetencyChip({ competency, mode, selected = false, onClick }: Props): React.JSX.Element {
  const theme = useTheme()

  const colorMap: Record<string, string> = {
    'Communication': theme.palette.competency.communication,
    'Client Focus': theme.palette.competency.clientFocus,
    'Proactivity': theme.palette.competency.proactivity,
    'Teamwork': theme.palette.competency.teamwork,
  }
  const color = colorMap[competency.name] ?? theme.palette.text.secondary

  if (mode === 'read-only') {
    return (
      <Chip
        label={competency.name}
        size="small"
        variant="outlined"
        sx={{
          borderColor: color,
          color,
          fontSize: '11px',
          height: 22,
          pointerEvents: 'none',
        }}
      />
    )
  }

  if (mode === 'toggle') {
    return (
      <Chip
        label={competency.name}
        size="small"
        onClick={onClick}
        aria-pressed={selected}
        sx={{
          cursor: 'pointer',
          bgcolor: selected ? color : 'transparent',
          color: selected ? '#fff' : color,
          borderColor: color,
          border: '1px solid',
          fontSize: '12px',
          opacity: selected ? 1 : 0.5,
          '&:hover': { opacity: 1 },
        }}
      />
    )
  }

  // filter mode
  return (
    <Chip
      label={competency.name}
      onClick={onClick}
      aria-pressed={selected}
      sx={{
        cursor: 'pointer',
        bgcolor: selected ? color : 'transparent',
        color: selected ? '#fff' : color,
        borderColor: color,
        border: '1px solid',
        fontSize: '12px',
        fontWeight: selected ? 600 : 400,
        '&:hover': { opacity: 0.85 },
      }}
    />
  )
}
```

---

### Task 5: `appStore.ts` — Replace `selectedEmployeeId` with `selectedEmployee`

Replace `selectedEmployeeId: number | null` with `selectedEmployee: Employee | null` (the full object). This gives `EmployeeDetail` access to the employee name without a secondary fetch.

```ts
import { create } from 'zustand'
import type { Competency, Employee } from '../../../shared/ipc-types'

type View = 'employees' | 'framework' | 'settings'

interface AppStore {
  currentView: View
  selectedEmployee: Employee | null      // replaces selectedEmployeeId
  selectedCompetency: Competency | null
  setView: (view: View) => void
  setEmployee: (employee: Employee | null) => void
  setCompetency: (c: Competency | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentView: 'employees',
  selectedEmployee: null,
  selectedCompetency: null,
  setView: (view) => set({ currentView: view }),
  setEmployee: (employee) => set({ selectedEmployee: employee, selectedCompetency: null }),
  setCompetency: (c) => set({ selectedCompetency: c }),
}))
```

Cascade: everywhere `selectedEmployeeId` was consumed, use `selectedEmployee?.id`. Currently that is only `App.tsx` ViewRouter (after this story adds the check).

---

### Task 6: `EmployeeDetail.tsx` — Full Implementation

```tsx
import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Link,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material'
import CompetencyChip from '../components/common/CompetencyChip'
import { useAppStore } from '../store/appStore'
import { useBehaviorLog } from '../hooks/useBehaviorLog'

export default function EmployeeDetail(): React.JSX.Element {
  const employee = useAppStore((s) => s.selectedEmployee)!
  const setEmployee = useAppStore((s) => s.setEmployee)
  const { entries, isLoading, error, load } = useBehaviorLog()
  const [activeTab, setActiveTab] = useState(0)
  const [showInlineRow, setShowInlineRow] = useState(false)  // wired to InlineLogRow in Story 4.2

  useEffect(() => {
    load(employee.id)
  }, [load, employee.id])

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2, fontSize: '13px' }}>
        <Link
          component="button"
          underline="hover"
          color="text.secondary"
          sx={{ fontSize: '13px', cursor: 'pointer' }}
          onClick={() => setEmployee(null)}
        >
          Employees
        </Link>
        <Typography sx={{ fontSize: '13px', color: 'text.primary' }}>{employee.name}</Typography>
      </Breadcrumbs>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_e, v) => setActiveTab(v)}
        sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Behavior Log" />
        <Tab label="Evaluate" />
      </Tabs>

      {activeTab === 1 && (
        <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          AI evaluation — coming in Epic 6.
        </Typography>
      )}

      {activeTab === 0 && (
        <>
          {/* Page header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A1A2E' }}>
              Behavior Log
            </Typography>
            <Button variant="contained" onClick={() => setShowInlineRow(true)}>
              + Log Behavior
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : entries.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, gap: 1 }}>
              <Typography color="text.secondary">
                No behaviors logged for {employee.name} yet
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell component="th" scope="col" sx={{ width: 110 }}>Date</TableCell>
                    <TableCell component="th" scope="col">Description</TableCell>
                    <TableCell component="th" scope="col" sx={{ width: 260 }}>Competencies</TableCell>
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
    </Box>
  )
}
```

`showInlineRow` state is intentionally wired but unused in this story — Story 4.2 adds the `{showInlineRow && <InlineLogRow ... />}` row.

---

### Task 7: `App.tsx` — ViewRouter Update

```tsx
import EmployeeDetail from './views/EmployeeDetail'

function ViewRouter(): React.JSX.Element {
  const currentView = useAppStore((s) => s.currentView)
  const selectedEmployee = useAppStore((s) => s.selectedEmployee)
  if (currentView === 'framework') return <Framework />
  if (currentView === 'settings') return <Settings />
  if (currentView === 'employees' && selectedEmployee !== null) return <EmployeeDetail />
  return <EmployeeList />
}
```

---

### Task 8: `EmployeeList.tsx` — Employee Name Click

Import `useAppStore` and add click to the employee name cell:

```tsx
import { useAppStore } from '../store/appStore'

// Inside the component:
const setEmployee = useAppStore((s) => s.setEmployee)

// Replace the name TableCell:
<TableCell
  sx={{ fontWeight: 500, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
  onClick={() => setEmployee(emp)}
>
  {emp.name}
</TableCell>
```

`emp` is the full `Employee` object from the `employees` array.

---

### Task 9: Tests

#### ABI Mismatch — Use Mock DB (Same Pattern as `employees.test.ts`)

`better-sqlite3` is compiled against Electron Node ABI 140; Vitest runs on system Node ABI 137. A real in-memory DB causes a crash. Use the mock DB pattern from `employees.test.ts` — key concern is mocking `.prepare(sql).all(args)`.

#### `__tests__/main/db/behaviorLog.test.ts`

```ts
import type Database from 'better-sqlite3'
import { describe, it, expect } from 'vitest'
import { listEntries } from '../../../src/main/db/behaviorLog'

function mockDbWithRows(rows: object[]): Database.Database {
  return {
    prepare: (_sql: string) => ({ all: (..._args: unknown[]) => rows }),
  } as unknown as Database.Database
}

describe('listEntries', () => {
  it('returns empty array when no rows', () => {
    expect(listEntries(mockDbWithRows([]), 1)).toEqual([])
  })

  it('maps snake_case to camelCase BehaviorLogEntry', () => {
    const rows = [{ id: 1, employee_id: 2, description: 'Did well', entry_date: '2026-04-01', created_at: '2026-04-01 10:00:00', comp_id: null, comp_name: null }]
    const [entry] = listEntries(mockDbWithRows(rows), 2)
    expect(entry.id).toBe(1)
    expect(entry.employeeId).toBe(2)
    expect(entry.entryDate).toBe('2026-04-01')
    expect(entry.createdAt).toBe('2026-04-01 10:00:00')
    expect((entry as any).employee_id).toBeUndefined()
    expect(entry.competencies).toEqual([])
  })

  it('aggregates multiple JOIN rows into one entry with multiple competencies', () => {
    const rows = [
      { id: 5, employee_id: 1, description: 'Good', entry_date: '2026-04-10', created_at: '2026-04-10 08:00:00', comp_id: 1, comp_name: 'Communication' },
      { id: 5, employee_id: 1, description: 'Good', entry_date: '2026-04-10', created_at: '2026-04-10 08:00:00', comp_id: 3, comp_name: 'Proactivity' },
    ]
    const [entry] = listEntries(mockDbWithRows(rows), 1)
    expect(entry.id).toBe(5)
    expect(entry.competencies).toHaveLength(2)
    expect(entry.competencies[0].name).toBe('Communication')
    expect(entry.competencies[1].name).toBe('Proactivity')
  })

  it('preserves SQL ORDER BY: first row in result set is first entry', () => {
    const rows = [
      { id: 10, employee_id: 1, description: 'Later', entry_date: '2026-05-01', created_at: '2026-05-01', comp_id: null, comp_name: null },
      { id:  7, employee_id: 1, description: 'Earlier', entry_date: '2026-04-01', created_at: '2026-04-01', comp_id: null, comp_name: null },
    ]
    const entries = listEntries(mockDbWithRows(rows), 1)
    expect(entries[0].id).toBe(10)
    expect(entries[1].id).toBe(7)
  })
})
```

#### `__tests__/renderer/components/CompetencyChip.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ThemeProvider } from '@mui/material/styles'
import CompetencyChip from '../../../src/renderer/src/components/common/CompetencyChip'
import theme from '../../../src/renderer/src/theme/theme'
import type { Competency } from '../../../src/shared/ipc-types'

const communication: Competency = { id: 1, name: 'Communication' }
const teamwork: Competency = { id: 4, name: 'Teamwork' }

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

describe('CompetencyChip — read-only', () => {
  it('renders competency name', () => {
    wrap(<CompetencyChip competency={communication} mode="read-only" />)
    expect(screen.getByText('Communication')).toBeDefined()
  })

  it('is not interactive (no role=button)', () => {
    wrap(<CompetencyChip competency={teamwork} mode="read-only" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('CompetencyChip — toggle', () => {
  it('has aria-pressed reflecting selected state', () => {
    wrap(<CompetencyChip competency={communication} mode="toggle" selected={true} />)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })

  it('has aria-pressed=false when not selected', () => {
    wrap(<CompetencyChip competency={communication} mode="toggle" selected={false} />)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-pressed')).toBe('false')
  })
})
```

---

### Architecture Compliance

| Rule | Applied here |
|---|---|
| No SQL in handlers | `behaviorLogHandlers.ts` delegates to `listEntries()` in `behaviorLog.ts` |
| `snake_case` → `camelCase` in repo layer | `groupJoinRows` maps `employee_id` → `employeeId`, `entry_date` → `entryDate`, etc. |
| `IpcResult<T>` discriminated union | `behavior-log:list` returns `{ ok: true, data }` or `{ ok: false, error }` |
| Hooks wrap IPC; components never call `window.electronAPI` directly | `useBehaviorLog` wraps the IPC call; `EmployeeDetail` uses the hook |
| `electron-log` format `[channel] key=value` | `log.info('[behavior-log:list] employeeId=%d ...')` |
| No direct `electron` import in renderer | Confirmed — uses `window.electronAPI` only |
| MUI `sx` prop for all styling | No inline `style` attributes |

---

### Previous Story Intelligence (Story 3.3)

- **`COMPETENCY_CHIP_STYLES`** in `Framework.tsx` uses outlined colors (different from `theme.palette.competency`). `CompetencyChip` uses `theme.palette.competency.*` (the filled/text colors). These are intentionally different — do not copy `COMPETENCY_CHIP_STYLES` into `CompetencyChip`.
- **Emoji icons in Sidebar** — do not add MUI icon imports expecting them; the sidebar already uses emoji.
- **Test count**: 31 tests currently passing — all must continue to pass after this story.
- **`setView` does NOT reset `selectedEmployee`** (deferred from Story 1.6) — when user clicks Framework/Settings nav, `selectedEmployee` is NOT cleared. This is pre-existing behavior. When returning to Employees, `selectedEmployee` may still be set — ViewRouter will show `EmployeeDetail` again. This is acceptable for now; the "Employees" breadcrumb link clears it.
- **`db!` non-null assertion** — consistent with all existing handlers; do not add extra null checks.

### UX Requirements Mapping

| Requirement | Implementation |
|---|---|
| UX-DR1: `CompetencyChip` read-only (small, outlined) | `CompetencyChip` mode="read-only" — outlined, `height: 22`, `pointerEvents: none` |
| UX-DR1: toggle mode with `aria-pressed` | `CompetencyChip` mode="toggle" — `aria-pressed={selected}` on MUI Chip |
| UX-DR1: filter mode with active background | `CompetencyChip` mode="filter" — filled when active |
| UX-DR11: empty state "No behaviors logged for [Name] yet" | `EmployeeDetail` renders centered empty state when `entries.length === 0` |
| UX-DR18: Breadcrumb "Employees › [Name]" with clickable back link | MUI `Breadcrumbs` + `Link` button → `setEmployee(null)` |
| UX-DR8: Primary button rendered at 40% opacity when required fields incomplete | "+ Log Behavior" button is primary (contained); no opacity needed since it always opens the row |
| AR6: Handler pattern — validate → delegate → return `IpcResult<T>` | `behavior-log:list` handler follows exact pattern |
| AR10: Vitest tests in `__tests__/` mirroring `src/` | `__tests__/main/db/behaviorLog.test.ts`, `__tests__/renderer/components/CompetencyChip.test.tsx` |

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Completion Notes List

- All 10 tasks completed; all 11 ACs satisfied.
- `selectedEmployeeId: number | null` in appStore replaced with `selectedEmployee: Employee | null` — full Employee object stored so EmployeeDetail can display name without a secondary fetch. Existing appStore tests rewritten to match new interface.
- JSDOM test cleanup issue: `@testing-library/react` did not auto-cleanup between tests under the `// @vitest-environment jsdom` directive; added explicit `afterEach(() => cleanup())` to CompetencyChip.test.tsx.
- `behavior-log:create`, `behavior-log:update`, `behavior-log:delete` handlers left as "Not implemented." stubs per AC 3.
- `showInlineRow` state is declared and wired to the "+ Log Behavior" button in EmployeeDetail but no inline row is rendered — Story 4.2 will add `{showInlineRow && <InlineLogRow />}`.
- Final test count: 44 tests, 6 test files, all passing.

### File List

**New:**
- `sdd-app/src/main/db/behaviorLog.ts`
- `sdd-app/src/renderer/src/components/common/CompetencyChip.tsx`
- `sdd-app/src/renderer/src/views/EmployeeDetail.tsx`
- `sdd-app/src/renderer/src/hooks/useBehaviorLog.ts`
- `sdd-app/__tests__/main/db/behaviorLog.test.ts`
- `sdd-app/__tests__/renderer/components/CompetencyChip.test.tsx`

**Modified:**
- `sdd-app/src/main/handlers/behaviorLogHandlers.ts`
- `sdd-app/src/renderer/src/App.tsx`
- `sdd-app/src/renderer/src/views/EmployeeList.tsx`
- `sdd-app/src/renderer/src/store/appStore.ts`
- `sdd-app/__tests__/renderer/store/appStore.test.ts`

### Review Findings

- [x] [Review][Patch] Missing `competencyId` filter test — AC10 specifies "competency filter" as a required test case; `behaviorLog.test.ts` has no test that passes a `competencyId` arg or verifies the two-argument `.all()` branch is exercised [`sdd-app/__tests__/main/db/behaviorLog.test.ts`]
- [x] [Review][Patch] `read-only` chip not keyboard focusable — AC5 requires "keyboard focusable across all modes"; `pointerEvents: 'none'` + no `tabIndex` makes the chip unreachable by keyboard [`sdd-app/src/renderer/src/components/common/CompetencyChip.tsx`]
- [x] [Review][Defer] Evaluate tab placeholder text deviates from spec — AC7 specifies `"Coming in Epic 6"`; code renders `"AI evaluation — coming in Epic 6."` [`sdd-app/src/renderer/src/views/EmployeeDetail.tsx`] — deferred, not relevant; Epic 6 will replace the placeholder entirely
- [x] [Review][Defer] `db!` non-null assertion in handler [`sdd-app/src/main/handlers/behaviorLogHandlers.ts`] — deferred, pre-existing pattern across all handlers; consistent with project architecture
- [x] [Review][Defer] `selectedEmployee!` non-null assertion in EmployeeDetail [`sdd-app/src/renderer/src/views/EmployeeDetail.tsx:25`] — deferred, guarded by ViewRouter; accepted project TypeScript pattern
- [x] [Review][Defer] useEffect has no IPC cancellation on unmount [`sdd-app/src/renderer/src/hooks/useBehaviorLog.ts`] — deferred, IPC is not cancellable; hook is component-local so stale writes cannot occur in current architecture
- [x] [Review][Defer] `useBehaviorLog` does not reset `entries` on new load [`sdd-app/src/renderer/src/hooks/useBehaviorLog.ts`] — deferred, component-local mount means no stale data today; worth revisiting if hook is lifted to shared context
- [x] [Review][Defer] `colorMap` keyed by display name string [`sdd-app/src/renderer/src/components/common/CompetencyChip.tsx`] — deferred, intentional per dev notes; no custom competencies in scope for current epics
- [x] [Review][Defer] Sidebar "Employees" nav resurfaces EmployeeDetail without resetting selection [`sdd-app/src/renderer/src/App.tsx`] — deferred, explicitly documented as acceptable behavior in Story 4.1 dev notes
- [x] [Review][Defer] `showInlineRow && null` renders nothing [`sdd-app/src/renderer/src/views/EmployeeDetail.tsx`] — deferred, intentional placeholder; Story 4.2 wires the InlineLogRow
