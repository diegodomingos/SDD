import type Database from 'better-sqlite3'
import { describe, it, expect } from 'vitest'
import { listEmployees, createEmployee, updateEmployee } from '../../../src/main/db/employees'

// Minimal mock: simulates better-sqlite3 prepare().all() without the native module.
// Electron compiles better-sqlite3 against its own Node.js (ABI 140); Vitest runs on
// system Node.js (ABI 137). A real in-memory DB would cause an ABI mismatch here.
function createMockDb(rows: object[]): Database.Database {
  return {
    prepare: (_sql: string) => ({ all: () => rows }),
  } as unknown as Database.Database
}

function createMockDbForCreate(insertedRow: object): Database.Database {
  return {
    prepare: (sql: string) => {
      if (sql.trimStart().startsWith('INSERT')) {
        return { run: () => ({ lastInsertRowid: (insertedRow as any).id, changes: 1 }) }
      }
      return { get: () => insertedRow }
    },
  } as unknown as Database.Database
}

describe('createEmployee', () => {
  it('returns a camelCase Employee with correct id, name, level, createdAt', () => {
    const mockDb = createMockDbForCreate({
      id: 7,
      name: 'Alice',
      level: 'A',
      created_at: '2026-04-26 10:00:00',
    })
    const emp = createEmployee(mockDb, 'Alice', 'A')
    expect(emp.id).toBe(7)
    expect(emp.name).toBe('Alice')
    expect(emp.level).toBe('A')
    expect(emp.createdAt).toBe('2026-04-26 10:00:00')
    expect((emp as any).created_at).toBeUndefined()
  })

  it('passes the name and level values through to the returned Employee', () => {
    const mockDb = createMockDbForCreate({
      id: 3,
      name: 'Bob',
      level: 'C',
      created_at: '2026-04-26 11:00:00',
    })
    const emp = createEmployee(mockDb, 'Bob', 'C')
    expect(emp.name).toBe('Bob')
    expect(emp.level).toBe('C')
  })
})

function createMockDbForUpdate(updatedRow: object): Database.Database {
  return {
    prepare: (sql: string) => {
      if (sql.trimStart().startsWith('UPDATE')) {
        return { run: () => ({ changes: 1 }) }
      }
      return { get: () => updatedRow }
    },
  } as unknown as Database.Database
}

describe('updateEmployee', () => {
  it('returns updated Employee with camelCase mapping', () => {
    const mockDb = createMockDbForUpdate({
      id: 3,
      name: 'Alice Updated',
      level: 'B',
      created_at: '2026-04-26 10:00:00',
    })
    const emp = updateEmployee(mockDb, 3, 'Alice Updated', 'B')
    expect(emp.id).toBe(3)
    expect(emp.name).toBe('Alice Updated')
    expect(emp.level).toBe('B')
    expect(emp.createdAt).toBe('2026-04-26 10:00:00')
    expect((emp as any).created_at).toBeUndefined()
  })

  it('passes updated name and level through to the returned Employee', () => {
    const mockDb = createMockDbForUpdate({
      id: 5,
      name: 'Charlie',
      level: 'C',
      created_at: '2026-04-26 11:00:00',
    })
    const emp = updateEmployee(mockDb, 5, 'Charlie', 'C')
    expect(emp.name).toBe('Charlie')
    expect(emp.level).toBe('C')
  })

  it('throws when employee row is not found after update', () => {
    const mockDb = {
      prepare: (sql: string) => {
        if (sql.trimStart().startsWith('UPDATE')) {
          return { run: () => ({ changes: 0 }) }
        }
        return { get: () => undefined }
      },
    } as unknown as Database.Database
    expect(() => updateEmployee(mockDb, 99, 'Ghost', 'A')).toThrow(
      'Employee row not found after update (id=99)'
    )
  })
})

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
