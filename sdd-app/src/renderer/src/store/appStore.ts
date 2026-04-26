import { create } from 'zustand'
import type { Competency } from '../../../shared/ipc-types'

type View = 'employees' | 'framework' | 'settings'

interface AppStore {
  currentView: View
  selectedEmployeeId: number | null
  selectedCompetency: Competency | null
  setView: (view: View) => void
  setEmployee: (id: number | null) => void
  setCompetency: (c: Competency | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentView: 'employees',
  selectedEmployeeId: null,
  selectedCompetency: null,
  setView: (view) => set({ currentView: view }),
  setEmployee: (id) => set({ selectedEmployeeId: id, selectedCompetency: null }),
  setCompetency: (c) => set({ selectedCompetency: c }),
}))
