import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../../../src/renderer/src/store/appStore'
import type { Employee } from '../../../src/shared/ipc-types'

const mockEmployee: Employee = { id: 42, name: 'Alice', level: 'A', createdAt: '2026-01-01' }
const anotherEmployee: Employee = { id: 5, name: 'Bob', level: 'B', createdAt: '2026-01-01' }

beforeEach(() => {
  useAppStore.setState({ currentView: 'employees', selectedEmployee: null, selectedCompetency: null })
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

  it('setEmployee sets selectedEmployee and clears selectedCompetency', () => {
    useAppStore.setState({ selectedCompetency: { id: 1, name: 'Communication' } })
    useAppStore.getState().setEmployee(mockEmployee)
    expect(useAppStore.getState().selectedEmployee?.id).toBe(42)
    expect(useAppStore.getState().selectedEmployee?.name).toBe('Alice')
    expect(useAppStore.getState().selectedCompetency).toBeNull()
  })

  it('setEmployee with null clears selectedEmployee and selectedCompetency', () => {
    useAppStore.setState({ selectedEmployee: anotherEmployee, selectedCompetency: { id: 2, name: 'Teamwork' } })
    useAppStore.getState().setEmployee(null)
    expect(useAppStore.getState().selectedEmployee).toBeNull()
    expect(useAppStore.getState().selectedCompetency).toBeNull()
  })

  it('setCompetency updates selectedCompetency', () => {
    useAppStore.getState().setCompetency({ id: 3, name: 'Proactivity' })
    expect(useAppStore.getState().selectedCompetency).toEqual({ id: 3, name: 'Proactivity' })
  })

  it('initial selectedEmployee is null', () => {
    expect(useAppStore.getState().selectedEmployee).toBeNull()
  })

  it('initial selectedCompetency is null', () => {
    expect(useAppStore.getState().selectedCompetency).toBeNull()
  })
})
