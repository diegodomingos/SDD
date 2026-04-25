/// <reference types="vite/client" />

import type { IpcResult } from '../../shared/ipc-types'

declare global {
  interface Window {
    electronAPI: {
      invoke<T>(channel: string, payload?: unknown): Promise<IpcResult<T>>
    }
  }
}
