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
import { listEntries, createEntry, updateEntry, deleteEntry } from '../db/behaviorLog'

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
      log.info('[behavior-log:create] employeeId=%d competencyIds=%j', payload.employeeId, payload.competencyIds)
      try {
        if (!payload.description?.trim()) {
          return { ok: false, error: 'Description is required.' }
        }
        if (!Array.isArray(payload.competencyIds) || payload.competencyIds.length === 0) {
          return { ok: false, error: 'At least one competency must be selected.' }
        }
        if (!payload.entryDate || !/^\d{4}-\d{2}-\d{2}$/.test(payload.entryDate)) {
          return { ok: false, error: 'A valid date is required.' }
        }
        const entry = createEntry(
          db!,
          payload.employeeId,
          payload.description.trim(),
          payload.competencyIds,
          payload.entryDate
        )
        return { ok: true, data: entry }
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
        if (!payload.description?.trim()) {
          return { ok: false, error: 'Description is required.' }
        }
        if (!Array.isArray(payload.competencyIds) || payload.competencyIds.length === 0) {
          return { ok: false, error: 'At least one competency must be selected.' }
        }
        if (!payload.entryDate || !/^\d{4}-\d{2}-\d{2}$/.test(payload.entryDate)) {
          return { ok: false, error: 'A valid date is required.' }
        }
        const entry = updateEntry(db!, payload.id, payload.description.trim(), payload.competencyIds, payload.entryDate)
        return { ok: true, data: entry }
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
        if (typeof payload.id !== 'number' || !Number.isInteger(payload.id) || payload.id <= 0) {
          return { ok: false, error: 'A valid entry id is required.' }
        }
        const deleted = deleteEntry(db!, payload.id)
        if (!deleted) return { ok: false, error: 'Entry not found.' }
        return { ok: true, data: null }
      } catch (e) {
        log.error('[behavior-log:delete] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to delete behavior log entry.' }
      }
    }
  )
}
