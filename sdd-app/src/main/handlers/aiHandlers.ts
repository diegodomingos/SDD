import { ipcMain } from 'electron'
import log from 'electron-log/main'
import type { AIProvider } from '../ai/AIProvider'
import { db } from '../db/database'
import { listEntries } from '../db/behaviorLog'
import { getExpectedBehavior } from '../db/framework'
import { getModel } from '../settings/modelPreference'
import type { IpcResult, EvaluateResult, EvaluatePayload, CompetencyLevel } from '../../shared/ipc-types'

const TIMEOUT_MS = 30_000

export function registerAiHandlers(aiProvider: AIProvider): void {
  ipcMain.handle(
    'ai:evaluate',
    async (_event, payload: EvaluatePayload): Promise<IpcResult<EvaluateResult>> => {
      log.info('[ai:evaluate] employeeId=%d competencyId=%d', payload.employeeId, payload.competencyId)
      try {
        const empRow = db!.prepare('SELECT level FROM employees WHERE id = ?').get(payload.employeeId) as { level: CompetencyLevel } | undefined
        if (!empRow) return { ok: false, error: 'Employee not found.' }

        const entries = listEntries(db!, payload.employeeId, payload.competencyId)
        const expectedBehaviors = getExpectedBehavior(payload.competencyId, empRow.level) ?? ''
        const model = getModel(db!)

        let timeoutHandle: ReturnType<typeof setTimeout>
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(
            () => reject(new Error('Evaluation timed out. Check your connection and try again.')),
            TIMEOUT_MS
          )
        })

        const result = await Promise.race([
          aiProvider.evaluate({ entries, expectedBehaviors, model }),
          timeoutPromise
        ]).finally(() => clearTimeout(timeoutHandle))

        log.info('[ai:evaluate] grade=%s', result.grade)
        return { ok: true, data: { grade: result.grade, rationale: result.rationale } }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'AI evaluation failed. Check your connection and try again.'
        log.error('[ai:evaluate] error: %s', message)
        return { ok: false, error: message }
      }
    }
  )
}
