import { Box, List, ListItemButton, ListItemText, Typography } from '@mui/material'
import { useAppStore } from '../../store/appStore'

type NavItem = { label: string; view: 'employees' | 'framework' | 'settings' }

const navItems: NavItem[] = [
  { label: 'Employees', view: 'employees' },
  { label: 'Framework', view: 'framework' },
  { label: 'Settings', view: 'settings' },
]

export default function Sidebar(): React.JSX.Element {
  const currentView = useAppStore((s) => s.currentView)
  const setView = useAppStore((s) => s.setView)

  return (
    <Box
      component="nav"
      sx={{
        width: 200,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        gap: 1,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }} color="text.primary">
        Employee Evaluation Tool
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Manager
      </Typography>
      <List disablePadding sx={{ mt: 1 }}>
        {navItems.map(({ label, view }) => (
          <ListItemButton
            key={view}
            selected={currentView === view}
            onClick={() => setView(view)}
            sx={{
              borderRadius: 1,
              borderLeft: '3px solid transparent',
              '&.Mui-selected': {
                borderLeftColor: 'primary.main',
                bgcolor: 'action.selected',
              },
              '&.Mui-selected:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}
