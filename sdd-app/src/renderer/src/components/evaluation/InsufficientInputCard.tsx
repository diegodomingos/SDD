import { Box, Button, Typography } from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

interface InsufficientInputCardProps {
  competencyName: string
  rationale: string
  onLogBehavior: () => void
}

export default function InsufficientInputCard({
  competencyName,
  rationale,
  onLogBehavior,
}: InsufficientInputCardProps): React.JSX.Element {
  return (
    <Box
      role="alert"
      sx={{
        p: 3,
        border: '1px solid #FCD34D',
        borderRadius: 1,
        bgcolor: '#FFFBEB',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <WarningAmberIcon sx={{ color: '#92400E' }} />
        <Typography sx={{ fontWeight: 600, color: '#92400E' }}>
          Insufficient Input
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ mb: 1.5, color: '#78350F' }}>
        {rationale}
      </Typography>
      <Typography sx={{ fontSize: '13px', color: '#B45309', fontWeight: 500, mb: 2 }}>
        → Add more {competencyName} observations to unlock an assessment
      </Typography>
      <Button variant="contained" onClick={onLogBehavior}>
        + Log Behavior
      </Button>
    </Box>
  )
}
