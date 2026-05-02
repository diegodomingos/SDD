import { ipcMain } from 'electron'
import log from 'electron-log/main'
import type {
  IpcResult,
  BehaviorLogEntry,
  ListBehaviorLogPayload,
  CreateBehaviorLogPayload,
  UpdateBehaviorLogPayload,
  DeleteBehaviorLogPayload
} from '../../shared/ipc-types'
import { db } from '../db/database'
import { listEntries } from '../db/behaviorLog'

export function registerBehaviorLogHandlers(): void {
  ipcMain.handle(
    'behavior-log:list',
    async (_event, payload: ListBehaviorLogPayload): Promise<IpcResult<BehaviorLogEntry[]>> => {
      log.info('[behavior-log:list] employeeId=%d competencyId=%s', payload.employeeId, payload.competencyId ?? 'none')
      try {
        const entries = listEntries(db!, payload.employeeId, payload.competencyId)
        return { ok: true, data: entries }
      } catch (e) {
        log.error('[behavior-log:list] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to list behavior log entries.' }
      }
    }
  )

  ipcMain.handle(
    'behavior-log:create',
    async (_event, payload: CreateBehaviorLogPayload): Promise<IpcResult<BehaviorLogEntry>> => {
      log.info('[behavior-log:create] employeeId=%d', payload.employeeId)
      try {
        return { ok: false, error: 'Not implemented.' }
      } catch (e) {
        log.error('[behavior-log:create] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to create behavior log entry.' }
      }
    }
  )

  ipcMain.handle(
    'behavior-log:update',
    async (_event, payload: UpdateBehaviorLogPayload): Promise<IpcResult<BehaviorLogEntry>> => {
      log.info('[behavior-log:update] id=%d', payload.id)
      try {
        return { ok: false, error: 'Not implemented.' }
      } catch (e) {
        log.error('[behavior-log:update] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to update behavior log entry.' }
      }
    }
  )

  ipcMain.handle(
    'behavior-log:delete',
    async (_event, payload: DeleteBehaviorLogPayload): Promise<IpcResult<null>> => {
      log.info('[behavior-log:delete] id=%d', payload.id)
      try {
        return { ok: false, error: 'Not implemented.' }
      } catch (e) {
        log.error('[behavior-log:delete] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to delete behavior log entry.' }
      }
    }
  )
}
