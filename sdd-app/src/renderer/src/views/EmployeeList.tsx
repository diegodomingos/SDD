import { Fragment, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
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
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import type { SelectChangeEvent } from '@mui/material'
import type { CompetencyLevel, Employee } from '../../../shared/ipc-types'
import { useEmployees } from '../hooks/useEmployees'
import { useAppStore } from '../store/appStore'

export default function EmployeeList(): React.JSX.Element {
  const { employees, isLoading, error, load, create, update, remove, clearError } = useEmployees()
  const setEmployee = useAppStore((s) => s.setEmployee)

  // Add Employee dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [level, setLevel] = useState<CompetencyLevel | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Inline edit state
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editLevel, setEditLevel] = useState<CompetencyLevel | ''>('')
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  useEffect(() => {
    load()
  }, [load])

  // Add Employee dialog handlers
  const handleOpenDialog = () => {
    clearError()
    setDialogOpen(true)
  }

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

  // Inline edit handlers
  const handleEditOpen = (emp: Employee) => {
    if (editingId !== null) return
    clearError()
    setEditingId(emp.id)
    setEditName(emp.name)
    setEditLevel(emp.level)
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditName('')
    setEditLevel('')
    clearError()
  }

  const handleEditSave = async () => {
    if (isEditSubmitting) return
    setIsEditSubmitting(true)
    try {
      const ok = await update(editingId!, editName.trim(), editLevel as CompetencyLevel)
      if (ok) {
        setEditingId(null)
        setEditName('')
        setEditLevel('')
      }
    } finally {
      setIsEditSubmitting(false)
    }
  }

  const editSaveDisabled = !editName.trim() || !editLevel

  // Delete confirmation handler
  const handleDeleteConfirm = async () => {
    if (deleteConfirmId === null) return
    setIsDeleting(true)
    const ok = await remove(deleteConfirmId)
    setIsDeleting(false)
    if (ok) setDeleteConfirmId(null)
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && !dialogOpen && editingId === null && deleteConfirmId === null) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Box>
      {/* Page header — always visible */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A1A2E' }}>
          Employees
        </Typography>
        <Button variant="contained" onClick={handleOpenDialog}>
          + Add Employee
        </Button>
      </Box>

      {employees.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, gap: 2 }}>
          <Typography color="text.secondary">
            No employees yet — add your first one to get started
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell sx={{ width: 120 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp) =>
                  editingId === emp.id ? (
                    <Fragment key={emp.id}>
                      <TableRow>
                        <TableCell>
                          <TextField
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            size="small"
                            autoFocus
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={editLevel}
                              onChange={(e: SelectChangeEvent) =>
                                setEditLevel(e.target.value as CompetencyLevel)
                              }
                            >
                              <MenuItem value="A">A</MenuItem>
                              <MenuItem value="B">B</MenuItem>
                              <MenuItem value="C">C</MenuItem>
                              <MenuItem value="D">D</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            aria-label="Save edit"
                            size="medium"
                            disabled={editSaveDisabled || isEditSubmitting}
                            sx={{ opacity: editSaveDisabled || isEditSubmitting ? 0.4 : 1 }}
                            onClick={handleEditSave}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            aria-label="Cancel edit"
                            size="medium"
                            onClick={handleEditCancel}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      {error && (
                        <TableRow>
                          <TableCell colSpan={3} sx={{ pt: 0, pb: 0.5 }}>
                            <Alert severity="error" sx={{ py: 0 }}>{error}</Alert>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ) : (
                    <TableRow
                      key={emp.id}
                      onMouseEnter={() => setHoveredId(emp.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 500,
                          cursor: 'pointer',
                          '&:hover': { color: 'primary.main' },
                        }}
                        onClick={() => setEmployee(emp)}
                      >
                        {emp.name}
                      </TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: '6px',
                            bgcolor: '#EEF2FF',
                            color: '#3B5BDB',
                            fontSize: '13px',
                            fontWeight: 600,
                          }}
                        >
                          {emp.level}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {hoveredId === emp.id && (
                          <>
                            <IconButton
                              aria-label="Edit employee"
                              size="medium"
                              onClick={() => handleEditOpen(emp)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              aria-label="Delete employee"
                              size="medium"
                              onClick={() => { if (editingId === null) setDeleteConfirmId(emp.id) }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Dialog
        open={deleteConfirmId !== null}
        onClose={() => { setDeleteConfirmId(null); clearError() }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Employee</DialogTitle>
        <DialogContent>
          <DialogContentText>
            All associated behavior log entries will also be deleted. This cannot be undone.
          </DialogContentText>
          {error && deleteConfirmId !== null && (
            <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => { setDeleteConfirmId(null); clearError() }}>
            Cancel
          </Button>
          <Button variant="outlined" color="error" onClick={handleDeleteConfirm} disabled={isDeleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
