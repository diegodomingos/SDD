import { vi, describe, it, expect, beforeEach } from 'vitest'

// vi.mock is hoisted to the top of the file by Vitest, so any variables it references
// must also be hoisted with vi.hoisted() to avoid "cannot access before initialization".
const mockDb = vi.hoisted(() => ({ prepare: vi.fn() }))

vi.mock('../../../src/main/db/database', () => ({ db: mockDb }))

import { getExpectedBehavior, listCompetencies, setExpectedBehavior } from '../../../src/main/db/framework'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getExpectedBehavior', () => {
  it('returns description string when row exists', () => {
    mockDb.prepare.mockReturnValue({
      get: () => ({ description: 'Communicates clearly in writing.' }),
    })
    const result = getExpectedBehavior(1, 'A')
    expect(result).toBe('Communicates clearly in writing.')
  })

  it('returns null when no row exists for that combination', () => {
    mockDb.prepare.mockReturnValue({
      get: () => undefined,
    })
    const result = getExpectedBehavior(2, 'C')
    expect(result).toBeNull()
  })

  it('queries with correct competencyId and level params', () => {
    const mockGet = vi.fn().mockReturnValue(undefined)
    mockDb.prepare.mockReturnValue({ get: mockGet })
    getExpectedBehavior(3, 'B')
    expect(mockGet).toHaveBeenCalledWith(3, 'B')
  })
})

describe('listCompetencies', () => {
  it('returns all competency rows', () => {
    mockDb.prepare.mockReturnValue({
      all: () => [
        { id: 1, name: 'Communication' },
        { id: 2, name: 'Client Focus' },
        { id: 3, name: 'Proactivity' },
        { id: 4, name: 'Teamwork' },
      ],
    })
    const result = listCompetencies()
    expect(result).toHaveLength(4)
    expect(result[0]).toEqual({ id: 1, name: 'Communication' })
  })

  it('returns empty array when no competencies', () => {
    mockDb.prepare.mockReturnValue({ all: () => [] })
    expect(listCompetencies()).toEqual([])
  })
})

describe('setExpectedBehavior', () => {
  it('calls INSERT OR REPLACE with correct competencyId, level, and description', () => {
    const mockRun = vi.fn()
    mockDb.prepare.mockReturnValue({ run: mockRun })
    setExpectedBehavior(1, 'A', 'Communicates clearly in writing.')
    expect(mockRun).toHaveBeenCalledWith(1, 'A', 'Communicates clearly in writing.')
  })

  it('returns the saved description string', () => {
    mockDb.prepare.mockReturnValue({ run: vi.fn() })
    const result = setExpectedBehavior(2, 'B', 'Proactively identifies blockers')
    expect(result).toBe('Proactively identifies blockers')
  })

  it('calls prepare with INSERT OR REPLACE SQL', () => {
    mockDb.prepare.mockReturnValue({ run: vi.fn() })
    setExpectedBehavior(3, 'C', 'Some behavior')
    expect(mockDb.prepare).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR REPLACE INTO expected_behaviors')
    )
  })
})
