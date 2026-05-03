import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { clearAllData } from '../../../src/main/db/clearAllData'

function mockDb(): { db: Database.Database; executedSql: string[] } {
  const executedSql: string[] = []
  const db = {
    prepare: (sql: string) => ({
      run: () => {
        executedSql.push(sql)
        return { changes: 0 }
      },
    }),
    transaction: (fn: () => void) => () => fn(),
  } as unknown as Database.Database
  return { db, executedSql }
}

describe('clearAllData', () => {
  it('deletes expected_behaviors', () => {
    const { db, executedSql } = mockDb()
    clearAllData(db)
    expect(executedSql.some((s) => s.includes('DELETE') && s.includes('expected_behaviors'))).toBe(true)
  })

  it('deletes employees', () => {
    const { db, executedSql } = mockDb()
    clearAllData(db)
    expect(executedSql.some((s) => s.includes('DELETE') && s.includes('employees'))).toBe(true)
  })

  it('does not delete competencies', () => {
    const { db, executedSql } = mockDb()
    clearAllData(db)
    expect(executedSql.every((s) => !s.toLowerCase().includes('competencies'))).toBe(true)
  })

  it('does not delete settings', () => {
    const { db, executedSql } = mockDb()
    clearAllData(db)
    expect(executedSql.every((s) => !s.toLowerCase().includes('settings'))).toBe(true)
  })
})
