import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import type { EvaluateResult, Grade } from '../../../../shared/ipc-types'

const GRADE_COLORS: Record<Grade, string> = {
  'Exceeds Expectations': '#2E7D32',
  'Meets Expectations': '#1565C0',
  'Does Not Meet Expectations': '#C62828',
  'Insufficient Input': '#E65100',
}

interface GradeResultCardProps {
  isLoading: boolean
  result: EvaluateResult | null
  error: string | null
  entryCount: number
  onRerun: () => void
  onRetry: () => void
}

export default function GradeResultCard({
  isLoading,
  result,
  error,
  entryCount,
  onRerun,
  onRetry,
}: GradeResultCardProps): React.JSX.Element {
  return (
    <Paper sx={{ p: 3, mb: 2 }} aria-live="polite" aria-label="Evaluation result">
      {isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography color="text.secondary">Running evaluation…</Typography>
        </Box>
      ) : error ? (
        <Box>
          <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
          <Button variant="outlined" onClick={onRetry}>Retry</Button>
        </Box>
      ) : result ? (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  backgroundColor: GRADE_COLORS[result.grade],
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  alignSelf: 'flex-start',
                }}
              >
                {result.grade}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Based on {entryCount} observation{entryCount !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Button variant="outlined" onClick={onRerun} sx={{ ml: 2, whiteSpace: 'nowrap' }}>
              Re-run Evaluation
            </Button>
          </Box>
          <Typography sx={{ fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {result.rationale}
          </Typography>
        </Box>
      ) : null}
    </Paper>
  )
}
