import { useState, useCallback } from 'react'
import { useAppStore } from '../store/appStore'

export function useSettings() {
  const [draftName, setDraftName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setStoreName = useAppStore((s) => s.setManagerName)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await window.electronAPI.invoke<string>('settings:get-manager-name')
      if (result.ok) {
        setDraftName(result.data)
        setStoreName(result.data)
      } else {
        setError(result.error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [setStoreName])

  const saveManagerName = useCallback(
    async (name: string): Promise<boolean> => {
      setIsSaving(true)
      setError(null)
      try {
        const result = await window.electronAPI.invoke<null>('settings:set-manager-name', { name })
        if (result.ok) {
          setDraftName(name)
          setStoreName(name)
        } else {
          setError(result.error)
        }
        return result.ok
      } finally {
        setIsSaving(false)
      }
    },
    [setStoreName]
  )

  return { draftName, setDraftName, isLoading, isSaving, error, load, saveManagerName }
}
