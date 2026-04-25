---
stepsCompleted: ["step-01-init", "step-02-context", "step-03-starter", "step-04-decisions", "step-05-patterns", "step-06-structure", "step-07-validation", "step-08-complete"]
lastStep: 8
status: 'complete'
completedAt: '2026-04-23'
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
  - "_bmad-output/planning-artifacts/product-brief-SDD.md"
workflowType: 'architecture'
project_name: 'SDD'
user_name: 'Diego'
date: '2026-04-23'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

27 FRs across 5 domains — all implementable as local CRUD + one async AI integration:

| Domain | FRs | Architectural Implication |
|---|---|---|
| Employee Management | FR1–FR4 | Simple CRUD; employees table with level field (A/B/C/D) |
| Competency Framework | FR5–FR8 | 4 fixed competencies × 4 levels = 16 configurable cells; separate expected_behaviors table |
| Behavior Logging | FR9–FR16 | Many-to-many (entries ↔ competencies); retroactive dates; edit/delete in place |
| AI Evaluation | FR17–FR23 | Async Claude API call; 4-value grade enum; Insufficient Input as valid outcome; re-triggerable |
| App Configuration | FR24–FR25 | API key via `safeStorage`; model selector persisted locally |

**Non-Functional Requirements:**

| NFR | Requirement | Architectural Impact |
|---|---|---|
| Performance | Local ops < 1s; AI < 15s; 30s timeout | Synchronous SQLite for all local ops; async IPC for AI calls with timeout enforcement |
| Security | API key in OS-level secure storage; never in logs or UI | `safeStorage` in main process only; renderer never receives raw key value |
| Reliability | Atomic DB writes; failed AI calls leave state intact; offline startup | SQLite transactions on all writes; AI errors isolated to evaluation result only |

**Scale & Complexity:**

- Primary domain: Desktop application (Electron, single-user, single-machine, local-first)
- Complexity level: Medium — straightforward CRUD baseline with one meaningful spike (Electron IPC architecture + Claude API + `safeStorage`)
- Estimated architectural components: 6 (Electron shell, IPC bridge, React frontend, SQLite data layer, AIProvider abstraction, Claude API client)

### Technical Constraints & Dependencies

| Constraint | Source | Impact |
|---|---|---|
| Electron main/renderer split | Platform | All Node.js APIs (SQLite, safeStorage, HTTP) live in main process; renderer is pure React |
| `better-sqlite3` | PRD decision | Synchronous API only; no async SQLite — fits main process model perfectly |
| Claude API (Haiku 4.5 / Sonnet 4.6) | PRD decision | External HTTP dependency; internet required for evaluation only |
| `safeStorage` API | Electron security | Main process only; not accessible from renderer |
| `electron-builder` | PRD decision | `.exe` (NSIS) for Windows; `.dmg` for macOS; standard config |
| MUI free tier only | UX decision | No DataGrid Pro; use free `Table` component for behavior log |
| `app.getPath('userData')` | PRD decision | DB file location; survives reinstalls |
| Windows primary, macOS/Linux nice-to-have | PRD decision | No platform-specific UI forks; Electron handles cross-platform rendering |

### Cross-Cutting Concerns Identified

| Concern | Scope | Notes |
|---|---|---|
| **Electron IPC layer** | All features | Defines the process boundary; every feature that reads/writes data or calls an API crosses this boundary |
| **`AIProvider` interface & mock** | AI evaluation + workstream decoupling | Interface must be locked early; mock returns fixed grade + rationale; real implementation drops in without restructuring |
| **SQLite transaction guarantees** | All write operations | Behavior log entries, framework edits, employee changes — all wrapped in transactions per PRD reliability NFR |
| **Error propagation (main → renderer)** | AI failures, DB errors, safeStorage failures | Structured error responses over IPC; renderer handles display; main process never crashes on recoverable errors |
| **React state management for tab persistence** | Evaluation view ↔ behavior log tab switching | Competency chip selection and employee context must live above tab components; lifted state or lightweight store |
| **API key lifecycle** | Settings screen + every AI call | Store (safeStorage), retrieve (main only), mask in UI, never log, never send to renderer as raw value |

## Starter Template Evaluation

### Primary Technology Domain

Desktop application — Electron + React + TypeScript, based on project requirements analysis. All technology decisions already established in PRD.

### Starter Options Considered

| Option | Command | Verdict |
|---|---|---|
| **electron-vite** `react-ts` template | `npm create @quick-start/electron@latest` | ✅ Selected |
| Electron Forge `vite-typescript` | `npm init electron-app@latest <name> -- --template=vite-typescript` | ❌ Forge's Vite support is experimental; React requires manual integration; uses Forge packager instead of `electron-builder` |

### Selected Starter: electron-vite (react-ts template)

**Rationale for Selection:**
Purpose-built Electron + Vite build tooling with first-class React + TypeScript support. Enforces the main/preload/renderer separation that the IPC security architecture requires. Works natively with `electron-builder` (PRD requirement). Actively maintained.

