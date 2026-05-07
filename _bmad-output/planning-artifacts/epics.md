---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# SDD - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Employee Competence Evaluation Tool (SDD), decomposing the requirements from the PRD, UX Design Specification, and Architecture Decision Document into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Manager can add a new employee with a name and assigned competency level (A/B/C/D).
FR2: Manager can edit an existing employee's name or assigned level.
FR3: Manager can view a list of all registered employees.
FR4: Manager can remove an employee from the system.
FR5: Manager can view the four fixed competency dimensions (Communication, Client Focus, Proactivity, Teamwork).
FR6: Manager can configure expected observable behaviors for each competency at each level (A/B/C/D).
FR7: Manager can edit existing expected observable behaviors.
FR8: Manager can view all configured expected behaviors organized by competency and level.
FR9: Manager can create a behavior log entry with a free-text description of an observed situation.
FR10: Manager can tag a behavior log entry to one or more competencies.
FR11: Manager can associate a behavior log entry with a specific employee.
FR12: Manager can set the date of a behavior log entry, including dates in the past (retroactive logging).
FR13: Manager can view all behavior log entries for a given employee.
FR14: Manager can filter behavior log entries by competency for a given employee.
FR15: Manager can edit an existing behavior log entry.
FR16: Manager can delete a behavior log entry.
FR17: Manager can trigger an AI assessment for a specific employee and competency.
FR18: System displays an AI-generated grade for a triggered assessment. Valid grades: Does Not Meet Expectations, Meets Expectations, Exceeds Expectations, Insufficient Input.
FR19: System displays an AI-generated written rationale alongside the grade, explicitly grounded in the comparison between the employee's logged behaviors and the expected behaviors for their level.
FR20: System returns Insufficient Input with an explanation when logged evidence is too sparse to support a reliable grade.
FR21: System confines AI assessment to logged behavioral evidence only — the AI does not infer, extrapolate, or reference information not present in the provided input.
FR22: Manager can re-trigger an AI assessment for the same employee and competency after adding new behavior log entries.
FR23: System displays a clear, actionable error message when an AI assessment fails due to connectivity or API issues.
FR24: Manager can configure the Claude API key used for AI assessments.
FR25: System stores the API key securely on the local machine.
FR26: System persists all data locally across application sessions without requiring internet connectivity.
FR27: System stores data in a location that survives application reinstalls.

### NonFunctional Requirements

