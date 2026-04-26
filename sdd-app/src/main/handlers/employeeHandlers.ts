import { ipcMain } from 'electron'
import log from 'electron-log/main'
import { db } from '../db/database'
import { listEmployees } from '../db/employees'
import type {
  IpcResult,
  Employee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  DeleteEmployeePayload
} from '../../shared/ipc-types'

export function registerEmployeeHandlers(): void {
  ipcMain.handle('employee:list', async (): Promise<IpcResult<Employee[]>> => {
    log.info('[employee:list]')
    try {
      return { ok: true, data: listEmployees(db!) }
    } catch (e) {
      log.error('[employee:list] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Failed to list employees.' }
    }
  })

  ipcMain.handle(
    'employee:create',
    async (_event, payload: CreateEmployeePayload): Promise<IpcResult<Employee>> => {
      log.info('[employee:create] name=%s level=%s', payload.name, payload.level)
      try {
        return { ok: false, error: 'Not implemented.' }
      } catch (e) {
        log.error('[employee:create] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to create employee.' }
      }
    }
  )

  ipcMain.handle(
    'employee:update',
    async (_event, payload: UpdateEmployeePayload): Promise<IpcResult<Employee>> => {
      log.info('[employee:update] id=%d', payload.id)
      try {
        return { ok: false, error: 'Not implemented.' }
      } catch (e) {
        log.error('[employee:update] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to update employee.' }
      }
    }
  )

  ipcMain.handle(
    'employee:delete',
    async (_event, payload: DeleteEmployeePayload): Promise<IpcResult<null>> => {
      log.info('[employee:delete] id=%d', payload.id)
      try {
        return { ok: false, error: 'Not implemented.' }
      } catch (e) {
        log.error('[employee:delete] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to delete employee.' }
      }
    }
  )
}