**Initialization Command:**

```bash
npm create @quick-start/electron@latest sdd-app -- --template react-ts
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript throughout — separate `tsconfig.json` for each process context: `main`, `preload`, `renderer`. Strict type safety across the IPC boundary.

**Build Tooling:**
Vite for the renderer process (HMR in development); esbuild for main and preload (fast rebuilds, hot restart on main process changes). No webpack configuration required.

**Project Structure:**
```
src/
  main/       ← Node.js process: SQLite, Claude API, safeStorage
  preload/    ← contextBridge: exposes typed IPC API to renderer
  renderer/   ← React app: UI only, no direct Node.js access
```

**IPC Pattern:**
`contextBridge` + `ipcRenderer`/`ipcMain` scaffolded in the preload script. This is the security-correct pattern — the renderer never accesses Node.js APIs directly. All `safeStorage`, SQLite, and Claude API calls are IPC handler invocations in the main process.

**Testing Framework:**
Not included in starter — to be added (Vitest for renderer unit tests; integration tests via the IPC layer).

**Code Organization:**
Process separation is enforced by the project structure. Main process modules (database, AI provider, settings) are co-located under `src/main/`. Renderer components under `src/renderer/`.

**Development Experience:**
Renderer HMR + main process hot restart on save. Source maps for all three process contexts. Debugging via Chrome DevTools (renderer) and Node.js inspector (main).

**Packaging:**
`electron-builder` config pre-included. Produces `.exe` (NSIS installer) for Windows and `.dmg` for macOS without additional configuration.

**Additional Dependencies to Install After Scaffolding:**

| Package | Process | Purpose |
|---|---|---|
| `@mui/material` `@emotion/react` `@emotion/styled` | renderer | Design system |
| `@mui/x-date-pickers` | renderer | DatePicker (free tier) |
| `better-sqlite3` + `@types/better-sqlite3` | main | Local database |
| `@anthropic-ai/sdk` | main | Claude API client |
| `zustand` | renderer | Tab state persistence (or React Context) |

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- IPC channel contract (naming + response type) — both workstreams write against this
- SQLite schema lifecycle — schema-on-startup with `CREATE TABLE IF NOT EXISTS`
- `AIProvider` interface — locks the workstream A/B integration point

**Important Decisions (Shape Architecture):**
- Zustand for renderer state management
- `electron-log` for production-visible logging
- Vitest for both renderer unit tests and IPC handler integration tests

**Deferred Decisions (Post-MVP):**
- Migration framework — not needed until PoC advances to production with live users
- Auto-update (`electron-updater`) — manual distribution sufficient for PoC
- E2E test automation — manual testing proportionate for PoC scale

### Data Architecture

**Database:** SQLite via `better-sqlite3`. Synchronous API fits the Electron main process model with no async complexity.

**Schema Lifecycle:** Schema-on-startup — `CREATE TABLE IF NOT EXISTS` statements run on every app launch. No migration framework for the PoC. If a table needs altering during development, handle with a one-off `ALTER TABLE` or recreate in dev. Revisit if PoC advances to production.

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('A','B','C','D')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS competencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE  -- 'Communication' | 'Client Focus' | 'Proactivity' | 'Teamwork'
);

CREATE TABLE IF NOT EXISTS expected_behaviors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competency_id INTEGER NOT NULL REFERENCES competencies(id),
  level TEXT NOT NULL CHECK(level IN ('A','B','C','D')),
  description TEXT NOT NULL,
  UNIQUE(competency_id, level)
);

CREATE TABLE IF NOT EXISTS behavior_log_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  entry_date TEXT NOT NULL,  -- ISO 8601 date string
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS behavior_log_entry_competencies (
  entry_id INTEGER NOT NULL REFERENCES behavior_log_entries(id) ON DELETE CASCADE,
  competency_id INTEGER NOT NULL REFERENCES competencies(id),
  PRIMARY KEY (entry_id, competency_id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

**Validation:** Input validated in the main process before DB write. No separate validation layer — assertions at IPC handler entry points are sufficient for a single-user PoC.

**Seeding:** The four competency rows (`Communication`, `Client Focus`, `Proactivity`, `Teamwork`) are seeded on first startup using `INSERT OR IGNORE`.

### Authentication & Security

**Authentication:** None. Single user, single machine — no login required.

**API Key:** Stored and retrieved exclusively via Electron `safeStorage` in the main process. The renderer never receives the raw key value — only a boolean `isConfigured` signal. Never logged, never included in IPC error responses.

**Local data:** Protected by OS-level user account access control. No additional encryption for the PoC.

**Logging discipline:** `electron-log` is used throughout the main process. API key value is explicitly excluded from all log statements. IPC error messages must not include key material.

### API & Communication Patterns

**IPC pattern:** `ipcMain.handle` (promise-based) in the main process; `contextBridge`-exposed `ipcRenderer.invoke` in the preload script. The renderer never imports from `electron` directly.

**Channel naming convention:** Colon-separated `domain:action`:
```
employee:list
employee:create
employee:update
employee:delete
behavior-log:list
behavior-log:create
behavior-log:update
behavior-log:delete
competency:list
expected-behavior:get
expected-behavior:set
ai:evaluate
settings:get-key-configured
settings:set-api-key
settings:get-model
settings:set-model
```

**Typed response format:** Every `ipcMain.handle` returns a discriminated union:
```ts
type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string }
```
Defined once in `src/shared/ipc-types.ts`, imported by both preload and renderer. TypeScript forces the caller to check `ok` before accessing `data`.

**Error handling:** Main process catches all errors (DB failures, AI call failures, safeStorage failures) and returns `{ ok: false, error: string }`. The main process never crashes on recoverable errors. AI call failures are isolated to the evaluation result — behavior log data is always intact.

**AI call timeout:** 30-second timeout enforced in the main process AI handler. Returns `{ ok: false, error: 'Evaluation timed out. Check your connection and try again.' }` on expiry.

### Frontend Architecture

**State management:** Zustand — one store holds the currently selected employee and selected competency. Consumed by tab components and the evaluation view. Tab switching preserves both values; competency selection resets when a new employee is selected.

```ts
interface AppStore {
  selectedEmployeeId: number | null
  selectedCompetency: Competency | null
  setEmployee: (id: number | null) => void
  setCompetency: (c: Competency | null) => void
}
```

**Routing:** No router. Sidebar navigation driven by a `currentView` enum in Zustand (`'employees' | 'framework' | 'settings'`). Employee sub-view reached by setting `selectedEmployeeId` — no URL-based routing needed for a 4-screen desktop app.

**Component organization:**
```
src/renderer/
  components/
    common/          ← CompetencyChip
    log/             ← InlineLogRow
    evaluation/      ← GradeResultCard, InsufficientInputCard
    layout/          ← Sidebar, AppShell
  views/             ← EmployeeList, EmployeeDetail, Framework, Settings
  store/             ← Zustand store
  hooks/             ← IPC invocation hooks (useEmployees, useBehaviorLog, etc.)
  theme/             ← MUI custom theme
