import { useEffect } from 'react'
import { Box, List, ListItemButton, Typography } from '@mui/material'
import { useAppStore } from '../../store/appStore'
import { useSettings } from '../../hooks/useSettings'

type NavItem = {
  label: string
  view: 'employees' | 'framework' | 'settings'
  icon: string
}

const navItems: NavItem[] = [
  { label: 'Employees', view: 'employees', icon: '👥' },
  { label: 'Framework', view: 'framework', icon: '📋' },
  { label: 'Settings', view: 'settings', icon: '⚙️' },
]

export default function Sidebar(): React.JSX.Element {
  const currentView = useAppStore((s) => s.currentView)
  const setView = useAppStore((s) => s.setView)
  const managerName = useAppStore((s) => s.managerName)
  const { load } = useSettings()

  useEffect(() => {
    load()
  }, [load])

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
      }}
    >
      {/* Logo area */}
      <Box
        sx={{
          px: 2,
          pt: '18px',
          pb: '14px',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          sx={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'primary.main',
            lineHeight: 1.4,
            letterSpacing: '0.1px',
          }}
        >
          Employee Evaluation Tool
        </Typography>
        <Typography
          sx={{
            fontSize: '11px',
            fontWeight: 400,
            color: '#9CA3AF',
            mt: '3px',
          }}
        >
          {managerName || 'Manager'}
        </Typography>
      </Box>

      {/* Nav items */}
      <List disablePadding sx={{ pt: 1, pb: 1, flex: 1 }}>
        {navItems.map(({ label, view, icon }) => (
          <ListItemButton
            key={view}
            selected={currentView === view}
            onClick={() => setView(view)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 2,
              py: '10px',
              color: '#6B7280',
              borderLeft: '3px solid transparent',
              borderRadius: 0,
              '&.Mui-selected': {
                bgcolor: '#EEF2FF',
                color: 'primary.main',
                fontWeight: 500,
                borderLeftColor: 'primary.main',
              },
              '&.Mui-selected:hover': {
                bgcolor: '#EEF2FF',
              },
              '&:hover:not(.Mui-selected)': {
                bgcolor: '#F9FAFB',
                color: '#1A1A2E',
              },
            }}
          >
            <Box
              component="span"
              aria-hidden="true"
              sx={{ width: 18, textAlign: 'center', fontSize: '15px', flexShrink: 0, lineHeight: 1 }}
            >
              {icon}
            </Box>
            <Typography sx={{ fontSize: '14px', color: 'inherit', fontWeight: 'inherit' }}>
              {label}
            </Typography>
          </ListItemButton>
        ))}
      </List>

      {/* Footer */}
      <Box
        sx={{
          px: 2,
          py: '12px',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>v1.0.0</Typography>
      </Box>
    </Box>
  )
}
