import { useEffect } from 'react'
import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material'
import { useSettings } from '../hooks/useSettings'
import { useAppStore } from '../store/appStore'

export default function Settings(): React.JSX.Element {
  const { draftName, setDraftName, isLoading, isSaving, error, load, saveManagerName } =
    useSettings()
  const storedName = useAppStore((s) => s.managerName)

  useEffect(() => {
    load()
  }, [load])

  const isDirty = draftName.trim() !== storedName
  const canSave = isDirty && !isSaving

  const handleSave = async () => {
    await saveManagerName(draftName.trim())
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography sx={{ fontSize: '20px', fontWeight: 600, mb: 3 }}>Settings</Typography>

      <Box
        sx={{
          mb: 3,
          p: 2.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 0.5 }}>
          Manager Display Name
        </Typography>
        <Typography sx={{ fontSize: '13px', color: 'text.secondary', mb: 2 }}>
          Shown in the sidebar. Used to personalize the app.
        </Typography>
        {isLoading ? (
          <CircularProgress size={20} />
        ) : (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Enter your name"
              sx={{ width: 280 }}
            />
            <Button variant="outlined" onClick={handleSave} disabled={!canSave}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </Box>
        )}
        {error && (
          <Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>
            {error}
          </Typography>
        )}
      </Box>
    </Box>
  )
}
