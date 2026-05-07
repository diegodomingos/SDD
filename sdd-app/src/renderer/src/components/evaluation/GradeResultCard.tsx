import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import type { EvaluateResult, Grade } from '../../../../shared/ipc-types'
import InsufficientInputCard from './InsufficientInputCard'

const GRADE_STYLES: Record<Grade, { color: string; bg: string; border: string }> = {
  'Exceeds Expectations':       { color: '#166534', bg: '#DCFCE7', border: '1px solid #86EFAC' },
  'Meets Expectations':         { color: '#1E40AF', bg: '#DBEAFE', border: '1px solid #93C5FD' },
  'Does Not Meet Expectations': { color: '#991B1B', bg: '#FEE2E2', border: '1px solid #FCA5A5' },
  'Insufficient Input':         { color: '#92400E', bg: '#FEF3C7', border: '1px solid #FCD34D' },
}

interface GradeResultCardProps {
  isLoading: boolean
  result: EvaluateResult | null
  error: string | null
  entryCount: number
  competencyName: string
  employeeLevel: string
  onLogBehavior: () => void
  onRerun: () => void
  onRetry: () => void
}

export default function GradeResultCard({
  isLoading,
  result,
  error,
  entryCount,
  competencyName,
  employeeLevel,
  onLogBehavior,
  onRerun,
  onRetry,
}: GradeResultCardProps): React.JSX.Element {
  return (
    <Paper sx={{ p: '20px 24px', mt: '20px' }} aria-live="polite" aria-label="Evaluation result">
      {isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography color="text.secondary">Running evaluation…</Typography>
        </Box>
      ) : error ? (
        <Box>
          <Alert severity="error" role="presentation" sx={{ mb: 2 }}>{error}</Alert>
          <Button variant="outlined" onClick={onRetry}>Retry</Button>
        </Box>
      ) : result ? (
        result.grade === 'Insufficient Input' ? (
          <InsufficientInputCard
            competencyName={competencyName}
            rationale={result.rationale}
            onLogBehavior={onLogBehavior}
          />
        ) : (
          <Box>
            <Typography sx={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#9CA3AF', mb: 1 }}>
              AI Assessment · {competencyName} · Level {employeeLevel}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    px: 1.5,
                    py: '5px',
                    borderRadius: '6px',
                    bgcolor: GRADE_STYLES[result.grade].bg,
                    color: GRADE_STYLES[result.grade].color,
                    border: GRADE_STYLES[result.grade].border,
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  {result.grade}
                </Box>
                <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                  Based on {entryCount} observation{entryCount !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <Button variant="outlined" onClick={onRerun} sx={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                ↺ Re-run Evaluation
              </Button>
            </Box>
            <Box sx={{ bgcolor: '#F9FAFB', borderLeft: '3px solid #C7D2FE', p: '12px 16px', borderRadius: '0 4px 4px 0', mt: '14px' }}>
              <Typography sx={{ fontSize: '14px', color: '#374151', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                {result.rationale}
              </Typography>
            </Box>
          </Box>
        )
      ) : null}
    </Paper>
  )
}
