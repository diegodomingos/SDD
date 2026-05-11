import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import log from 'electron-log/main'
import { initializeSchema, db } from './db/database'
import type { AIProvider } from './ai/AIProvider'
import { ClaudeAIProvider } from './ai/ClaudeAIProvider'
import { registerEmployeeHandlers } from './handlers/employeeHandlers'
import { registerBehaviorLogHandlers } from './handlers/behaviorLogHandlers'
import { registerFrameworkHandlers } from './handlers/frameworkHandlers'
import { registerAiHandlers } from './handlers/aiHandlers'
import { registerSettingsHandlers } from './handlers/settingsHandlers'

// ClaudeAIProvider wired in Story 6.6
const aiProvider: AIProvider = new ClaudeAIProvider()

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1170,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.sdd.employeeevaluation')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    initializeSchema()
  } catch (e) {
    log.error('[database] Schema init failed:', e instanceof Error ? e.message : String(e))
    app.quit()
    return
  }

  log.info('[ai] Provider:', aiProvider.constructor.name)

  registerEmployeeHandlers()
  registerBehaviorLogHandlers()
  registerFrameworkHandlers()
  registerAiHandlers(aiProvider)
  registerSettingsHandlers()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  db?.close()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