```

**IPC invocation hooks:** Custom React hooks in `src/renderer/hooks/` wrap `window.electronAPI.invoke(channel, payload)` calls, handle loading state, and return typed results. Components call hooks, not IPC directly.

### Infrastructure & Deployment

**Packaging:** `electron-builder` — produces `.exe` (NSIS installer) for Windows, `.dmg` for macOS. Manual distribution for PoC.

**Logging:** `electron-log` in the main process. Writes to `app.getPath('logs')` in the installed app; prints to console in dev. Used for IPC handler entry/exit, AI call start/result (excluding key material), and DB errors.

**Testing:**
- *Renderer unit tests:* Vitest + React Testing Library for custom components and Zustand store logic
- *IPC integration tests:* Vitest tests that import main process handler functions directly, wired to an in-memory or temp-file SQLite database. Validates DB schema, query correctness, and IPC response shapes — critical for the `AIProvider` mock/real handoff
- *No e2e automation:* Manual testing proportionate for a single-user PoC

**CI/CD:** None for PoC. Manual builds via `npm run build`.

### Decision Impact Analysis

**Implementation Sequence:**
1. Scaffold with `npm create @quick-start/electron@latest sdd-app -- --template react-ts`
2. Define `src/shared/ipc-types.ts` — locks the IPC contract both workstreams depend on
3. Implement SQLite schema-on-startup in `src/main/db/` — all other main process work depends on this
4. Implement `AIProvider` interface + mock — unblocks Workstream A end-to-end testing
5. Wire `contextBridge` preload with all channel registrations
6. Build Zustand store and IPC invocation hooks in renderer
7. Build UI views against hooks
8. Swap mock `AIProvider` for real Claude implementation when Workstream B delivers

**Cross-Component Dependencies:**
- `src/shared/ipc-types.ts` is a shared dependency — changes affect both preload and renderer
- `AIProvider` interface is the integration seam between workstreams — must be stable before Workstream B begins
- Zustand store shape affects every view component — finalize before building views
- `electron-log` setup should happen before any handler implementation so all handlers are logged from the start

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical conflict points identified:** 8 areas where AI agents could make different choices without explicit rules.

### Naming Patterns

**Database Naming Conventions:**
- Tables: `lowercase_plural_snake_case` — `employees`, `competencies`, `expected_behaviors`, `behavior_log_entries`, `behavior_log_entry_competencies`, `settings`
- Columns: `snake_case` — `employee_id`, `entry_date`, `created_at`
- Foreign keys: `{referenced_table_singular}_id` — `employee_id`, `competency_id`, `entry_id`

**TypeScript Naming Conventions:**

| Element | Convention | Example |
|---|---|---|
| Variables & functions | `camelCase` | `selectedEmployeeId`, `getEmployee()` |
| Types, interfaces, enums | `PascalCase` | `Employee`, `IpcResult`, `Competency` |
| React components | `PascalCase` | `CompetencyChip`, `InlineLogRow` |
| Zustand store | `camelCase` noun | `appStore` |
| IPC hooks | `use` + PascalCase domain | `useEmployees`, `useBehaviorLog`, `useEvaluation` |
| Constants (module-level) | `camelCase` | `defaultModel`, `evaluationTimeout` |

**File Naming Conventions:**

| File type | Convention | Example |
|---|---|---|
| React components | `PascalCase.tsx` | `CompetencyChip.tsx`, `GradeResultCard.tsx` |
| Hooks | `camelCase.ts` | `useEmployees.ts`, `useBehaviorLog.ts` |
| Stores | `camelCase.ts` | `appStore.ts` |
| Utilities | `camelCase.ts` | `ipcTypes.ts`, `dateUtils.ts` |
| DB modules | `camelCase.ts` | `employees.ts`, `behaviorLog.ts` |
| Test files | `{SourceFile}.test.{ts,tsx}` | `CompetencyChip.test.tsx`, `employees.test.ts` |

### Structure Patterns

**Project Organization:**
```
src/
  main/
    db/           ← One file per domain: employees.ts, behaviorLog.ts, framework.ts
    ai/           ← AIProvider interface + MockAIProvider + ClaudeAIProvider
    settings/     ← safeStorage wrapper, model preference
    index.ts      ← App entry, IPC handler registration, schema init
  preload/
    index.ts      ← contextBridge — exposes window.electronAPI
  renderer/
    components/
      common/     ← CompetencyChip.tsx
      log/        ← InlineLogRow.tsx
      evaluation/ ← GradeResultCard.tsx, InsufficientInputCard.tsx
      layout/     ← Sidebar.tsx, AppShell.tsx
    views/        ← EmployeeList.tsx, EmployeeDetail.tsx, Framework.tsx, Settings.tsx
    store/        ← appStore.ts
    hooks/        ← useEmployees.ts, useBehaviorLog.ts, useEvaluation.ts, useSettings.ts
    theme/        ← theme.ts (MUI custom theme)
    main.tsx      ← Renderer entry
  shared/
    ipc-types.ts  ← IpcResult<T> type + all channel payload/response types

