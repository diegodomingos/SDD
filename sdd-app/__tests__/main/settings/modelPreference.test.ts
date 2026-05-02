import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { getManagerName, setManagerName } from '../../../src/main/settings/modelPreference'

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

describe('getManagerName', () => {
  it('returns empty string when row is absent', () => {
    const db = mockDb(undefined)
    expect(getManagerName(db)).toBe('')
  })

  it('returns stored value when row exists', () => {
    const db = mockDb({ value: 'Marco' })
    expect(getManagerName(db)).toBe('Marco')
  })
})

describe('setManagerName', () => {
  it('calls run() with the correct key and value', () => {
    let capturedArgs: unknown[] = []
    const db = mockDb(undefined, (...args: unknown[]) => {
      capturedArgs = args
    })
    setManagerName(db, 'Marco')
    expect(capturedArgs).toEqual(['manager_name', 'Marco'])
  })
})
