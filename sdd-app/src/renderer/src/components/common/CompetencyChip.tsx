import { Chip } from '@mui/material'
import type { Competency } from '../../../../shared/ipc-types'

type ChipMode = 'read-only' | 'toggle' | 'filter'

interface Props {
  competency: Competency
  mode: ChipMode
  selected?: boolean
  onClick?: () => void
}

const CHIP_COLORS: Record<string, { color: string; borderColor: string; bgcolor: string }> = {
  'Communication': { color: '#2563EB', borderColor: '#93C5FD', bgcolor: '#EFF6FF' },
  'Client Focus':  { color: '#0D9488', borderColor: '#5EEAD4', bgcolor: '#F0FDFA' },
  'Proactivity':   { color: '#D97706', borderColor: '#FCD34D', bgcolor: '#FFFBEB' },
  'Teamwork':      { color: '#7C3AED', borderColor: '#C4B5FD', bgcolor: '#F5F3FF' },
}

export default function CompetencyChip({ competency, mode, selected = false, onClick }: Props): React.JSX.Element {
  const c = CHIP_COLORS[competency.name] ?? { color: '#6B7280', borderColor: '#E5E7EB', bgcolor: '#F9FAFB' }

  if (mode === 'read-only') {
    return (
      <Chip
        label={competency.name}
        size="small"
        tabIndex={0}
        sx={{
          bgcolor: c.bgcolor,
          color: c.color,
          border: `1px solid ${c.borderColor}`,
          fontSize: '12px',
          height: 22,
          pointerEvents: 'none',
        }}
      />
    )
  }

  if (mode === 'toggle') {
    return (
      <Chip
        label={competency.name}
        size="small"
        onClick={onClick}
        aria-pressed={selected}
        sx={{
          cursor: 'pointer',
          bgcolor: c.bgcolor,
          color: c.color,
          border: `1.5px solid ${c.borderColor}`,
          fontSize: '12px',
          opacity: selected ? 1 : 0.35,
          '&:hover': { opacity: 1 },
        }}
      />
    )
  }

  // filter mode
  return (
    <Chip
      label={competency.name}
      onClick={onClick}
      aria-pressed={selected}
      sx={{
        cursor: 'pointer',
        bgcolor: selected ? c.bgcolor : 'white',
        color: c.color,
        border: `1.5px solid ${c.borderColor}`,
        fontSize: '13px',
        fontWeight: selected ? 600 : 400,
        '&:hover': { bgcolor: c.bgcolor, opacity: 0.9 },
      }}
    />
  )
}