__tests__/
  main/
    db/           ← employees.test.ts, behaviorLog.test.ts, framework.test.ts
    ai/           ← MockAIProvider.test.ts
  renderer/
    components/   ← CompetencyChip.test.tsx, InlineLogRow.test.tsx, etc.
    store/        ← appStore.test.ts
```

**Shared Types File (`src/shared/ipc-types.ts`):**
All IPC channel payload and response types live here. Both preload and renderer import from this file. Main process handler functions use these types for their return values.

### Format Patterns

**IPC Response Format:**
```ts
type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string }
```
Every `ipcMain.handle` returns this type. No exceptions. Callers must check `ok` before accessing `data`.

**Date Format:**
- In SQLite: ISO 8601 date strings (`'2026-04-23'` for dates, `datetime('now')` for timestamps)
- Over IPC: ISO 8601 strings (not `Date` objects — they don't serialize correctly over IPC)
- In renderer: convert to `Date` objects only for display formatting via MUI `DatePicker` or `date-fns`

**Field Naming Over IPC:**
All payloads crossing the IPC boundary use `camelCase`. The mapping from DB `snake_case` to TypeScript `camelCase` happens in the main process repository functions before the response is returned.

**Grade Enum:**
```ts
type Grade =
  | 'Does Not Meet Expectations'
  | 'Meets Expectations'
  | 'Exceeds Expectations'
  | 'Insufficient Input'
