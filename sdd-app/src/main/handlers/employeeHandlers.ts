import { ipcMain } from 'electron'
import log from 'electron-log/main'
import { db } from '../db/database'
import { listEmployees, createEmployee, updateEmployee, deleteEmployee } from '../db/employees'
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
        if (!payload.name?.trim()) return { ok: false, error: 'Employee name is required.' }
        if (!['A', 'B', 'C', 'D'].includes(payload.level)) return { ok: false, error: 'Invalid level.' }
        const employee = createEmployee(db!, payload.name.trim(), payload.level)
        return { ok: true, data: employee }
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
        if (!payload.id || !Number.isInteger(payload.id) || payload.id < 1) return { ok: false, error: 'Invalid employee id.' }
        if (!payload.name?.trim()) return { ok: false, error: 'Employee name is required.' }
        if (!['A', 'B', 'C', 'D'].includes(payload.level)) return { ok: false, error: 'Invalid level.' }
        const employee = updateEmployee(db!, payload.id, payload.name.trim(), payload.level)
        return { ok: true, data: employee }
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
        if (!payload.id || !Number.isInteger(payload.id) || payload.id < 1) return { ok: false, error: 'Invalid employee id.' }
        deleteEmployee(db!, payload.id)
        return { ok: true, data: null }
      } catch (e) {
        log.error('[employee:delete] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to delete employee.' }
      }
    }
  )
}
