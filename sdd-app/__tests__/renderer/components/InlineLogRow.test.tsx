// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../src/renderer/src/theme/theme'
import InlineLogRow from '../../../src/renderer/src/components/log/InlineLogRow'
import type { Competency } from '../../../src/shared/ipc-types'

afterEach(() => cleanup())

const competencies: Competency[] = [
  { id: 1, name: 'Communication' },
  { id: 2, name: 'Client Focus' },
  { id: 3, name: 'Proactivity' },
  { id: 4, name: 'Teamwork' },
]

function wrap(
  onSave = vi.fn(),
  onCancel = vi.fn(),
  initialDescription?: string,
  initialCompetencyIds?: number[],
  initialDate?: string
) {
  return render(
    <ThemeProvider theme={theme}>
      <table>
        <tbody>
          <InlineLogRow
            competencies={competencies}
            onSave={onSave}
            onCancel={onCancel}
            initialDescription={initialDescription}
            initialCompetencyIds={initialCompetencyIds}
            initialDate={initialDate}
          />
        </tbody>
      </table>
    </ThemeProvider>
  )
}

describe('InlineLogRow', () => {
  it('renders all four competency chips', () => {
    wrap()
    expect(screen.getByText('Communication')).toBeDefined()
    expect(screen.getByText('Client Focus')).toBeDefined()
    expect(screen.getByText('Proactivity')).toBeDefined()
    expect(screen.getByText('Teamwork')).toBeDefined()
  })

  it('save button disabled when description is empty', () => {
    wrap()
    const save = screen.getByRole('button', { name: /save log entry/i })
    expect((save as HTMLButtonElement).disabled).toBe(true)
  })

  it('save button disabled when description filled but no chip selected', () => {
    wrap()
    fireEvent.change(screen.getByPlaceholderText(/describe the observed behavior/i), {
      target: { value: 'Handled client well' },
    })
    const save = screen.getByRole('button', { name: /save log entry/i })
    expect((save as HTMLButtonElement).disabled).toBe(true)
  })

  it('save button enabled when description filled and at least one chip selected', () => {
    wrap()
    fireEvent.change(screen.getByPlaceholderText(/describe the observed behavior/i), {
      target: { value: 'Handled client well' },
    })
    fireEvent.click(screen.getByText('Communication'))
    const save = screen.getByRole('button', { name: /save log entry/i })
    expect((save as HTMLButtonElement).disabled).toBe(false)
  })

  it('onCancel called when cancel button clicked', () => {
    const onCancel = vi.fn()
    wrap(vi.fn(), onCancel)
    fireEvent.click(screen.getByRole('button', { name: /cancel log entry/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('onCancel called on Escape key in description textarea', () => {
    const onCancel = vi.fn()
    wrap(vi.fn(), onCancel)
    const textarea = screen.getByPlaceholderText(/describe the observed behavior/i)
    fireEvent.keyDown(textarea, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledOnce()
  })
})

describe('InlineLogRow edit mode (pre-filled)', () => {
  it('renders pre-filled description', () => {
    wrap(vi.fn(), vi.fn(), 'Pre-filled description', [1], '2026-05-01')
    const textarea = screen.getByPlaceholderText(/describe the observed behavior/i) as HTMLTextAreaElement
    expect(textarea.value).toBe('Pre-filled description')
  })

  it('save button enabled when pre-filled with valid description and competency', () => {
    wrap(vi.fn(), vi.fn(), 'Some behavior', [2], '2026-05-01')
    const save = screen.getByRole('button', { name: /save log entry/i })
    expect((save as HTMLButtonElement).disabled).toBe(false)
  })

  it('save button disabled when pre-filled description is empty string', () => {
    wrap(vi.fn(), vi.fn(), '', [1], '2026-05-01')
    const save = screen.getByRole('button', { name: /save log entry/i })
    expect((save as HTMLButtonElement).disabled).toBe(true)
  })
})
