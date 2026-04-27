import { ipcMain } from 'electron'
import log from 'electron-log/main'
import type { IpcResult, Competency, GetExpectedBehaviorPayload, SetExpectedBehaviorPayload } from '../../shared/ipc-types'
import { listCompetencies, getExpectedBehavior, setExpectedBehavior } from '../db/framework'

export function registerFrameworkHandlers(): void {
  ipcMain.handle('competency:list', async (): Promise<IpcResult<Competency[]>> => {
    log.info('[competency:list]')
    try {
      const competencies = listCompetencies()
      return { ok: true, data: competencies }
    } catch (e) {
      log.error('[competency:list] error: %s', e instanceof Error ? e.message : String(e))
      return { ok: false, error: 'Failed to list competencies.' }
    }
  })

  ipcMain.handle(
    'expected-behavior:get',
    async (_event, payload: GetExpectedBehaviorPayload): Promise<IpcResult<string | null>> => {
      try {
        log.info('[expected-behavior:get] competencyId=%d level=%s', payload.competencyId, payload.level)
        const description = getExpectedBehavior(payload.competencyId, payload.level)
        return { ok: true, data: description }
      } catch (e) {
        log.error('[expected-behavior:get] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to get expected behavior.' }
      }
    }
  )

  ipcMain.handle(
    'expected-behavior:set',
    async (_event, _payload: SetExpectedBehaviorPayload): Promise<IpcResult<string>> => {
      log.info('[expected-behavior:set] competencyId=%d level=%s', _payload.competencyId, _payload.level)
      try {
        if (!_payload.description?.trim()) {
          return { ok: false, error: 'Expected behavior description is required.' }
        }
        const saved = setExpectedBehavior(_payload.competencyId, _payload.level, _payload.description.trim())
        return { ok: true, data: saved }
      } catch (e) {
        log.error('[expected-behavior:set] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to set expected behavior.' }
      }
    }
  )
}
