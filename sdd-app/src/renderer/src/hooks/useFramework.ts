import { useState, useCallback } from 'react'
import type { Competency, CompetencyLevel } from '../../../shared/ipc-types'

type ExpectedBehaviorMap = Record<number, Record<CompetencyLevel, string | null>>

const LEVELS: CompetencyLevel[] = ['A', 'B', 'C', 'D']

function useFramework() {
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [behaviors, setBehaviors] = useState<ExpectedBehaviorMap>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const compResult = await window.electronAPI.invoke<Competency[]>('competency:list')
      if (!compResult.ok) {
        setError(compResult.error)
        return
      }
      setCompetencies(compResult.data)

      // Load all 16 cells in parallel — 4 competencies × 4 levels
      const entries = await Promise.all(
        compResult.data.flatMap((comp) =>
          LEVELS.map(async (level) => {
            const res = await window.electronAPI.invoke<string | null>('expected-behavior:get', {
              competencyId: comp.id,
              level,
            })
            return {
              competencyId: comp.id,
              level,
              description: res.ok ? res.data : null,
              error: res.ok ? null : res.error,
            }
          })
        )
      )

      const cellError = entries.find((e) => e.error)?.error ?? null
      if (cellError) {
        setError(cellError)
        return
      }

      const map: ExpectedBehaviorMap = {}
      for (const { competencyId, level, description } of entries) {
        if (!map[competencyId]) map[competencyId] = { A: null, B: null, C: null, D: null }
        map[competencyId][level] = description
      }
      setBehaviors(map)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error loading framework')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const saveBehavior = useCallback(
    async (competencyId: number, level: CompetencyLevel, description: string): Promise<boolean> => {
      setError(null)
      const result = await window.electronAPI.invoke<string>('expected-behavior:set', {
        competencyId,
        level,
        description,
      })
      if (!result.ok) {
        setError(result.error)
        return false
      }
      setBehaviors((prev) => ({
        ...prev,
        [competencyId]: {
          ...(prev[competencyId] ?? { A: null, B: null, C: null, D: null }),
          [level]: result.data,
        },
      }))
      return true
    },
    []
  )

  return { competencies, behaviors, isLoading, error, load, clearError, saveBehavior }
}

export default useFramework
