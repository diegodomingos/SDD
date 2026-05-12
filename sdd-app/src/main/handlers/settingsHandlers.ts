import { ipcMain, safeStorage, dialog } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import log from 'electron-log/main'
import type {
  IpcResult,
  SetApiKeyPayload,
  SetModelPayload,
  SetManagerNamePayload,
  BackupPayload
} from '../../shared/ipc-types'
import { db } from '../db/database'
import { getManagerName, setManagerName, getModel, setModel } from '../settings/modelPreference'
import { isConfigured, setApiKey } from '../settings/apiKey'
import { clearAllData } from '../db/clearAllData'
import { exportData, importData } from '../db/backup'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get-manager-name', async (): Promise<IpcResult<string>> => {
    log.info('[settings:get-manager-name]')
    try {
      if (!db) return { ok: false, error: 'Database not ready.' }
      const name = getManagerName(db)
      return { ok: true, data: name }
    } catch (e) {
      log.error('[settings:get-manager-name] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Failed to get manager name.' }
    }
  })

  ipcMain.handle(
    'settings:set-manager-name',
    async (_event, payload: SetManagerNamePayload): Promise<IpcResult<null>> => {
      log.info('[settings:set-manager-name]')
      try {
        if (!payload.name?.trim()) return { ok: false, error: 'Manager name is required.' }
        if (!db) return { ok: false, error: 'Database not ready.' }
        setManagerName(db, payload.name.trim())
        return { ok: true, data: null }
      } catch (e) {
        log.error(
          '[settings:set-manager-name] error: %s',
          e instanceof Error ? e.message : String(e)
        )
        return { ok: false, error: 'Failed to set manager name.' }
      }
    }
  )

  ipcMain.handle('settings:get-key-configured', async (): Promise<IpcResult<boolean>> => {
    log.info('[settings:get-key-configured]')
    try {
      if (!db) return { ok: false, error: 'Database not ready.' }
      const configured = isConfigured(db)
      return { ok: true, data: configured }
    } catch (e) {
      log.error(
        '[settings:get-key-configured] error: %s',
        e instanceof Error ? e.message : String(e)
      )
      return { ok: false, error: 'Failed to get key configuration status.' }
    }
  })

  ipcMain.handle(
    'settings:set-api-key',
    async (_event, payload: SetApiKeyPayload): Promise<IpcResult<null>> => {
      try {
        if (!payload) return { ok: false, error: 'Invalid request.' }
        if (!payload.key?.trim()) return { ok: false, error: 'API key is required.' }
        log.info('[settings:set-api-key] (key redacted)')
        if (!db) return { ok: false, error: 'Database not ready.' }
        if (!safeStorage.isEncryptionAvailable()) {
          return { ok: false, error: 'Secure storage is not available on this system.' }
        }
        setApiKey(db, payload.key.trim())
        return { ok: true, data: null }
      } catch {
        log.error('[settings:set-api-key] error (key redacted)')
        return { ok: false, error: 'Failed to save API key.' }
      }
    }
  )

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

  ipcMain.handle(
    'settings:set-model',
    async (_event, payload: SetModelPayload): Promise<IpcResult<null>> => {
      log.info('[settings:set-model]')
      const VALID_MODELS = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6']
      try {
        if (!payload) return { ok: false, error: 'Invalid request.' }
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

  ipcMain.handle('settings:clear-all-data', async (): Promise<IpcResult<null>> => {
    log.info('[settings:clear-all-data]')
    try {
      if (!db) return { ok: false, error: 'Database not ready.' }
      clearAllData(db)
      return { ok: true, data: null }
    } catch (e) {
      log.error('[settings:clear-all-data] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Failed to clear data.' }
    }
  })

  ipcMain.handle('settings:export-data', async (): Promise<IpcResult<'saved' | 'cancelled'>> => {
    log.info('[settings:export-data]')
    try {
      if (!db) return { ok: false, error: 'Database not ready.' }
      const date = new Date().toISOString().slice(0, 10)
      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: `sdd-backup-${date}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      })
      if (canceled || !filePath) return { ok: true, data: 'cancelled' }
      const payload = exportData(db)
      writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8')
      return { ok: true, data: 'saved' }
    } catch (e) {
      log.error('[settings:export-data] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Failed to export data.' }
    }
  })

  ipcMain.handle('settings:import-data', async (): Promise<IpcResult<'imported' | 'cancelled'>> => {
    log.info('[settings:import-data]')
    try {
      if (!db) return { ok: false, error: 'Database not ready.' }
      const { canceled, filePaths } = await dialog.showOpenDialog({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
      })
      if (canceled || !filePaths[0]) return { ok: true, data: 'cancelled' }
      let backup: BackupPayload
      try {
        backup = JSON.parse(readFileSync(filePaths[0], 'utf-8')) as BackupPayload
      } catch {
        return { ok: false, error: 'Invalid backup file.' }
      }
      if (backup?.version !== 1) return { ok: false, error: 'Unsupported backup version.' }
      if (
        !Array.isArray(backup.employees) ||
        !Array.isArray(backup.expectedBehaviors) ||
        !Array.isArray(backup.behaviorLogEntries) ||
        !Array.isArray(backup.behaviorLogEntryCompetencies) ||
        typeof backup.settings !== 'object' ||
        backup.settings === null
      ) {
        return { ok: false, error: 'Invalid backup file: missing or malformed data.' }
      }
      importData(db, backup)
      return { ok: true, data: 'imported' }
    } catch (e) {
      log.error('[settings:import-data] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Failed to import data.' }
    }
  })
}
