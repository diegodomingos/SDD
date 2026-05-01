import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import useFramework from '../hooks/useFramework'
import type { CompetencyLevel } from '../../../shared/ipc-types'

const LEVELS: CompetencyLevel[] = ['A', 'B', 'C', 'D']

type EditingCell = { competencyId: number; level: CompetencyLevel }

const COMPETENCY_CHIP_STYLES: Record<string, { color: string; borderColor: string; bgcolor: string }> = {
  Communication:  { color: '#2563EB', borderColor: '#93C5FD', bgcolor: '#EFF6FF' },
  'Client Focus': { color: '#0D9488', borderColor: '#5EEAD4', bgcolor: '#F0FDFA' },
  Proactivity:    { color: '#D97706', borderColor: '#FCD34D', bgcolor: '#FFFBEB' },
  Teamwork:       { color: '#7C3AED', borderColor: '#C4B5FD', bgcolor: '#F5F3FF' },
}

export default function Framework(): React.JSX.Element {
  const { competencies, behaviors, isLoading, error, load, clearError, saveBehavior } = useFramework()
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [draftText, setDraftText] = useState('')

  useEffect(() => {
    load()
  }, [load])

  const startEdit = (competencyId: number, level: CompetencyLevel, currentText: string | null) => {
    clearError()
    setEditingCell({ competencyId, level })
    setDraftText(currentText ?? '')
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setDraftText('')
  }

  const confirmSave = async (competencyId: number, level: CompetencyLevel) => {
    const success = await saveBehavior(competencyId, level, draftText.trim())
    if (success) {
      setEditingCell(null)
      setDraftText('')
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (competencies.length === 0 && error) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#1A1A2E' }}>
        Competency Framework
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: -0.5 }}>
        Define the expected observable behaviors per competency and level. These are the standards used
        by the AI to assess employees.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}
      {competencies.map((comp) => {
        const chipStyle = COMPETENCY_CHIP_STYLES[comp.name] ?? {
          color: '#6B7280',
          borderColor: '#E5E7EB',
          bgcolor: '#F9FAFB',
        }
        const configuredCount = LEVELS.filter((l) => behaviors[comp.id]?.[l]).length

        return (
          <Box
            key={comp.id}
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              mb: 1.5,
              overflow: 'hidden',
            }}
          >
            {/* Card header */}
            <Box
              sx={{
                px: 2.5,
                py: 1.75,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: '#F9FAFB',
              }}
            >
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: '10px',
                  py: '2px',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: chipStyle.borderColor,
                  bgcolor: chipStyle.bgcolor,
                  color: chipStyle.color,
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                {comp.name}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {configuredCount} of {LEVELS.length} levels configured
              </Typography>
            </Box>

            {/* Card body */}
            <Box sx={{ px: 2.5, py: 2 }}>
              {LEVELS.map((level, idx) => {
                const description = behaviors[comp.id]?.[level] ?? null
                const isEditing =
                  editingCell?.competencyId === comp.id && editingCell?.level === level

                return (
                  <Box
                    key={level}
                    sx={{
                      display: 'flex',
                      gap: 1.75,
                      alignItems: 'flex-start',
                      mb: idx < LEVELS.length - 1 ? 1.75 : 0,
                      ...(isEditing && {
                        bgcolor: '#F0F4FF',
                        mx: -0.5,
                        px: 0.5,
                        py: 1,
                        borderRadius: '6px',
                      }),
                    }}
                  >
                    {/* Level badge */}
                    <Box
                      sx={{
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        borderRadius: '6px',
                        bgcolor: '#EEF2FF',
                        color: '#3B5BDB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                        mt: '1px',
                      }}
                    >
                      {level}
                    </Box>

                    {/* Description or textarea */}
                    <Box sx={{ flex: 1 }}>
                      {isEditing ? (
                        <TextField
                          multiline
                          fullWidth
                          size="small"
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') cancelEdit()
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            color: description ? '#374151' : 'text.secondary',
                            lineHeight: 1.55,
                          }}
                        >
                          {description ?? 'not configured'}
                        </Typography>
                      )}
                    </Box>

                    {/* Action buttons */}
                    {isEditing ? (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => { if (draftText.trim()) confirmSave(comp.id, level) }}
                          sx={{
                            flexShrink: 0,
                            mt: '2px',
                            fontSize: '12px',
                            px: 1.5,
                            py: 0.5,
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            fontWeight: 500,
                            opacity: draftText.trim() ? 1 : 0.4,
                            pointerEvents: draftText.trim() ? 'auto' : 'none',
                          }}
                        >
                          Save
                        </Button>
                        <IconButton
                          size="small"
                          aria-label="Cancel edit"
                          onClick={cancelEdit}
                          sx={{ mt: '2px', flexShrink: 0 }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => startEdit(comp.id, level, description)}
                        sx={{
                          flexShrink: 0,
                          mt: '2px',
                          fontSize: '12px',
                          px: 1.5,
                          py: 0.5,
                          borderColor: '#E5E7EB',
                          color: '#6B7280',
                          '&:hover': {
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            bgcolor: 'transparent',
                          },
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </Box>
                )
              })}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
