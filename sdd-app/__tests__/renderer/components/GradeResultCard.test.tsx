// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { ThemeProvider } from '@mui/material/styles'
import theme from '../../../src/renderer/src/theme/theme'
import GradeResultCard from '../../../src/renderer/src/components/evaluation/GradeResultCard'
import type { EvaluateResult } from '../../../src/shared/ipc-types'

afterEach(() => cleanup())

function wrap(props: Partial<React.ComponentProps<typeof GradeResultCard>> = {}) {
  const defaults = {
    isLoading: false,
    result: null,
    error: null,
    entryCount: 3,
    competencyName: 'Communication',
    employeeLevel: 'B',
    onLogBehavior: vi.fn(),
    onRerun: vi.fn(),
    onRetry: vi.fn(),
  }
  return render(
    <ThemeProvider theme={theme}>
      <GradeResultCard {...defaults} {...props} />
    </ThemeProvider>
  )
}

const meetResult: EvaluateResult = { grade: 'Meets Expectations', rationale: 'The employee met the bar.' }
const exceedsResult: EvaluateResult = { grade: 'Exceeds Expectations', rationale: 'Outstanding performance shown.' }
const doesNotMeetResult: EvaluateResult = { grade: 'Does Not Meet Expectations', rationale: 'Several gaps observed.' }
const insufficientResult: EvaluateResult = { grade: 'Insufficient Input', rationale: 'Not enough evidence provided.' }

describe('GradeResultCard — loading state', () => {
  it('renders loading text when isLoading is true', () => {
    wrap({ isLoading: true })
    expect(screen.getByText('Running evaluation…')).toBeDefined()
  })

  it('renders CircularProgress when isLoading is true', () => {
    wrap({ isLoading: true })
    expect(screen.getByRole('progressbar')).toBeDefined()
  })

  it('does not render Retry button while loading', () => {
    wrap({ isLoading: true })
    expect(screen.queryByRole('button', { name: /retry/i })).toBeNull()
  })

  it('does not render Re-run button while loading', () => {
    wrap({ isLoading: true })
    expect(screen.queryByRole('button', { name: /re-run/i })).toBeNull()
  })

  it('does not render grade text while loading', () => {
    wrap({ isLoading: true, result: meetResult })
    expect(screen.queryByText('Meets Expectations')).toBeNull()
  })

  it('does not render error message when isLoading and error are both set', () => {
    wrap({ isLoading: true, error: 'Connection failed.' })
    expect(screen.queryByText('Connection failed.')).toBeNull()
  })
})

describe('GradeResultCard — error state', () => {
  it('renders the error message text', () => {
    wrap({ error: 'Something went wrong. Please try again.' })
    expect(screen.getByText('Something went wrong. Please try again.')).toBeDefined()
  })

  it('renders a Retry button', () => {
    wrap({ error: 'Connection failed.' })
    expect(screen.getByRole('button', { name: /retry/i })).toBeDefined()
  })

  it('calls onRetry when Retry is clicked', () => {
    const onRetry = vi.fn()
    wrap({ error: 'Connection failed.', onRetry })
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('does not render grade text in error state', () => {
    wrap({ error: 'Timeout.' })
    expect(screen.queryByText('Meets Expectations')).toBeNull()
  })
})

describe('GradeResultCard — result state (graded outcomes)', () => {
  it('renders the grade text for Meets Expectations', () => {
    wrap({ result: meetResult })
    expect(screen.getByText('Meets Expectations')).toBeDefined()
  })

  it('renders the grade text for Exceeds Expectations', () => {
    wrap({ result: exceedsResult })
    expect(screen.getByText('Exceeds Expectations')).toBeDefined()
  })

  it('renders the grade text for Does Not Meet Expectations', () => {
    wrap({ result: doesNotMeetResult })
    expect(screen.getByText('Does Not Meet Expectations')).toBeDefined()
  })

  it('renders the rationale text', () => {
    wrap({ result: meetResult })
    expect(screen.getByText('The employee met the bar.')).toBeDefined()
  })

  it('renders plural observation count (>1)', () => {
    wrap({ result: meetResult, entryCount: 3 })
    expect(screen.getByText('Based on 3 observations')).toBeDefined()
  })

  it('renders singular observation count (1)', () => {
    wrap({ result: meetResult, entryCount: 1 })
    expect(screen.getByText('Based on 1 observation')).toBeDefined()
  })

  it('renders Re-run Evaluation button', () => {
    wrap({ result: meetResult })
    expect(screen.getByRole('button', { name: /re-run evaluation/i })).toBeDefined()
  })

  it('calls onRerun when Re-run Evaluation is clicked', () => {
    const onRerun = vi.fn()
    wrap({ result: meetResult, onRerun })
    fireEvent.click(screen.getByRole('button', { name: /re-run evaluation/i }))
    expect(onRerun).toHaveBeenCalledOnce()
  })

  it('does not render Retry button in result state', () => {
    wrap({ result: meetResult })
    expect(screen.queryByRole('button', { name: /retry/i })).toBeNull()
  })

  it('renders competencyName and employeeLevel in header label', () => {
    wrap({ result: meetResult, competencyName: 'Teamwork', employeeLevel: 'C' })
    expect(screen.getByText(/Teamwork/)).toBeDefined()
    expect(screen.getByText(/Level C/)).toBeDefined()
  })
})

describe('GradeResultCard — Insufficient Input result', () => {
  it('renders role="alert" element (InsufficientInputCard)', () => {
    wrap({ result: insufficientResult })
    expect(screen.getByRole('alert')).toBeDefined()
  })

  it('does not render Re-run Evaluation button for Insufficient Input', () => {
    wrap({ result: insufficientResult })
    expect(screen.queryByRole('button', { name: /re-run evaluation/i })).toBeNull()
  })

  it('renders the rationale from InsufficientInputCard', () => {
    wrap({ result: insufficientResult })
    expect(screen.getByText('Not enough evidence provided.')).toBeDefined()
  })

  it('does not render grade badge text for Insufficient Input', () => {
    wrap({ result: insufficientResult })
    expect(screen.queryByText(/Meets Expectations|Exceeds Expectations|Does Not Meet Expectations/)).toBeNull()
  })

  it('does not render observation count for Insufficient Input', () => {
    wrap({ result: insufficientResult })
    expect(screen.queryByText(/Based on/)).toBeNull()
  })
})

describe('GradeResultCard — null/idle state', () => {
  it('does not render loading text when idle', () => {
    wrap()
    expect(screen.queryByText(/Running evaluation/)).toBeNull()
  })

  it('does not render Retry button when idle', () => {
    wrap()
    expect(screen.queryByRole('button', { name: /retry/i })).toBeNull()
  })

  it('does not render grade text when idle', () => {
    wrap()
    expect(screen.queryByText('Meets Expectations')).toBeNull()
  })

  it('renders empty Paper (no content) in idle state', () => {
    const { container } = wrap()
    const paper = container.querySelector('[aria-label="Evaluation result"]')
    expect(paper?.textContent).toBe('')
  })
})
