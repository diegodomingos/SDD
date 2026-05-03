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

## Deferred from: code review of 2-2-add-employee (2026-04-26)

- `db!` non-null assertion — pre-existing pattern across all handlers; if `db` is undefined, SQLite crashes inside the called function and surfaces as generic error; address when DB initialization lifecycle is hardened (`sdd-app/src/main/handlers/employeeHandlers.ts`)
- `payload.name` logged before null/undefined payload check — if IPC payload is malformed, `payload.name` access throws before validation guard; IPC boundary integrity currently assumed from preload setup (`sdd-app/src/main/handlers/employeeHandlers.ts`)
- Test mock SQL matching fragility — `trimStart().startsWith('INSERT')` silently falls through to wrong branch on lower-case or CTE-prefixed SQL; add explicit SELECT branch check when tests are refactored (`sdd-app/__tests__/main/db/employees.test.ts`)
- No `maxLength` on name `TextField` — unbounded input; DB schema should enforce column length; add client-side cap when UI hardening story is planned (`sdd-app/src/renderer/src/views/EmployeeList.tsx`)

## Deferred from: code review of 2-3-edit-employee (2026-04-26)

- `db!` non-null assertion in employee:update handler — pre-existing pattern across all handlers; if db is undefined, SQLite crashes and surfaces as generic error; address when DB initialization lifecycle is hardened (`sdd-app/src/main/handlers/employeeHandlers.ts:47`)
- Non-atomic UPDATE+SELECT in updateEmployee — no transaction wrapping; single-user desktop app has no concurrency risk in practice; address if multi-window or multi-process scenarios are introduced (`sdd-app/src/main/db/employees.ts`)
- Employee row id leaked in application log via throw message — `throw new Error(\`Employee row not found after update (id=${id})\`)` logged verbatim; local desktop logs only, low concern (`sdd-app/src/main/db/employees.ts:41`)
- `editingId!` non-null assertion in handleEditSave — UI gate (disabled button) prevents the null path; theoretical risk only for programmatic invocation (`sdd-app/src/renderer/src/views/EmployeeList.tsx`)
- `editLevel as CompetencyLevel` cast without runtime re-check inside handleEditSave — guarded by editSaveDisabled flag and IPC server-side level validation; revisit if keyboard submit path is added (`sdd-app/src/renderer/src/views/EmployeeList.tsx`)
- `setError(null)` in update() clears unrelated concurrent errors — pre-existing hook design shared with create(); low impact in single-user desktop context (`sdd-app/src/renderer/src/hooks/useEmployees.ts`)
- Edit icon uses JS conditional rendering (hover state) instead of CSS-only visibility — AC doesn't specify mechanism; keyboard focus-based reveal not required by spec; revisit in accessibility pass (`sdd-app/src/renderer/src/views/EmployeeList.tsx`)

## Deferred from: code review of 2-4-remove-employee (2026-04-26)

- `db!` non-null assertion without runtime null guard — pre-existing pattern across all handlers; if `db` is null, crashes with generic error (`sdd-app/src/main/handlers/employeeHandlers.ts:63`)
- `payload` null/undefined check missing before `payload.id` access — accessing `payload.id` before `!payload` guard; pre-existing pattern in create/update handlers (`sdd-app/src/main/handlers/employeeHandlers.ts:62`)
- `result.error` may be `undefined` when `ok === false` — `setError(result.error)` has no fallback string; pre-existing in create/update hooks (`sdd-app/src/renderer/src/hooks/useEmployees.ts:63`)
- No test for DB-throws path in `deleteEmployee` — only normal return mocked; exception propagation to handler catch is implicitly trusted (`sdd-app/__tests__/main/db/employees.test.ts`)
- `payload.id` type validation fragility — no `typeof` guard; relies on `Number.isInteger` incidentally rejecting strings; TypeScript IPC types prevent this in practice (`sdd-app/src/main/handlers/employeeHandlers.ts:62`)
- `async` handler wraps synchronous `deleteEmployee` — consistent with pre-existing handler pattern; style-only concern (`sdd-app/src/main/handlers/employeeHandlers.ts:58`)

