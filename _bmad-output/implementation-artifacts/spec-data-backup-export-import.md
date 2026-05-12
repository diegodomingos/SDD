---
title: 'Data Backup: Export and Import'
type: 'feature'
created: '2026-05-11'
status: 'done'
baseline_commit: '39fb7b46846d3d1410d40ce89b86b6cd6d9addfa'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** There is no way to back up or restore app data, so users risk losing all employees, behavior logs, and competency framework configurations if their machine fails or they reinstall.

**Approach:** Add Export and Import buttons to the Settings screen. Export collects all DB data (excluding the API key) and writes it to a user-chosen JSON file via Electron's save dialog. Import reads a backup JSON, validates it, and atomically replaces all DB data.

## Boundaries & Constraints

**Always:**
- Export must never include the API key (stored in `safeStorage` — it's a secret)
- File dialogs (`showSaveDialog`, `showOpenDialog`) run in the main process inside IPC handlers — renderer only invokes the channel
- Import replaces data atomically in a single SQLite transaction; partial imports are not possible
- Import validates `version: 1` before writing; reject any file missing it
- Both handlers return `{ ok: true, data: 'cancelled' }` when the user dismisses the file dialog, `{ ok: false, error: '...' }` on failure
- Original row IDs are preserved on import (explicit `INSERT` with `id`) so FK references survive

**Ask First:**
- If a new DB table is added to the schema, confirm whether it belongs in the backup before adding it

**Never:**
- Include the Claude API key in the export JSON
- Merge/append on import — import is always a full replace (same destructive semantics as "Clear all data")
- Pull in external serialization libraries — use built-in `JSON.stringify`/`JSON.parse`

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Export happy path | DB has data | JSON file saved; `{ ok: true, data: 'saved' }` | — |
| Export cancelled | User dismisses save dialog | `{ ok: true, data: 'cancelled' }`; no file written | — |
| Import happy path | Valid v1 backup JSON | All DB data replaced atomically; `{ ok: true, data: 'imported' }` | — |
| Import cancelled | User dismisses open dialog | `{ ok: true, data: 'cancelled' }`; DB untouched | — |
| Import invalid JSON | Malformed or non-JSON file | `{ ok: false, error: 'Invalid backup file.' }` | Transaction never starts |
| Import wrong version | JSON lacks `version: 1` | `{ ok: false, error: 'Unsupported backup version.' }` | Transaction never starts |
| Import DB error | SQLite write fails mid-transaction | Transaction rolled back; DB in original state; `{ ok: false, error: '...' }` | |

</frozen-after-approval>

## Code Map

- `sdd-app/src/main/db/backup.ts` — NEW: `exportData(db)` and `importData(db, payload)` DB functions
- `sdd-app/src/shared/ipc-types.ts` — ADD `BackupPayload` interface (shared type for export/import)
- `sdd-app/src/main/handlers/settingsHandlers.ts` — ADD `settings:export-data` and `settings:import-data` handlers (file dialogs + FS reads/writes live here)
- `sdd-app/src/preload/index.ts` — ADD the two new channels to `ALLOWED_CHANNELS`
- `sdd-app/src/renderer/src/hooks/useSettings.ts` — ADD `exportData`, `importData` callbacks and their associated loading/error state
- `sdd-app/src/renderer/src/views/Settings.tsx` — ADD "Data Backup" section (non-danger) with Export and Import buttons; Import shows a confirmation dialog before invoking the channel

## Tasks & Acceptance

**Execution:**
- [x] `sdd-app/src/shared/ipc-types.ts` -- ADD `BackupPayload` interface with fields: `version: 1`, `exportedAt: string`, `employees: Array<{id,name,level,createdAt}>`, `expectedBehaviors: Array<{competencyId,level,description}>`, `behaviorLogEntries: Array<{id,employeeId,description,entryDate,createdAt}>`, `behaviorLogEntryCompetencies: Array<{entryId,competencyId}>`, `settings: Record<string, string>` -- type-safe contract between main and renderer
- [x] `sdd-app/src/main/db/backup.ts` -- CREATE with two functions:
  - `exportData(db)`: queries all five table groups (employees; expected_behaviors; behavior_log_entries; behavior_log_entry_competencies; settings WHERE key IN ('manager_name','model')) and returns a `BackupPayload` with `version: 1` and `exportedAt: new Date().toISOString()`
  - `importData(db, backup)`: runs a single transaction — deletes expected_behaviors, behavior_log_entries (cascades to junction table), employees; then inserts each row from the backup with explicit `id` values using `INSERT INTO ... VALUES`; restores settings rows
- [x] `sdd-app/src/main/handlers/settingsHandlers.ts` -- ADD two handlers using `import { dialog } from 'electron'` and `import { readFileSync, writeFileSync } from 'node:fs'`:
  - `settings:export-data`: call `dialog.showSaveDialog({ defaultPath: 'sdd-backup-YYYY-MM-DD.json', filters: [{name:'JSON',extensions:['json']}] })`; if cancelled return `{ok:true,data:'cancelled'}`; else call `exportData(db)`, write JSON, return `{ok:true,data:'saved'}`
  - `settings:import-data`: call `dialog.showOpenDialog({ filters: [{name:'JSON',extensions:['json']}], properties:['openFile'] })`; if cancelled return `{ok:true,data:'cancelled'}`; read file, parse JSON, validate `version===1`, call `importData(db,backup)`, return `{ok:true,data:'imported'}`
- [x] `sdd-app/src/preload/index.ts` -- ADD `'settings:export-data'` and `'settings:import-data'` to `ALLOWED_CHANNELS`
- [x] `sdd-app/src/renderer/src/hooks/useSettings.ts` -- ADD `isExporting`, `exportError`, `isImporting`, `importError` state; `exportData` callback invokes `settings:export-data` and returns `'saved' | 'cancelled' | null` (null on error); `importData` callback invokes `settings:import-data`, on success calls `load()` to refresh settings; return all new state/callbacks from the hook
- [x] `sdd-app/src/renderer/src/views/Settings.tsx` -- ADD "Data Backup" section inserted between the "AI Configuration" section and the "Data Management" (danger) section; UI spec:
  - Outer `Box`: same styling as General and AI Configuration sections (`bgcolor: 'background.paper'`, `border: '1px solid'`, `borderColor: 'divider'`, `borderRadius: 1`, `overflow: 'hidden'`, `mb: 3`)
  - `<SectionHeader label="Data Backup" />` (non-danger, no `danger` prop)
  - Inner `Box sx={{ p: 2.5 }}`; two subsections stacked vertically with `mb: 2` between them:
    - **Export row:** `<Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 1 }}>Export Data</Typography>`; `<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>`; description `<Typography sx={{ fontSize: '13px', color: 'text.secondary', flex: 1 }}>Save all app data to a JSON backup file.</Typography>`; `<Button variant="outlined" size="small" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }} onClick={handleExport} disabled={isExporting}>{isExporting ? 'Exporting…' : 'Export backup'}</Button>`
    - Export success message (when `exportSuccess === true`): `<Typography sx={{ fontSize: '12px', color: '#059669', mt: 0.75 }}>Backup exported successfully.</Typography>`
    - Export error (when `exportError`): `<Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>{exportError}</Typography>`
    - **Import row:** same layout as Export row; description `<Typography sx={{ fontSize: '13px', color: 'text.secondary', flex: 1 }}>Restore data from a backup file. This will overwrite all current data.</Typography>`; `<Button variant="outlined" size="small" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }} onClick={() => setImportConfirmOpen(true)} disabled={isImporting}>{isImporting ? 'Importing…' : 'Import backup'}</Button>`
    - Import success message (when `importSuccess === true`): `<Typography sx={{ fontSize: '12px', color: '#059669', mt: 0.75 }}>Data restored successfully.</Typography>`
    - Import error (when `importError`): `<Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>{importError}</Typography>`
  - Import confirmation `<Dialog>`: same pattern as the existing "Clear all data" dialog (`Dialog`, `DialogTitle`, `DialogContent`, `DialogContentText`, `DialogActions`); title "Import backup?"; body "All current data will be replaced by the backup. This cannot be undone."; actions: `<Button onClick={() => setImportConfirmOpen(false)}>Cancel</Button>` and `<Button onClick={handleImportConfirm} disabled={isImporting}>Import</Button>`
  - `exportSuccess` and `importSuccess` are local `boolean` state; set to `true` on successful operation; reset to `false` whenever the opposing action starts or on error

**Acceptance Criteria:**
- Given the Settings screen renders, then a "Data Backup" section is visible above "Data Management" with "Export backup" and "Import backup" buttons
- Given the user clicks "Export backup" and picks a file path, then a JSON file is written containing `version: 1`, all employees, behavior log entries, expected behaviors, and non-sensitive settings, with no API key present
- Given the user clicks "Import backup", confirms the dialog, and picks a valid backup file, then all DB data is atomically replaced and the Settings view reflects any restored manager name / model preference
- Given the user dismisses either file dialog, then no data changes and no error message is shown
- Given a malformed or wrong-version JSON file is selected for import, then an error message is shown inline and no data is changed

## Design Notes

**Insert order on import:** employees first (FK target), then behavior_log_entries (FK to employees), then behavior_log_entry_competencies (FK to entries). `expected_behaviors` references competencies (seeded, not exported) — insert after employees.

**Competencies not exported:** The four competencies (Communication, Client Focus, Proactivity, Teamwork) are seeded on DB init and their IDs are stable. Exporting them would complicate import without benefit.

**Post-import state sync:** Calling `load()` in the hook after a successful import refreshes manager name and model in Zustand. Other views (employee list, behavior log) re-fetch from IPC on their next mount/navigation, so no additional broadcast is needed.

## Verification

**Commands:**
- `cd sdd-app && npm run typecheck` -- expected: zero type errors
- `cd sdd-app && npm run lint` -- expected: zero lint warnings or errors

## Suggested Review Order

**Entry point — data shape and atomic replace**

- Start here: `exportData` shows exactly what data is captured and how it's structured
  [`backup.ts:31`](../../sdd-app/src/main/db/backup.ts#L31)

- Core logic: transaction deletes then re-inserts with FK-safe ordering
  [`backup.ts:85`](../../sdd-app/src/main/db/backup.ts#L85)

**Data contract**

- Shared typed shape that flows between main process and renderer
  [`ipc-types.ts:108`](../../sdd-app/src/shared/ipc-types.ts#L108)

**Security & validation**

- Version gate: rejects non-v1 files before any write
  [`settingsHandlers.ts:162`](../../sdd-app/src/main/handlers/settingsHandlers.ts#L162)

- Structural guard: Array.isArray checks before loops prevent crash-inside-transaction
  [`settingsHandlers.ts:163`](../../sdd-app/src/main/handlers/settingsHandlers.ts#L163)

- Allowlist: only 'manager_name' and 'model' keys accepted from backup settings
  [`backup.ts:119`](../../sdd-app/src/main/db/backup.ts#L119)

**IPC boundary (main process)**

- Export handler: save dialog and file write run in main, not renderer
  [`settingsHandlers.ts:128`](../../sdd-app/src/main/handlers/settingsHandlers.ts#L128)

- Import handler: open dialog, read, validate, call importData
  [`settingsHandlers.ts:147`](../../sdd-app/src/main/handlers/settingsHandlers.ts#L147)

- Preload: two new channels added to the allowlist
  [`index.ts:23`](../../sdd-app/src/preload/index.ts#L23)

**Renderer hook**

- exportData callback: loading/success/error state; clears opposing success flag
  [`useSettings.ts:171`](../../sdd-app/src/renderer/src/hooks/useSettings.ts#L171)

- importData callback: calls load() after success to sync manager name and model
  [`useSettings.ts:193`](../../sdd-app/src/renderer/src/hooks/useSettings.ts#L193)

**UI**

- Data Backup section placement — between AI Configuration and Data Management (danger)
  [`Settings.tsx:285`](../../sdd-app/src/renderer/src/views/Settings.tsx#L285)

- Import confirmation dialog — same Dialog pattern as "Clear all data"
  [`Settings.tsx:399`](../../sdd-app/src/renderer/src/views/Settings.tsx#L399)
