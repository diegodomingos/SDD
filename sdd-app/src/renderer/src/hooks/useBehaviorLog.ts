import { useState, useCallback } from 'react'
import type { BehaviorLogEntry } from '../../../shared/ipc-types'

export function useBehaviorLog() {
  const [entries, setEntries] = useState<BehaviorLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (employeeId: number, competencyId?: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.invoke<BehaviorLogEntry[]>(
        'behavior-log:list',
        { employeeId, competencyId }
      )
      if (result.ok) setEntries(result.data)
      else setError(result.error)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { entries, isLoading, error, load, clearError }
}
