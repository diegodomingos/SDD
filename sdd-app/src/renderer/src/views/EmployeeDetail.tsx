import { useCallback, useEffect, useState } from 'react'
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
import InlineLogRow from '../components/log/InlineLogRow'
import { useAppStore } from '../store/appStore'
import { useBehaviorLog } from '../hooks/useBehaviorLog'

export default function EmployeeDetail(): React.JSX.Element {
  const employee = useAppStore((s) => s.selectedEmployee)!
  const setEmployee = useAppStore((s) => s.setEmployee)
  const { entries, competencies, isLoading, error, load, loadCompetencies, create } = useBehaviorLog()
  const [activeTab, setActiveTab] = useState(0)
  const [showInlineRow, setShowInlineRow] = useState(false)
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<number | null>(null)

  // Load competencies once on mount
  useEffect(() => {
    loadCompetencies()
  }, [loadCompetencies])

  // Reload entries whenever employee or active filter changes
  useEffect(() => {
    load(employee.id, selectedCompetencyId ?? undefined)
  }, [load, employee.id, selectedCompetencyId])

  const handleSave = useCallback(
    async (description: string, competencyIds: number[], entryDate: string): Promise<boolean> => {
      const ok = await create(
        { employeeId: employee.id, description, competencyIds, entryDate },
        selectedCompetencyId !== null ? { skipPrepend: true } : undefined
      )
      if (ok) {
        if (selectedCompetencyId !== null) {
          // Reload filtered view — prevents prepended entry from showing when it doesn't match the filter
          load(employee.id, selectedCompetencyId)
        }
        setShowInlineRow(false)
      }
      return ok
    },
    [create, employee.id, selectedCompetencyId, load]
  )

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

          {/* Filter chips */}
          {competencies.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {competencies.map((c) => (
                <CompetencyChip
                  key={c.id}
                  competency={c}
                  mode="filter"
                  selected={selectedCompetencyId === c.id}
                  onClick={() =>
                    setSelectedCompetencyId((prev) => (prev === c.id ? null : c.id))
                  }
                />
              ))}
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : entries.length === 0 && !showInlineRow ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, gap: 2 }}>
              <Typography color="text.secondary">
                {selectedCompetencyId !== null
                  ? `No entries tagged to ${competencies.find((c) => c.id === selectedCompetencyId)?.name ?? 'this competency'} for ${employee.name}`
                  : `No behaviors logged for ${employee.name} yet`}
              </Typography>
              <Button variant="contained" onClick={() => setShowInlineRow(true)}>
                + Log Behavior
              </Button>
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
                  {showInlineRow && (
                    <InlineLogRow
                      competencies={competencies}
                      onSave={handleSave}
                      onCancel={() => setShowInlineRow(false)}
                    />
                  )}
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
    </Box>
  )
}