## Deferred from: code review of 3-1-framework-view-with-expected-behavior-display (2026-04-26)

- `load()` has no concurrent-call guard; re-invocations can corrupt competencies/behaviors state mismatch — no reload UI in Story 3.1; address when a refresh trigger is added (`sdd-app/src/renderer/src/hooks/useFramework.ts:14-48`)
- `getExpectedBehavior` null guard (`if (!db) throw`) inconsistent with `listCompetencies` which has no guard — defensive pre-existing inconsistency; address when DB init lifecycle is hardened (`sdd-app/src/main/db/framework.ts:10`)
- SQLite result cast `as { description: string }` hides schema drift — standard better-sqlite3 pattern; revisit if schema changes or `STRICT` mode is adopted (`sdd-app/src/main/db/framework.ts:12-13`)
- Row header cells (`comp.name`) in `<TableBody>` rendered as `<td>` without `scope="row"` — spec only requires `scope="col"` for column headers; address in a future accessibility pass (`sdd-app/src/renderer/src/views/Framework.tsx`)
- Empty-competency list renders no empty-state message — DB is always seeded with 4 competencies; address if a future admin flow can delete all competencies (`sdd-app/src/renderer/src/views/Framework.tsx`)
- Test suite does not verify SQL string passed to `prepare()` in `listCompetencies` — behavior tested; SQL correctness trusted to SQLite; add if query becomes complex (`sdd-app/__tests__/main/db/framework.test.ts:41-57`)
- `ExpectedBehaviorMap` type is local to `useFramework.ts` and not exported — dev notes mark it renderer-internal; export when Story 3.2 needs to annotate it externally (`sdd-app/src/renderer/src/hooks/useFramework.ts:3`)

## Deferred from: code review of 3-2-edit-expected-behaviors-inline (2026-04-26)

- Optimistic state update: `setExpectedBehavior` echoes input string rather than re-reading from DB; if a trigger or future coercion transforms the value, UI and DB diverge silently (`sdd-app/src/main/db/framework.ts:24`)
- `!db` null-guard in `setExpectedBehavior` inconsistent with `listCompetencies` (no guard); address when DB init lifecycle is hardened (`sdd-app/src/main/db/framework.ts:21`)
- DB function accepts empty/whitespace description — validation lives only at handler boundary; any direct caller can persist blank values (`sdd-app/src/main/db/framework.ts:18-26`)
- Inline arrow handlers inside table-row map recreate on every render; no `useCallback` wrapping for `onChange`, `onKeyDown`, `onClick` closures (`sdd-app/src/renderer/src/views/Framework.tsx:106-128`)
- Handler does not validate `competencyId` (positive integer / FK existence) — defence-in-depth gap; address in a future validation layer (`sdd-app/src/main/handlers/frameworkHandlers.ts:36`)
- No in-flight guard in `saveBehavior`; rapid double-click can dispatch parallel IPC calls that race on `behaviors` state update (`sdd-app/src/renderer/src/hooks/useFramework.ts:64`)
- `editingCell`/`draftText` not reconciled with `behaviors` if `load()` re-fires while a cell is in edit mode; theoretical until an auto-refresh trigger is added
- `Escape` handler missing `e.preventDefault()` / `e.stopPropagation()`; could bubble to parent in future modal wrapper (`sdd-app/src/renderer/src/views/Framework.tsx:109`)
- No test coverage for `!db` null-guard branch in `setExpectedBehavior` (`sdd-app/__tests__/main/db/framework.test.ts`)
- Handler trims description before passing to repository (`_payload.description.trim()`); spec is silent on trimming — intentional defensive behaviour but unspecified (`sdd-app/src/main/handlers/frameworkHandlers.ts:40`)

