# Story 1.3: Initialize SQLite Database with Schema-on-Startup

Status: done

## Story

As a manager,
I want the application to initialize its local database automatically when it launches,
so that my data persists between sessions without any setup or configuration on my part.

## Acceptance Criteria

1. `initializeSchema()` in `src/main/db/database.ts` creates the `settings` and `competencies` tables using `CREATE TABLE IF NOT EXISTS` — no error if tables already exist.
2. On first launch, `initializeSchema()` seeds exactly four rows in `competencies`: `Communication`, `Client Focus`, `Proactivity`, `Teamwork` — inserted via `INSERT OR IGNORE`.
3. On subsequent launches, `initializeSchema()` runs without errors and no duplicate competency rows are created.
4. The SQLite file is created at `app.getPath('userData')/sdd.db` — surviving app reinstalls (FR26, FR27).
5. `electron-log` is configured in the main process; on app start a log entry confirms database initialization success and the log file is written to `app.getPath('logs')`.
6. SQLite's default transaction guarantees ensure the database is not left in a corrupt or partial state after a crash mid-write (NFR7).

## Tasks / Subtasks

- [x] Task 1: Create `src/main/db/database.ts` — DB singleton + schema init (AC: 1, 2, 3, 4, 6)
  - [x] Import `better-sqlite3`, `electron`'s `app`, and `path`
  - [x] Export singleton `db` instance opened at `join(app.getPath('userData'), 'sdd.db')`
  - [x] Enable WAL mode and foreign keys via `db.pragma()` immediately after opening
  - [x] Export `initializeSchema()` that runs `db.exec()` with `CREATE TABLE IF NOT EXISTS` for all 6 tables (AR3 — exact SQL in Dev Notes below)
  - [x] Add `INSERT OR IGNORE` seeding for the 4 competency rows within `initializeSchema()`

- [x] Task 2: Configure `electron-log` in `src/main/index.ts` (AC: 5)
  - [x] Add `import log from 'electron-log/main'` at the top of `src/main/index.ts` (v5 API — NOT `'electron-log'`)
  - [x] Log init success after `initializeSchema()` returns: `log.info('[database] Schema initialized at', dbPath)`
  - [x] Electron-log v5 default in main process writes to `app.getPath('logs')/main.log` automatically — no `log.transports` config required

- [x] Task 3: Wire `initializeSchema()` into app startup in `src/main/index.ts` (AC: 1, 5)
  - [x] Import `{ initializeSchema }` from `'./db/database'`
  - [x] Call `initializeSchema()` inside `app.whenReady().then(() => { ... })` BEFORE `createWindow()`
  - [x] Wrap the call in try/catch — `log.error('[database] Schema init failed:', e)` and rethrow (fatal error, app cannot function without DB)
  - [x] Remove the debug `ipcMain.on('ping', () => console.log('pong'))` line (deferred from Story 1.1 — clean it up now)

- [x] Task 4: Typecheck (AC: 1–6)
  - [x] Run `npx tsc --noEmit -p tsconfig.node.json && npx tsc --noEmit -p tsconfig.web.json` from `sdd-app/` — zero errors (one intermediate fix: added explicit `Database.Database` type annotation to satisfy TS4023)

## Dev Notes

### CRITICAL: Create ALL 6 Tables in `initializeSchema()`

AR3 mandates all six tables in one call. Although AC1 explicitly names only `settings` and `competencies`, the remaining four tables are validated by Stories 2.1, 3.1, and 4.1 against the same `initializeSchema()`. Create all of them now — do NOT defer to later stories or they will fail their ACs.

**Exact SQL to use in `db.exec()` (copy verbatim from architecture.md):**

