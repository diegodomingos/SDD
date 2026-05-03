import { contextBridge, ipcRenderer } from 'electron'

const ALLOWED_CHANNELS = new Set([
  'employee:list',
  'employee:create',
  'employee:update',
  'employee:delete',
  'behavior-log:list',
  'behavior-log:create',
  'behavior-log:update',
  'behavior-log:delete',
  'competency:list',
  'expected-behavior:get',
  'expected-behavior:set',
  'ai:evaluate',
  'settings:get-key-configured',
  'settings:set-api-key',
  'settings:get-model',
  'settings:set-model',
  'settings:get-manager-name',
  'settings:set-manager-name',
  'settings:clear-all-data',
])

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, payload?: unknown) => {
    if (!ALLOWED_CHANNELS.has(channel)) {
      throw new Error(`IPC channel not allowed: ${channel}`)
    }
    return ipcRenderer.invoke(channel, payload)
  }
})