## Deferred from: code review of 3-3-ux-polish-framework-and-shell (2026-05-01)

- Hover-only action buttons in EmployeeList — keyboard inaccessibility (WCAG 2.1 SC 2.1.1); pre-existing pattern from Story 2.x; address in accessibility pass (`sdd-app/src/renderer/src/views/EmployeeList.tsx`)
- `confirmSave` has no double-click in-flight guard — parallel IPC calls can race on behaviors state; pre-existing pattern noted in Story 3.2 review (`sdd-app/src/renderer/src/hooks/useFramework.ts:64`)
- `COMPETENCY_CHIP_STYLES` keyed by display name — silent grey fallback if competency name changes or is added; design tradeoff documented in spec; address if competency names become configurable (`sdd-app/src/renderer/src/views/Framework.tsx`)
- `fontWeight: 'inherit'` on nav label Typography may not cascade from parent ListItemButton `sx` — selected state bold emphasis may be silently ineffective; verify in browser (`sdd-app/src/renderer/src/components/layout/Sidebar.tsx`)

## Deferred from: code review of 4-1-behavior-log-list-view (2026-05-01)

- `db!` non-null assertion in `behavior-log:list` handler — pre-existing pattern across all handlers; consistent with project architecture; address when DB init lifecycle is hardened (`sdd-app/src/main/handlers/behaviorLogHandlers.ts`)
- `selectedEmployee!` non-null assertion in EmployeeDetail — guarded by ViewRouter; accepted TypeScript pattern; address if component is ever rendered outside ViewRouter context (`sdd-app/src/renderer/src/views/EmployeeDetail.tsx:25`)
- useEffect has no IPC cancellation on unmount — IPC not cancellable; component-local hook prevents stale writes today; revisit if hook is lifted to shared context or cancellable IPC is introduced (`sdd-app/src/renderer/src/hooks/useBehaviorLog.ts`)
- `useBehaviorLog` does not reset `entries` on new `load()` call — component-local mount means no stale data in current architecture; address if hook is lifted to shared context in Story 4.3 (filter feature) (`sdd-app/src/renderer/src/hooks/useBehaviorLog.ts`)
- `colorMap` keyed by display name string — intentional per dev notes; silent grey fallback if competency name changes; address if competency names become configurable (`sdd-app/src/renderer/src/components/common/CompetencyChip.tsx`)
- Sidebar "Employees" nav resurfaces EmployeeDetail without resetting selection — explicitly documented as acceptable in Story 4.1 dev notes; "Employees" breadcrumb link is the intended back-navigation path (`sdd-app/src/renderer/src/App.tsx`)
- `showInlineRow && null` renders nothing — intentional placeholder; Story 4.2 wires InlineLogRow using this state (`sdd-app/src/renderer/src/views/EmployeeDetail.tsx`)
- Evaluate tab placeholder text `"AI evaluation — coming in Epic 6."` deviates from spec `"Coming in Epic 6"` — not relevant; Epic 6 will replace the placeholder entirely (`sdd-app/src/renderer/src/views/EmployeeDetail.tsx`)

## Deferred from: code review of 4-2-inline-behavior-log-entry-creation (2026-05-02)

- Two "Log Behavior" buttons (header + empty state) visible simultaneously when entries exist — spec-compliant; header button pre-exists from Story 4.1 (`sdd-app/src/renderer/src/views/EmployeeDetail.tsx:85`)
- Optimistic prepend puts past-dated entries above newer entries until next reload — spec-mandated "prepend so it appears immediately at top" behavior; sort order corrects on next `load()` (`sdd-app/src/renderer/src/hooks/useBehaviorLog.ts:37`)
- `competencyIds` element type/FK validation not done in handler — internal IPC only; SQLite transaction rollback handles invalid IDs correctly; generic error message sufficient for single-user desktop (`sdd-app/src/main/handlers/behaviorLogHandlers.ts:37`)
- `mockDbForCreate` mock returns same `lastInsertRowid` for all `run()` calls — cannot distinguish entry vs junction insert rowid; test quality improvement only, not a correctness bug (`sdd-app/__tests__/main/db/behaviorLog.test.ts:16`)

