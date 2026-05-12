import { useState, useCallback } from 'react'
import { useAppStore } from '../store/appStore'

export function useSettings(): {
  draftName: string
  setDraftName: (v: string) => void
  isLoading: boolean
  isSaving: boolean
  nameError: string | null
  keyError: string | null
  modelError: string | null
  load: () => Promise<void>
  saveManagerName: (name: string) => Promise<boolean>
  isKeyConfigured: boolean
  draftApiKey: string
  setDraftApiKey: (v: string) => void
  isSavingKey: boolean
  saveApiKey: (key: string) => Promise<boolean>
  draftModel: string
  setDraftModel: (v: string) => void
  isSavingModel: boolean
  saveModel: (model: string) => Promise<boolean>
  isClearingData: boolean
  clearDataError: string | null
  clearAllData: () => Promise<boolean>
  resetClearError: () => void
  isExporting: boolean
  exportError: string | null
  exportSuccess: boolean
  exportData: () => Promise<'saved' | 'cancelled' | null>
  isImporting: boolean
  importError: string | null
  importSuccess: boolean
  importData: () => Promise<'imported' | 'cancelled' | null>
} {
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
  const [isClearingData, setIsClearingData] = useState(false)
  const [clearDataError, setClearDataError] = useState<string | null>(null)

  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportSuccess, setExportSuccess] = useState(false)

  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  const setStoreKeyConfigured = useAppStore((s) => s.setKeyConfigured)
  const setStoreAiModel = useAppStore((s) => s.setAiModel)
  const resetUserData = useAppStore((s) => s.resetUserData)

  const load = useCallback(async () => {
    setIsLoading(true)
    setNameError(null)
    setKeyError(null)
    setModelError(null)
    try {
      const [nameResult, keyResult, modelResult] = await Promise.all([
        window.electronAPI.invoke<string>('settings:get-manager-name'),
        window.electronAPI.invoke<boolean>('settings:get-key-configured'),
        window.electronAPI.invoke<string>('settings:get-model')
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

  const exportData = useCallback(async (): Promise<'saved' | 'cancelled' | null> => {
    setIsExporting(true)
    setExportError(null)
    setExportSuccess(false)
    setImportSuccess(false)
    try {
      const result = await window.electronAPI.invoke<'saved' | 'cancelled'>('settings:export-data')
      if (result.ok) {
        if (result.data === 'saved') setExportSuccess(true)
        return result.data
      } else {
        setExportError(result.error)
        return null
      }
    } catch {
      setExportError('Unexpected error exporting data.')
      return null
    } finally {
      setIsExporting(false)
    }
  }, [])

  const importData = useCallback(async (): Promise<'imported' | 'cancelled' | null> => {
    setIsImporting(true)
    setImportError(null)
    setImportSuccess(false)
    setExportSuccess(false)
    try {
      const result = await window.electronAPI.invoke<'imported' | 'cancelled'>(
        'settings:import-data'
      )
      if (result.ok) {
        if (result.data === 'imported') {
          setImportSuccess(true)
          await load()
        }
        return result.data
      } else {
        setImportError(result.error)
        return null
      }
    } catch {
      setImportError('Unexpected error importing data.')
      return null
    } finally {
      setIsImporting(false)
    }
  }, [load])

  const clearAllData = useCallback(async (): Promise<boolean> => {
    setIsClearingData(true)
    setClearDataError(null)
    try {
      const result = await window.electronAPI.invoke<null>('settings:clear-all-data')
      if (result.ok) {
        resetUserData()
      } else {
        setClearDataError(result.error ?? 'Failed to clear data.')
      }
      return result.ok
    } catch {
      setClearDataError('Unexpected error clearing data.')
      return false
    } finally {
      setIsClearingData(false)
    }
  }, [resetUserData])

  return {
    draftName,
    setDraftName,
    isLoading,
    isSaving,
    nameError,
    keyError,
    modelError,
    load,
    saveManagerName,
    isKeyConfigured,
    draftApiKey,
    setDraftApiKey,
    isSavingKey,
    saveApiKey,
    draftModel,
    setDraftModel,
    isSavingModel,
    saveModel,
    isClearingData,
    clearDataError,
    clearAllData,
    resetClearError: () => setClearDataError(null),
    isExporting,
    exportError,
    exportSuccess,
    exportData,
    isImporting,
    importError,
    importSuccess,
    importData
  }
}
