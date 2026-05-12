import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useSettings } from '../hooks/useSettings'
import { useAppStore } from '../store/appStore'

function SectionHeader({
  label,
  danger = false
}: {
  label: string
  danger?: boolean
}): React.JSX.Element {
  return (
    <Box
      sx={{
        px: '20px',
        py: '14px',
        bgcolor: danger ? '#FFF5F5' : '#F9FAFB',
        borderBottom: `1px solid ${danger ? '#FCA5A5' : '#E5E7EB'}`
      }}
    >
      <Typography
        sx={{
          fontSize: '13px',
          fontWeight: 600,
          color: danger ? '#991B1B' : '#374151',
          textTransform: 'uppercase',
          letterSpacing: '0.6px'
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

export default function Settings(): React.JSX.Element {
  const {
    draftName,
    setDraftName,
    isLoading,
    isSaving,
    nameError,
    keyError,
    modelError,
    load,
    saveManagerName,
    isKeyConfigured,
    draftApiKey,
    setDraftApiKey,
    isSavingKey,
    saveApiKey,
    draftModel,
    setDraftModel,
    isSavingModel,
    saveModel,
    isClearingData,
    clearDataError,
    clearAllData: clearAllDataFn,
    resetClearError,
    isExporting,
    exportError,
    exportSuccess,
    exportData,
    isImporting,
    importError,
    importSuccess,
    importData
  } = useSettings()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const storedName = useAppStore((s) => s.managerName)
  const storedModel = useAppStore((s) => s.aiModel)

  useEffect(() => {
    load()
  }, [load])

  const isDirty = draftName.trim() !== storedName
  const canSave = isDirty && !isSaving

  const handleSave = async (): Promise<void> => {
    await saveManagerName(draftName.trim())
  }

  const handleSaveKey = async (): Promise<void> => {
    await saveApiKey(draftApiKey.trim())
  }

  const handleSaveModel = async (): Promise<void> => {
    await saveModel(draftModel)
  }

  const handleClearConfirm = async (): Promise<void> => {
    const ok = await clearAllDataFn()
    if (ok) setConfirmOpen(false)
  }

  const handleExport = async (): Promise<void> => {
    await exportData()
  }

  const handleImportConfirm = async (): Promise<void> => {
    await importData()
    setImportConfirmOpen(false)
  }

  return (
    <>
      <Box>
        <Typography sx={{ fontSize: '20px', fontWeight: 600, mb: 3 }}>Settings</Typography>

        {/* GENERAL */}
        <Box
          sx={{
            mb: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <SectionHeader label="General" />
          <Box sx={{ p: 2.5 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 1 }}>
              Manager Display Name
            </Typography>
            {isLoading ? (
              <CircularProgress size={20} />
            ) : (
              <Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.75 }}>
                  <TextField
                    size="small"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Enter your name"
                    sx={{ width: 280 }}
                  />
                  <Button variant="outlined" size="small" onClick={handleSave} disabled={!canSave}>
                    {isSaving ? 'Saving…' : 'Save'}
                  </Button>
                </Box>
                <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>
                  Shown in the sidebar. Used to personalize the app.
                </Typography>
              </Box>
            )}
            {nameError && (
              <Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>
                {nameError}
              </Typography>
            )}
          </Box>
        </Box>

        {/* AI CONFIGURATION */}
        <Box
          sx={{
            mb: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <SectionHeader label="AI Configuration" />
          <Box sx={{ p: 2.5 }}>
            {/* API Key */}
            <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 1.5 }}>
              Claude API Key
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <TextField
                type={showApiKey ? 'text' : 'password'}
                size="small"
                value={draftApiKey}
                onChange={(e) => setDraftApiKey(e.target.value)}
                placeholder="Enter API key"
                sx={{ width: 380 }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                          onClick={() => setShowApiKey((v) => !v)}
                          edge="end"
                        >
                          {showApiKey ? (
                            <VisibilityOffIcon fontSize="small" />
                          ) : (
                            <VisibilityIcon fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleSaveKey}
                disabled={!draftApiKey.trim() || isSavingKey}
              >
                {isSavingKey ? 'Saving…' : 'Save'}
              </Button>
            </Box>
            <Typography sx={{ fontSize: '12px', mb: 0.5 }}>
              {isKeyConfigured ? '✓ API key is configured' : 'No API key configured'}
            </Typography>
            <Typography sx={{ fontSize: '12px' }}>
              <Box component="span" sx={{ color: '#059669', fontWeight: 500 }}>
                🔒 Stored securely
              </Box>
              <Box component="span" sx={{ color: '#9CA3AF' }}>
                {' '}
                · Encrypted by your OS credential store
              </Box>
            </Typography>
            {keyError && (
              <Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>
                {keyError}
              </Typography>
            )}

            {/* Model selector */}
            <Typography sx={{ fontSize: '14px', fontWeight: 600, mt: 3, mb: 1 }}>
              Claude Model
            </Typography>
            <Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.75 }}>
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
                  size="small"
                  onClick={handleSaveModel}
                  disabled={isLoading || draftModel === storedModel || isSavingModel}
                >
                  {isSavingModel ? 'Saving…' : 'Save'}
                </Button>
              </Box>
              <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>
                Model used for AI competency evaluation.
              </Typography>
            </Box>
            {modelError && (
              <Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>
                {modelError}
              </Typography>
            )}
          </Box>
        </Box>

        {/* DATA BACKUP */}
        <Box
          sx={{
            mb: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <SectionHeader label="Data Backup" />
          <Box sx={{ p: 2.5 }}>
            {/* Export */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 1 }}>Export Data</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: '13px', color: 'text.secondary', flex: 1 }}>
                  Save all app data to a JSON backup file.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting…' : 'Export backup'}
                </Button>
              </Box>
              {exportSuccess && (
                <Typography sx={{ fontSize: '12px', color: '#059669', mt: 0.75 }}>
                  Backup exported successfully.
                </Typography>
              )}
              {exportError && (
                <Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>
                  {exportError}
                </Typography>
              )}
            </Box>

            {/* Import */}
            <Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 1 }}>Import Data</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: '13px', color: 'text.secondary', flex: 1 }}>
                  Restore data from a backup file. This will overwrite all current data.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={() => setImportConfirmOpen(true)}
                  disabled={isImporting}
                >
                  {isImporting ? 'Importing…' : 'Import backup'}
                </Button>
              </Box>
              {importSuccess && (
                <Typography sx={{ fontSize: '12px', color: '#059669', mt: 0.75 }}>
                  Data restored successfully.
                </Typography>
              )}
              {importError && (
                <Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>
                  {importError}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* DATA MANAGEMENT */}
        <Box
          sx={{
            mb: 3,
            bgcolor: 'background.paper',
            border: '1px solid #FCA5A5',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <SectionHeader label="Data Management" danger />
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontSize: '13px', color: 'text.secondary', flex: 1 }}>
                Permanently delete all employees, behavior log entries, and expected behaviors. This
                cannot be undone.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                size="small"
                sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                onClick={() => {
                  resetClearError()
                  setConfirmOpen(true)
                }}
                disabled={isClearingData}
              >
                {isClearingData ? 'Clearing…' : 'Clear all data'}
              </Button>
            </Box>
            {clearDataError && (
              <Typography color="error" sx={{ fontSize: '13px', mt: 1 }}>
                {clearDataError}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Dialog
        open={importConfirmOpen}
        onClose={isImporting ? undefined : () => setImportConfirmOpen(false)}
      >
        <DialogTitle>Import backup?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            All current data will be replaced by the backup. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleImportConfirm} disabled={isImporting}>
            Import
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={isClearingData ? undefined : () => setConfirmOpen(false)}>
        <DialogTitle>Clear all data?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            All employees, behavior log entries, and expected behaviors will be permanently deleted.
            This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleClearConfirm} disabled={isClearingData}>
            Delete all data
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
