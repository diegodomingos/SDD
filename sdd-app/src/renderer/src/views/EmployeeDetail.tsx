import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Link,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material'
import CompetencyChip from '../components/common/CompetencyChip'
import { useAppStore } from '../store/appStore'
import { useBehaviorLog } from '../hooks/useBehaviorLog'

export default function EmployeeDetail(): React.JSX.Element {
  const employee = useAppStore((s) => s.selectedEmployee)!
  const setEmployee = useAppStore((s) => s.setEmployee)
  const { entries, isLoading, error, load } = useBehaviorLog()
  const [activeTab, setActiveTab] = useState(0)
  const [showInlineRow, setShowInlineRow] = useState(false) // wired to InlineLogRow in Story 4.2

  useEffect(() => {
    load(employee.id)
  }, [load, employee.id])

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 2, fontSize: '13px' }}>
        <Link
          component="button"
          underline="hover"
          color="text.secondary"
          sx={{ fontSize: '13px', cursor: 'pointer', background: 'none', border: 'none', p: 0 }}
          onClick={() => setEmployee(null)}
        >
          Employees
        </Link>
        <Typography sx={{ fontSize: '13px', color: 'text.primary' }}>{employee.name}</Typography>
      </Breadcrumbs>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_e, v) => setActiveTab(v as number)}
        sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Behavior Log" />
        <Tab label="Evaluate" />
      </Tabs>

      {activeTab === 1 && (
        <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          AI evaluation — coming in Epic 6.
        </Typography>
      )}

      {activeTab === 0 && (
        <>
          {/* Page header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A1A2E' }}>
              Behavior Log
            </Typography>
            <Button variant="contained" onClick={() => setShowInlineRow(true)}>
              + Log Behavior
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : entries.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, gap: 1 }}>
              <Typography color="text.secondary">
                No behaviors logged for {employee.name} yet
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell component="th" scope="col" sx={{ width: 110 }}>
                      Date
                    </TableCell>
                    <TableCell component="th" scope="col">
                      Description
                    </TableCell>
                    <TableCell component="th" scope="col" sx={{ width: 280 }}>
                      Competencies
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell sx={{ verticalAlign: 'top', color: 'text.secondary', fontSize: '13px' }}>
                        {entry.entryDate}
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                        {entry.description}
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {entry.competencies.map((c) => (
                            <CompetencyChip key={c.id} competency={c} mode="read-only" />
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* showInlineRow used by Story 4.2 — suppress unused-var lint */}
      {showInlineRow && null}
    </Box>
  )
}
