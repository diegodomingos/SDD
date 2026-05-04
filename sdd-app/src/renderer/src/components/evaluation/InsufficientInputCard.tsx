import { Box, Button, Typography } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

interface InsufficientInputCardProps {
  competencyName: string
  rationale: string
  onLogBehavior: () => void
  onRerun: () => void
}

export default function InsufficientInputCard({
  competencyName,
  rationale,
  onLogBehavior,
  onRerun,
}: InsufficientInputCardProps): React.JSX.Element {
  return (
    <Box
      role="alert"
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: '#E65100',
        borderRadius: 1,
        backgroundColor: '#FFF3E0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <WarningAmberIcon sx={{ color: '#E65100' }} />
        <Typography sx={{ fontWeight: 600, color: '#E65100' }}>
          Insufficient Input
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        Add more observations for {competencyName} to unlock a grade.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
        {rationale}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={onLogBehavior}>
          + Log Behavior
        </Button>
        <Button variant="outlined" onClick={onRerun}>
          Re-run Evaluation
        </Button>
      </Box>
    </Box>
  )
}
