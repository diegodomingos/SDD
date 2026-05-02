import { useState, useRef } from 'react'
import { Box, IconButton, TableCell, TableRow, TextField } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format } from 'date-fns'
import CompetencyChip from '../common/CompetencyChip'
import type { Competency } from '../../../../shared/ipc-types'

interface InlineLogRowProps {
  competencies: Competency[]
  onSave: (description: string, competencyIds: number[], entryDate: string) => Promise<boolean>
  onCancel: () => void
}

export default function InlineLogRow({ competencies, onSave, onCancel }: InlineLogRowProps): React.JSX.Element {
  const [date, setDate] = useState<Date | null>(new Date())
  const [description, setDescription] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  const canSave = description.trim().length > 0 && selectedIds.size > 0 && date !== null

  const toggleCompetency = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (!canSave || !date || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      const ok = await onSave(description.trim(), [...selectedIds], format(date, 'yyyy-MM-dd'))
      if (!ok) setSaving(false)
    } catch {
      setSaving(false)
    } finally {
      savingRef.current = false
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <TableRow sx={{ backgroundColor: '#F0F4FF' }}>
        {/* Date cell */}
        <TableCell sx={{ verticalAlign: 'top', width: 110, pt: 1.5 }}>
          <DatePicker
            value={date}
            onChange={(d) => setDate(d)}
            slotProps={{
              textField: {
                size: 'small',
                sx: { width: 130 },
              },
            }}
          />
        </TableCell>

        {/* Description cell */}
        <TableCell sx={{ verticalAlign: 'top', pt: 1.5 }}>
          <TextField
            multiline
            autoFocus
            minRows={2}
            fullWidth
            size="small"
            placeholder="Describe the observed behavior…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !saving) onCancel()
            }}
            disabled={saving}
          />
        </TableCell>

        {/* Chips + actions cell */}
        <TableCell sx={{ verticalAlign: 'top', width: 280, pt: 1.5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {competencies.map((c) => (
              <CompetencyChip
                key={c.id}
                competency={c}
                mode="toggle"
                selected={selectedIds.has(c.id)}
                onClick={() => toggleCompetency(c.id)}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              color="primary"
              aria-label="Save log entry"
              onClick={handleSave}
              disabled={!canSave || saving}
              sx={{ '&.Mui-disabled': { opacity: 0.4 } }}
            >
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Cancel log entry"
              onClick={onCancel}
              disabled={saving}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
    </LocalizationProvider>
  )
}
