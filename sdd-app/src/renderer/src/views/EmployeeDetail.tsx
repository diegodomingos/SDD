import { useCallback, useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  IconButton,
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
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CompetencyChip from '../components/common/CompetencyChip'
import InlineLogRow from '../components/log/InlineLogRow'
import GradeResultCard from '../components/evaluation/GradeResultCard'
import { useAppStore } from '../store/appStore'
import { useBehaviorLog } from '../hooks/useBehaviorLog'
import { useEvaluation } from '../hooks/useEvaluation'

export default function EmployeeDetail(): React.JSX.Element {
  const employee = useAppStore((s) => s.selectedEmployee)!
  const setEmployee = useAppStore((s) => s.setEmployee)
  const selectedCompetency = useAppStore((s) => s.selectedCompetency)
  const setCompetency = useAppStore((s) => s.setCompetency)
  const { entries, competencies, isLoading, error, load, loadCompetencies, create, update, remove } = useBehaviorLog()
  const { isLoading: isEvaluating, result: evalResult, error: evalError, evaluate, reset } = useEvaluation()
  const [activeTab, setActiveTab] = useState(0)
  const [showInlineRow, setShowInlineRow] = useState(false)
  const [inlineRowInitialCompetencyIds, setInlineRowInitialCompetencyIds] = useState<number[] | undefined>(undefined)
  const [selectedCompetencyId, setSelectedCompetencyId] = useState<number | null>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null)
  const [totalEntryCount, setTotalEntryCount] = useState(employee.entryCount ?? 0)

  // Load competencies once on mount
  useEffect(() => {
    loadCompetencies()
  }, [loadCompetencies])

  // Reload entries for the active tab's filter
  useEffect(() => {
    if (activeTab === 0) {
      load(employee.id, selectedCompetencyId ?? undefined)
    } else if (activeTab === 1 && selectedCompetency !== null) {
      load(employee.id, selectedCompetency.id)
    }
    // activeTab === 1 && selectedCompetency === null: skip — instructional empty state, no fetch needed
  }, [load, employee.id, selectedCompetencyId, selectedCompetency, activeTab])

  const handleSave = useCallback(
    async (description: string, competencyIds: number[], entryDate: string): Promise<boolean> => {
      const ok = await create(
        { employeeId: employee.id, description, competencyIds, entryDate },
        selectedCompetencyId !== null ? { skipPrepend: true } : undefined
      )
      if (ok) {
        setTotalEntryCount((n) => n + 1)
        if (selectedCompetencyId !== null) {
          // Reload filtered view — prevents prepended entry from showing when it doesn't match the filter
          load(employee.id, selectedCompetencyId)
        }
        setShowInlineRow(false)
        setInlineRowInitialCompetencyIds(undefined)
      }
      return ok
    },
    [create, employee.id, selectedCompetencyId, load]
  )

  const handleSaveEdit = useCallback(
    async (id: number, description: string, competencyIds: number[], entryDate: string): Promise<boolean> => {
      const ok = await update(id, description, competencyIds, entryDate)
      if (ok) setEditingEntryId(null)
      return ok
    },
    [update]
  )

  const handleDelete = useCallback(
    async (id: number) => {
      const ok = await remove(id)
      if (ok) setTotalEntryCount((n) => n - 1)
    },
    [remove]
  )

  const handleLogBehaviorFromInsufficient = useCallback(() => {
    setActiveTab(0)
    setShowInlineRow(true)
    setSelectedCompetencyId(selectedCompetency!.id)
    setInlineRowInitialCompetencyIds([selectedCompetency!.id])
  }, [selectedCompetency])

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs separator="›" sx={{ mb: 2, fontSize: '13px' }}>
        <Link
          component="button"
          underline="always"
          color="primary"
          sx={{ fontSize: '13px', cursor: 'pointer', background: 'none', border: 'none', p: 0, fontWeight: 500 }}
          onClick={() => setEmployee(null)}
        >
          Employees
        </Link>
        <Typography sx={{ fontSize: '13px', color: 'text.primary' }}>{employee.name}</Typography>
      </Breadcrumbs>

      {/* Employee header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', mb: '20px', mt: 1 }}>
        <Box
          sx={{
            width: 42, height: 42, borderRadius: '50%',
            bgcolor: '#EEF2FF', color: '#3B5BDB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 600, flexShrink: 0,
          }}
        >
          {employee.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
        </Box>
        <Box>
          <Typography sx={{ fontSize: '20px', fontWeight: 600, color: '#1A1A2E' }}>
            {employee.name}
          </Typography>
          <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: '2px' }}>
            Level <strong>{employee.level}</strong> · {totalEntryCount} behavior {totalEntryCount === 1 ? 'entry' : 'entries'}
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_e, v) => setActiveTab(v as number)}
        sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Behavior Log" sx={{ textTransform: 'none', fontSize: '14px' }} />
        <Tab label="Evaluate" sx={{ textTransform: 'none', fontSize: '14px' }} />
      </Tabs>

      {activeTab === 1 && (
        <>
          {/* Competency chips + Run Evaluation button row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                Select a competency to evaluate:
              </Typography>
              {competencies.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {competencies.map((c) => (
                    <CompetencyChip
                      key={c.id}
                      competency={c}
                      mode="filter"
                      selected={selectedCompetency?.id === c.id}
                      onClick={() => {
                        setCompetency(selectedCompetency?.id === c.id ? null : c)
                        reset()
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
            {selectedCompetency !== null && (
              <Button
                variant="contained"
                sx={{ ml: 2, whiteSpace: 'nowrap' }}
                onClick={() => evaluate(employee.id, selectedCompetency.id)}
                disabled={isEvaluating}
              >
                Run Evaluation
              </Button>
            )}
          </Box>

          {/* Content area based on competency selection and data state */}
          {selectedCompetency === null ? (
            <Box
              sx={{
                bgcolor: 'white',
                border: '1.5px dashed #E5E7EB',
                borderRadius: '8px',
                p: '56px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                mt: 2,
              }}
            >
              <Typography sx={{ fontSize: '32px', lineHeight: 1 }}>📊</Typography>
              <Typography sx={{ fontSize: '15px', fontWeight: 500, color: '#6B7280', mt: 1 }}>
                Select a competency above to begin
              </Typography>
              <Typography sx={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>
                The relevant behavior entries will be shown, then you can run the AI assessment.
              </Typography>
            </Box>
          ) : (
            <>
              {error ? (
                <Box sx={{ mt: 4 }}>
                  <Alert severity="error">{error}</Alert>
                </Box>
              ) : isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress />
                </Box>
              ) : entries.length === 0 && !isEvaluating && evalResult === null && evalError === null ? (
                <Box
                  sx={{
                    bgcolor: 'white',
                    border: '1.5px dashed #E5E7EB',
                    borderRadius: '8px',
                    p: '56px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    mt: 2,
                  }}
                >
                  <Typography sx={{ fontSize: '32px', lineHeight: 1 }}>📋</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 500, color: '#6B7280', mt: 1 }}>
                    No entries for {selectedCompetency.name}
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center', mb: 2 }}>
                    Log some behaviors tagged to {selectedCompetency.name} to unlock an AI assessment.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => { if (!editingEntryId) { setActiveTab(0); setShowInlineRow(true) } }}
                  >
                    + Log Behavior
                  </Button>
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell component="th" scope="col" sx={{ width: 110 }}>Date</TableCell>
                        <TableCell component="th" scope="col">Description</TableCell>
                        <TableCell component="th" scope="col" sx={{ width: 280 }}>Competencies</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell sx={{ verticalAlign: 'top', color: 'text.secondary', fontSize: '13px' }}>
                            {format(parseISO(entry.entryDate), 'MMM d, yyyy')}
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
              {(isEvaluating || evalResult !== null || evalError !== null) && (
                <GradeResultCard
                  isLoading={isEvaluating}
                  result={evalResult}
                  error={evalError}
                  entryCount={entries.length}
                  competencyName={selectedCompetency!.name}
                  employeeLevel={employee.level}
                  onLogBehavior={handleLogBehaviorFromInsufficient}
                  onRerun={() => evaluate(employee.id, selectedCompetency!.id)}
                  onRetry={() => evaluate(employee.id, selectedCompetency!.id)}
                />
              )}
            </>
          )}
        </>
      )}

      {activeTab === 0 && (
        <>
          {/* Page header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} ·{' '}
              {selectedCompetencyId !== null
                ? competencies.find((c) => c.id === selectedCompetencyId)?.name ?? 'this competency'
                : 'all competencies'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => setShowInlineRow(true)}
              disabled={editingEntryId !== null}
            >
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
            <Box
              sx={{
                bgcolor: 'white',
                border: '1.5px dashed #E5E7EB',
                borderRadius: '8px',
                p: '56px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                mt: 2,
              }}
            >
              <Typography sx={{ fontSize: '32px', lineHeight: 1 }}>📝</Typography>
              <Typography sx={{ fontSize: '15px', fontWeight: 500, color: '#6B7280', mt: 1 }}>
                {selectedCompetencyId !== null ? 'No matching entries' : 'No behaviors logged yet'}
              </Typography>
              <Typography sx={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>
                {selectedCompetencyId !== null
                  ? `No entries tagged to ${competencies.find((c) => c.id === selectedCompetencyId)?.name ?? 'this competency'} — click "+ Log Behavior" above to add one.`
                  : 'Click "+ Log Behavior" above to record an observed behavior.'}
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
                    <TableCell sx={{ width: 80 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {showInlineRow && (
                    <InlineLogRow
                      key={inlineRowInitialCompetencyIds?.join(',') ?? 'default'}
                      competencies={competencies}
                      initialCompetencyIds={inlineRowInitialCompetencyIds}
                      onSave={handleSave}
                      onCancel={() => {
                        setShowInlineRow(false)
                        setInlineRowInitialCompetencyIds(undefined)
                      }}
                    />
                  )}
                  {entries.map((entry) =>
                    editingEntryId === entry.id ? (
                      <InlineLogRow
                        key={entry.id}
                        competencies={competencies}
                        initialDescription={entry.description}
                        initialCompetencyIds={entry.competencies.map((c) => c.id)}
                        initialDate={entry.entryDate}
                        onSave={(desc, ids, date) => handleSaveEdit(entry.id, desc, ids, date)}
                        onCancel={() => setEditingEntryId(null)}
                      />
                    ) : (
                      <TableRow
                        key={entry.id}
                        onMouseEnter={() => setHoveredId(entry.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        <TableCell sx={{ verticalAlign: 'top', color: 'text.secondary', fontSize: '13px' }}>
                          {format(parseISO(entry.entryDate), 'MMM d, yyyy')}
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
                        <TableCell sx={{ verticalAlign: 'top', width: 80 }}>
                          {hoveredId === entry.id && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                aria-label="Edit log entry"
                                size="small"
                                sx={{ minWidth: 40, minHeight: 40 }}
                                onClick={() => { setShowInlineRow(false); setHoveredId(null); setEditingEntryId(entry.id) }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                aria-label="Delete log entry"
                                size="small"
                                sx={{ minWidth: 40, minHeight: 40 }}
                                onClick={() => handleDelete(entry.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  )
}
