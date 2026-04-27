import { useEffect } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import useFramework from '../hooks/useFramework'

const LEVELS = ['A', 'B', 'C', 'D'] as const

export default function Framework(): React.JSX.Element {
  const { competencies, behaviors, isLoading, error, load } = useFramework()

  useEffect(() => {
    load()
  }, [load])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Competency Framework
      </Typography>
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
                return (
                  <TableCell key={level} align="left" sx={{ verticalAlign: 'top', minWidth: 180 }}>
                    {description ? (
                      <Typography variant="body2">{description}</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        (not configured)
                      </Typography>
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
