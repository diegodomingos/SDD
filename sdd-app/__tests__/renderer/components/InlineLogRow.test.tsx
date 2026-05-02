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

function wrap(onSave = vi.fn(), onCancel = vi.fn()) {
  return render(
    <ThemeProvider theme={theme}>
      <table>
        <tbody>
          <InlineLogRow competencies={competencies} onSave={onSave} onCancel={onCancel} />
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
