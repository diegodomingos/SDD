import { CssBaseline, ThemeProvider } from '@mui/material'
import AppShell from './components/layout/AppShell'
import { useAppStore } from './store/appStore'
import theme from './theme/theme'
import EmployeeDetail from './views/EmployeeDetail'
import EmployeeList from './views/EmployeeList'
import Framework from './views/Framework'
import Settings from './views/Settings'

function ViewRouter(): React.JSX.Element {
  const currentView = useAppStore((s) => s.currentView)
  const selectedEmployee = useAppStore((s) => s.selectedEmployee)
  if (currentView === 'framework') return <Framework />
  if (currentView === 'settings') return <Settings />
  if (currentView === 'employees' && selectedEmployee !== null) return <EmployeeDetail key={selectedEmployee.id} />
  return <EmployeeList />
}

function App(): React.JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell>
        <ViewRouter />
      </AppShell>
    </ThemeProvider>
  )
}

export default App