```sql
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('A','B','C','D')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS competencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
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
  entry_date TEXT NOT NULL,
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

**Competency seed (run after table creation):**

```sql
INSERT OR IGNORE INTO competencies (name) VALUES ('Communication');
INSERT OR IGNORE INTO competencies (name) VALUES ('Client Focus');
INSERT OR IGNORE INTO competencies (name) VALUES ('Proactivity');
INSERT OR IGNORE INTO competencies (name) VALUES ('Teamwork');
```

### CRITICAL: `database.ts` Implementation Pattern

`app.getPath('userData')` is safe to call at module top-level before `whenReady` in modern Electron — no lazy init wrapper needed. Export the `db` instance directly so repository modules can import it cleanly.

```ts
// src/main/db/database.ts
import Database from 'better-sqlite3'
import { app } from 'electron'
import log from 'electron-log/main'
import { join } from 'path'

export const dbPath = join(app.getPath('userData'), 'sdd.db')
export const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initializeSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees ( ... );
    -- ... all 6 tables
  `)
  db.exec(`
    INSERT OR IGNORE INTO competencies (name) VALUES ('Communication');
    INSERT OR IGNORE INTO competencies (name) VALUES ('Client Focus');
    INSERT OR IGNORE INTO competencies (name) VALUES ('Proactivity');
    INSERT OR IGNORE INTO competencies (name) VALUES ('Teamwork');
  `)
  log.info('[database] Schema initialized at', dbPath)
}
```

**Why WAL mode:** WAL (Write-Ahead Logging) allows concurrent reads during writes and improves crash safety. Required by NFR7.

**Why foreign keys pragma:** SQLite does NOT enforce foreign keys by default. `PRAGMA foreign_keys = ON` must be set per connection. Without it, `ON DELETE CASCADE` on `behavior_log_entries` and `behavior_log_entry_competencies` will silently do nothing.

### CRITICAL: `electron-log` v5 Import Path

The installed version is `electron-log@^5.4.3`. The v5 API uses split entry points:
- Main process: `import log from 'electron-log/main'` ✅
- Renderer: `import log from 'electron-log/renderer'`
- Old v4 style `import log from 'electron-log'` still works but is discouraged in v5

**Log location:** electron-log v5 in the main process writes to `app.getPath('logs')/main.log` automatically with no configuration. On Windows: `%APPDATA%\<app-name>\logs\main.log`.

**Log format (must follow architecture pattern):**
```ts
log.info('[database] Schema initialized at', dbPath)   // success
log.error('[database] Schema init failed:', e.message) // failure
// NEVER: log.info('API key:', key) — key material must never appear in logs
```

### `src/main/index.ts` — Changes Required

Current state (from Story 1.1): default electron-vite scaffold with `ipcMain.on('ping', ...)` debug handler.

Changes to make:
1. Add at top: `import log from 'electron-log/main'`
2. Add import: `import { initializeSchema } from './db/database'`
3. Inside `app.whenReady().then(() => { ... })`, before `createWindow()`:
   ```ts
   try {
     initializeSchema()
   } catch (e) {
     log.error('[database] Schema init failed:', (e as Error).message)
     throw e  // fatal — app cannot function without DB
   }
   ```
4. Remove: `ipcMain.on('ping', () => console.log('pong'))` (deferred cleanup from Story 1.1)

### What This Story Does NOT Do

- Does NOT create repository functions (`employees.ts`, `behaviorLog.ts`, `framework.ts`) — those are Stories 2.x, 3.x, 4.x
- Does NOT register any `ipcMain.handle` channels — Stories 1.5+ wire those
- Does NOT modify `src/preload/index.ts` — Story 1.5 rewrites the preload
- Does NOT implement any React components or UI

### Project Structure Notes

