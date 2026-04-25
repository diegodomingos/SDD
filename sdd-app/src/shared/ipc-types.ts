// ─── Core discriminated union ────────────────────────────────────────────────

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string }

// ─── Domain enums ────────────────────────────────────────────────────────────

export type CompetencyLevel = 'A' | 'B' | 'C' | 'D'

export type Grade =
  | 'Does Not Meet Expectations'
  | 'Meets Expectations'
  | 'Exceeds Expectations'
  | 'Insufficient Input'

// ─── Entity types (camelCase; snake_case→camelCase mapping done in repository layer) ──

export interface Employee {
  id: number
  name: string
  level: CompetencyLevel
  createdAt: string // ISO 8601 datetime string
}

export interface Competency {
  id: number
  name: string // 'Communication' | 'Client Focus' | 'Proactivity' | 'Teamwork'
}

export interface BehaviorLogEntry {
  id: number
  employeeId: number
  description: string
  entryDate: string    // ISO 8601 date string e.g. '2026-04-25'
  createdAt: string    // ISO 8601 datetime string
  competencies: Competency[]
}

export interface EvaluateResult {
  grade: Grade
  rationale: string
}

// ─── IPC channel payload types ───────────────────────────────────────────────
// One interface per channel that accepts input. Channels with no payload
// (list, get-key-configured, get-model, get-manager-name) take no argument.

// employee:*
export interface CreateEmployeePayload {
  name: string
  level: CompetencyLevel
}

export interface UpdateEmployeePayload {
  id: number
  name: string
  level: CompetencyLevel
}

export interface DeleteEmployeePayload {
  id: number
}

// behavior-log:*
export interface ListBehaviorLogPayload {
  employeeId: number
  competencyId?: number // omit to return all entries for the employee
}

export interface CreateBehaviorLogPayload {
  employeeId: number
  description: string
  competencyIds: number[]
  entryDate: string // ISO 8601 date string
}

export interface UpdateBehaviorLogPayload {
  id: number
  description: string
  competencyIds: number[]
  entryDate: string // ISO 8601 date string
}

export interface DeleteBehaviorLogPayload {
  id: number
}

// expected-behavior:*
export interface GetExpectedBehaviorPayload {
  competencyId: number
  level: CompetencyLevel
}

export interface SetExpectedBehaviorPayload {
  competencyId: number
  level: CompetencyLevel
  description: string
}

// ai:*
export interface EvaluatePayload {
  employeeId: number
  competencyId: number
}

// settings:*
export interface SetApiKeyPayload {
  key: string
}

export interface SetModelPayload {
  model: string // 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6'
}

export interface SetManagerNamePayload {
  name: string
}
