# Deferred Work Log

## Deferred from: code review of 1-1-scaffold-and-configure-project (2026-04-24)

- `src/renderer/src/env.d.ts` created by scaffold but spec lists it under Story 1.2 scope — Story 1.2 can check if the file is correct or update if needed
- `sandbox: false` disables renderer sandbox (`sdd-app/src/main/index.ts`) — scaffold default; story scope excludes modification; address before first distribution
- CSP missing `connect-src` directive (`sdd-app/src/renderer/index.html`) — scaffold default; add when Claude API calls are wired (Story 6.5)
- `window.electron` accessed without null guard in `App.tsx` and `Versions.tsx` — scaffold template; replaced by real UI in Stories 1.4–1.6
- Non-null assertion `getElementById('root')!` throws if element absent (`sdd-app/src/renderer/src/main.tsx:7`) — scaffold default; low risk in controlled Electron context
- `contextBridge.exposeInMainWorld` error swallowed silently (`sdd-app/src/preload/index.ts`) — scaffold default; Story 1.5 rewrites IPC scaffold
- `setWindowOpenHandler` passes URLs to `shell.openExternal` without scheme validation (`sdd-app/src/main/index.ts`) — scaffold default; address when AI-generated content exists (Story 6.x)
- Debug `ipcMain.on('ping')` and `console.log('pong')` left in main process (`sdd-app/src/main/index.ts`) — scaffold default; Story 1.5 replaces IPC scaffolding
- `@ts-ignore` in preload suppresses type errors on `window` assignments (`sdd-app/src/preload/index.ts`) — scaffold default; Story 1.2 replaces `window.api`
- `window.api` exposed as `unknown` placeholder (`sdd-app/src/preload/index.ts`) — scaffold default; Story 1.2 defines the actual IPC contract
- `notarize: false` — macOS Gatekeeper will block distribution (`sdd-app/electron-builder.yml`) — not relevant until packaging; address in Story 6.6
- Auto-update `publish.url` is placeholder `https://example.com/auto-updates` (`sdd-app/electron-builder.yml`) — not used yet; configure before distribution
- `appId: com.electron.app` is template default (`sdd-app/electron-builder.yml`) — set real app ID before distribution
- `author` and `homepage` are template placeholder values (`sdd-app/package.json`) — update before distribution
- `electronApp.setAppUserModelId('com.electron')` does not match `appId` (`sdd-app/src/main/index.ts`) — fix alongside appId in Story 6.6
- `maintainer: electronjs.org` in Linux build config (`sdd-app/electron-builder.yml`) — update before distribution
- `!src/*` files exclusion in `electron-builder.yml` may not be recursive (`sdd-app/electron-builder.yml`) — low risk; compiled output in `out/`; verify during Story 6.6 packaging

## Deferred from: code review of 1-2-define-ipc-contract-and-shared-types (2026-04-25)

- Weak IPC invoke signature — `invoke<T>(channel: string, payload?: unknown)` has no channel union or payload-to-return mapping; Story 1.5 should define typed overloads or a channel map
- `IpcResult<T>` error carries only `string` — no error code field; renderer cannot programmatically branch on error category without fragile string parsing
- Empty string accepted by `name`/`description`/`key` fields — no branded type enforcement; repository layer must validate before DB writes
- `competencyIds` accepts empty array in create/update payloads — a log entry with zero competencies is semantically invalid; repository layer must reject
- Date fields (`entryDate`, `createdAt`) are unvalidated plain `string` — ISO 8601 is comment-only; repository layer must validate format
- `SetModelPayload.model` is `string` not a union — valid model IDs listed in comment only; tighten to union type in a future cleanup
- Update payloads require all fields — no `Partial<>` variants; callers must re-supply all unchanged fields; consider partial-update variants when API evolves
- `BehaviorLogEntry.competencies` can be empty array — repository layer should ensure entries always carry at least one competency or document the zero-competency case
- `CompetencyLevel` values opaque — no documentation of level ordering (`'A'` through `'D'`); add to architecture doc or a future competency reference
- No IPC schema versioning strategy — if main and renderer get out of sync during an update cycle, type mismatches will be silent at runtime; address before v1.0

## Deferred from: code review of 1-3-initialize-sqlite-database-with-schema-on-startup (2026-04-25)

- No schema migration strategy — `IF NOT EXISTS` silently skips future column additions; no migration version table or runner; address before any schema change story
- `db` exported as mutable singleton — any module can execute arbitrary SQL bypassing future transaction discipline; consider a repository pattern wrapper in Epic 2+
- `entry_date TEXT NOT NULL` accepts empty string — no CHECK constraint enforcing ISO-8601 format; date range queries may silently produce wrong results
- `competency_id` FK in `behavior_log_entry_competencies` has no explicit `ON DELETE` action — implicit RESTRICT will raise cryptic FK error for callers deleting competencies
- `created_at DEFAULT (datetime('now'))` stores UTC without timezone marker — ambiguous vs local time in UI display; address before cross-timezone use
- No SQLite `STRICT` table mode — type affinity coercion can silently store wrong types (e.g., integer stored in TEXT column)

