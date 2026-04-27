import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import useFramework from '../hooks/useFramework'
import type { CompetencyLevel } from '../../../shared/ipc-types'

const LEVELS: CompetencyLevel[] = ['A', 'B', 'C', 'D']

type EditingCell = { competencyId: number; level: CompetencyLevel }

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
      <Typography variant="h6" sx={{ mb: 2 }}>
        Competency Framework
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell component="th" scope="col">
              Competency
            </TableCell>
            {LEVELS.map((level) => (
              <TableCell key={level} component="th" scope="col" align="center">
                Level {level}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {competencies.map((comp) => (
            <TableRow key={comp.id}>
              <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>{comp.name}</TableCell>
              {LEVELS.map((level) => {
                const description = behaviors[comp.id]?.[level] ?? null
                const isEditing =
                  editingCell?.competencyId === comp.id && editingCell?.level === level

                return (
                  <TableCell key={level} align="left" sx={{ verticalAlign: 'top', minWidth: 200 }}>
                    {isEditing ? (
                      <Box>
                        <TextField
                          multiline
                          fullWidth
                          size="small"
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              cancelEdit()
                            }
                          }}
                        />
                        <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            aria-label="Save expected behavior"
                            disabled={!draftText.trim()}
                            sx={{ opacity: draftText.trim() ? 1 : 0.4 }}
                            onClick={() => confirmSave(comp.id, level)}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            aria-label="Cancel edit"
                            onClick={cancelEdit}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        {description ? (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {description}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            (not configured)
                          </Typography>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => startEdit(comp.id, level, description)}
                        >
                          Edit
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