```
This string union is the canonical grade representation across DB storage, IPC payloads, and renderer display.

### Communication Patterns

**IPC Handler Structure — every handler follows this pattern:**
```ts
ipcMain.handle('employee:create', async (_event, payload: CreateEmployeePayload): Promise<IpcResult<Employee>> => {
  log.info('[employee:create] name=%s level=%s', payload.name, payload.level)
  try {
    // 1. Validate inputs
    if (!payload.name?.trim()) return { ok: false, error: 'Employee name is required.' }
    // 2. Execute DB operation (delegate to repository function)
    const employee = db.createEmployee(payload.name.trim(), payload.level)
    // 3. Return success
    return { ok: true, data: employee }
  } catch (e) {
    log.error('[employee:create] error: %s', e.message)
    return { ok: false, error: 'Failed to create employee.' }
  }
})
```
Rule: handler functions never contain SQL directly — they call repository functions in `src/main/db/`.

**IPC Invocation Hook Structure — every hook follows this pattern:**
```ts
function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await window.electronAPI.invoke('employee:list')
    if (result.ok) setEmployees(result.data)
    else setError(result.error)
    setIsLoading(false)
  }, [])

  return { employees, isLoading, error, load }
}
```
Rule: components never call `window.electronAPI.invoke` directly — they always go through a hook.

**Zustand Store Updates:**
Zustand handles immutability automatically. Store actions use `set()` directly — no manual spreading or cloning required.

### Process Patterns

**Error Handling:**
- Main process: all handler errors are caught and returned as `{ ok: false, error: string }`. Plain English messages — never raw exception text that could contain key material or stack traces.
- Renderer hooks: `error` state is `string | null`. Components display `error` via MUI `Alert` or `Snackbar`. Never show raw error objects in the UI.
- AI evaluation errors: displayed in the `GradeResultCard` error state with a Retry button. Never affect behavior log state.

**Loading States:**
- Each hook owns its own `isLoading: boolean` via `useState` — local, not global
- AI evaluation loading state lives in the `useEvaluation` hook and drives the `GradeResultCard` loading variant
- No global loading overlay — each UI area manages its own loading indicator independently

**Logging Format (main process):**
```ts
log.info('[channel:name] description key=value')   // handler entry / success
log.error('[channel:name] error: message')          // failures
// NEVER: log.info('API key: ' + key) or any key material
```

### Enforcement Guidelines

**All AI agents MUST:**
- Never import from `electron` in `src/renderer/` — use `window.electronAPI` via hooks only
- Never write SQL inside IPC handler functions — delegate to `src/main/db/` repository functions
- Never store or log the raw API key value anywhere outside `src/main/settings/`
- Never use `snake_case` for TypeScript variables, function names, or object fields
- Never return a raw error object over IPC — always `{ ok: false, error: string }`
- Always place test files in `__tests__/` mirroring the `src/` directory structure

**Anti-Patterns:**
```ts
// ❌ Direct IPC call in component
const result = await window.electronAPI.invoke('employee:list')

// ✅ Use a hook
const { employees, isLoading } = useEmployees()

// ❌ SQL in handler
ipcMain.handle('employee:list', () => db.prepare('SELECT * FROM employees').all())

// ✅ Delegate to repository
ipcMain.handle('employee:list', () => ({ ok: true, data: employeeRepo.list() }))

// ❌ snake_case in TypeScript
const { created_at } = employee

// ✅ camelCase everywhere outside SQL
const { createdAt } = employee
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
sdd-app/
├── package.json
├── electron-builder.yml
├── electron.vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── .gitignore
├── .eslintrc.cjs
├── resources/
│   └── icon.png
├── src/
│   ├── main/
│   │   ├── index.ts                         ← App entry: BrowserWindow, schema init, handler registration
│   │   ├── db/
│   │   │   ├── database.ts                  ← DB connection singleton + schema-on-startup init
│   │   │   ├── employees.ts                 ← Employee CRUD repository (FR1–FR4)
│   │   │   ├── behaviorLog.ts               ← Behavior log CRUD + competency tag queries (FR9–FR16)
│   │   │   └── framework.ts                 ← Expected behavior get/set + competency seeding (FR5–FR8)
│   │   ├── ai/
│   │   │   ├── AIProvider.ts                ← AIProvider interface definition
│   │   │   ├── MockAIProvider.ts            ← Fixed-response mock for Workstream A testing
│   │   │   └── ClaudeAIProvider.ts          ← Real Claude API implementation (Workstream B)
│   │   ├── settings/
│   │   │   ├── apiKey.ts                    ← safeStorage get/set/isConfigured (FR24–FR25)
│   │   │   └── modelPreference.ts           ← settings table read/write for selected model
│   │   └── handlers/
│   │       ├── employeeHandlers.ts          ← ipcMain.handle for employee:* channels
│   │       ├── behaviorLogHandlers.ts       ← ipcMain.handle for behavior-log:* channels
│   │       ├── frameworkHandlers.ts         ← ipcMain.handle for expected-behavior:* + competency:* channels
│   │       ├── aiHandlers.ts                ← ipcMain.handle for ai:evaluate (30s timeout enforced)
│   │       └── settingsHandlers.ts          ← ipcMain.handle for settings:* channels
│   ├── preload/
│   │   └── index.ts                         ← contextBridge: exposes window.electronAPI with all channels
│   ├── renderer/
│   │   ├── main.tsx                         ← React entry point
│   │   ├── App.tsx                          ← Root: AppShell + view routing via Zustand currentView
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── CompetencyChip.tsx       ← read-only | toggle | filter variants (UX spec)
│   │   │   ├── log/
│   │   │   │   └── InlineLogRow.tsx         ← Inline editable table row for new log entries (UX spec)
│   │   │   ├── evaluation/
│   │   │   │   ├── GradeResultCard.tsx      ← loading | result | error states (UX spec)
│   │   │   │   └── InsufficientInputCard.tsx ← Insufficient Input outcome with CTA (UX spec)
│   │   │   └── layout/
│   │   │       ├── Sidebar.tsx              ← Fixed left nav: Employees | Framework | Settings
│   │   │       └── AppShell.tsx             ← Layout wrapper: sidebar + content area (max 960px)
│   │   ├── views/
│   │   │   ├── EmployeeList.tsx             ← FR1–FR4: employee list + add/edit/delete
│   │   │   ├── EmployeeDetail.tsx           ← FR9–FR23: Behavior Log tab + Evaluate tab
│   │   │   ├── Framework.tsx                ← FR5–FR8: 4 competencies × 4 levels inline editing
│   │   │   └── Settings.tsx                 ← FR24–FR25: manager name, API key, model, clear data
│   │   ├── store/
│   │   │   └── appStore.ts                  ← Zustand: selectedEmployeeId, selectedCompetency, currentView
│   │   ├── hooks/
│   │   │   ├── useEmployees.ts              ← FR1–FR4: list, create, update, delete
│   │   │   ├── useBehaviorLog.ts            ← FR9–FR16: list (with competency filter), create, update, delete
│   │   │   ├── useFramework.ts              ← FR5–FR8: competency list, expected behavior get/set
│   │   │   ├── useEvaluation.ts             ← FR17–FR23: trigger evaluation, grade result + loading + error
│   │   │   └── useSettings.ts               ← FR24–FR25: API key configured check, set key, get/set model
│   │   └── theme/
│   │       └── theme.ts                     ← MUI custom theme: palette, typography, component overrides
│   └── shared/
│       └── ipc-types.ts                     ← IpcResult<T>, Grade type, Competency type, all payload/response types
├── __tests__/
│   ├── main/
│   │   ├── db/
│   │   │   ├── employees.test.ts            ← CRUD operations against temp SQLite DB
│   │   │   ├── behaviorLog.test.ts          ← Multi-tag queries, competency filter, retroactive dates
│   │   │   └── framework.test.ts            ← Expected behavior get/set, competency seeding
│   │   └── ai/
│   │       └── MockAIProvider.test.ts       ← Verifies mock returns correct IpcResult shape for all grade variants
│   └── renderer/
│       ├── components/
│       │   ├── CompetencyChip.test.tsx
│       │   ├── InlineLogRow.test.tsx
│       │   ├── GradeResultCard.test.tsx
│       │   └── InsufficientInputCard.test.tsx
│       └── store/
│           └── appStore.test.ts
└── dist/                                    ← Build output (gitignored)
```

### Architectural Boundaries

**IPC Boundary (the central boundary of this application):**

The `src/preload/index.ts` contextBridge is the only legal crossing point between renderer and main process. No renderer code imports from `electron`. No main process code imports from `src/renderer/`.

```
Renderer (React)
    ↕ window.electronAPI.invoke(channel, payload)
