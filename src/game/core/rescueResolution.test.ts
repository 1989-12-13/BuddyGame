import { describe, expect, it } from 'vitest'
import type { DispatchRecord, PatientStatus } from '../types'
import { resolveRescue } from './rescueResolution'

const dispatchRecord: DispatchRecord = {
  callId: 'cardiac_arrest',
  dispatchTime: 30,
  triage: 'red',
  correctTriage: 'red',
  addressCompleteness: 'full',
  ambulanceETA: 120,
  dispatchedAt: 30,
  isPrank: false,
}
const patientStatus: PatientStatus = {
  stability: 50,
  initialStability: 80,
  vitalSign: 'warning',
  decayRate: 0.1,
  died: false,
}

describe('rescue resolution', () => {
  it('applies a bounded 12-point risk effect for incomplete guidance', () => {
    const complete = resolveRescue({ dispatchRecord, patientStatus, guidanceResults: ['correct', 'correct'], guidanceMinigameScores: [], guidanceRequiredTotal: 2, perks: [] })
    const incomplete = resolveRescue({ dispatchRecord, patientStatus, guidanceResults: ['correct', null], guidanceMinigameScores: [], guidanceRequiredTotal: 2, perks: [] })
    expect(complete.successScore - incomplete.successScore).toBeCloseTo(0.06)
  })

  it('applies first-aid tolerance to risk as well as score', () => {
    const normal = resolveRescue({ dispatchRecord, patientStatus, guidanceResults: ['incorrect', 'correct'], guidanceMinigameScores: [], guidanceRequiredTotal: 2, perks: [] })
    const tolerant = resolveRescue({ dispatchRecord, patientStatus, guidanceResults: ['incorrect', 'correct'], guidanceMinigameScores: [], guidanceRequiredTotal: 2, perks: ['field_first_aid'] })
    expect(tolerant.successScore - normal.successScore).toBeCloseTo(0.03)
  })

  it('does not turn an incomplete-guidance failure into a patient death', () => {
    const lowButAlive = { ...patientStatus, stability: 16, vitalSign: 'critical' as const }
    const result = resolveRescue({
      dispatchRecord: { ...dispatchRecord, dispatchTime: 80 },
      patientStatus: lowButAlive,
      guidanceResults: ['correct', null],
      guidanceMinigameScores: [],
      guidanceRequiredTotal: 2,
      perks: [],
    })

    expect(result.outcome).toBe('failed')
    expect(result.patientStatus.died).toBe(false)
    expect(result.patientStatus.stability).toBe(16)
  })
})