## Deferred from: code review of 4-4-edit-and-delete-behavior-log-entries (2026-05-02)

- `updateEntry` has no cross-employee ownership check — `WHERE id = ?` without `AND employee_id = ?`; acceptable in single-user Electron desktop; address if multi-user or remote-IPC scenarios are introduced (`sdd-app/src/main/db/behaviorLog.ts`)
- `initialDate` prop changes after mount are ignored by `useState` — fragile component contract if `editingEntryId` switches without unmounting; current usage mounts a fresh key so not triggered (`sdd-app/src/renderer/src/components/log/InlineLogRow.tsx`)
- `handleSave` calls `load()` without `await` before dismissing inline row — error from re-fetch surfaces after row is already gone; pre-existing pattern from Story 4.2 (`sdd-app/src/renderer/src/views/EmployeeDetail.tsx`)
- `InlineLogRow` `saving` stuck `true` permanently if parent does not unmount after successful save — `setSaving(false)` only called on failure; relies on parent always unmounting on success (`sdd-app/src/renderer/src/components/log/InlineLogRow.tsx`)

## Deferred from: code review of 5-1-settings-view-with-manager-display-name (2026-05-02)

- `load()` not cancellation-safe on component unmount — local state setters fire on a dead component instance; pre-existing pattern across all hooks (`sdd-app/src/renderer/src/hooks/useSettings.ts`)
- No max length validation on manager name — unbounded string passes through to SQLite; sidebar Typography has no overflow/truncation styling; address in a UI hardening story (`sdd-app/src/main/handlers/settingsHandlers.ts`, `sdd-app/src/renderer/src/components/layout/Sidebar.tsx`)
- Whitespace-only name sends empty string to backend — handler correctly rejects it but the field visually shows spaces, making the error confusing; consider disabling Save when `draftName.trim() === ''` (`sdd-app/src/renderer/src/views/Settings.tsx`)
- Sidebar `load()` fires on every remount — rewrites `storedName` in Zustand, which shifts Settings' `isDirty` computation mid-edit; low risk in practice (SQLite read returns current value), but fragile if save-then-remount race occurs (`sdd-app/src/renderer/src/components/layout/Sidebar.tsx`)

## Deferred from: code review of 5-2-claude-api-key-configuration-and-model-selection (2026-05-02)

- `getApiKey` not wired to any IPC handler — intentional; needed by Story 6.5 main-process AI calls (`sdd-app/src/main/handlers/settingsHandlers.ts`)
- `clearApiKey` has no IPC handler — intentional; needed by Story 5.3 Danger Zone (`sdd-app/src/main/handlers/settingsHandlers.ts`)
- `getModel` returns stale invalid model from DB — VALID_MODELS enforcement is handler-only; acceptable for current fixed-list scope; revisit if model list changes (`sdd-app/src/main/settings/modelPreference.ts`)
- No test for `getApiKey` with corrupted/invalid base64 stored value — covered if patch for `decryptString` error handling is applied (`sdd-app/__tests__/main/settings/apiKey.test.ts`)

## Deferred from: code review of 5-3-danger-zone-clear-all-data (2026-05-02)