## Deferred from: code review of 1-4-define-aiprovider-interface-and-implement-mockaiprovider (2026-04-25)

- Timing assertion in `MockAIProvider.test.ts:34-38` uses `Date.now()` delta < 50ms as a network-call proxy — spec-mandated and safe for an in-process mock but could be flaky under heavy CI load; revisit if test flakiness is observed
- `aiProvider.constructor.name` is used in a log statement (`src/main/index.ts`) — `Function.prototype.name` is stripped in minified Electron builds; low risk for an informational log, but consider a static string label if logs prove unreadable in prod
- `EvaluationInput.expectedBehaviors` accepts empty string at the interface level — no type-level enforcement; `ClaudeAIProvider` and IPC handler must validate before calling the API (address in Story 6.5)
- `aiProvider` is instantiated at module-load time before `app.whenReady()` (`src/main/index.ts:11`) — safe with MockAIProvider's trivial constructor; if `ClaudeAIProvider` reads `app.getPath()` or uses electron APIs in its constructor, it must be lazily instantiated inside `app.whenReady()` (address in Story 6.5)

## Deferred from: code review of 1-6-mui-theme-and-app-shell (2026-04-25)

- `setView` does not reset `selectedEmployeeId`/`selectedCompetency` on navigation (`appStore.ts:20`) — out of scope for Story 1.6; revisit if a future epic needs full state resets on nav
- `body { user-select: none }` lost when electron-vite template `main.css` was removed (`main.tsx`) — Electron UX enhancement preventing accidental text selection in UI; address in a later UI polish story

## Deferred from: code review of 2-1-employee-list-view (2026-04-25)

- AC1 schema verification bypassed — `employees.test.ts` uses a hand-rolled mock instead of a real in-memory SQLite DB; ABI mismatch (Electron Node 22 ABI 140 vs system Node 20 ABI 137) prevents loading native module in Vitest. Reason: not worth risking code breakage to fix a test infrastructure issue right now (`sdd-app/__tests__/main/db/employees.test.ts`)
- Test mock ignores SQL string in `employees.test.ts` — ABI mismatch prevents real better-sqlite3 in Vitest; mapping logic tested, SQL correctness trusted to SQLite (`sdd-app/__tests__/main/db/employees.test.ts`)
- `createdAt` stores SQLite `datetime('now')` format (`YYYY-MM-DD HH:MM:SS`) not strict ISO 8601 — cross-cutting concern; renderer/AI layer must handle non-T-separator format (`sdd-app/src/main/db/employees.ts`)
- `employees` state not cleared before reload in `useEmployees.load()` — stale data flash on re-fetch; not triggerable in Story 2.1 (mount-only); address if Story 2.2+ needs live-refresh UX (`sdd-app/src/renderer/src/hooks/useEmployees.ts`)
- Concurrent `load()` calls produce a race condition — no cancellation or in-flight guard; not triggerable until Story 2.2+ adds additional trigger sources (`sdd-app/src/renderer/src/hooks/useEmployees.ts`)
- No test covering null/missing `name`/`level` fields — SQLite NOT NULL constraint prevents at runtime; moot until constraint is relaxed or a migration loosens the schema (`sdd-app/__tests__/main/db/employees.test.ts`)

## Deferred from: code review of 1-5-wire-contextbridge-preload-and-ipc-handler-scaffold (2026-04-25)

- `expected-behavior:set` catch block returns `'Not implemented.'` regardless of actual error — will mask real DB errors when Story 3.2 implements the function; update error message to something like `'Failed to set expected behavior.'` at that time (`sdd-app/src/main/handlers/frameworkHandlers.ts:41`)
- No runtime payload validation across all IPC handlers — payloads typed but not validated at runtime; a systemic design decision for a future validation/guard layer before Epic 2+
- `db` null-guard missing in stub functions `getExpectedBehavior` and `setExpectedBehavior` — add `if (!db) throw new Error('Database not initialized')` guards when Stories 3.1/3.2 implement the functions (`sdd-app/src/main/db/framework.ts:9-25`)
- `settings:set-api-key` — no API key redaction pattern established; establish `log.info('[settings:set-api-key] (key redacted)')` pattern before Story 5.2 implements this handler (`sdd-app/src/main/handlers/settingsHandlers.ts:28`)
- Double-registration risk on macOS `activate` callback — handler registrations are correctly outside the activate callback today; ensure they stay outside if `app.whenReady()` block is refactored (`sdd-app/src/main/index.ts:62`)
