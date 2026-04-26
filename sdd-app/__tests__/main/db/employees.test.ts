import type Database from 'better-sqlite3'
import { describe, it, expect } from 'vitest'
import { listEmployees } from '../../../src/main/db/employees'

// Minimal mock: simulates better-sqlite3 prepare().all() without the native module.
// Electron compiles better-sqlite3 against its own Node.js (ABI 140); Vitest runs on
// system Node.js (ABI 137). A real in-memory DB would cause an ABI mismatch here.
function createMockDb(rows: object[]): Database.Database {
  return {
    prepare: (_sql: string) => ({ all: () => rows }),
  } as unknown as Database.Database
}

describe('listEmployees', () => {
  it('returns empty array when no rows', () => {
    expect(listEmployees(createMockDb([]))).toEqual([])
  })

  it('maps snake_case DB columns to camelCase Employee', () => {
    const [emp] = listEmployees(
      createMockDb([{ id: 1, name: 'Alice', level: 'A', created_at: '2026-04-25T10:00:00' }])
    )
    expect(emp).toMatchObject({ id: 1, name: 'Alice', level: 'A' })
    expect(emp.createdAt).toBe('2026-04-25T10:00:00')
    expect((emp as any).created_at).toBeUndefined()
  })

  it('preserves row order returned by the DB (ORDER BY enforced by SQL in listEmployees)', () => {
    const rows = [
      { id: 2, name: 'Bob', level: 'B', created_at: '2026-02-01' },
      { id: 1, name: 'Alice', level: 'A', created_at: '2026-01-01' },
    ]
    const results = listEmployees(createMockDb(rows))
    expect(results[0].name).toBe('Bob')
    expect(results[1].name).toBe('Alice')
  })
})