- `setKeyConfigured` typo `confused` instead of `configured` — pre-existing bug in appStore.ts, all calls to `setKeyConfigured` throw ReferenceError at runtime (`sdd-app/src/renderer/src/store/appStore.ts`)
- CASCADE relies on `foreign_keys = ON` pragma being active — spec-approved; pragma set in `database.ts` at startup; if a new DB connection ever omits the pragma, `behavior_log_entries` and `behavior_log_entry_competencies` silently stay behind (`sdd-app/src/main/db/clearAllData.ts`)
- Tests cannot verify cascade-deleted tables (`behavior_log_entries`, `behavior_log_entry_competencies`) — ABI mock limitation prevents real SQLite in Vitest; spec documents CASCADE explicitly as the deletion mechanism; gap is known and unfixable with current mock infrastructure (`sdd-app/__tests__/main/db/clearAllData.test.ts`)
- `resetUserData` limited to `selectedEmployee`/`selectedCompetency` — spec intentionally scopes this; `currentView` and employee list cache not reset; views reload from DB on navigation (`sdd-app/src/renderer/src/store/appStore.ts`)
- No integration/E2E test for dialog confirmation flow — dialog open/close/cancel not covered by automated tests; out of story scope; unit tests cover the DB layer (`sdd-app/src/renderer/src/views/Settings.tsx`)

## Deferred from: code review of 4-3-filter-log-entries-by-competency (2026-05-02)

- `load`'s `setError(null)` silently clears concurrent `loadCompetencies` errors — two independent useEffects fire on mount; if `loadCompetencies` sets an error, the near-simultaneous `load()` call's `setError(null)` clears it before render; pre-existing hook design (`sdd-app/src/renderer/src/hooks/useBehaviorLog.ts:12`)
- `afterEach(cleanup)` placed before imports — code organisation issue; `cleanup` called before ThemeProvider etc. are imported; works at runtime due to hoisting but misleads readers; pre-existing (`sdd-app/__tests__/renderer/components/CompetencyChip.test.tsx:6`)
- `aria-pressed` asserted via `getAttribute` instead of `toHaveAttribute` — raw `getAttribute` returns `null` if attribute absent, which would vacuously pass if component omits `aria-pressed` entirely; pre-existing pattern across existing tests (`sdd-app/__tests__/renderer/components/CompetencyChip.test.tsx`)

## Deferred from: code review of 6-1-evaluate-tab-with-competency-filter-and-evidence-display (2026-05-03)

- AC1 scroll position preservation — UX-DR10 scroll requirement is out of scope for Story 6.1; Scope Boundary explicitly excludes it; address if scroll restoration becomes a UX requirement in a future story (`sdd-app/src/renderer/src/views/EmployeeDetail.tsx`)
- `selectedCompetency` persists across non-`setEmployee` navigation paths — current code paths always call `setEmployee` which resets the value; latent risk only for future navigation flows that bypass `setEmployee` (`sdd-app/src/renderer/src/views/EmployeeDetail.tsx`)
- Shared `entries`/`isLoading` causes brief stale-data flash on tab switch — inherent to shared-hook design established in prior stories; requires per-tab state isolation to properly fix (`sdd-app/src/renderer/src/hooks/useBehaviorLog.ts`)
- Rapid competency switching race condition — no abort controller in `useBehaviorLog`; a slow first request resolving after a fast second one permanently shows wrong data; hook-level fix needed (`sdd-app/src/renderer/src/hooks/useBehaviorLog.ts`)
- Reverse-chronological order relies on hook/DB ordering — no explicit sort in Evaluate tab render; consistent with Behavior Log tab; if hook guarantees order the behavior is correct (`sdd-app/src/renderer/src/views/EmployeeDetail.tsx`)
- Description renders in full, not excerpted — AC4 says "description excerpt" but full text renders; consistent with Behavior Log tab; both tabs need truncation in a future UI polish story (`sdd-app/src/renderer/src/views/EmployeeDetail.tsx`)
- Table header/cell associations for multi-chip competency column — screen-reader navigation fragile for the competency chip column; consistent with Behavior Log tab; address in accessibility pass (`sdd-app/src/renderer/src/views/EmployeeDetail.tsx`)
- `entry.entryDate` rendered as raw string without locale formatting — consistent with Behavior Log tab; address in a future UI polish story (`sdd-app/src/renderer/src/views/EmployeeDetail.tsx`)
