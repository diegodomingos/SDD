# Story 5.2: Claude API Key Configuration and Model Selection

Status: done

## Story

As a manager,
I want to configure my Claude API key and choose the Claude model,
so that the AI evaluation feature can make real API calls securely.

## Acceptance Criteria

1. **Given** `src/main/settings/apiKey.ts` uses Electron `safeStorage`, **when** `setApiKey(db, key)` is called, **then** the key is encrypted via `safeStorage.encryptString()` and stored as base64 in the `settings` table — never written to disk in plaintext (NFR4)

2. **Given** `apiKey.ts`, **when** `isConfigured(db)` is called, **then** it returns `true` if an `api_key` row exists in the settings table, `false` otherwise — the raw key value is never returned to the renderer (NFR5)

3. **Given** `settingsHandlers.ts` implements `settings:set-api-key` and `settings:get-key-configured`, **when** `settings:get-key-configured` is invoked from the renderer, **then** it returns `{ ok: true, data: boolean }` — the raw key never crosses the IPC boundary, and the log statement uses `'(key redacted)'` (deferred-work requirement from Story 1.5 review)

4. **Given** the Settings view renders, **when** the API key section loads, **then** a masked password input is shown with its own Save button (enabled only when the input is non-empty) plus the trust note "API key is stored securely in your OS credential store" (UX-DR14)

5. **Given** the model selector renders in Settings, **when** the user opens the dropdown, **then** two options are available: "Claude Haiku 4.5 (default)" and "Claude Sonnet 4.6" — the current selection is persisted to the `settings` table and restored on next load

6. **Given** the API key field, **when** the key is saved, **then** the key value does not appear in any `electron-log` output, IPC error messages, or UI elements other than the masked input field (NFR5)

## Tasks / Subtasks

- [x] Task 1: Create `src/main/settings/apiKey.ts` (AC: 1, 2, 6)
  - [x] 1.1: Implement `setApiKey(db, key)` — `safeStorage.encryptString(key)` → `Buffer.toString('base64')` → `INSERT OR REPLACE INTO settings (key, value)` with key `'api_key'`
  - [x] 1.2: Implement `isConfigured(db)` — `SELECT 1 FROM settings WHERE key = 'api_key'`; return `row != null`
  - [x] 1.3: Implement `getApiKey(db)` — needed by Story 6.5 main-process AI calls; decrypt via `safeStorage.decryptString(Buffer.from(row.value, 'base64'))`; return `null` if row absent
  - [x] 1.4: Implement `clearApiKey(db)` — `DELETE FROM settings WHERE key = 'api_key'`; needed by Story 5.3

- [x] Task 2: Add `getModel` and `setModel` to `src/main/settings/modelPreference.ts` (AC: 5)
  - [x] 2.1: Implement `getModel(db)` — `SELECT value FROM settings WHERE key = 'model'`; return `row?.value ?? 'claude-haiku-4-5-20251001'`
  - [x] 2.2: Implement `setModel(db, model)` — `INSERT OR REPLACE INTO settings (key, value) VALUES ('model', ?)`

- [x] Task 3: Replace 4 stubs in `src/main/handlers/settingsHandlers.ts` (AC: 2, 3, 5, 6)
  - [x] 3.1: Add import `{ isConfigured, setApiKey }` from `'../settings/apiKey'` and extend existing import to include `{ getModel, setModel }` from `'../settings/modelPreference'`
  - [x] 3.2: Replace `settings:get-key-configured` stub — remove hardcoded `false`; add `if (!db)` guard; call `isConfigured(db)`; return `{ ok: true, data: configured }`
  - [x] 3.3: Replace `settings:set-api-key` stub — remove `void payload`; validate `payload.key?.trim()` non-empty; log `'[settings:set-api-key] (key redacted)'` NOT the key value; add `if (!db)` guard; call `setApiKey(db, payload.key.trim())`; return `{ ok: true, data: null }`
  - [x] 3.4: Replace `settings:get-model` stub — remove hardcoded string; add `if (!db)` guard; call `getModel(db)`; return `{ ok: true, data: model }`
  - [x] 3.5: Replace `settings:set-model` stub — remove `void payload`; validate `payload.model` is in `VALID_MODELS`; add `if (!db)` guard; call `setModel(db, payload.model)`; return `{ ok: true, data: null }`

- [x] Task 4: Add `keyConfigured` and `aiModel` to `src/renderer/src/store/appStore.ts` (AC: 4, 5)
  - [x] 4.1: Add `keyConfigured: boolean` (initial `false`) and `setKeyConfigured: (configured: boolean) => void` to `AppStore` interface and store definition
  - [x] 4.2: Add `aiModel: string` (initial `'claude-haiku-4-5-20251001'`) and `setAiModel: (model: string) => void` to `AppStore` interface and store definition

