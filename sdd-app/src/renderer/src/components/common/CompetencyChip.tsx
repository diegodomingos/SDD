import { Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { Competency } from '../../../../shared/ipc-types'

type ChipMode = 'read-only' | 'toggle' | 'filter'

interface Props {
  competency: Competency
  mode: ChipMode
  selected?: boolean
  onClick?: () => void
}

export default function CompetencyChip({ competency, mode, selected = false, onClick }: Props): React.JSX.Element {
  const theme = useTheme()

  const colorMap: Record<string, string> = {
    'Communication': theme.palette.competency.communication,
    'Client Focus': theme.palette.competency.clientFocus,
    'Proactivity': theme.palette.competency.proactivity,
    'Teamwork': theme.palette.competency.teamwork,
  }
  const color = colorMap[competency.name] ?? theme.palette.text.secondary

  if (mode === 'read-only') {
    return (
      <Chip
        label={competency.name}
        size="small"
        variant="outlined"
        tabIndex={0}
        sx={{
          borderColor: color,
          color,
          fontSize: '11px',
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
          bgcolor: selected ? color : 'transparent',
          color: selected ? '#fff' : color,
          borderColor: color,
          border: '1px solid',
          fontSize: '12px',
          opacity: selected ? 1 : 0.5,
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
        bgcolor: selected ? color : 'transparent',
        color: selected ? '#fff' : color,
        borderColor: color,
        border: '1px solid',
        fontSize: '12px',
        fontWeight: selected ? 600 : 400,
        '&:hover': { opacity: 0.85 },
      }}
    />
  )
}
