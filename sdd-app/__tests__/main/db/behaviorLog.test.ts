import type Database from 'better-sqlite3'
import { describe, it, expect } from 'vitest'
import { listEntries, createEntry, updateEntry, deleteEntry } from '../../../src/main/db/behaviorLog'

// Minimal mock: simulates better-sqlite3 prepare().all() without the native module.
// Electron compiles better-sqlite3 against its own Node.js (ABI 140); Vitest runs on
// system Node.js (ABI 137). A real in-memory DB would cause an ABI mismatch here.
function mockDbWithRows(rows: object[]): Database.Database {
  return {
    prepare: (_sql: string) => ({ all: (..._args: unknown[]) => rows }),
  } as unknown as Database.Database
}

// Mock for createEntry: supports run() (returning lastInsertRowid) and all() (returning fetch rows).
// transaction() executes the wrapped function immediately (no real transaction in test).
function mockDbForCreate(fetchRows: object[], lastInsertRowid: number = 1): Database.Database {
  return {
    prepare: (_sql: string) => ({
      run: (..._args: unknown[]) => ({ lastInsertRowid }),
      all: (..._args: unknown[]) => fetchRows,
    }),
    transaction: (fn: (...args: unknown[]) => unknown) => (...args: unknown[]) => fn(...args),
  } as unknown as Database.Database
}

describe('listEntries', () => {
  it('returns empty array when no rows', () => {
    expect(listEntries(mockDbWithRows([]), 1)).toEqual([])
  })

  it('maps snake_case DB columns to camelCase BehaviorLogEntry', () => {
    const rows = [
      {
        id: 1,
        employee_id: 2,
        description: 'Did well in the meeting',
        entry_date: '2026-04-01',
        created_at: '2026-04-01 10:00:00',
        comp_id: null,
        comp_name: null,
      },
    ]
    const [entry] = listEntries(mockDbWithRows(rows), 2)
    expect(entry.id).toBe(1)
    expect(entry.employeeId).toBe(2)
    expect(entry.description).toBe('Did well in the meeting')
    expect(entry.entryDate).toBe('2026-04-01')
    expect(entry.createdAt).toBe('2026-04-01 10:00:00')
    expect((entry as any).employee_id).toBeUndefined()
    expect((entry as any).entry_date).toBeUndefined()
    expect(entry.competencies).toEqual([])
  })

  it('aggregates multiple JOIN rows into one entry with multiple competencies', () => {
    const rows = [
      {
        id: 5,
        employee_id: 1,
        description: 'Great presentation',
        entry_date: '2026-04-10',
        created_at: '2026-04-10 08:00:00',
        comp_id: 1,
        comp_name: 'Communication',
      },
      {
        id: 5,
        employee_id: 1,
        description: 'Great presentation',
        entry_date: '2026-04-10',
        created_at: '2026-04-10 08:00:00',
        comp_id: 3,
        comp_name: 'Proactivity',
      },
    ]
    const entries = listEntries(mockDbWithRows(rows), 1)
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBe(5)
    expect(entries[0].competencies).toHaveLength(2)
    expect(entries[0].competencies[0]).toEqual({ id: 1, name: 'Communication' })
    expect(entries[0].competencies[1]).toEqual({ id: 3, name: 'Proactivity' })
  })

  it('returns multiple distinct entries preserving row order', () => {
    const rows = [
      {
        id: 10,
        employee_id: 1,
        description: 'Later event',
        entry_date: '2026-05-01',
        created_at: '2026-05-01',
        comp_id: null,
        comp_name: null,
      },
      {
        id: 7,
        employee_id: 1,
        description: 'Earlier event',
        entry_date: '2026-04-01',
        created_at: '2026-04-01',
        comp_id: null,
        comp_name: null,
      },
    ]
    const entries = listEntries(mockDbWithRows(rows), 1)
    expect(entries[0].id).toBe(10)
    expect(entries[1].id).toBe(7)
  })

  it('skips null competency rows (entry with no tags)', () => {
    const rows = [
      {
        id: 3,
        employee_id: 1,
        description: 'No tag entry',
        entry_date: '2026-03-01',
        created_at: '2026-03-01',
        comp_id: null,
        comp_name: null,
      },
    ]
    const [entry] = listEntries(mockDbWithRows(rows), 1)
    expect(entry.competencies).toEqual([])
  })

  it('passes both employeeId and competencyId args to .all() when competencyId is provided', () => {
    let capturedArgs: unknown[] = []
    const db = {
      prepare: (_sql: string) => ({
        all: (...args: unknown[]) => {
          capturedArgs = args
          return []
        },
      }),
    } as unknown as Database.Database

    listEntries(db, 7, 42)
    expect(capturedArgs).toEqual([7, 42])
  })
})