- [x] Task 5: Extend `src/renderer/src/hooks/useSettings.ts` (AC: 4, 5)
  - [x] 5.1: Add `isKeyConfigured`, `draftApiKey`/`setDraftApiKey`, `isSavingKey`, `draftModel`/`setDraftModel`, `isSavingModel` state variables
  - [x] 5.2: Add `setStoreKeyConfigured` and `setStoreAiModel` selectors from `useAppStore`
  - [x] 5.3: Rewrite `load()` to fetch manager name, key configured status, and model **in parallel** via `Promise.all`; update all state and store on each result; preserve `try/finally` pattern from Story 5.1 fix
  - [x] 5.4: Add `saveApiKey(key)` callback — invokes `settings:set-api-key`; on success: reset `draftApiKey` to `''`, set `isKeyConfigured(true)`, update `setStoreKeyConfigured(true)`; uses own `isSavingKey` flag; wraps in `try/finally`; returns `boolean`
  - [x] 5.5: Add `saveModel(model)` callback — invokes `settings:set-model`; on success: `setDraftModel(model)`, update `setStoreAiModel(model)`; uses own `isSavingModel` flag; wraps in `try/finally`; returns `boolean`

- [x] Task 6: Extend `src/renderer/src/views/Settings.tsx` (AC: 4, 5)
  - [x] 6.1: Add API key section (new `Box` block, same card style as manager name section): `TextField` with `type="password"`, width 280px, placeholder "Enter API key"; Save button enabled when `draftApiKey.trim().length > 0 && !isSavingKey`; `Typography` status line (`isKeyConfigured ? '✓ API key is configured' : 'No API key configured'`); `Typography` trust note "API key is stored securely in your OS credential store"
  - [x] 6.2: Add model selector section (new `Box` block, same card style): `Select` size="small", width 280px, value `draftModel`, `onChange` calls `setDraftModel`; two `MenuItem`s (see exact values below); Save button disabled when `draftModel === storedModel || isSavingModel`
  - [x] 6.3: Import `Select`, `MenuItem` from `'@mui/material'`; read `storedModel` from `useAppStore((s) => s.aiModel)`; the existing `useEffect(() => { load() }, [load])` already covers all three loads — no second `useEffect` needed

- [x] Task 7: Write tests (AC: 1, 2)
  - [x] 7.1: Create `sdd-app/__tests__/main/settings/apiKey.test.ts` — mock `electron` module with `vi.mock`; test `isConfigured` suite (row absent → false, row present → true); test `setApiKey` suite (calls `encryptString`, stores base64-encoded result); test `getApiKey` suite (row absent → null, row present → decrypted string via `decryptString`)
  - [x] 7.2: Extend `sdd-app/__tests__/main/settings/modelPreference.test.ts` — add `getModel` suite (returns `'claude-haiku-4-5-20251001'` when absent, returns stored value when present); add `setModel` suite (calls `run()` with `'model'` key and correct value)

- [x] Task 8: TypeScript + test suite
  - [x] `npx tsc --noEmit -p tsconfig.node.json --composite false` — zero errors
  - [x] `npx tsc --noEmit -p tsconfig.web.json --composite false` — zero errors
  - [x] `npm run test` — all existing 69 tests pass + new tests pass

## Dev Notes

### Files to Create / Modify

| File | Action | Notes |
|---|---|---|
| `sdd-app/src/main/settings/apiKey.ts` | CREATE | `setApiKey`, `isConfigured`, `getApiKey`, `clearApiKey` — same directory as `modelPreference.ts` |
| `sdd-app/src/main/settings/modelPreference.ts` | MODIFY | Add `getModel(db)`, `setModel(db, model)` — do NOT touch `getManagerName`/`setManagerName` |
| `sdd-app/src/main/handlers/settingsHandlers.ts` | MODIFY | Replace 4 stubs only — do NOT touch `get-manager-name`/`set-manager-name` handlers |
| `sdd-app/src/renderer/src/store/appStore.ts` | MODIFY | Add `keyConfigured` + `setKeyConfigured`, `aiModel` + `setAiModel` — do NOT remove/rename existing fields |
| `sdd-app/src/renderer/src/hooks/useSettings.ts` | MODIFY | Extend; rewrite `load()` for parallel fetch; add new state, `saveApiKey`, `saveModel` |
| `sdd-app/src/renderer/src/views/Settings.tsx` | MODIFY | Add API key + model selector `Box` blocks below manager name |
| `sdd-app/__tests__/main/settings/apiKey.test.ts` | CREATE | Mock `electron` module |
| `sdd-app/__tests__/main/settings/modelPreference.test.ts` | MODIFY | Add `getModel` + `setModel` suites |

**DO NOT touch:**
- `sdd-app/src/shared/ipc-types.ts` — `SetApiKeyPayload { key: string }` and `SetModelPayload { model: string }` already defined
- `sdd-app/src/main/db/database.ts` — `settings` table already created in schema
- `sdd-app/src/main/index.ts` — `registerSettingsHandlers()` already called
- `sdd-app/src/renderer/src/components/layout/Sidebar.tsx` — no changes needed for this story

---

### Task 1: `apiKey.ts` — New File