Preload (contextBridge)
    ↕ ipcRenderer.invoke(channel, payload)
Main Process (Node.js)
    ↕ better-sqlite3 / @anthropic-ai/sdk / safeStorage
```

**Data Boundary:**
- SQLite file lives at `app.getPath('userData')/sdd.db` — main process only
- Raw API key lives in OS secure storage — main process only, never crosses IPC
- `isConfigured: boolean` is the only API key signal that reaches the renderer

**AIProvider Boundary (workstream integration seam):**
- `AIProvider` interface in `src/main/ai/AIProvider.ts` defines the contract
- `aiHandlers.ts` depends on the interface, not the implementation
- Swap `MockAIProvider` → `ClaudeAIProvider` in `src/main/index.ts` at integration time — no other files change

### Requirements to Structure Mapping

**FR1–FR4 (Employee Management):**
- DB: `src/main/db/employees.ts` — `createEmployee`, `updateEmployee`, `deleteEmployee`, `listEmployees`
- IPC: `src/main/handlers/employeeHandlers.ts` — `employee:create`, `employee:update`, `employee:delete`, `employee:list`
- UI: `src/renderer/views/EmployeeList.tsx` + `src/renderer/hooks/useEmployees.ts`

**FR5–FR8 (Competency Framework):**
- DB: `src/main/db/framework.ts` — `listCompetencies`, `getExpectedBehavior`, `setExpectedBehavior`; seeding on init
- IPC: `src/main/handlers/frameworkHandlers.ts` — `competency:list`, `expected-behavior:get`, `expected-behavior:set`
- UI: `src/renderer/views/Framework.tsx` + `src/renderer/hooks/useFramework.ts`

**FR9–FR16 (Behavior Logging):**
- DB: `src/main/db/behaviorLog.ts` — `createEntry`, `updateEntry`, `deleteEntry`, `listEntries(employeeId, competencyId?)`
- IPC: `src/main/handlers/behaviorLogHandlers.ts` — `behavior-log:list`, `behavior-log:create`, `behavior-log:update`, `behavior-log:delete`
- UI: `EmployeeDetail.tsx` (log tab) + `InlineLogRow.tsx` + `CompetencyChip.tsx` (toggle mode) + `useBehaviorLog.ts`

**FR17–FR23 (AI Evaluation):**
- AI: `src/main/ai/AIProvider.ts` interface; `MockAIProvider.ts` (Workstream A); `ClaudeAIProvider.ts` (Workstream B)
- IPC: `src/main/handlers/aiHandlers.ts` — `ai:evaluate`; fetches entries + expected behaviors internally; enforces 30s timeout
- UI: `EmployeeDetail.tsx` (evaluate tab) + `GradeResultCard.tsx` + `InsufficientInputCard.tsx` + `useEvaluation.ts`

**FR24–FR25 (App Configuration):**
- Settings: `src/main/settings/apiKey.ts` (safeStorage); `src/main/settings/modelPreference.ts` (settings table)
- IPC: `src/main/handlers/settingsHandlers.ts` — `settings:get-key-configured`, `settings:set-api-key`, `settings:get-model`, `settings:set-model`
- UI: `src/renderer/views/Settings.tsx` + `src/renderer/hooks/useSettings.ts`

### Integration Points

**Internal Communication:**
- All cross-process communication flows through the contextBridge IPC layer
- Zustand store mediates view state within the renderer (no prop drilling between views)
- `EmployeeDetail.tsx` reads `selectedEmployeeId` from Zustand; tab state and `selectedCompetency` also in Zustand

**External Integrations:**
- Claude API (Anthropic): called from `ClaudeAIProvider.ts` in main process only; requires internet; isolated behind `AIProvider` interface
- OS secure storage: accessed from `src/main/settings/apiKey.ts` only via Electron `safeStorage`

**Data Flow — Behavior Log Entry Creation:**
```
InlineLogRow (save ✓)
  → useBehaviorLog.create({ employeeId, description, competencyIds, entryDate })
  → window.electronAPI.invoke('behavior-log:create', payload)
  → behaviorLogHandlers.ts validates + calls behaviorLog.ts repo
  → behaviorLog.ts: INSERT entry + INSERT entry_competency rows (in one transaction)
  → returns { ok: true, data: BehaviorLogEntry }
  → hook updates local entries state → new row appears in table
