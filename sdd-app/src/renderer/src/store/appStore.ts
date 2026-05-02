import { create } from 'zustand'
import type { Competency, Employee } from '../../../shared/ipc-types'

type View = 'employees' | 'framework' | 'settings'

interface AppStore {
  currentView: View
  selectedEmployee: Employee | null
  selectedCompetency: Competency | null
  managerName: string
  setView: (view: View) => void
  setEmployee: (employee: Employee | null) => void
  setCompetency: (c: Competency | null) => void
  setManagerName: (name: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentView: 'employees',
  selectedEmployee: null,
  selectedCompetency: null,
  managerName: '',
  setView: (view) => set({ currentView: view }),
  setEmployee: (employee) => set({ selectedEmployee: employee, selectedCompetency: null }),
  setCompetency: (c) => set({ selectedCompetency: c }),
  setManagerName: (name) => set({ managerName: name }),
}))
