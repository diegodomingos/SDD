import { useCallback, useState } from 'react'
import type { EvaluateResult } from '../../../shared/ipc-types'

interface UseEvaluationReturn {
  isLoading: boolean
  result: EvaluateResult | null
  error: string | null
  evaluate: (employeeId: number, competencyId: number) => Promise<void>
  reset: () => void
}

export function useEvaluation(): UseEvaluationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<EvaluateResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const evaluate = useCallback(async (employeeId: number, competencyId: number): Promise<void> => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await window.electronAPI.invoke('ai:evaluate', { employeeId, competencyId })
      if (res.ok) {
        setResult(res.data as EvaluateResult)
      } else {
        setError(res.error ?? 'Evaluation failed.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error during evaluation.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsLoading(false)
    setResult(null)
    setError(null)
  }, [])

  return { isLoading, result, error, evaluate, reset }
}
