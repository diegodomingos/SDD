import { useState, useCallback } from 'react'
import type { BehaviorLogEntry, Competency, CreateBehaviorLogPayload } from '../../../shared/ipc-types'

export function useBehaviorLog() {
  const [entries, setEntries] = useState<BehaviorLogEntry[]>([])
  const [competencies, setCompetencies] = useState<Competency[]>([])
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

  const loadCompetencies = useCallback(async () => {
    try {
      const result = await window.electronAPI.invoke<Competency[]>('competency:list')
      if (result.ok) setCompetencies(result.data)
      else setError(result.error)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    }
  }, [])

  const create = useCallback(async (payload: CreateBehaviorLogPayload, options?: { skipPrepend?: boolean }): Promise<boolean> => {
    setError(null)
    try {
      const result = await window.electronAPI.invoke<BehaviorLogEntry>('behavior-log:create', payload)
      if (result.ok) {
        if (!options?.skipPrepend) setEntries((prev) => [result.data, ...prev])
        return true
      }
      setError(result.error)
      return false
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
      return false
    }
  }, [])

  const update = useCallback(
    async (id: number, description: string, competencyIds: number[], entryDate: string): Promise<boolean> => {
      setError(null)
      try {
        const result = await window.electronAPI.invoke<BehaviorLogEntry>('behavior-log:update', {
          id,
          description,
          competencyIds,
          entryDate,
        })
        if (result.ok) {
          setEntries((prev) => prev.map((e) => (e.id === id ? result.data : e)))
          return true
        }
        setError(result.error)
        return false
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unexpected error')
        return false
      }
    },
    []
  )

  const remove = useCallback(async (id: number): Promise<boolean> => {
    setError(null)
    try {
      const result = await window.electronAPI.invoke<null>('behavior-log:delete', { id })
      if (result.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id))
        return true
      }
      setError(result.error)
      return false
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
      return false
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { entries, competencies, isLoading, error, load, loadCompetencies, create, update, remove, clearError }
}