```ts
import { safeStorage } from 'electron'
import Database from 'better-sqlite3'

const SETTINGS_KEY = 'api_key'

export function setApiKey(db: Database.Database, key: string): void {
  const encrypted = safeStorage.encryptString(key)
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(
    SETTINGS_KEY,
    encrypted.toString('base64')
  )
}

export function getApiKey(db: Database.Database): string | null {
  const row = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(SETTINGS_KEY) as { value: string } | undefined
  if (!row) return null
  return safeStorage.decryptString(Buffer.from(row.value, 'base64'))
}

export function isConfigured(db: Database.Database): boolean {
  const row = db.prepare('SELECT 1 FROM settings WHERE key = ?').get(SETTINGS_KEY)
  return row != null
}

export function clearApiKey(db: Database.Database): void {
  db.prepare('DELETE FROM settings WHERE key = ?').run(SETTINGS_KEY)
}
```

Repository signature convention: first arg is `db: Database.Database`, matching `employees.ts`, `behaviorLog.ts`, `framework.ts`, `modelPreference.ts`.

`safeStorage` from Electron encrypts using the OS credential store key (Windows Credential Manager on Windows). The encrypted `Buffer` is stored as base64 text in the `settings` table — plaintext key never touches disk.

---

### Task 2: `modelPreference.ts` — Add Two Functions

Append to the existing file (do NOT replace existing `getManagerName`/`setManagerName`):

```ts
export function getModel(db: Database.Database): string {
  const row = db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get('model') as { value: string } | undefined
  return row?.value ?? 'claude-haiku-4-5-20251001'
}

export function setModel(db: Database.Database, model: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('model', model)
}
```

---

### Task 3: `settingsHandlers.ts` — Replace 4 Stubs

Add to the existing import block at top:
```ts
import { isConfigured, setApiKey } from '../settings/apiKey'
import { getManagerName, setManagerName, getModel, setModel } from '../settings/modelPreference'
```
*(The `getManagerName`, `setManagerName` import already exists — extend it to also include `getModel`, `setModel`.)*

Replace `settings:get-key-configured`:
```ts
ipcMain.handle('settings:get-key-configured', async (): Promise<IpcResult<boolean>> => {
  log.info('[settings:get-key-configured]')
  try {
    if (!db) return { ok: false, error: 'Database not ready.' }
    const configured = isConfigured(db)
    return { ok: true, data: configured }
  } catch (e) {
    log.error('[settings:get-key-configured] error: %s', e instanceof Error ? e.message : String(e))
    return { ok: false, error: 'Failed to get key configuration status.' }
  }
})
```

Replace `settings:set-api-key`:
```ts
ipcMain.handle(
  'settings:set-api-key',
  async (_event, payload: SetApiKeyPayload): Promise<IpcResult<null>> => {
    log.info('[settings:set-api-key] (key redacted)')
    try {
      if (!payload.key?.trim()) return { ok: false, error: 'API key is required.' }
      if (!db) return { ok: false, error: 'Database not ready.' }
      setApiKey(db, payload.key.trim())
      return { ok: true, data: null }
    } catch (e) {
      log.error('[settings:set-api-key] error (key redacted)')
      return { ok: false, error: 'Failed to save API key.' }
    }
  }
)
```
**SECURITY:** The `catch` block must NOT include `e.message` in the log — it might contain key material if `safeStorage` throws with context. Use the generic `'error (key redacted)'` form.

Replace `settings:get-model`:
```ts
ipcMain.handle('settings:get-model', async (): Promise<IpcResult<string>> => {
  log.info('[settings:get-model]')
  try {
    if (!db) return { ok: false, error: 'Database not ready.' }
    const model = getModel(db)
    return { ok: true, data: model }
  } catch (e) {
    log.error('[settings:get-model] error: %s', e instanceof Error ? e.message : String(e))
    return { ok: false, error: 'Failed to get model.' }
  }
})
```

Replace `settings:set-model`:
```ts
ipcMain.handle(
  'settings:set-model',
  async (_event, payload: SetModelPayload): Promise<IpcResult<null>> => {
    log.info('[settings:set-model]')
    const VALID_MODELS = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6']
    try {
      if (!VALID_MODELS.includes(payload.model)) {
        return { ok: false, error: 'Invalid model selection.' }
      }
      if (!db) return { ok: false, error: 'Database not ready.' }
      setModel(db, payload.model)
      return { ok: true, data: null }
    } catch (e) {
      log.error('[settings:set-model] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Failed to set model.' }
    }
  }
)
```

---

### Task 4: `appStore.ts` — Add 4 Fields

Add to the `AppStore` interface and store definition (do NOT modify existing fields):

```ts
interface AppStore {
  currentView: View
  selectedEmployee: Employee | null
  selectedCompetency: Competency | null
  managerName: string
  keyConfigured: boolean                              // ADD
  aiModel: string                                     // ADD
  setView: (view: View) => void
  setEmployee: (employee: Employee | null) => void
  setCompetency: (c: Competency | null) => void
  setManagerName: (name: string) => void
  setKeyConfigured: (configured: boolean) => void     // ADD
  setAiModel: (model: string) => void                 // ADD
}
```

