import { describe, it, expect, vi, beforeEach } from 'vitest'
import Database from 'better-sqlite3'

vi.mock('electron', () => ({
  safeStorage: {
    encryptString: vi.fn((str: string) => Buffer.from(str, 'utf-8')),
    decryptString: vi.fn((buf: Buffer) => buf.toString('utf-8')),
  },
}))

import { safeStorage } from 'electron'
import { setApiKey, getApiKey, isConfigured } from '../../../src/main/settings/apiKey'

function mockDb(getResult: object | undefined, runSpy?: (...args: unknown[]) => void): Database.Database {
  return {
    prepare: (_sql: string) => ({
      get: (..._args: unknown[]) => getResult,
      run: (...args: unknown[]) => {
        if (runSpy) runSpy(...args)
        return { changes: 1 }
      },
    }),
  } as unknown as Database.Database
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('isConfigured', () => {
  it('returns false when no row in db', () => {
    const db = mockDb(undefined)
    expect(isConfigured(db)).toBe(false)
  })

  it('returns true when row exists', () => {
    const db = mockDb({ 1: 1 })
    expect(isConfigured(db)).toBe(true)
  })
})

describe('setApiKey', () => {
  it('calls encryptString and stores base64-encoded result', () => {
    let capturedArgs: unknown[] = []
    const db = mockDb(undefined, (...args: unknown[]) => {
      capturedArgs = args
    })

    setApiKey(db, 'sk-test-key')

    expect(safeStorage.encryptString).toHaveBeenCalledWith('sk-test-key')
    expect(capturedArgs[0]).toBe('api_key')
    expect(typeof capturedArgs[1]).toBe('string')
    expect(capturedArgs[1]).toBe(Buffer.from('sk-test-key', 'utf-8').toString('base64'))
  })
})

describe('getApiKey', () => {
  it('returns null when no row in db', () => {
    const db = mockDb(undefined)
    expect(getApiKey(db)).toBeNull()
  })

  it('calls decryptString and returns decrypted key', () => {
    const encoded = Buffer.from('sk-my-key', 'utf-8').toString('base64')
    const db = mockDb({ value: encoded })
    const result = getApiKey(db)
    expect(safeStorage.decryptString).toHaveBeenCalled()
    expect(result).toBe('sk-my-key')
  })
})