```

**Data Flow — AI Evaluation:**
```
GradeResultCard (Run Evaluation)
  → useEvaluation.evaluate({ employeeId, competencyId })
  → window.electronAPI.invoke('ai:evaluate', { employeeId, competencyId })
  → aiHandlers.ts:
      1. behaviorLog.ts: listEntries(employeeId, competencyId) → filtered entries
      2. framework.ts: getExpectedBehavior(competencyId, employee.level) → expected behaviors
      3. AIProvider.evaluate(entries, expectedBehaviors) with 30s timeout
  → { ok: true, data: { grade, rationale } } | { ok: false, error }
  → GradeResultCard | InsufficientInputCard | error state
```

### Development Workflow

**Development:** `npm run dev` — Electron with Vite HMR for renderer + main process hot restart.

**Testing:** `npm run test` — Vitest runs all `__tests__/**/*.test.{ts,tsx}`. DB integration tests use a temp SQLite file per suite.

**Build:** `npm run build` — compiles main/preload/renderer then runs `electron-builder` to produce platform installers in `dist/`.

**Distribution:** Share `.exe` (Windows) or `.dmg` (macOS) from `dist/` directly with testers. No auto-update for PoC.

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** ✅
All technology choices are mutually compatible. The synchronous `better-sqlite3` API is well-suited to the Electron main process model. `ipcMain.handle` (promise-based) handles the async AI evaluation call cleanly. `safeStorage` is main-process-only by design — consistent with the contextBridge isolation pattern. MUI + Zustand + React Testing Library + Vitest form a cohesive renderer stack with no conflicts.

**Pattern Consistency:** ✅
- `snake_case` SQL / `camelCase` TypeScript mapping at the repository layer is consistent with the IPC boundary — one mapping point, no leakage
- `IpcResult<T>` discriminated union aligns with hook error state (`string | null`) — callers always know what to expect
- Handler structure (validate → execute → return) is consistent with `electron-log` format — uniform logging across all handlers

**Structure Alignment:** ✅
The `src/main/handlers/` / `src/main/db/` separation correctly enforces the "no SQL in handlers" pattern. `src/shared/ipc-types.ts` sits outside both process directories, accessible as a pure TypeScript import without crossing the IPC boundary.

### Requirements Coverage Validation

**Functional Requirements:** ✅ All 27 FRs covered

| Domain | Coverage |
|---|---|
| FR1–FR4 Employee Management | `employees.ts` + `employeeHandlers.ts` + `EmployeeList.tsx` + `useEmployees.ts` |
| FR5–FR8 Competency Framework | `framework.ts` + `frameworkHandlers.ts` + `Framework.tsx` + `useFramework.ts` |
| FR9–FR16 Behavior Logging | `behaviorLog.ts` + `behaviorLogHandlers.ts` + `EmployeeDetail.tsx` + `InlineLogRow.tsx` + `useBehaviorLog.ts` |
| FR17–FR23 AI Evaluation | `AIProvider.ts` + `MockAIProvider.ts` + `ClaudeAIProvider.ts` + `aiHandlers.ts` + `GradeResultCard.tsx` + `InsufficientInputCard.tsx` + `useEvaluation.ts` |
| FR24–FR25 App Configuration | `apiKey.ts` + `modelPreference.ts` + `settingsHandlers.ts` + `Settings.tsx` + `useSettings.ts` |
| FR26–FR27 Data Persistence | `database.ts` schema-on-startup at `app.getPath('userData')` |

**Non-Functional Requirements:** ✅ All NFRs covered

| NFR | Coverage |
|---|---|
| Local ops < 1s | Synchronous `better-sqlite3` in main process — no async overhead |
| AI < 15s / 30s timeout | Enforced in `aiHandlers.ts` with Promise.race timeout |
| API key in secure storage | `safeStorage` in `apiKey.ts` only; renderer receives `isConfigured: boolean` only |
| Atomic DB writes | SQLite transactions in `behaviorLog.ts` for multi-table insert (entry + competency rows) |
| Offline startup | AI call isolated to `ai:evaluate` channel; all other features function without network |
| Failed AI = no state corruption | AI errors returned via `IpcResult`; `useEvaluation` hook isolates error to result state only |

### Gap Analysis Results

**Important Gaps — resolved during validation:**

**Gap 1 — `window.electronAPI` TypeScript type declaration**
Without a global type declaration, renderer TypeScript code treats `window.electronAPI` as `any`. Resolved by adding `src/renderer/env.d.ts` to the project structure:

```ts
// src/renderer/env.d.ts
import type { IpcResult } from '../shared/ipc-types'

