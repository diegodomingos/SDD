import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../../src/renderer/src/store/appStore'

beforeEach(() => {
  useAppStore.setState({ currentView: 'employees', selectedEmployeeId: null, selectedCompetency: null })
})

describe('appStore', () => {
  it('defaults to employees view', () => {
    expect(useAppStore.getState().currentView).toBe('employees')
  })

  it('setView updates currentView', () => {
    useAppStore.getState().setView('framework')
    expect(useAppStore.getState().currentView).toBe('framework')
  })

  it('setView to settings updates currentView', () => {
    useAppStore.getState().setView('settings')
    expect(useAppStore.getState().currentView).toBe('settings')
  })

  it('setEmployee sets selectedEmployeeId and clears selectedCompetency', () => {
    useAppStore.setState({ selectedCompetency: { id: 1, name: 'Communication' } })
    useAppStore.getState().setEmployee(42)
    expect(useAppStore.getState().selectedEmployeeId).toBe(42)
    expect(useAppStore.getState().selectedCompetency).toBeNull()
  })

  it('setEmployee with null clears selectedEmployeeId and selectedCompetency', () => {
    useAppStore.setState({ selectedEmployeeId: 5, selectedCompetency: { id: 2, name: 'Teamwork' } })
    useAppStore.getState().setEmployee(null)
    expect(useAppStore.getState().selectedEmployeeId).toBeNull()
    expect(useAppStore.getState().selectedCompetency).toBeNull()
  })

  it('setCompetency updates selectedCompetency', () => {
    useAppStore.getState().setCompetency({ id: 3, name: 'Proactivity' })
    expect(useAppStore.getState().selectedCompetency).toEqual({ id: 3, name: 'Proactivity' })
  })

  it('initial selectedEmployeeId is null', () => {
    expect(useAppStore.getState().selectedEmployeeId).toBeNull()
  })

  it('initial selectedCompetency is null', () => {
    expect(useAppStore.getState().selectedCompetency).toBeNull()
  })
})
