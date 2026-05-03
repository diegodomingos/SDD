import { useEffect } from 'react'
import { Box, Button, CircularProgress, MenuItem, Select, TextField, Typography } from '@mui/material'
import { useSettings } from '../hooks/useSettings'
import { useAppStore } from '../store/appStore'

export default function Settings(): React.JSX.Element {
  const {
    draftName, setDraftName, isLoading, isSaving, nameError, keyError, modelError, load, saveManagerName,
    isKeyConfigured, draftApiKey, setDraftApiKey, isSavingKey, saveApiKey,
    draftModel, setDraftModel, isSavingModel, saveModel,
  } = useSettings()
  const storedName = useAppStore((s) => s.managerName)
  const storedModel = useAppStore((s) => s.aiModel)

  useEffect(() => {
    load()
  }, [load])

  const isDirty = draftName.trim() !== storedName
  const canSave = isDirty && !isSaving

  const handleSave = async () => {
    await saveManagerName(draftName.trim())
  }

  const handleSaveKey = async () => {
    await saveApiKey(draftApiKey.trim())
  }

  const handleSaveModel = async () => {
    await saveModel(draftModel)
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600 }}>
      <Typography sx={{ fontSize: '20px', fontWeight: 600, mb: 3 }}>Settings</Typography>

      {/* Manager Display Name */}
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
        {nameError && (
          <Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>
            {nameError}
          </Typography>
        )}
      </Box>

      {/* Claude API Key */}
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
        <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 1.5 }}>
          Claude API Key
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
          <TextField
            type="password"
            size="small"
            value={draftApiKey}
            onChange={(e) => setDraftApiKey(e.target.value)}
            placeholder="Enter API key"
            sx={{ width: 280 }}
          />
          <Button
            variant="outlined"
            onClick={handleSaveKey}
            disabled={!draftApiKey.trim() || isSavingKey}
          >
            {isSavingKey ? 'Saving…' : 'Save'}
          </Button>
        </Box>
        <Typography sx={{ fontSize: '13px', color: 'text.secondary', mb: 0.5 }}>
          {isKeyConfigured ? '✓ API key is configured' : 'No API key configured'}
        </Typography>
        <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>
          API key is stored securely in your OS credential store
        </Typography>
        {keyError && (
          <Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>
            {keyError}
          </Typography>
        )}
      </Box>

      {/* Claude Model */}
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
          Claude Model
        </Typography>
        <Typography sx={{ fontSize: '13px', color: 'text.secondary', mb: 2 }}>
          Model used for AI competency evaluation.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Select
            size="small"
            value={draftModel}
            onChange={(e) => setDraftModel(e.target.value)}
            sx={{ width: 280 }}
          >
            <MenuItem value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (default)</MenuItem>
            <MenuItem value="claude-sonnet-4-6">Claude Sonnet 4.6</MenuItem>
          </Select>
          <Button
            variant="outlined"
            onClick={handleSaveModel}
            disabled={isLoading || draftModel === storedModel || isSavingModel}
          >
            {isSavingModel ? 'Saving…' : 'Save'}
          </Button>
        </Box>
        {modelError && (
          <Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>
            {modelError}
          </Typography>
        )}
      </Box>
    </Box>
  )
}