Store definition additions:
```ts
export const useAppStore = create<AppStore>((set) => ({
  currentView: 'employees',
  selectedEmployee: null,
  selectedCompetency: null,
  managerName: '',
  keyConfigured: false,                               // ADD
  aiModel: 'claude-haiku-4-5-20251001',               // ADD
  setView: (view) => set({ currentView: view }),
  setEmployee: (employee) => set({ selectedEmployee: employee, selectedCompetency: null }),
  setCompetency: (c) => set({ selectedCompetency: c }),
  setManagerName: (name) => set({ managerName: name }),
  setKeyConfigured: (configured) => set({ keyConfigured: configured }),   // ADD
  setAiModel: (model) => set({ aiModel: model }),                         // ADD
}))
```

---

### Task 5: `useSettings.ts` — Extended Hook

Complete replacement of the file (all existing Story 5.1 logic is preserved, extensions added):

```ts
import { useState, useCallback } from 'react'
import { useAppStore } from '../store/appStore'

export function useSettings() {
  // Manager name (Story 5.1 — unchanged)
  const [draftName, setDraftName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setStoreName = useAppStore((s) => s.setManagerName)

  // API key (Story 5.2)
  const [isKeyConfigured, setIsKeyConfigured] = useState(false)
  const [draftApiKey, setDraftApiKey] = useState('')
  const [isSavingKey, setIsSavingKey] = useState(false)

  // Model (Story 5.2)
  const [draftModel, setDraftModel] = useState('claude-haiku-4-5-20251001')
  const [isSavingModel, setIsSavingModel] = useState(false)

  const setStoreKeyConfigured = useAppStore((s) => s.setKeyConfigured)
  const setStoreAiModel = useAppStore((s) => s.setAiModel)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [nameResult, keyResult, modelResult] = await Promise.all([
        window.electronAPI.invoke<string>('settings:get-manager-name'),
        window.electronAPI.invoke<boolean>('settings:get-key-configured'),
        window.electronAPI.invoke<string>('settings:get-model'),
      ])
      if (nameResult.ok) {
        setDraftName(nameResult.data)
        setStoreName(nameResult.data)
      } else {
        setError(nameResult.error)
      }
      if (keyResult.ok) {
        setIsKeyConfigured(keyResult.data)
        setStoreKeyConfigured(keyResult.data)
      } else {
        setError(keyResult.error)
      }
      if (modelResult.ok) {
        setDraftModel(modelResult.data)
        setStoreAiModel(modelResult.data)
      } else {
        setError(modelResult.error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [setStoreName, setStoreKeyConfigured, setStoreAiModel])

  const saveManagerName = useCallback(
    async (name: string): Promise<boolean> => {
      setIsSaving(true)
      setError(null)
      try {
        const result = await window.electronAPI.invoke<null>('settings:set-manager-name', { name })
        if (result.ok) {
          setDraftName(name)
          setStoreName(name)
        } else {
          setError(result.error)
        }
        return result.ok
      } finally {
        setIsSaving(false)
      }
    },
    [setStoreName]
  )

  const saveApiKey = useCallback(
    async (key: string): Promise<boolean> => {
      setIsSavingKey(true)
      setError(null)
      try {
        const result = await window.electronAPI.invoke<null>('settings:set-api-key', { key })
        if (result.ok) {
          setDraftApiKey('')
          setIsKeyConfigured(true)
          setStoreKeyConfigured(true)
        } else {
          setError(result.error)
        }
        return result.ok
      } finally {
        setIsSavingKey(false)
      }
    },
    [setStoreKeyConfigured]
  )

  const saveModel = useCallback(
    async (model: string): Promise<boolean> => {
      setIsSavingModel(true)
      setError(null)
      try {
        const result = await window.electronAPI.invoke<null>('settings:set-model', { model })
        if (result.ok) {
          setDraftModel(model)
          setStoreAiModel(model)
        } else {
          setError(result.error)
        }
        return result.ok
      } finally {
        setIsSavingModel(false)
      }
    },
    [setStoreAiModel]
  )

  return {
    draftName, setDraftName, isLoading, isSaving, error, load, saveManagerName,
    isKeyConfigured, draftApiKey, setDraftApiKey, isSavingKey, saveApiKey,
    draftModel, setDraftModel, isSavingModel, saveModel,
  }
}
```

**Notes:**
- `load()` deps array: `[setStoreName, setStoreKeyConfigured, setStoreAiModel]` — all are Zustand setters (stable, never change). Safe.
- Sidebar and Settings both call `load()`. Now makes 3 IPC calls instead of 1 on each mount. Acceptable overhead for a desktop app.
- `error` is shared across all sections. Last error wins. Acceptable for this scope.

---

### Task 6: `Settings.tsx` — API Key and Model Sections

Add imports:
```tsx
import { Select, MenuItem } from '@mui/material'
```

