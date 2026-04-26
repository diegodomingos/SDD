import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material'
import type { CompetencyLevel } from '../../../shared/ipc-types'
import { useEmployees } from '../hooks/useEmployees'

export default function EmployeeList(): React.JSX.Element {
  const { employees, isLoading, error, load, create, clearError } = useEmployees()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [level, setLevel] = useState<CompetencyLevel | ''>('')

  useEffect(() => {
    load()
  }, [load])

  const handleOpenDialog = () => setDialogOpen(true)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setName('')
    setLevel('')
    clearError()
  }

  const handleSave = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const ok = await create(name.trim(), level as CompetencyLevel)
      if (ok) handleCloseDialog()
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveDisabled = !name.trim() || !level

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && !dialogOpen) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Box>
      {employees.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, gap: 2 }}>
          <Typography color="text.secondary">
            No employees yet — add your first one to get started
          </Typography>
          <Button variant="contained" onClick={handleOpenDialog}>
            + Add Employee
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" onClick={handleOpenDialog}>
              + Add Employee
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2">Name</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">Level</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.level}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Add Employee</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={level}
                label="Level"
                onChange={(e: SelectChangeEvent) => setLevel(e.target.value as CompetencyLevel)}
              >
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="C">C</MenuItem>
                <MenuItem value="D">D</MenuItem>
              </Select>
            </FormControl>
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={saveDisabled || isSubmitting}
            sx={{ opacity: (saveDisabled || isSubmitting) ? 0.4 : 1 }}
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
