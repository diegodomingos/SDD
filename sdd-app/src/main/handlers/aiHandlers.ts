import { ipcMain } from 'electron'
import log from 'electron-log/main'
import type { AIProvider } from '../ai/AIProvider'
import type { IpcResult, EvaluateResult, EvaluatePayload } from '../../shared/ipc-types'

export function registerAiHandlers(aiProvider: AIProvider): void {
  ipcMain.handle(
    'ai:evaluate',
    async (_event, payload: EvaluatePayload): Promise<IpcResult<EvaluateResult>> => {
      log.info('[ai:evaluate] employeeId=%d competencyId=%d', payload.employeeId, payload.competencyId)
      void aiProvider // used in Story 6.2
      try {
        return { ok: false, error: 'Not implemented.' }
      } catch (e) {
        log.error('[ai:evaluate] error: %s', e instanceof Error ? e.message : String(e))
        return { ok: false, error: 'Failed to evaluate.' }
      }
    }
  )
}
