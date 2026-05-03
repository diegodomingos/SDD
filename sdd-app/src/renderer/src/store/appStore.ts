import { create } from 'zustand'
import type { Competency, Employee } from '../../../shared/ipc-types'

type View = 'employees' | 'framework' | 'settings'

interface AppStore {
  currentView: View
  selectedEmployee: Employee | null
  selectedCompetency: Competency | null
  managerName: string
  keyConfigured: boolean
  aiModel: string
  setView: (view: View) => void
  setEmployee: (employee: Employee | null) => void
  setCompetency: (c: Competency | null) => void
  setManagerName: (name: string) => void
  setKeyConfigured: (configured: boolean) => void
  setAiModel: (model: string) => void
  resetUserData: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentView: 'employees',
  selectedEmployee: null,
  selectedCompetency: null,
  managerName: '',
  keyConfigured: false,
  aiModel: 'claude-haiku-4-5-20251001',
  setView: (view) => set({ currentView: view }),
  setEmployee: (employee) => set({ selectedEmployee: employee, selectedCompetency: null }),
  setCompetency: (c) => set({ selectedCompetency: c }),
  setManagerName: (name) => set({ managerName: name }),
  setKeyConfigured: (configured) => set({ keyConfigured: configured }),
  setAiModel: (model) => set({ aiModel: model }),
  resetUserData: () => set({ selectedEmployee: null, selectedCompetency: null }),
}))
