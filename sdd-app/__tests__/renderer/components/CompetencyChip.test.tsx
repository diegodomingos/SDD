// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'

afterEach(() => cleanup())
import { ThemeProvider } from '@mui/material/styles'
import CompetencyChip from '../../../src/renderer/src/components/common/CompetencyChip'
import theme from '../../../src/renderer/src/theme/theme'
import type { Competency } from '../../../src/shared/ipc-types'

const communication: Competency = { id: 1, name: 'Communication' }
const teamwork: Competency = { id: 4, name: 'Teamwork' }

function wrap(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>)
}

describe('CompetencyChip — read-only', () => {
  it('renders the competency name', () => {
    wrap(<CompetencyChip competency={communication} mode="read-only" />)
    expect(screen.getByText('Communication')).toBeDefined()
  })

  it('renders a different competency name', () => {
    wrap(<CompetencyChip competency={teamwork} mode="read-only" />)
    expect(screen.getByText('Teamwork')).toBeDefined()
  })

  it('is not interactive — no button role without onClick', () => {
    wrap(<CompetencyChip competency={communication} mode="read-only" />)
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('CompetencyChip — toggle', () => {
  it('has aria-pressed=true when selected', () => {
    wrap(
      <CompetencyChip
        competency={communication}
        mode="toggle"
        selected={true}
        onClick={() => {}}
      />
    )
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })

  it('has aria-pressed=false when not selected', () => {
    wrap(
      <CompetencyChip
        competency={communication}
        mode="toggle"
        selected={false}
        onClick={() => {}}
      />
    )
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-pressed')).toBe('false')
  })

  it('renders competency name in toggle mode', () => {
    wrap(
      <CompetencyChip competency={teamwork} mode="toggle" selected={false} onClick={() => {}} />
    )
    expect(screen.getByText('Teamwork')).toBeDefined()
  })
})

describe('CompetencyChip — filter', () => {
  it('renders competency name in filter mode', () => {
    wrap(
      <CompetencyChip competency={communication} mode="filter" selected={false} onClick={() => {}} />
    )
    expect(screen.getByText('Communication')).toBeDefined()
  })

  it('has aria-pressed=true when active', () => {
    wrap(
      <CompetencyChip
        competency={communication}
        mode="filter"
        selected={true}
        onClick={() => {}}
      />
    )
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-pressed')).toBe('true')
  })

  it('has aria-pressed=false when not selected', () => {
    wrap(
      <CompetencyChip
        competency={communication}
        mode="filter"
        selected={false}
        onClick={() => {}}
      />
    )
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-pressed')).toBe('false')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    wrap(
      <CompetencyChip competency={communication} mode="filter" selected={false} onClick={onClick} />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