Read stored model from store (add alongside existing `storedName`):
```tsx
const storedModel = useAppStore((s) => s.aiModel)
```

Destructure new hook values:
```tsx
const {
  draftName, setDraftName, isLoading, isSaving, error, load, saveManagerName,
  isKeyConfigured, draftApiKey, setDraftApiKey, isSavingKey, saveApiKey,
  draftModel, setDraftModel, isSavingModel, saveModel,
} = useSettings()
```

Add handlers (below existing `handleSave`):
```tsx
const handleSaveKey = async () => {
  await saveApiKey(draftApiKey.trim())
}

const handleSaveModel = async () => {
  await saveModel(draftModel)
}
```

Add API key section (insert below the manager name `Box` block, before the closing `</Box>` of the page):
```tsx
{/* Claude API Key */}
<Box
  sx={{
    mb: 3,
    p: 2.5,
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
  }}
>
  <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 0.5 }}>
    Claude API Key
  </Typography>
  <Typography sx={{ fontSize: '13px', color: 'text.secondary', mb: 2 }}>
    {isKeyConfigured ? '✓ API key is configured' : 'No API key configured'}
  </Typography>
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
    <TextField
      type="password"
      size="small"
      value={draftApiKey}
      onChange={(e) => setDraftApiKey(e.target.value)}
      placeholder="Enter API key"
      sx={{ width: 280 }}
    />
    <Button
      variant="outlined"
      onClick={handleSaveKey}
      disabled={!draftApiKey.trim() || isSavingKey}
    >
      {isSavingKey ? 'Saving…' : 'Save'}
    </Button>
  </Box>
  <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>
    API key is stored securely in your OS credential store
  </Typography>
</Box>
```

Add model selector section (insert below the API key `Box` block):
```tsx
{/* Claude Model */}
<Box
  sx={{
    mb: 3,
    p: 2.5,
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
  }}
>
  <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 0.5 }}>
    Claude Model
  </Typography>
  <Typography sx={{ fontSize: '13px', color: 'text.secondary', mb: 2 }}>
    Model used for AI competency evaluation.
  </Typography>
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
    <Select
      size="small"
      value={draftModel}
      onChange={(e) => setDraftModel(e.target.value)}
      sx={{ width: 280 }}
    >
      <MenuItem value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (default)</MenuItem>
      <MenuItem value="claude-sonnet-4-6">Claude Sonnet 4.6</MenuItem>
    </Select>
    <Button
      variant="outlined"
      onClick={handleSaveModel}
      disabled={draftModel === storedModel || isSavingModel}
    >
      {isSavingModel ? 'Saving…' : 'Save'}
    </Button>
  </Box>
  {error && (
    <Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>
      {error}
    </Typography>
  )}
</Box>
```

**UX notes:**
- API key input is always empty on load (renderer never receives raw key, only `isConfigured: boolean`)
- Save button for API key is enabled as soon as input is non-empty (no dirty check against stored value — we never load the stored value)
- Model Save button uses dirty check: disabled when `draftModel === storedModel`
- Error display at bottom of model section covers all section errors (shared `error` state)
- No success toast for either section (UX-DR17)
- The single `useEffect(() => { load() }, [load])` from Story 5.1 already handles loading all three values — do NOT add a second `useEffect`

---

### Task 7: Tests

#### `apiKey.test.ts` — New File

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Database from 'better-sqlite3'

vi.mock('electron', () => ({
  safeStorage: {
    encryptString: vi.fn((str: string) => Buffer.from(str, 'utf-8')),
    decryptString: vi.fn((buf: Buffer) => buf.toString('utf-8')),
  },
}))

import { safeStorage } from 'electron'
import { setApiKey, getApiKey, isConfigured } from '../../../src/main/settings/apiKey'