NFR1: All local operations (logging, browsing, framework editing, employee management) complete within 1 second under normal conditions.
NFR2: AI assessment calls complete within 15 seconds under normal network conditions. The UI must display a loading state during the call.
NFR3: AI calls exceeding 30 seconds time out gracefully with an actionable error message.
NFR4: The Claude API key is stored using OS-level secure storage (Windows Credential Manager via Electron's safeStorage API) — never in plaintext in config files, logs, or environment variables accessible outside the app.
NFR5: The API key does not appear in application logs, error messages, or any UI element beyond the configuration screen.
NFR6: Local employee and behavioral data is protected by OS-level user account access control. No additional encryption required for the PoC's single-user, single-machine deployment.
NFR7: All data writes are atomic — a crash mid-operation must not leave the database in a corrupt or partial state. SQLite transactions enforce this by default.
NFR8: Failed AI calls do not corrupt application state. A failed assessment leaves the behavior log intact; the manager can retry without data loss.
NFR9: The application starts successfully when the Claude API is unreachable — all non-evaluation features remain available offline.

### Additional Requirements

- AR1: Scaffold with electron-vite react-ts starter: `npm create @quick-start/electron@latest sdd-app -- --template react-ts`. This must be the very first implementation story per Architecture document.
- AR2: Define `src/shared/ipc-types.ts` with the `IpcResult<T>` discriminated union and all channel payload/response types — locks the IPC contract for both workstreams.
- AR3: Implement SQLite schema-on-startup in `src/main/db/database.ts` using `CREATE TABLE IF NOT EXISTS` for all six tables (employees, competencies, expected_behaviors, behavior_log_entries, behavior_log_entry_competencies, settings). Seed the four competency rows on startup using `INSERT OR IGNORE`.
- AR4: Define the `AIProvider` interface (`src/main/ai/AIProvider.ts`) with concrete `EvaluationInput` / `EvaluationResult` types and implement `MockAIProvider.ts` with fixed-response returns covering all four grade variants — unblocks end-to-end testing before real Claude integration.
- AR5: Wire the `contextBridge` preload (`src/preload/index.ts`) exposing `window.electronAPI` with all IPC channels — the sole legal crossing point between renderer and main process.
- AR6: All IPC handlers follow the structured pattern: log entry → validate inputs → delegate to repository function → return `IpcResult<T>`. SQL never written inside handler functions.
- AR7: Implement `electron-log` in the main process writing to `app.getPath('logs')`. API key value must never appear in log statements.
- AR8: Implement `ClaudeAIProvider.ts` using `@anthropic-ai/sdk`. The `ai:evaluate` handler enforces a 30-second timeout via `Promise.race`; returns `{ ok: false, error: '...' }` on expiry.
- AR9: Add `src/renderer/env.d.ts` declaring `window.electronAPI` global type for TypeScript type safety across the IPC boundary.
- AR10: Use Vitest for renderer unit tests (+ React Testing Library) and IPC integration tests against a temp SQLite database. Test files in `__tests__/` mirroring the `src/` directory structure.
- AR11: Package with `electron-builder` producing `.exe` (NSIS) for Windows and `.dmg` for macOS. Manual distribution for PoC — no auto-update.

### UX Design Requirements

UX-DR1: Implement `CompetencyChip` custom component with three variants: `read-only` (small, outlined, on log rows), `toggle` (dimmed when inactive, full opacity when selected, used in inline editing), and `filter` (medium, full background when active, used in evaluation tab). Must support `aria-pressed` in toggle mode and keyboard focusability.
UX-DR2: Implement `InlineLogRow` custom component — editable table row for new behavior log entries. Fields left-to-right: date picker (pre-filled to today, editable for retroactive) | description textarea (autofocused on mount, Enter = line break, Tab moves focus to competency chips) | 4 CompetencyChip toggles | ✓ save button | ✕ cancel button. Save active only when description + ≥1 chip are filled. Escape cancels.
UX-DR3: Implement `GradeResultCard` custom component with three states: loading (CircularProgress spinner, grade badge replaced, Run Evaluation button disabled), result (grade badge + rationale text + Re-run button), error (plain-English error message + Retry button). Grade badge uses the 4-value Grade enum with corresponding outcome colors.
UX-DR4: Implement `InsufficientInputCard` custom component with `role="alert"`, forward-looking copy framing ("Add more observations for [Competency] to unlock a grade"), and embedded "+ Log Behavior" CTA button that navigates to the Behavior Log tab with a new row ready.
UX-DR5: Implement fixed left sidebar (~200px) displaying: app name "Employee Evaluation Tool", manager display name (from settings), three nav items (Employees | Framework | Settings) with active state (left border accent + background tint). Sidebar is always visible, never collapses.
UX-DR6: Implement `AppShell` layout wrapper with `<nav>` semantic sidebar and `<main>` semantic content area. Minimum window size 1024×600px. Content area max-width 960px, centered on screens wider than 1160px.
UX-DR7: Define custom MUI theme in `src/renderer/theme/theme.ts`. Base palette: background `#F5F7FA`, surface `#FFFFFF`, primary accent `#3B5BDB`, text primary `#1A1A2E`, text secondary `#6B7280`, border `#E5E7EB`. Competency chip colors: Communication `#4A90D9`, Client Focus `#26A69A`, Proactivity `#FB8C00`, Teamwork `#7C3AED`. Grade outcome colors: Exceeds Expectations `#2E7D32`, Meets Expectations `#1565C0`, Does Not Meet Expectations `#C62828`, Insufficient Input `#E65100`.
UX-DR8: Implement button hierarchy consistently across all screens — Primary (filled blue, one per screen), Secondary (outlined blue, alternative actions), Danger (outlined red, destructive only). Primary button rendered at 40% opacity when required fields incomplete.
UX-DR9: Implement evaluation tab with competency filter chips (one per competency, no "All" chip), instructional empty state when no competency selected ("Select a competency above to begin"), filtered log table showing only entries tagged to the selected competency, and "Run Evaluation" button.
UX-DR10: Implement tab persistence via Zustand store — switching between Behavior Log and Evaluate tabs retains selected employee context and selected competency; competency selection resets when a different employee is selected.
UX-DR11: Implement empty states for all four conditions: (1) no employees — "No employees yet — add your first one" + Add Employee CTA; (2) no log entries for employee — "No behaviors logged for [Name] yet" + Log Behavior CTA; (3) evaluate tab, no competency selected — instructional text, no CTA; (4) evaluate tab, competency selected but no entries — "No entries tagged to [Competency] for [Name]" + Log Behavior CTA.
UX-DR12: Implement hover-reveal row actions for behavior log entries: edit (pencil icon) and delete (trash icon) appear on row hover. Both buttons require `aria-label`. Minimum 40×40px click targets.
UX-DR13: Implement framework view as a 4×4 grid (4 competencies × 4 levels A/B/C/D). Each cell shows current expected behavior text with an Edit button. Clicking Edit activates inline row editing (FrameworkLevelRow pattern — textarea + ✓/✕ buttons). Saved text updates in place.
UX-DR14: Implement Settings view with four independently-saveable fields: manager display name (own Save button), Claude API key (masked field, "API key stored securely in OS credential store" trust note, own Save button), Claude model selector (Haiku 4.5 default / Sonnet 4.6 option), and danger zone with "Clear all data" outlined red button requiring a confirmation dialog before executing.
UX-DR15: Implement accessibility requirements: all icon-only buttons have `aria-label`; table column headers use `<th scope="col">`; AI loading state uses `aria-live="polite"`; `InsufficientInputCard` uses `role="alert"`; `CompetencyChip` toggle variant uses `aria-pressed`; MUI focus indicators retained (not overridden in theme).
UX-DR16: Implement keyboard navigation: Tab order follows visual reading order across all screens; sidebar nav items are keyboard-focusable; inline row ✓/✕ buttons reachable by Tab; Escape cancels inline editing row.
UX-DR17: Implement feedback patterns: no success toasts for log entry saves or framework saves (entry appearing in table IS the confirmation); `Snackbar` + `Alert` for AI network errors with Retry action; `CircularProgress` with "Running evaluation…" label during AI call; confirmation dialog before Clear all data executes.
UX-DR18: Implement breadcrumb navigation on employee sub-pages: "Employees › [Name]" with "Employees" as a clickable back link returning to the employee list view.

### FR Coverage Map

FR1: Epic 2 — Add employee with name and level
FR2: Epic 2 — Edit employee name or level
FR3: Epic 2 — View employee list
FR4: Epic 2 — Remove employee
FR5: Epic 3 — View four fixed competency dimensions
FR6: Epic 3 — Configure expected behaviors per competency/level
FR7: Epic 3 — Edit existing expected behaviors
FR8: Epic 3 — View all expected behaviors organized by competency and level
FR9: Epic 4 — Create behavior log entry (free-text description)
FR10: Epic 4 — Tag log entry to one or more competencies
FR11: Epic 4 — Associate log entry to a specific employee
FR12: Epic 4 — Set entry date including retroactive dates
FR13: Epic 4 — View all log entries for a given employee
FR14: Epic 4 — Filter log entries by competency for a given employee
FR15: Epic 4 — Edit an existing behavior log entry
FR16: Epic 4 — Delete a behavior log entry
FR17: Epic 6 — Trigger AI assessment for employee + competency
FR18: Epic 6 — Display AI-generated grade (4-value scale)
FR19: Epic 6 — Display AI-generated rationale grounded in logged evidence vs. expected behaviors
FR20: Epic 6 — Return Insufficient Input with explanation when evidence is too sparse
FR21: Epic 6 — Confine AI to logged evidence only (no inference or extrapolation)
FR22: Epic 6 — Re-trigger assessment after adding new log entries
FR23: Epic 6 — Display clear, actionable error when AI call fails
FR24: Epic 5 — Configure Claude API key
FR25: Epic 5 — Store API key securely on local machine
FR26: Epic 1 — Persist all data locally across sessions without internet
FR27: Epic 1 — Store data in location that survives application reinstalls

## Epic List

### Epic 1: Foundation — Scaffolded, Launchable App Shell
The Electron application scaffolds, starts, and displays a working navigation shell (sidebar + three empty view placeholders). SQLite initializes on startup with the full schema and seeded competencies, the IPC architecture is in place, the MUI theme is applied, and the AIProvider interface + mock are locked in. The app is fully runnable.
**FRs covered:** FR26, FR27
**ARs covered:** AR1, AR2, AR3, AR4, AR5, AR7, AR9
**UX-DRs covered:** UX-DR5, UX-DR6, UX-DR7
**NFRs addressed:** NFR1 (synchronous SQLite), NFR6 (app.getPath('userData'))

### Epic 2: Employee Management
Manager can add employees with name and level (A/B/C/D), view the full list, edit entries, and remove employees. The employee list is the entry point for all logging and evaluation work.
**FRs covered:** FR1, FR2, FR3, FR4
**ARs covered:** AR6 (establishes handler pattern for all subsequent epics)
**UX-DRs covered:** UX-DR8, UX-DR11 (employee empty state), UX-DR12, UX-DR18

### Epic 3: Competency Framework Configuration
Manager can configure expected observable behaviors for each of the four competencies at each level (A/B/C/D). The 4×4 framework grid is fully editable and persisted — this is the comparison baseline the AI will use at evaluation time.
**FRs covered:** FR5, FR6, FR7, FR8
**UX-DRs covered:** UX-DR13

### Epic 4: Behavior Logging
Manager can log observed behaviors (free-text, multi-competency tagged, dated including retroactive), view and filter the behavior log per employee per competency, and edit or delete entries. The evidence base for AI evaluation is fully operational.
**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16
**NFRs addressed:** NFR7 (atomic writes — multi-table insert uses SQLite transaction)
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR10, UX-DR11 (log empty states), UX-DR12 (log row hover actions), UX-DR16, UX-DR17

### Epic 5: Application Settings & API Configuration
Manager can set their display name, configure the Claude API key (OS secure storage, never in logs or UI), and select the Claude model. The app is ready for real AI evaluation with all security requirements satisfied.
**FRs covered:** FR24, FR25
**NFRs covered:** NFR4, NFR5
**UX-DRs covered:** UX-DR14

### Epic 6: AI Competency Evaluation & Distribution
Manager can trigger AI assessments per competency per employee, receive a trusted grade + rationale grounded in logged evidence, handle Insufficient Input as forward-looking guidance, and retry on network failures. The complete PoC is packaged as a Windows installer ready for testing managers.
**FRs covered:** FR17, FR18, FR19, FR20, FR21, FR22, FR23
**NFRs covered:** NFR2, NFR3, NFR8, NFR9
**ARs covered:** AR8, AR10, AR11
**UX-DRs covered:** UX-DR3, UX-DR4, UX-DR9, UX-DR11 (evaluate empty states), UX-DR15, UX-DR17

---

## Epic 1: Foundation — Scaffolded, Launchable App Shell

The Electron application scaffolds, starts, and displays a working navigation shell with sidebar navigation and MUI theme applied. SQLite initializes on startup with the full schema and seeded competencies, the IPC architecture is in place, and the AIProvider interface + mock are locked in. Every subsequent epic builds on this foundation.

### Story 1.1: Scaffold and Configure Project

As a developer,
I want the Electron + React + TypeScript project scaffolded with all required dependencies installed,
So that the development environment is ready and the Electron window opens in development mode.

**Acceptance Criteria:**

**Given** the scaffold command `npm create @quick-start/electron@latest sdd-app -- --template react-ts` is run
**When** `npm install` completes and `npm run dev` is executed
**Then** the Electron window opens with no console errors and the default template UI is visible

**Given** the project is scaffolded
**When** package.json dependencies are reviewed
**Then** `@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/x-date-pickers`, `better-sqlite3`, `@types/better-sqlite3`, `@anthropic-ai/sdk`, `zustand`, and `electron-log` are all present

**Given** the TypeScript configuration
**When** the TypeScript compiler runs
**Then** no type errors are reported across `src/main/`, `src/preload/`, and `src/renderer/`

**Given** the project structure
**When** the repository is inspected
**Then** `src/main/`, `src/preload/`, `src/renderer/`, and `src/shared/` directories exist with the separation enforced by electron-vite

---

### Story 1.2: Define IPC Contract and Shared Types

As a developer,
I want a single shared file defining all IPC types and the discriminated union response format,
So that both the main process and renderer have type-safe, consistent IPC channel definitions with no duplication.

**Acceptance Criteria:**

**Given** `src/shared/ipc-types.ts` exists and is imported by main and renderer
**When** the type is used
**Then** `IpcResult<T>` resolves to `{ ok: true; data: T } | { ok: false; error: string }` — callers must check `ok` before accessing `data`

**Given** `ipc-types.ts` defines the `Grade` type
**When** a grade value is assigned
**Then** only the four valid strings are accepted: `'Does Not Meet Expectations' | 'Meets Expectations' | 'Exceeds Expectations' | 'Insufficient Input'`

**Given** `ipc-types.ts` defines the `Competency` type and all channel payload/response types
**When** any IPC handler or hook references a channel payload
**Then** the type is imported from `src/shared/ipc-types.ts` — no inline type definitions duplicated across files

**Given** `src/renderer/env.d.ts` declares the `Window` interface extension
**When** the renderer calls `window.electronAPI.invoke(channel, payload)`
**Then** TypeScript resolves the return type as `Promise<IpcResult<unknown>>` with no `any` warnings

---

### Story 1.3: Initialize SQLite Database with Schema-on-Startup

As a manager,
I want the application to initialize its local database automatically when it launches,
So that my data persists between sessions without any setup or configuration on my part.

**Acceptance Criteria:**

**Given** the app launches for the first time
**When** `initializeSchema()` runs in `src/main/db/database.ts`
**Then** `settings` and `competencies` tables are created using `CREATE TABLE IF NOT EXISTS` statements — no errors if tables already exist

**Given** the first launch
**When** `initializeSchema()` seeds the competency rows
**Then** exactly four rows exist in `competencies`: `Communication`, `Client Focus`, `Proactivity`, `Teamwork` — inserted via `INSERT OR IGNORE`

**Given** a subsequent app launch after the first run
**When** `initializeSchema()` runs again
**Then** no errors are thrown and no duplicate competency rows are created

**Given** the SQLite file location
**When** the database is initialized
**Then** the file is created at `app.getPath('userData')/sdd.db` — surviving app reinstalls (FR26, FR27)

**Given** `electron-log` is configured in the main process
**When** the app starts
**Then** a log entry confirms database initialization success and the log file is written to `app.getPath('logs')`

**Given** a crash during a write operation
**When** the app restarts
**Then** SQLite's default transaction guarantees ensure the database is not left in a corrupt or partial state (NFR7)

---

### Story 1.4: Define AIProvider Interface and Implement MockAIProvider

As a developer,
I want the AIProvider interface defined and a mock implementation wired in,
So that the full application can be built and tested end-to-end without depending on the real Claude API.

**Acceptance Criteria:**

**Given** `src/main/ai/AIProvider.ts`
**When** the interface is reviewed
**Then** it defines `evaluate(input: EvaluationInput): Promise<EvaluationResult>` where `EvaluationInput` has `entries`, `expectedBehaviors`, and `model` fields, and `EvaluationResult` has `grade: Grade` and `rationale: string`

**Given** `src/main/ai/MockAIProvider.ts`
**When** `evaluate()` is called with any input
**Then** it returns a valid `EvaluationResult` with `grade: 'Meets Expectations'` and a non-empty rationale string by default — no network calls made

**Given** `MockAIProvider.ts` in a test scenario
**When** configured to simulate sparse evidence
**Then** it returns `{ grade: 'Insufficient Input', rationale: '...' }` — covering all four Grade variants

**Given** `src/main/index.ts`
**When** the application starts
**Then** `MockAIProvider` is the active `AIProvider` instance — swappable to `ClaudeAIProvider` by changing a single import with no other file changes

---

### Story 1.5: Wire contextBridge Preload and IPC Handler Scaffold

As a developer,
I want the contextBridge preload wired and all IPC handler files scaffolded,
So that renderer components can call main process functions through `window.electronAPI` and the handler structure is ready for feature implementation.

**Acceptance Criteria:**

**Given** `src/preload/index.ts` exposes `contextBridge.exposeInMainWorld('electronAPI', { invoke })`
**When** the renderer calls `window.electronAPI.invoke('competency:list')`
**Then** the main process `ipcMain.handle('competency:list', ...)` handler responds with `{ ok: true, data: [...] }` containing the four seeded competencies

**Given** the `BrowserWindow` configuration in `src/main/index.ts`
**When** the window is created
**Then** the `webPreferences.preload` option points to the compiled preload script and `contextIsolation: true` is set

**Given** the handler scaffold in `src/main/handlers/`
**When** the directory is inspected
**Then** `employeeHandlers.ts`, `behaviorLogHandlers.ts`, `frameworkHandlers.ts`, `aiHandlers.ts`, and `settingsHandlers.ts` exist and are registered in `src/main/index.ts`

**Given** the renderer codebase
**When** all `src/renderer/` files are reviewed
**Then** no file imports directly from `electron` — all main process access goes through `window.electronAPI`

---

### Story 1.6: MUI Theme and App Shell

As a manager,
I want to open the application and see a clean navigation shell with sections for Employees, Framework, and Settings,
So that I can orient myself and navigate to any area of the tool immediately.

**Acceptance Criteria:**

**Given** `src/renderer/theme/theme.ts` is applied via MUI `ThemeProvider`
**When** any MUI component renders
**Then** the base palette is active: background `#F5F7FA`, primary accent `#3B5BDB`, text primary `#1A1A2E`, text secondary `#6B7280`, border `#E5E7EB`. Competency chip colors and grade outcome colors are defined as theme tokens accessible via `theme.palette`.

**Given** the app renders
**When** the layout is inspected
**Then** `AppShell.tsx` renders a fixed left sidebar (~200px wide) alongside a `<main>` content area with a max-width of 960px — using semantic HTML (`<nav>` for sidebar, `<main>` for content)

**Given** the sidebar renders
**When** the user views it
**Then** it displays the app name "Employee Evaluation Tool", a manager name placeholder ("Manager"), and three nav items: Employees, Framework, Settings

**Given** the user clicks a nav item
**When** the selection changes
**Then** the corresponding placeholder view renders in the content area and the active nav item shows a left border accent and background tint

**Given** the Zustand store `src/renderer/store/appStore.ts`
**When** the store is initialized
**Then** `currentView` is typed as `'employees' | 'framework' | 'settings'` and defaults to `'employees'` on app start

---

## Epic 2: Employee Management

Manager can add employees with name and level (A/B/C/D), view the full list, edit entries, and remove employees. The employee list view is the entry point for all logging and evaluation work.

### Story 2.1: Employee List View

As a manager,
I want to see a list of all my registered employees,
So that I can get an overview of my team and navigate to any employee's detail.

**Acceptance Criteria:**

**Given** `src/main/db/database.ts` schema-on-startup
**When** `initializeSchema()` runs
**Then** the `employees` table is created: `id`, `name`, `level CHECK(level IN ('A','B','C','D'))`, `created_at`

**Given** `src/main/db/employees.ts` repository
**When** `listEmployees()` is called
**Then** it returns all employee rows as camelCase TypeScript objects — `snake_case` DB columns mapped before returning

**Given** `src/main/handlers/employeeHandlers.ts` registers `employee:list`
**When** the channel is invoked from the renderer
**Then** it returns `{ ok: true, data: Employee[] }` or `{ ok: false, error: string }` — never throws

**Given** `src/renderer/hooks/useEmployees.ts`
**When** `load()` is called
**Then** it invokes `employee:list` via `window.electronAPI`, manages `isLoading` and `error` state, and returns typed `employees`

**Given** `src/renderer/views/EmployeeList.tsx` renders with no employees
**When** the view loads
**Then** the empty state displays: "No employees yet — add your first one to get started" with an "+ Add Employee" button (UX-DR11)

**Given** employees exist in the database
**When** `EmployeeList` renders
**Then** each employee appears as a table row showing name and level — readable at a glance

---

### Story 2.2: Add Employee

As a manager,
I want to add a new employee with their name and competency level,
So that I can register team members and begin logging their behaviors.

**Acceptance Criteria:**

**Given** `employees.ts` repository
**When** `createEmployee(name, level)` is called
**Then** it inserts a new row and returns the created `Employee` object with the generated `id`

**Given** `employeeHandlers.ts` registers `employee:create`
**When** the handler is invoked with a valid payload `{ name: string, level: 'A'|'B'|'C'|'D' }`
**Then** it validates that `name` is non-empty and `level` is one of the four valid values, then delegates to the repository and returns `{ ok: true, data: Employee }`

**Given** the handler is invoked with an empty name
**When** validation runs
**Then** it returns `{ ok: false, error: 'Employee name is required.' }` without writing to the database

**Given** the "+ Add Employee" button in `EmployeeList`
**When** clicked
**Then** an inline form or modal appears with a name text field and a level selector (A/B/C/D) — the primary "Save" button is disabled until both fields are filled

**Given** the form is submitted with valid data
**When** the save completes
**Then** the new employee appears immediately in the list — no page reload required

---

### Story 2.3: Edit Employee

As a manager,
I want to edit an existing employee's name or assigned level,
So that I can correct mistakes or reflect a promotion without losing their logged history.

**Acceptance Criteria:**

**Given** `employees.ts` repository
**When** `updateEmployee(id, name, level)` is called
**Then** it updates the row with the given `id` and returns the updated `Employee` object

**Given** `employeeHandlers.ts` registers `employee:update`
**When** the handler is invoked
**Then** it validates the payload (non-empty name, valid level), delegates to the repository, and returns `{ ok: true, data: Employee }` or `{ ok: false, error: string }`

**Given** each employee row in `EmployeeList`
**When** the user hovers over a row
**Then** an edit icon button appears with `aria-label="Edit employee"` (UX-DR12)

**Given** the edit icon is clicked
**When** the row enters edit mode
**Then** the name and level fields become editable in place — pre-filled with current values — with Save (✓) and Cancel (✕) actions

**Given** the user saves valid edits
**When** the update completes
**Then** the row exits edit mode and displays the updated values immediately

---

### Story 2.4: Remove Employee

As a manager,
I want to remove an employee from the system,
So that I can keep my employee list accurate as my team changes.

**Acceptance Criteria:**

**Given** `employees.ts` repository
**When** `deleteEmployee(id)` is called
**Then** the employee row is deleted — `ON DELETE CASCADE` removes all associated `behavior_log_entries` and their competency junction rows automatically

**Given** `employeeHandlers.ts` registers `employee:delete`
**When** the handler is invoked with a valid `id`
**Then** it delegates to the repository and returns `{ ok: true, data: null }` or `{ ok: false, error: string }`

**Given** each employee row in `EmployeeList`
**When** the user hovers over a row
**Then** a delete icon button appears with `aria-label="Delete employee"` alongside the edit icon (UX-DR12)

**Given** the delete icon is clicked
**When** the confirmation dialog appears
**Then** it warns that all associated behavior log entries will also be deleted — requires explicit confirmation before proceeding

**Given** the user confirms deletion
**When** the delete completes
**Then** the employee row is removed from the list immediately — if no employees remain, the empty state is shown

---

## Epic 3: Competency Framework Configuration

Manager can configure expected observable behaviors for each of the four competencies at each level (A/B/C/D). The 4×4 framework grid is fully editable and persisted — this is the comparison baseline the AI will use at evaluation time.

### Story 3.1: Framework View with Expected Behavior Display

As a manager,
I want to see the competency framework organized by competency and level,
So that I can understand what behaviors are currently configured as the standard for each combination.

**Acceptance Criteria:**

**Given** `src/main/db/database.ts` schema-on-startup
**When** `initializeSchema()` runs
**Then** the `expected_behaviors` table is created: `id`, `competency_id`, `level`, `description`, with a `UNIQUE(competency_id, level)` constraint

**Given** `src/main/db/framework.ts` repository
**When** `listCompetencies()` is called
**Then** it returns all four seeded competency rows

**Given** `framework.ts` repository
**When** `getExpectedBehavior(competencyId, level)` is called
**Then** it returns the `description` string for that combination, or `null` if not yet configured

**Given** `frameworkHandlers.ts` registers `competency:list` and `expected-behavior:get`
**When** these channels are invoked
**Then** they return `IpcResult<T>` responses following the standard handler pattern

**Given** `src/renderer/views/Framework.tsx` renders
**When** the view loads
**Then** a 4×4 grid displays — rows are the four competencies, columns are levels A, B, C, D. Each cell shows the current expected behavior description text, or "(not configured)" if empty.

---

### Story 3.2: Edit Expected Behaviors Inline

As a manager,
I want to type and save expected observable behaviors for each competency at each level,
So that the system has the comparison baseline it needs to generate meaningful AI grades.

**Acceptance Criteria:**

**Given** `framework.ts` repository
**When** `setExpectedBehavior(competencyId, level, description)` is called
**Then** it upserts the row (insert or replace) and returns the saved description — the `UNIQUE(competency_id, level)` constraint ensures no duplicates

**Given** `frameworkHandlers.ts` registers `expected-behavior:set`
**When** the handler is invoked with a valid payload
**Then** it validates that `description` is non-empty, delegates to the repository, and returns `{ ok: true, data: string }` or `{ ok: false, error: string }`

**Given** each cell in the framework grid
**When** the user clicks the Edit button
**Then** the cell enters inline edit mode: the description text is replaced by a textarea pre-filled with the current value, plus ✓ save and ✕ cancel buttons

**Given** the user types new text and clicks ✓
**When** the save completes
**Then** the cell exits edit mode and displays the updated description immediately — no toast, the updated text in place is the confirmation (UX-DR17)

**Given** the user clicks ✕ or presses Escape
**When** cancel is triggered
**Then** the cell exits edit mode and the original description is restored — no changes saved

**Given** the user attempts to save an empty textarea
**When** the save button is clicked
**Then** the save button remains disabled — the textarea must contain at least one non-whitespace character (UX-DR8)

---

### Story 3.3: UX Polish — Framework Layout and App Shell Visual Alignment

As a manager,
I want the application to visually match the approved UX mockups,
so that the interface looks polished and professional, and the framework view is intuitive to navigate.

**Acceptance Criteria:**

**Given** the Framework view renders
**When** the user navigates to Framework
**Then** each competency is displayed as a standalone card section (not a table grid) with: a `#F9FAFB` header showing a colored outlined chip + "X of 4 levels configured" count; and a body listing 4 level rows (level badge + description text + Edit button)

**Given** the Framework page renders
**When** the heading is visible
**Then** a subtitle paragraph appears below the title: "Define the expected observable behaviors per competency and level. These are the standards used by the AI to assess employees."

**Given** a level row is in edit mode
**When** the user edits a behavior
**Then** the row background becomes `#F0F4FF`, the description is replaced by a textarea, the action button changes to a text "Save" button (blue outlined, 40% opacity when draft empty), and a ✕ cancel IconButton is present; Escape cancels; no success toast on save

**Given** the sidebar renders
**When** any screen is active
**Then** the app name "Employee Evaluation Tool" is in primary blue; a border-bottom separates the logo area from the nav; each nav item includes an icon (Employees → People, Framework → ListAlt, Settings → Settings); and a footer "v1.0.0 · PoC" with border-top is visible at the bottom

**Given** the Employee List view renders
**When** employees exist or the list is empty
**Then** a page header is always visible with "Employees" title (20px/600) on the left and "+ Add Employee" button on the right; employee level is rendered as a 28×28px styled badge (#EEF2FF background, #3B5BDB text, 6px border-radius)

---

## Epic 4: Behavior Logging

Manager can log observed behaviors (free-text, multi-competency tagged, dated including retroactive), view and filter the behavior log per employee per competency, and edit or delete entries. The evidence base for AI evaluation is fully operational.

### Story 4.1: Behavior Log List View

As a manager,
I want to see all logged behaviors for an employee in a table,
So that I can review the full evidence base I've accumulated throughout the year.

**Acceptance Criteria:**

**Given** `src/main/db/database.ts` schema-on-startup
**When** `initializeSchema()` runs
**Then** `behavior_log_entries` (id, employee_id, description, entry_date, created_at) and `behavior_log_entry_competencies` (entry_id, competency_id — composite PK) tables are created with `ON DELETE CASCADE` foreign keys

**Given** `src/main/db/behaviorLog.ts` repository
**When** `listEntries(employeeId, competencyId?)` is called
**Then** it returns all entries for the employee (optionally filtered by competency), each with its associated competency list, ordered by `entry_date DESC`

**Given** `behaviorLogHandlers.ts` registers `behavior-log:list`
**When** invoked with `{ employeeId, competencyId? }`
**Then** it returns `{ ok: true, data: BehaviorLogEntry[] }` following the standard handler pattern

**Given** `src/renderer/hooks/useBehaviorLog.ts`
**When** `load(employeeId)` is called
**Then** it invokes `behavior-log:list`, manages `isLoading` and `error` state, and returns typed entries

**Given** `src/renderer/views/EmployeeDetail.tsx` renders after selecting an employee
**When** the Behavior Log tab is active
**Then** a breadcrumb "Employees › [Name]" appears with "Employees" as a clickable back link (UX-DR18)
**And** a table lists all entries with columns: date, description excerpt, competency chips

**Given** `CompetencyChip.tsx` renders in read-only mode on a log row
**When** the chip is displayed
**Then** it shows the competency color and label — outlined style, no click interaction in read-only mode (UX-DR1)

**Given** no entries exist for the employee
**When** the Behavior Log tab renders
**Then** the empty state displays: "No behaviors logged for [Name] yet" with a "+ Log Behavior" button (UX-DR11)

---

### Story 4.2: Inline Behavior Log Entry Creation

As a manager,
I want to log a new behavioral observation directly in the employee's log view,
So that I can capture what I just witnessed in under 30 seconds without leaving context.

**Acceptance Criteria:**

**Given** `behaviorLog.ts` repository
**When** `createEntry(employeeId, description, competencyIds, entryDate)` is called
**Then** it inserts the entry row and all competency junction rows in a single SQLite transaction — either all succeed or all fail (NFR7)

**Given** `behaviorLogHandlers.ts` registers `behavior-log:create`
**When** invoked with a valid payload
**Then** it validates non-empty description and at least one competency ID, delegates to the repository, and returns `{ ok: true, data: BehaviorLogEntry }`

**Given** the "+ Log Behavior" button above the table
**When** clicked
**Then** `InlineLogRow.tsx` appears as the top row in the table — description textarea is autofocused immediately (UX-DR2)

**Given** `InlineLogRow` is visible
**When** the fields are reviewed
**Then** the date picker is pre-filled to today's date (editable for retroactive entries), four `CompetencyChip` toggles are present (one per competency), and ✓ save and ✕ cancel buttons are on the right

**Given** the description field is empty or no chip is selected
**When** the save button is inspected
**Then** it is disabled at 40% opacity — save only activates when description is non-empty AND at least one chip is toggled on (UX-DR8)

**Given** the user fills description and selects chips then clicks ✓
**When** the save completes
**Then** the new entry appears immediately as the top read-only row in the table — no success toast (UX-DR17)

**Given** the user presses Escape or clicks ✕
**When** cancel is triggered
**Then** the inline row disappears and no entry is created

**Given** the user presses Enter in the description textarea
**When** Enter is pressed
**Then** a line break is inserted — Enter does not submit the form (UX-DR2)

---

### Story 4.3: Filter Log Entries by Competency

As a manager,
I want to filter the behavior log to show only entries tagged to a specific competency,
So that I can review concentrated evidence before triggering an AI evaluation.

**Acceptance Criteria:**

**Given** `CompetencyChip.tsx` renders in filter mode above the log table
**When** the chip is displayed
**Then** it shows full background when active, outlined when inactive — toggling one chip filters the table to that competency (UX-DR1 filter variant)

**Given** four filter chips render above the behavior log table
**When** no chip is active (default state)
**Then** all entries for the employee are shown

**Given** the user clicks a competency chip
**When** the filter is active
**Then** only entries tagged to that competency appear in the table — entries tagged to multiple competencies appear if they include the filtered competency

**Given** the user clicks an active chip
**When** it is toggled off
**Then** the filter clears and all entries are shown again

**Given** the filter is active and no entries match
**When** the table renders
**Then** the empty state for that filter shows: "No entries tagged to [Competency] for [Name]" with a "+ Log Behavior" button

---

### Story 4.4: Edit and Delete Behavior Log Entries

As a manager,
I want to edit or delete existing behavior log entries,
So that I can correct mistakes or remove entries that are no longer relevant.

**Acceptance Criteria:**

**Given** `behaviorLog.ts` repository
**When** `updateEntry(id, description, competencyIds, entryDate)` is called
**Then** it updates the entry row and replaces all competency junction rows in a single transaction — delete existing junctions, insert new ones

**Given** `behaviorLog.ts` repository
**When** `deleteEntry(id)` is called
**Then** it deletes the entry row — `ON DELETE CASCADE` removes junction rows automatically

**Given** `behaviorLogHandlers.ts` registers `behavior-log:update` and `behavior-log:delete`
**When** these channels are invoked
**Then** they follow the standard handler pattern returning `IpcResult<T>`

**Given** each log entry row in the table
**When** the user hovers over the row
**Then** an edit icon (`aria-label="Edit log entry"`) and delete icon (`aria-label="Delete log entry"`) appear on the right — minimum 40×40px click targets (UX-DR12, UX-DR15)

**Given** the edit icon is clicked
**When** the row enters edit mode
**Then** it becomes an `InlineLogRow` in editing state pre-filled with existing description, competency selections, and entry date

**Given** the user saves valid edits
**When** the update completes
**Then** the row exits edit mode and displays updated values immediately

**Given** the delete icon is clicked
**When** the action is triggered
**Then** the entry is removed from the table immediately — no confirmation dialog required for log entry deletion (low blast radius; FR15 data is recoverable by re-logging)

---

## Epic 5: Application Settings & API Configuration

Manager can set their display name, configure the Claude API key (OS secure storage, never in logs or UI), and select the Claude model. The application is ready for real AI evaluation with all security requirements satisfied.

### Story 5.1: Settings View with Manager Display Name

As a manager,
I want to set my display name in the application,
So that the app feels personalized and I can confirm the settings screen is working before configuring the API key.

**Acceptance Criteria:**

**Given** `src/main/settings/modelPreference.ts` uses the `settings` table
**When** `getManagerName()` or `setManagerName(name)` is called
**Then** it reads/writes the `manager_name` key in the `settings` table

**Given** `settingsHandlers.ts` registers `settings:get-manager-name` and `settings:set-manager-name`
**When** these channels are invoked
**Then** they return `IpcResult<string>` following the standard handler pattern

**Given** `src/renderer/hooks/useSettings.ts`
**When** `load()` is called
**Then** it fetches the manager name, model preference, and API key configured status and exposes them with loading and error state

**Given** `src/renderer/views/Settings.tsx` renders
**When** the view loads
**Then** a manager display name text field is shown with its own Save button — pre-filled with the current value if one exists

**Given** the user updates the name and clicks Save
**When** the save completes
**Then** the Save button returns to default state and the sidebar immediately reflects the updated manager name

---

### Story 5.2: Claude API Key Configuration and Model Selection

As a manager,
I want to configure my Claude API key and choose the Claude model,
So that the AI evaluation feature can make real API calls securely.

**Acceptance Criteria:**

**Given** `src/main/settings/apiKey.ts` uses Electron `safeStorage`
**When** `setApiKey(key)` is called
**Then** the key is encrypted and stored in OS-level secure storage (Windows Credential Manager) — never written to disk in plaintext (NFR4)

**Given** `apiKey.ts`
**When** `isConfigured()` is called
**Then** it returns `true` if a key is stored, `false` otherwise — the raw key value is never returned to the renderer (NFR5)

**Given** `settingsHandlers.ts` registers `settings:set-api-key` and `settings:get-key-configured`
**When** `settings:get-key-configured` is invoked from the renderer
**Then** it returns `{ ok: true, data: boolean }` — the raw key never crosses the IPC boundary

**Given** the Settings view
**When** the API key section renders
**Then** a masked input field is shown with its own Save button and a note: "API key is stored securely in your OS credential store" (UX-DR14)

**Given** the model selector renders
**When** the user opens the dropdown
**Then** two options are available: "Claude Haiku 4.5 (default)" and "Claude Sonnet 4.6" — the current selection is persisted to the `settings` table

**Given** the API key field
**When** the key is saved
**Then** the key value does not appear in any `electron-log` output, IPC error messages, or UI elements other than the masked input field (NFR5)

---

### Story 5.3: Danger Zone — Clear All Data

As a manager,
I want a way to clear all my data from the application,
So that I can reset the tool for a new cycle or hand it to another tester with a clean state.

**Acceptance Criteria:**

**Given** the Settings view danger zone section
**When** it renders
**Then** a "Clear all data" button appears with a red outlined style — visually distinct from other actions (UX-DR14)

**Given** the user clicks "Clear all data"
**When** the confirmation dialog appears
**Then** it explains what will be deleted ("All employees, behavior log entries, and expected behaviors will be permanently deleted. This cannot be undone.") and requires explicit confirmation before proceeding

**Given** the user confirms
**When** the clear operation executes
**Then** all rows are deleted from `employees`, `behavior_log_entries`, `behavior_log_entry_competencies`, and `expected_behaviors` tables — the four competency seed rows in `competencies` and `settings` rows are preserved

**Given** the user cancels the confirmation dialog
**When** cancel is clicked
**Then** no data is deleted and the Settings view is unchanged

---

## Epic 6: AI Competency Evaluation & Distribution

Manager can trigger AI assessments per competency per employee, receive a trusted grade + rationale grounded in logged evidence, handle Insufficient Input as forward-looking guidance, and retry on network failures. The complete PoC is packaged as a Windows installer ready for testing managers.

### Story 6.1: Evaluate Tab with Competency Filter and Evidence Display

As a manager,
I want to select a competency in the Evaluate tab and see the filtered log entries that will inform the AI assessment,
So that I can review the evidence before triggering the evaluation.

**Acceptance Criteria:**

**Given** `EmployeeDetail.tsx` renders
**When** the Evaluate tab is clicked
**Then** the tab becomes active and the Behavior Log tab state (selected competency, scroll position) is preserved on tab switch back (UX-DR10)

**Given** the Evaluate tab renders with no competency selected
**When** the view loads
**Then** the instructional empty state displays: "Select a competency above to begin" — no "All" chip, no Run Evaluation button visible (UX-DR9, UX-DR11)

**Given** four competency filter chips render in the Evaluate tab
**When** the user clicks a chip
**Then** the table below filters to show only log entries tagged to that competency — the chip shows active state

**Given** a competency is selected and entries exist
**When** the table renders
**Then** entries are shown in reverse-chronological order with date, description excerpt, and competency chips visible — identical to the Behavior Log view but filtered

**Given** a competency is selected but no entries are tagged to it
**When** the table renders
**Then** the empty state displays: "No entries tagged to [Competency] for [Name]" with a "+ Log Behavior" CTA (UX-DR11)

**Given** a competency is selected and entries exist
**When** the "Run Evaluation" button renders
**Then** it is visible as a primary filled button — disabled until a competency is selected

---

### Story 6.2: AI Grade Result Display

As a manager,
I want to trigger an AI assessment and see the grade and rationale,
So that I receive a trusted, evidence-grounded evaluation result I can act on.

**Acceptance Criteria:**

**Given** `src/main/handlers/aiHandlers.ts` registers `ai:evaluate`
**When** invoked with `{ employeeId, competencyId }`
**Then** the handler: (1) fetches filtered log entries via `behaviorLog.listEntries`, (2) fetches expected behaviors via `framework.getExpectedBehavior`, (3) calls `AIProvider.evaluate()` with a 30-second timeout enforced by `Promise.race`, (4) returns `IpcResult<{ grade, rationale }>`

**Given** `src/renderer/hooks/useEvaluation.ts`
**When** `evaluate(employeeId, competencyId)` is called
**Then** it invokes `ai:evaluate`, manages `isLoading`, `result`, and `error` state — isolating the evaluation state from all other state in the view

**Given** the user clicks "Run Evaluation"
**When** the AI call is in progress
**Then** `GradeResultCard.tsx` shows a loading state: `CircularProgress` spinner with "Running evaluation…" label, Run Evaluation button disabled (UX-DR3, NFR2)

**Given** the AI call completes successfully
**When** the result renders
**Then** `GradeResultCard` shows: a grade badge using the outcome color for the returned grade, the full rationale text, an entry count ("Based on N observations"), and a "Re-run Evaluation" secondary button (FR18, FR19, FR22)

**Given** the grade badge renders
**When** the grade is one of the four valid values
**Then** the badge uses the correct outcome color: Exceeds `#2E7D32`, Meets `#1565C0`, Does Not Meet `#C62828`, Insufficient `#E65100` (UX-DR7)

---

### Story 6.3: Insufficient Input Outcome

As a manager,
I want to receive clear, actionable guidance when my evidence is too sparse for a grade,
So that I know exactly what to do next rather than receiving a false result.

**Acceptance Criteria:**

**Given** `MockAIProvider.ts` configured for sparse evidence
**When** `ai:evaluate` returns `grade: 'Insufficient Input'`
**Then** the handler returns `{ ok: true, data: { grade: 'Insufficient Input', rationale: '...' } }` — not an error state

**Given** `InsufficientInputCard.tsx` renders when grade is `'Insufficient Input'`
**When** it appears
**Then** it has `role="alert"` so screen readers announce the outcome immediately (UX-DR4, UX-DR15)
**And** the copy uses forward-looking language: "Add more observations for [Competency] to unlock a grade" — not error/failure language

**Given** `InsufficientInputCard` renders
**When** the user reads the rationale
**Then** the AI-generated explanation of what is missing is visible below the title (FR20)

**Given** the "+ Log Behavior" CTA button in `InsufficientInputCard`
**When** clicked
**Then** the view switches to the Behavior Log tab with a new `InlineLogRow` ready at the top — the competency that triggered Insufficient Input is pre-selected in the chips

**Given** the manager logs new entries and returns to the Evaluate tab
**When** the competency is still selected
**Then** the new entries are visible in the filtered table and "Run Evaluation" / "Re-run Evaluation" is available (FR22)

---

### Story 6.4: AI Error Handling and Network Resilience

As a manager,
I want clear, actionable error messages when the AI evaluation fails,
So that I can retry without confusion and continue using all other app features offline.

**Acceptance Criteria:**

**Given** `aiHandlers.ts` enforces a 30-second timeout via `Promise.race`
**When** the AI call exceeds 30 seconds
**Then** the handler returns `{ ok: false, error: 'Evaluation timed out. Check your connection and try again.' }` — behavior log data is untouched (NFR3, NFR8)

**Given** the AI call fails for any reason (network, API error, timeout)
**When** the error is received in the renderer
**Then** `GradeResultCard` renders its error state: plain-English error message + "Retry" button — no raw exception text or stack traces visible in the UI (FR23)

**Given** the Retry button is clicked
**When** a new `ai:evaluate` call is made
**Then** the loading state reactivates and the evaluation is re-attempted — behavior log entries remain intact (NFR8)

**Given** the Claude API is unreachable when the app launches
**When** the app starts
**Then** all features except AI evaluation work normally — Employees, Framework, Behavior Log, and Settings are fully functional offline (NFR9)

**Given** a successful evaluation followed by a failed re-run
**When** the error state renders
**Then** the previous grade result is cleared — the error state is the only thing shown in the result area until a successful call completes

---

### Story 6.5: UX Fidelity Fix

As a manager,
I want the application's visual design to match the approved mockups exactly,
So that the tool looks and feels as designed — building confidence and trust in the product before real AI integration.

**Acceptance Criteria:**

**Given** `EmployeeDetail.tsx` renders with a selected employee
**When** the view loads
**Then** an employee header section appears between the breadcrumb and the tabs, containing: a 42×42px circular avatar (background `#EEF2FF`, color `#3B5BDB`) with the employee's initials, the employee's name at 20px bold, and meta text "Level [X] · [N] behavior entries" at 13px `#6B7280`

**Given** behavior log entries are displayed in any table view
**When** the `entryDate` column renders
**Then** dates are formatted as "Apr 14, 2026" (human-readable) — not as ISO "2026-04-14"

**Given** `GradeResultCard` renders in the Evaluate tab after a successful evaluation
**When** the result is displayed
**Then** the card appears BELOW the filtered entries table — not above it

**Given** `CompetencyChip` renders in `read-only` mode
**When** it displays any competency
**Then** it uses the three-tone color style from the mockup: Communication (color `#2563EB`, border `#93C5FD`, bg `#EFF6FF`), Client Focus (color `#0D9488`, border `#5EEAD4`, bg `#F0FDFA`), Proactivity (color `#D97706`, border `#FCD34D`, bg `#FFFBEB`), Teamwork (color `#7C3AED`, border `#C4B5FD`, bg `#F5F3FF`)

**Given** `CompetencyChip` renders in `filter` mode
**When** a chip is inactive
**Then** it has white background with colored border and text; when active, it shows a light tint background (same colors as read-only bg) — NOT a solid filled background with white text

**Given** `GradeResultCard` shows a grade result
**When** the grade badge renders
**Then** it uses the light-bg + dark-text + border style: Exceeds (color `#166534`, bg `#DCFCE7`, border `#86EFAC`), Meets (color `#1E40AF`, bg `#DBEAFE`, border `#93C5FD`), Does Not Meet (color `#991B1B`, bg `#FEE2E2`, border `#FCA5A5`); the grade badge and "Based on N observations" appear inline in a flex row

**Given** `GradeResultCard` shows a grade result
**When** the rationale section renders
**Then** an "AI ASSESSMENT · [Competency] · LEVEL [X]" uppercase label (11px, `#9CA3AF`, letter-spacing 0.7px) appears above the grade row, and the rationale text is displayed in a styled block (background `#F9FAFB`, 3px left border `#C7D2FE`, padding 12px 16px, border-radius 0 4px 4px 0)

**Given** `InsufficientInputCard` renders
**When** the card is displayed
**Then** it uses amber/yellow styling: background `#FFFBEB`, border `#FCD34D`, title color `#92400E`; the CTA text reads "→ Add more [Competency] observations to unlock an assessment"; the card does NOT show a Re-run Evaluation button (only the "+ Log Behavior" primary button)

**Given** the Evaluate tab renders with no competency selected
**When** the empty state shows
**Then** a "Select a competency to evaluate:" label (13px, `#6B7280`) appears before the filter chips; the empty content area is a styled dashed card (white bg, 1.5px dashed `#E5E7EB` border, borderRadius 8px, padding 56px 24px, centered content) with a 📊 icon (32px), title "Select a competency above to begin", and subtitle "The relevant behavior entries will be shown, then you can run the AI assessment."

**Given** `InlineLogRow` renders in the table
**When** the editable row is displayed
**Then** it spans four columns matching the parent table (Date | Description | Competencies | Actions), with save and cancel in a separate fourth TableCell; the save button is a circular 32×32px button with background `#DCFCE7`, color `#166534`, border `1px solid #86EFAC`; the cancel button is circular 32×32px with background `#FEE2E2`, color `#991B1B`, border `1px solid #FCA5A5`

**Given** `Settings.tsx` renders
**When** the view loads
**Then** settings are organized into three named sections with styled section headers (uppercase 13px, `#374151`, background `#F9FAFB`, border-bottom, padding 14px 20px): "General" (manager name), "AI Configuration" (API key + model), "Data Management" (danger zone with red border `#FCA5A5` and red header background `#FFF5F5`); section label reads "Data Management" not "Danger Zone"; API key input is 380px wide with a show/hide eye icon button

**Given** the Behavior Log tab renders
**When** the header row above the table shows
**Then** it displays "[N] entries · all competencies" (or "[N] entries · [CompetencyName]" when filtered) in 13px `#6B7280` text instead of a "Behavior Log" heading

**Given** the Employee list renders
**When** employees exist in the database
**Then** the table shows four columns: Name, Level, Last Entry (most recent behavior log date formatted as "Apr 14, 2026", or "—" if no entries), and Log Entries (count of total entries, or "—" if zero); clicking anywhere on the row (not just the name) navigates to the employee detail

**Given** `AppShell.tsx` renders
**When** the content area shows
**Then** the content area has a maximum width of 960px

---

### Story 6.6: Real Claude API Integration

As a manager,
I want the AI evaluation to use the real Claude API with my configured key,
So that I receive genuine, evidence-grounded grades and rationales from the AI.

**Acceptance Criteria:**

**Given** `src/main/ai/ClaudeAIProvider.ts` implements the `AIProvider` interface using `@anthropic-ai/sdk`
**When** `evaluate(input)` is called
**Then** it constructs a prompt with the employee's log entries and expected behaviors, calls the Claude API (Haiku 4.5 by default), and parses the response into `{ grade: Grade, rationale: string }`

**Given** the Claude prompt design
**When** the AI responds
**Then** the grade is constrained to one of the four valid values — the prompt explicitly lists the allowed grade strings and instructs the AI to select exactly one (FR18, FR21)

**Given** the evidence base is too sparse (per prompt threshold)
**When** the AI responds
**Then** the grade returned is `'Insufficient Input'` with a rationale explaining what is missing — not a forced grade (FR20, FR21)

**Given** `src/main/index.ts`
**When** `ClaudeAIProvider` replaces `MockAIProvider`
**Then** only the import in `src/main/index.ts` changes — no other files are modified (AIProvider boundary)

**Given** the real API integration is active
**When** an evaluation is run with real log entries and framework data
**Then** the returned grade and rationale are grounded in the provided input — the rationale references specific behaviors from the log

---

### Story 6.7: Testing, Accessibility, and Packaging

As a manager and developer,
I want the application fully tested, accessibility-verified, and packaged as an installer,
So that non-technical testing managers can install and use the PoC on their Windows machines.

**Acceptance Criteria:**

**Given** `__tests__/main/db/employees.test.ts`, `behaviorLog.test.ts`, `framework.test.ts`
**When** `npm run test` is executed
**Then** IPC integration tests run against a temp SQLite file, verifying CRUD operations, query correctness, and `IpcResult` response shapes for all DB modules (AR10)

**Given** `__tests__/renderer/components/` test files
**When** `npm run test` is executed
**Then** Vitest + React Testing Library unit tests verify `CompetencyChip`, `InlineLogRow`, `GradeResultCard`, and `InsufficientInputCard` render correctly across their variants and states

**Given** all interactive elements
**When** keyboard-only navigation is performed
**Then** Tab moves focus through all interactive elements in visual reading order; inline row ✓/✕ are reachable by Tab; Escape cancels inline editing; no focus traps exist (UX-DR16)

**Given** all icon-only buttons
**When** inspected
**Then** every icon button has a descriptive `aria-label` — no icon-only action is inaccessible to screen readers (UX-DR15)

**Given** `electron-builder.yml` configuration
**When** `npm run build` is executed on Windows
**Then** a `.exe` NSIS installer is produced in `dist/` — installable on a clean Windows machine without developer tooling (AR11)

**Given** the installed application on Windows
**When** launched from the installed location
**Then** the app starts, navigates, logs behaviors, and (with a configured API key) runs evaluations — the full PoC works end-to-end (NFR1: all local ops complete in under 1 second)
