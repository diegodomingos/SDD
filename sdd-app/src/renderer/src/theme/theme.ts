import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    competency: {
      communication: string
      clientFocus: string
      proactivity: string
      teamwork: string
    }
    grade: {
      exceedsExpectations: string
      meetsExpectations: string
      doesNotMeetExpectations: string
      insufficientInput: string
    }
  }
  interface PaletteOptions {
    competency?: {
      communication: string
      clientFocus: string
      proactivity: string
      teamwork: string
    }
    grade?: {
      exceedsExpectations: string
      meetsExpectations: string
      doesNotMeetExpectations: string
      insufficientInput: string
    }
  }
}

const theme = createTheme({
  palette: {
    background: { default: '#F5F7FA', paper: '#FFFFFF' },
    primary: { main: '#3B5BDB' },
    text: { primary: '#1A1A2E', secondary: '#6B7280' },
    divider: '#E5E7EB',
    competency: {
      communication: '#4A90D9',
      clientFocus: '#26A69A',
      proactivity: '#FB8C00',
      teamwork: '#7C3AED',
    },
    grade: {
      exceedsExpectations: '#2E7D32',
      meetsExpectations: '#1565C0',
      doesNotMeetExpectations: '#C62828',
      insufficientInput: '#E65100',
    },
  },
})

export default theme