function mockDb(getResult: object | undefined, runSpy?: () => void): Database.Database {
  return {
    prepare: (_sql: string) => ({
      get: (..._args: unknown[]) => getResult,
      run: (..._args: unknown[]) => {
        if (runSpy) runSpy()
        return { changes: 1 }
      },
    }),
  } as unknown as Database.Database
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('isConfigured', () => {
  it('returns false when no row in db', () => {
    const db = mockDb(undefined)
    expect(isConfigured(db)).toBe(false)
  })

  it('returns true when row exists', () => {
    const db = mockDb({ 1: 1 })
    expect(isConfigured(db)).toBe(true)
  })
})

describe('setApiKey', () => {
  it('calls encryptString and stores base64-encoded result', () => {
    let storedArgs: unknown[] = []
    const db = {
      prepare: (_sql: string) => ({
        run: (...args: unknown[]) => { storedArgs = args; return { changes: 1 } },
      }),
    } as unknown as Database.Database

    setApiKey(db, 'sk-test-key')

    expect(safeStorage.encryptString).toHaveBeenCalledWith('sk-test-key')
    expect(storedArgs[0]).toBe('api_key')
    expect(typeof storedArgs[1]).toBe('string')
    // stored value is base64 of the Buffer returned by the mock encryptString
    expect(storedArgs[1]).toBe(Buffer.from('sk-test-key', 'utf-8').toString('base64'))
  })
})

describe('getApiKey', () => {
  it('returns null when no row in db', () => {
    const db = mockDb(undefined)
    expect(getApiKey(db)).toBeNull()
  })

  it('calls decryptString and returns decrypted key', () => {
    const encoded = Buffer.from('sk-my-key', 'utf-8').toString('base64')
    const db = mockDb({ value: encoded })
    const result = getApiKey(db)
    expect(safeStorage.decryptString).toHaveBeenCalled()
    expect(result).toBe('sk-my-key')
  })
})
```

**Why `vi.mock` before import:** Vitest hoists `vi.mock` calls. The mock must be declared before the `import` that uses `electron` so the module factory runs first.

#### `modelPreference.test.ts` — Add to Existing File

Append two new `describe` blocks to the existing file (do NOT replace the `getManagerName`/`setManagerName` tests):

```ts
describe('getModel', () => {
  it('returns default model when row is absent', () => {
    const db = mockDb(undefined)
    expect(getModel(db)).toBe('claude-haiku-4-5-20251001')
  })

  it('returns stored value when row exists', () => {
    const db = mockDb({ value: 'claude-sonnet-4-6' })
    expect(getModel(db)).toBe('claude-sonnet-4-6')
  })
})

describe('setModel', () => {
  it('calls run() with model key and correct value', () => {
    let runArgs: unknown[] = []
    const db = {
      prepare: (_sql: string) => ({
        run: (...args: unknown[]) => { runArgs = args; return { changes: 1 } },
      }),
    } as unknown as Database.Database
    setModel(db, 'claude-sonnet-4-6')
    expect(runArgs[0]).toBe('model')
    expect(runArgs[1]).toBe('claude-sonnet-4-6')
  })
})
```

Also update the import at the top of `modelPreference.test.ts` to include the new functions:
```ts
import { getManagerName, setManagerName, getModel, setModel } from '../../../src/main/settings/modelPreference'
```

---

### Architecture Compliance

| Rule | Applied here |
|---|---|
| No SQL in handlers | SQL in `apiKey.ts` and `modelPreference.ts`; handlers delegate |
| `safeStorage` main-process only | `apiKey.ts` imports from `'electron'` — renderer never imports it |
| Raw key never crosses IPC boundary | `get-key-configured` returns `boolean`, not the key; `get-model` and `get-manager-name` are safe; raw key in `set-api-key` stays in main process |
| API key never logged | `set-api-key` log uses `'(key redacted)'`; catch block uses generic message |
| `IpcResult<T>` discriminated union | `get-key-configured` → `IpcResult<boolean>`, `set-api-key` → `IpcResult<null>`, `get-model` → `IpcResult<string>`, `set-model` → `IpcResult<null>` |
| Repository pattern (first arg = db) | `setApiKey(db, key)`, `isConfigured(db)`, `getModel(db)`, `setModel(db, model)` |
| Components use hooks, not IPC directly | `Settings.tsx` calls `useSettings()`; never calls `window.electronAPI` directly |
| `camelCase` TypeScript | `isKeyConfigured`, `setKeyConfigured`, `draftApiKey`, `isSavingKey`, `aiModel`, `setAiModel`, `draftModel`, `isSavingModel` |

---

### Previous Story Intelligence (Story 5.1)

- **ABI mismatch pattern**: `better-sqlite3` (Electron ABI 140) vs Vitest (Node ABI 137). Use `mockDb()` factory for ALL DB tests. Do NOT use real SQLite in tests.
- **Vitest `vi.mock` hoisting**: `vi.mock('electron', ...)` in `apiKey.test.ts` must be declared at the top before any `import` that transitively uses `electron`. Vitest hoists `vi.mock` calls so this is fine syntactically, but declare early to be explicit.
- **`void payload` removal**: Story 5.1 confirmed — when replacing a stub body, remove the `void payload` guard since the payload is now actively used. Both `set-api-key` and `set-model` have `void payload` in their current stubs.
- **Handler `db` guard pattern**: Story 5.1 introduced `if (!db) return { ok: false, error: 'Database not ready.' }` — use this same guard in all 4 new handler implementations.
- **Zustand selector style**: `useAppStore((s) => s.someField)` — follow this pattern for `keyConfigured` and `aiModel`.
- **`useCallback` deps with Zustand setters**: Zustand setters are stable (referentially equal across renders). Include them in deps arrays for correctness without causing unnecessary re-creation.
- **`try/finally` in hooks**: Story 5.1 review found that missing `try/finally` caused `isSaving` to get stuck. ALL new save callbacks (`saveApiKey`, `saveModel`) must wrap in `try/finally` to reset their respective saving flags.
- **Test count after 5.1**: 69 tests across 8 files. Story 5.2 adds tests in `apiKey.test.ts` (new file) and extends `modelPreference.test.ts`. Expected final count: ~80+ tests.

---

### Scope Boundary Notes

- **5.2 scope: API key + model only.** Do NOT add the Danger Zone ("Clear all data") to `Settings.tsx` — that is Story 5.3's scope.
- **`clearApiKey` is in scope** to implement in `apiKey.ts` (it's a companion to `setApiKey` and needed by 5.3). Do NOT wire it to a handler or UI in this story.
- **`getApiKey` is in scope** to implement in `apiKey.ts` (needed by Story 6.5 for actual API calls). Do NOT call it from any handler in this story — the main process never returns the raw key over IPC.
- **Model validation**: `VALID_MODELS` array defined inline in the handler. Story 6.5 will use these same model IDs when constructing Claude API calls.
- **`aiModel` vs `model`**: Zustand store uses `aiModel`/`setAiModel` to avoid ambiguity with the hook-local `draftModel` and the IPC payload field `model`. The dev agent should NOT rename these.
- **Settings.tsx `isLoading` spinner**: The existing loading spinner only covers the manager name section (`{isLoading ? <CircularProgress /> : ...}`). For Story 5.2, API key and model sections can render their placeholders immediately (empty input, default model value) — no need to gate them behind `isLoading`. The `draftModel` starts with the default; it updates when `load()` resolves.

---

### Security Requirements (NFR4, NFR5)

- `safeStorage.encryptString(key)` must be called in the **main process** only (`apiKey.ts`). Never import or call `safeStorage` in the renderer or preload.
- The `settings:set-api-key` IPC handler validates the key is non-empty, calls `setApiKey`, and returns `{ ok: true, data: null }`. The key value itself is never in any return value, log statement, or error message.
- The `catch` block in `settings:set-api-key` uses the generic log message `'[settings:set-api-key] error (key redacted)'` — never `String(e)` or `e.message`, which might contain key material from a `safeStorage` exception.
- The `settings:get-key-configured` IPC handler returns only a `boolean`. The renderer learns whether a key is stored, nothing more.
- `getApiKey(db)` is main-process-only. It is implemented here for Story 6.5. Do NOT add an IPC handler that calls it.

---

### UX Requirements Mapping

| Requirement | Implementation |
|---|---|
| UX-DR14: API key masked field with trust note | `TextField type="password"` + `Typography` "API key is stored securely in your OS credential store" |
| UX-DR14: Model selector, Haiku default / Sonnet option | `Select` with two `MenuItem`s; default value `'claude-haiku-4-5-20251001'` from `getModel` |
| UX-DR14: Each field independently saveable | API key has own Save; model has own Save; no global submit |
| UX-DR17: No success toast | Save button returning to non-dirty/non-saving state IS the confirmation |
| NFR5: Key never in logs or IPC | Enforced in handler implementation — see Security Requirements above |

### References

- [Source: architecture.md — Authentication & Security]
- [Source: architecture.md — IPC Channel Naming]
- [Source: architecture.md — Project Structure, Settings Files]
- [Source: epics.md — Story 5.2 Acceptance Criteria]
- [Source: ux-design-specification.md — UX-DR14, Button Hierarchy]
- [Source: deferred-work.md — Story 1.5 review: `settings:set-api-key` log redaction pattern]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none)

### Completion Notes List

- All 8 tasks completed; all 6 ACs satisfied.
- `apiKey.ts`: Created `sdd-app/src/main/settings/apiKey.ts`. Implements `setApiKey(db, key)` — encrypts via `safeStorage.encryptString()`, stores as base64 in `settings` table with key `'api_key'`; `isConfigured(db)` — checks row existence; `getApiKey(db)` — decrypts and returns key (for Story 6.5 main-process use only, never over IPC); `clearApiKey(db)` — deletes row (for Story 5.3). Repository pattern (db as first arg) matches all other repository files.
- `modelPreference.ts`: Added `getModel(db)` — reads `'model'` key from settings table, returns `'claude-haiku-4-5-20251001'` as default; `setModel(db, model)` — upserts via INSERT OR REPLACE. Existing `getManagerName`/`setManagerName` functions untouched.
- `settingsHandlers.ts`: Added imports for `{ isConfigured, setApiKey }` from apiKey and extended modelPreference import to include `{ getModel, setModel }`. Replaced 4 stubs: `get-key-configured` now calls `isConfigured(db)` with db guard; `set-api-key` validates non-empty key, logs `'(key redacted)'`, never logs key value in either log or error; `get-model` calls `getModel(db)` with db guard; `set-model` validates against VALID_MODELS array, calls `setModel(db, payload.model)`. Both manager-name handlers untouched.
- `appStore.ts`: Added `keyConfigured: boolean` (initial `false`), `aiModel: string` (initial `'claude-haiku-4-5-20251001'`), `setKeyConfigured`, `setAiModel` to AppStore interface and store definition. No existing fields modified.
- `useSettings.ts`: Extended hook with new state for API key (`isKeyConfigured`, `draftApiKey`, `isSavingKey`) and model (`draftModel`, `isSavingModel`). Rewrote `load()` to use `Promise.all` for parallel fetch of all 3 settings. Added `saveApiKey(key)` — on success clears input and sets configured=true in both local state and store; added `saveModel(model)` — on success updates local and store model. All save callbacks wrapped in `try/finally` per Story 5.1 review finding.
- `Settings.tsx`: Added Claude API Key card section with masked `TextField` (type="password"), status text showing configured state, own Save button (enabled when non-empty), and trust note. Added Claude Model card section with MUI `Select` dropdown (Haiku 4.5 / Sonnet 4.6), own Save button (disabled when not dirty). Imported `Select`, `MenuItem` from `@mui/material`. No second `useEffect` needed — existing `load()` effect covers all three values. No Danger Zone — that is Story 5.3.
- Tests: `apiKey.test.ts` — 5 tests using `vi.mock('electron', ...)` pattern; `isConfigured` (absent→false, present→true), `setApiKey` (calls encryptString, stores base64), `getApiKey` (absent→null, present→decrypted). `modelPreference.test.ts` — added `getModel` (2 tests) and `setModel` (1 test) suites. Existing `getManagerName`/`setManagerName` tests unmodified.
- Final test count: 77 tests across 9 files, all passing. Zero TypeScript errors on both `tsconfig.node.json` and `tsconfig.web.json`.

### File List

**Created:**
- `sdd-app/src/main/settings/apiKey.ts`
- `sdd-app/__tests__/main/settings/apiKey.test.ts`

**Modified:**
- `sdd-app/src/main/settings/modelPreference.ts`
- `sdd-app/src/main/handlers/settingsHandlers.ts`
- `sdd-app/src/renderer/src/store/appStore.ts`
- `sdd-app/src/renderer/src/hooks/useSettings.ts`
- `sdd-app/src/renderer/src/views/Settings.tsx`
- `sdd-app/__tests__/main/settings/modelPreference.test.ts`

### Review Findings

- [x] [Review][Done] safeStorage.isEncryptionAvailable() not checked — On Linux/some systems safeStorage encryption can be unavailable; calling `encryptString`/`decryptString` without checking throws; the catch block only surfaces a generic "Failed to save API key." message with no actionable guidance. Needs decision: fail gracefully with user-facing error, disable feature on unavailable platforms, or accept current behavior.
- [x] [Review][Done] Shared error state — API key save errors are stored in shared `error` state but displayed only in the model section; multiple `load()` failures silently overwrite each other (last error wins). Needs decision: introduce per-section error states, or accept current single-error-channel design.
- [x] [Review][Done] Status line layout deviation (AC4/UX-DR14) — Spec Task 6.1 describes a distinct Typography "status line" element; implementation uses the status text as the section's leading subtitle (`mb: 2`). Needs decision: match spec layout or accept current placement.

- [x] [Review][Done] payload null/undefined crash in IPC handlers — `payload.key?.trim()` in `set-api-key` and `VALID_MODELS.includes(payload.model)` in `set-model` access properties before null-checking `payload` itself; a malformed IPC call throws TypeError before the try block [sdd-app/src/main/handlers/settingsHandlers.ts]
- [x] [Review][Done] load() Promise.all rejection unhandled — if any IPC call rejects, the error propagates out of `load()` with no `setError()` call; user sees no error message [sdd-app/src/renderer/src/hooks/useSettings.ts]
- [x] [Review][Done] draftModel/storedModel race — Save button incorrectly enabled before initial load completes when stored model differs from the default [sdd-app/src/renderer/src/views/Settings.tsx]
- [x] [Review][Done] saveApiKey/saveModel IPC rejection propagates as unhandled rejection — `try/finally` without `catch` means a rejected `invoke()` propagates uncaught to callers in Settings.tsx [sdd-app/src/renderer/src/hooks/useSettings.ts]
- [x] [Review][Done] safeStorage.decryptString throws on corrupted ciphertext — `getApiKey` passes `Buffer.from(row.value, 'base64')` to `decryptString` with no error handling [sdd-app/src/main/settings/apiKey.ts]
- [x] [Review][Done] Log fires before validation in set-api-key — `log.info('[settings:set-api-key] (key redacted)')` executes unconditionally before the `!payload.key?.trim()` guard; spec Task 3.3 specifies validate then log [sdd-app/src/main/handlers/settingsHandlers.ts]

- [x] [Review][Defer] getApiKey not wired to any IPC handler [sdd-app/src/main/handlers/settingsHandlers.ts] — deferred, pre-existing; intentional, needed by Story 6.5
- [x] [Review][Defer] clearApiKey has no IPC handler [sdd-app/src/main/handlers/settingsHandlers.ts] — deferred, pre-existing; intentional, needed by Story 5.3
- [x] [Review][Defer] getModel returns stale invalid model from DB — VALID_MODELS enforcement is handler-only; acceptable for current fixed-list scope [sdd-app/src/main/settings/modelPreference.ts] — deferred, pre-existing
- [x] [Review][Defer] No test for getApiKey with corrupted/invalid base64 stored value [sdd-app/__tests__/main/settings/apiKey.test.ts] — deferred, pre-existing
