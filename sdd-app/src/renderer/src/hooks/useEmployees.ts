import { useState, useCallback } from 'react'
import type { Employee } from '../../../shared/ipc-types'

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.invoke<Employee[]>('employee:list')
      if (result.ok) setEmployees(result.data)
      else setError(result.error)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { employees, isLoading, error, load }
}
