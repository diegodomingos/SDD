// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../src/renderer/src/theme/theme'
import InsufficientInputCard from '../../../src/renderer/src/components/evaluation/InsufficientInputCard'

afterEach(() => cleanup())

function wrap(
  competencyName = 'Communication',
  rationale = 'Not enough data.',
  onLogBehavior = vi.fn()
) {
  return render(
    <ThemeProvider theme={theme}>
      <InsufficientInputCard
        competencyName={competencyName}
        rationale={rationale}
        onLogBehavior={onLogBehavior}
      />
    </ThemeProvider>
  )
}

describe('InsufficientInputCard', () => {
  it('has role="alert" on the root element', () => {
    wrap()
    expect(screen.getByRole('alert')).toBeDefined()
  })

  it('renders the rationale text', () => {
    wrap('Communication', 'The entries lack specific observable behaviors.')
    expect(screen.getByText('The entries lack specific observable behaviors.')).toBeDefined()
  })

  it('renders CTA text with interpolated competency name — Communication', () => {
    wrap('Communication')
    expect(
      screen.getByText(/→ Add more Communication observations to unlock an assessment/)
    ).toBeDefined()
  })

  it('renders CTA text with interpolated competency name — Teamwork', () => {
    wrap('Teamwork')
    expect(
      screen.getByText(/→ Add more Teamwork observations to unlock an assessment/)
    ).toBeDefined()
  })

  it('renders the "+ Log Behavior" button', () => {
    wrap()
    expect(screen.getByRole('button', { name: /Log Behavior/i })).toBeDefined()
  })

  it('calls onLogBehavior when the button is clicked', () => {
    const onLogBehavior = vi.fn()
    wrap('Communication', 'Not enough data.', onLogBehavior)
    fireEvent.click(screen.getByRole('button', { name: /Log Behavior/i }))
    expect(onLogBehavior).toHaveBeenCalledOnce()
  })

  it('renders the "Insufficient Input" title text', () => {
    wrap()
    expect(screen.getByText('Insufficient Input')).toBeDefined()
  })
})
