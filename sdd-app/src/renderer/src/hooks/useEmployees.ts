import { useState, useCallback } from 'react'
import type { Employee, CompetencyLevel } from '../../../shared/ipc-types'

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

  const create = useCallback(async (name: string, level: CompetencyLevel): Promise<boolean> => {
    setError(null)
    try {
      const result = await window.electronAPI.invoke<Employee>('employee:create', { name, level })
      if (result.ok) {
        setEmployees(prev => [result.data, ...prev])
        return true
      }
      setError(result.error)
      return false
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
      return false
    }
  }, [])

  const update = useCallback(async (id: number, name: string, level: CompetencyLevel): Promise<boolean> => {
    setError(null)
    try {
      const result = await window.electronAPI.invoke<Employee>('employee:update', { id, name, level })
      if (result.ok) {
        setEmployees(prev => prev.map(e => e.id === id ? result.data : e))
        return true
      }
      setError(result.error)
      return false
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
      return false
    }
  }, [])

  const remove = useCallback(async (id: number): Promise<boolean> => {
    setError(null)
    try {
      const result = await window.electronAPI.invoke<null>('employee:delete', { id })
      if (result.ok) {
        setEmployees(prev => prev.filter(e => e.id !== id))
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

  return { employees, isLoading, error, load, create, update, remove, clearError }
}