- **Working directory for all commands:** `sdd-app/` (i.e., `c:\Users\Diego\Documents\Diego\Claude\SDD\sdd-app\`)
- **New file:** `sdd-app/src/main/db/database.ts`
- **Modified file:** `sdd-app/src/main/index.ts` — add log import, add initializeSchema call, remove ping handler
- `src/main/db/` directory does not yet exist — create it
- `better-sqlite3` is already installed (`"better-sqlite3": "^12.9.0"` in package.json)
- `electron-log` is already installed (`"electron-log": "^5.4.3"` in package.json)
- `@types/better-sqlite3` is already installed — TypeScript types available
- Import path from `src/main/db/database.ts` to nothing — no cross-imports in this story
- Import path from `src/main/index.ts` to `database.ts`: `'./db/database'`

### References

- [epics.md#Story 1.3: Initialize SQLite Database with Schema-on-Startup] — acceptance criteria source
- [architecture.md#Data Architecture] — complete SQL schema, WAL mode, foreign keys, seeding strategy
- [architecture.md#Infrastructure & Deployment] — `electron-log` setup, log format pattern
- [architecture.md#Enforcement Guidelines] — "Never store or log the raw API key value"
- [architecture.md#Implementation Patterns — Logging Format] — `[channel:name] description key=value` format
- [1-2-define-ipc-contract-and-shared-types.md#Project Structure Notes] — working directory is `sdd-app/`
- [deferred-work.md] — `ipcMain.on('ping')` debug handler cleanup targeted here
- AR3, AR7 (epics.md Requirements Inventory)
- FR26, FR27 — data persistence at `app.getPath('userData')`
- NFR7 — atomic DB writes via SQLite transactions

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TS4023 on `export const db`: TypeScript could not name the inferred type `BetterSqlite3.Database` from the external module. Fixed by adding explicit annotation: `export const db: Database.Database = new Database(dbPath)`.

### Completion Notes List

- Created `sdd-app/src/main/db/database.ts`: exports `db` (singleton `better-sqlite3` connection at `app.getPath('userData')/sdd.db`), sets WAL journal mode and foreign key enforcement via `db.pragma()`, and exports `initializeSchema()` which creates all 6 tables via `CREATE TABLE IF NOT EXISTS` and seeds 4 competency rows via `INSERT OR IGNORE`.
- Updated `sdd-app/src/main/index.ts`: added `electron-log/main` import (v5 API), added `initializeSchema()` import and call inside `app.whenReady()` before `createWindow()`, wrapped in try/catch with fatal rethrow, removed debug `ipcMain.on('ping')` handler and unused `ipcMain` import.
- Both typechecks (`tsconfig.node.json` and `tsconfig.web.json`) pass with zero errors.
- AC6 (crash safety / NFR7) satisfied by WAL mode + SQLite's built-in transaction atomicity — no explicit transaction wrapping needed for DDL.

### File List

- `sdd-app/src/main/db/database.ts` (created)
- `sdd-app/src/main/index.ts` (modified)

## Review Findings

- [x] [Review][Patch] `new Database(dbPath)` and pragma calls unguarded at module level — throws synchronously before any try/catch in `index.ts` can intercept [database.ts:7-10]
- [x] [Review][Patch] Database connection never closed on app quit — WAL requires clean flush to main DB file; no shutdown hook [database.ts]
- [x] [Review][Patch] DDL and seed inserts in two separate non-atomic `db.exec()` calls — partial init state if process dies between them [database.ts:13-59]
- [x] [Review][Patch] Re-throw inside `.then()` → unhandled Promise rejection → app hangs windowless with no window and no `app.quit()` [index.ts:44-49]
- [x] [Review][Patch] `(e as Error).message` unsafe cast — logs `undefined` if error is a non-Error object [index.ts:47]
- [x] [Review][Defer] No schema migration strategy — `IF NOT EXISTS` silently skips future column changes; no version table or runner [database.ts] — deferred, pre-existing architectural concern
- [x] [Review][Defer] `db` exported as mutable singleton — any module can bypass future transaction discipline [database.ts:7] — deferred, pre-existing
- [x] [Review][Defer] `entry_date TEXT NOT NULL` accepts empty string — no format CHECK constraint [database.ts:38] — deferred, pre-existing
- [x] [Review][Defer] `competency_id` FK in `behavior_log_entry_competencies` has no explicit `ON DELETE` action — implicit RESTRICT behavior surprises callers [database.ts:42-46] — deferred, pre-existing
- [x] [Review][Defer] `created_at DEFAULT (datetime('now'))` stores UTC with no timezone marker — ambiguous vs local time in UI [database.ts] — deferred, pre-existing
- [x] [Review][Defer] No SQLite STRICT table mode — type affinity coercion can silently store wrong types [database.ts] — deferred, pre-existing