declare global {
  interface Window {
    electronAPI: {
      invoke<T>(channel: string, payload?: unknown): Promise<IpcResult<T>>
    }
  }
}
```

**Gap 2 — `AIProvider` interface signature**
The integration seam between workstreams was underdefined. Resolved by specifying the concrete interface:

```ts
// src/main/ai/AIProvider.ts
import type { Grade } from '../../shared/ipc-types'

export interface EvaluationInput {
  entries: BehaviorLogEntry[]       // behavior log entries filtered to one competency
  expectedBehaviors: string         // configured expected behavior text for this competency + level
  model: string                     // 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6'
}

export interface EvaluationResult {
  grade: Grade                      // includes 'Insufficient Input' as valid outcome
  rationale: string
}

export interface AIProvider {
  evaluate(input: EvaluationInput): Promise<EvaluationResult>
  // throws on API failure — aiHandlers.ts catches and returns { ok: false, error }
  // 'Insufficient Input' is a valid EvaluationResult, not an error
}
```

**No critical gaps identified.**

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed — 27 FRs across 5 domains, 3 NFR categories
- [x] Scale and complexity assessed — Medium; 6 architectural components
- [x] Technical constraints identified — 8 constraints from PRD and platform
- [x] Cross-cutting concerns mapped — 6 concerns identified and addressed

**Architectural Decisions**
- [x] Critical decisions documented — IPC contract, schema lifecycle, AIProvider interface
- [x] Technology stack fully specified — electron-vite react-ts, MUI, Zustand, better-sqlite3, electron-log, Vitest
- [x] Integration patterns defined — contextBridge IPC, AIProvider seam, repository layer
- [x] Performance considerations addressed — sync SQLite, 30s timeout, offline startup

**Implementation Patterns**
- [x] Naming conventions established — DB, TypeScript, file, IPC channel
- [x] Structure patterns defined — `__tests__/` mirroring, component directories, process separation
- [x] Communication patterns specified — handler structure, hook structure, IPC response format
- [x] Process patterns documented — error handling, loading states, logging format

**Project Structure**
- [x] Complete directory structure defined — every file named and annotated
- [x] Component boundaries established — IPC boundary, AIProvider boundary, data boundary
- [x] Integration points mapped — contextBridge, AIProvider swap point, Zustand store
- [x] Requirements to structure mapping complete — all FRs mapped to specific files

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all requirements covered, all patterns specified, all boundaries defined, both workstream integration seams locked.

**Key Strengths:**
- IPC architecture enforces security boundaries by design — `safeStorage` and API key never reach the renderer
- `AIProvider` interface enables true parallel development — Workstream A and B can proceed independently
- Schema-on-startup with no migration framework is the right call for a PoC — zero overhead, easy to iterate
- Implementation patterns are specific enough to prevent agent conflicts without being over-prescribed

**Areas for Future Enhancement (Post-PoC):**
- Migration framework when real users and live data are involved
- `electron-updater` for auto-update distribution
- E2E test suite if PoC advances to production

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented — no ad-hoc technology substitutions
- Use the implementation patterns consistently — handler structure, hook structure, naming conventions
- Respect the IPC boundary — never import from `electron` in `src/renderer/`
- Refer to this document for all architectural questions before making independent decisions

**First Implementation Steps:**
1. `npm create @quick-start/electron@latest sdd-app -- --template react-ts`
2. Create `src/shared/ipc-types.ts` — lock the IPC contract
3. Create `src/renderer/env.d.ts` — type `window.electronAPI`
4. Implement `src/main/db/database.ts` — schema-on-startup
5. Define `src/main/ai/AIProvider.ts` interface + `MockAIProvider.ts`