describe('createEntry', () => {
  it('returns a BehaviorLogEntry with correct camelCase shape', () => {
    const fetchRows = [
      {
        id: 1,
        employee_id: 2,
        description: 'Presented well',
        entry_date: '2026-05-01',
        created_at: '2026-05-01 10:00:00',
        comp_id: 1,
        comp_name: 'Communication',
      },
    ]
    const db = mockDbForCreate(fetchRows, 1)
    const entry = createEntry(db, 2, 'Presented well', [1], '2026-05-01')
    expect(entry.id).toBe(1)
    expect(entry.employeeId).toBe(2)
    expect(entry.description).toBe('Presented well')
    expect(entry.entryDate).toBe('2026-05-01')
    expect(entry.competencies).toHaveLength(1)
    expect(entry.competencies[0]).toEqual({ id: 1, name: 'Communication' })
    expect((entry as any).employee_id).toBeUndefined()
  })

  it('returns entry with multiple competencies', () => {
    const fetchRows = [
      { id: 5, employee_id: 1, description: 'X', entry_date: '2026-05-01', created_at: '2026-05-01', comp_id: 1, comp_name: 'Communication' },
      { id: 5, employee_id: 1, description: 'X', entry_date: '2026-05-01', created_at: '2026-05-01', comp_id: 3, comp_name: 'Proactivity' },
    ]
    const db = mockDbForCreate(fetchRows, 5)
    const entry = createEntry(db, 1, 'X', [1, 3], '2026-05-01')
    expect(entry.competencies).toHaveLength(2)
    expect(entry.competencies[0].name).toBe('Communication')
    expect(entry.competencies[1].name).toBe('Proactivity')
  })

  it('returns entry with no competencies when none tagged', () => {
    const fetchRows = [
      { id: 7, employee_id: 1, description: 'Untagged', entry_date: '2026-05-01', created_at: '2026-05-01', comp_id: null, comp_name: null },
    ]
    const db = mockDbForCreate(fetchRows, 7)
    const entry = createEntry(db, 1, 'Untagged', [], '2026-05-01')
    expect(entry.id).toBe(7)
    expect(entry.competencies).toEqual([])
  })

  it('calls db.transaction (wraps inserts atomically)', () => {
    const fetchRows = [
      { id: 1, employee_id: 1, description: 'Y', entry_date: '2026-05-01', created_at: '2026-05-01', comp_id: null, comp_name: null },
    ]
    let transactionCalled = false
    const db = {
      prepare: (_sql: string) => ({
        run: (..._args: unknown[]) => ({ lastInsertRowid: 1 }),
        all: (..._args: unknown[]) => fetchRows,
      }),
      transaction: (fn: (...args: unknown[]) => unknown) => {
        transactionCalled = true
        return (...args: unknown[]) => fn(...args)
      },
    } as unknown as Database.Database
    createEntry(db, 1, 'Y', [], '2026-05-01')
    expect(transactionCalled).toBe(true)
  })
})

// Supports transaction() + prepare() returning both run() and all()
function mockDbForUpdate(fetchRows: object[]): Database.Database {
  return {
    prepare: (_sql: string) => ({
      run: (..._args: unknown[]) => ({ changes: 1 }),
      all: (..._args: unknown[]) => fetchRows,
    }),
    transaction: (fn: (...args: unknown[]) => unknown) => (...args: unknown[]) => fn(...args),
  } as unknown as Database.Database
}

describe('updateEntry', () => {
  it('wraps in a transaction', () => {
    const fetchRows = [
      { id: 1, employee_id: 1, description: 'Updated', entry_date: '2026-05-01', created_at: '2026-05-01', comp_id: null, comp_name: null },
    ]
    let transactionCalled = false
    const db = {
      prepare: (_sql: string) => ({
        run: (..._args: unknown[]) => ({ changes: 1 }),
        all: (..._args: unknown[]) => fetchRows,
      }),
      transaction: (fn: (...args: unknown[]) => unknown) => {
        transactionCalled = true
        return (...args: unknown[]) => fn(...args)
      },
    } as unknown as Database.Database
    updateEntry(db, 1, 'Updated', [], '2026-05-01')
    expect(transactionCalled).toBe(true)
  })

  it('returns updated entry with camelCase shape', () => {
    const fetchRows = [
      { id: 5, employee_id: 2, description: 'Revised', entry_date: '2026-05-02', created_at: '2026-05-01', comp_id: 1, comp_name: 'Communication' },
    ]
    const db = mockDbForUpdate(fetchRows)
    const entry = updateEntry(db, 5, 'Revised', [1], '2026-05-02')
    expect(entry.id).toBe(5)
    expect(entry.description).toBe('Revised')
    expect(entry.entryDate).toBe('2026-05-02')
    expect(entry.competencies).toHaveLength(1)
    expect(entry.competencies[0]).toEqual({ id: 1, name: 'Communication' })
    expect((entry as any).employee_id).toBeUndefined()
  })

  it('returns entry with no competencies when updated with empty array', () => {
    const fetchRows = [
      { id: 3, employee_id: 1, description: 'No tag', entry_date: '2026-05-01', created_at: '2026-05-01', comp_id: null, comp_name: null },
    ]
    const db = mockDbForUpdate(fetchRows)
    const entry = updateEntry(db, 3, 'No tag', [], '2026-05-01')
    expect(entry.competencies).toEqual([])
  })
})

describe('deleteEntry', () => {
  it('calls run() on the DELETE statement', () => {
    let runCalled = false
    const db = {
      prepare: (_sql: string) => ({
        run: (..._args: unknown[]) => { runCalled = true; return { changes: 1 } },
      }),
    } as unknown as Database.Database
    deleteEntry(db, 42)
    expect(runCalled).toBe(true)
  })

  it('returns true when a row is deleted', () => {
    const db = {
      prepare: (_sql: string) => ({ run: (..._args: unknown[]) => ({ changes: 1 }) }),
    } as unknown as Database.Database
    expect(deleteEntry(db, 1)).toBe(true)
  })

  it('returns false when no row is deleted', () => {
    const db = {
      prepare: (_sql: string) => ({ run: (..._args: unknown[]) => ({ changes: 0 }) }),
    } as unknown as Database.Database
    expect(deleteEntry(db, 999)).toBe(false)
  })
})
