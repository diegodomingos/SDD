import { Box } from '@mui/material'
import Sidebar from './Sidebar'

interface Props {
  children: React.ReactNode
}

export default function AppShell({ children }: Props): React.JSX.Element {
  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box component="main" sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ maxWidth: 960, mx: 'auto', p: 3 }}>{children}</Box>
      </Box>
    </Box>
  )
}
