import { ipcMain } from 'electron'
import log from 'electron-log/main'
import type { IpcResult, SetApiKeyPayload, SetModelPayload, SetManagerNamePayload } from '../../shared/ipc-types'
import { db } from '../db/database'
import { getManagerName, setManagerName } from '../settings/modelPreference'

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
        log.error('[settings:set-manager-name] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to set manager name.' }
      }
    }
  )

  ipcMain.handle('settings:get-key-configured', async (): Promise<IpcResult<boolean>> => {
    log.info('[settings:get-key-configured]')
    try {
      return { ok: true, data: false }
    } catch (e) {
      log.error('[settings:get-key-configured] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Failed to get key configuration status.' }
    }
  })

  ipcMain.handle(
    'settings:set-api-key',
    async (_event, payload: SetApiKeyPayload): Promise<IpcResult<null>> => {
      log.info('[settings:set-api-key]')
      void payload
      try {
        return { ok: false, error: 'Not implemented.' }
      } catch (e) {
        log.error('[settings:set-api-key] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to set API key.' }
      }
    }
  )

  ipcMain.handle('settings:get-model', async (): Promise<IpcResult<string>> => {
    log.info('[settings:get-model]')
    try {
      return { ok: true, data: 'claude-haiku-4-5-20251001' }
    } catch (e) {
      log.error('[settings:get-model] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Failed to get model.' }
    }
  })

  ipcMain.handle(
    'settings:set-model',
    async (_event, payload: SetModelPayload): Promise<IpcResult<null>> => {
      log.info('[settings:set-model]')
      void payload
      try {
        return { ok: false, error: 'Not implemented.' }
      } catch (e) {
        log.error('[settings:set-model] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to set model.' }
      }
    }
  )
}
