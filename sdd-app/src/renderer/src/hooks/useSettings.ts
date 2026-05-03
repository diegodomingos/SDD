import { useState, useCallback } from 'react'
import { useAppStore } from '../store/appStore'

export function useSettings() {
  const [draftName, setDraftName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [keyError, setKeyError] = useState<string | null>(null)
  const [modelError, setModelError] = useState<string | null>(null)
  const setStoreName = useAppStore((s) => s.setManagerName)

  const [isKeyConfigured, setIsKeyConfigured] = useState(false)
  const [draftApiKey, setDraftApiKey] = useState('')
  const [isSavingKey, setIsSavingKey] = useState(false)

  const [draftModel, setDraftModel] = useState('claude-haiku-4-5-20251001')
  const [isSavingModel, setIsSavingModel] = useState(false)

  const setStoreKeyConfigured = useAppStore((s) => s.setKeyConfigured)
  const setStoreAiModel = useAppStore((s) => s.setAiModel)

  const load = useCallback(async () => {
    setIsLoading(true)
    setNameError(null)
    setKeyError(null)
    setModelError(null)
    try {
      const [nameResult, keyResult, modelResult] = await Promise.all([
        window.electronAPI.invoke<string>('settings:get-manager-name'),
        window.electronAPI.invoke<boolean>('settings:get-key-configured'),
        window.electronAPI.invoke<string>('settings:get-model'),
      ])
      if (nameResult.ok) {
        setDraftName(nameResult.data)
        setStoreName(nameResult.data)
      } else {
        setNameError(nameResult.error)
      }
      if (keyResult.ok) {
        setIsKeyConfigured(keyResult.data)
        setStoreKeyConfigured(keyResult.data)
      } else {
        setKeyError(keyResult.error)
      }
      if (modelResult.ok) {
        setDraftModel(modelResult.data)
        setStoreAiModel(modelResult.data)
      } else {
        setModelError(modelResult.error)
      }
    } catch {
      setNameError('Failed to load settings.')
    } finally {
      setIsLoading(false)
    }
  }, [setStoreName, setStoreKeyConfigured, setStoreAiModel])

  const saveManagerName = useCallback(
    async (name: string): Promise<boolean> => {
      setIsSaving(true)
      setNameError(null)
      try {
        const result = await window.electronAPI.invoke<null>('settings:set-manager-name', { name })
        if (result.ok) {
          setDraftName(name)
          setStoreName(name)
        } else {
          setNameError(result.error)
        }
        return result.ok
      } catch {
        setNameError('Unexpected error saving manager name.')
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [setStoreName]
  )

  const saveApiKey = useCallback(
    async (key: string): Promise<boolean> => {
      setIsSavingKey(true)
      setKeyError(null)
      try {
        const result = await window.electronAPI.invoke<null>('settings:set-api-key', { key })
        if (result.ok) {
          setDraftApiKey('')
          setIsKeyConfigured(true)
          setStoreKeyConfigured(true)
        } else {
          setKeyError(result.error)
        }
        return result.ok
      } catch {
        setKeyError('Unexpected error saving API key.')
        return false
      } finally {
        setIsSavingKey(false)
      }
    },
    [setStoreKeyConfigured]
  )

  const saveModel = useCallback(
    async (model: string): Promise<boolean> => {
      setIsSavingModel(true)
      setModelError(null)
      try {
        const result = await window.electronAPI.invoke<null>('settings:set-model', { model })
        if (result.ok) {
          setDraftModel(model)
          setStoreAiModel(model)
        } else {
          setModelError(result.error)
        }
        return result.ok
      } catch {
        setModelError('Unexpected error saving model.')
        return false
      } finally {
        setIsSavingModel(false)
      }
    },
    [setStoreAiModel]
  )

  return {
    draftName, setDraftName, isLoading, isSaving, nameError, keyError, modelError, load, saveManagerName,
    isKeyConfigured, draftApiKey, setDraftApiKey, isSavingKey, saveApiKey,
    draftModel, setDraftModel, isSavingModel, saveModel,
  }
}
