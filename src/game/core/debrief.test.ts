import { describe, expect, it } from 'vitest'
import { getScenario } from '../events/templates'
import { createInitialState, createCallerState } from './worldState'
import {
  attitudeRatioGrade,
  baseOverall,
  buildCallEvaluation,
  buildShiftEvaluation,
  chooseProfile,
  clinicalRatioGrade,
  dispatchTimeGrade,
  emptyAttitudeEvidence,
  patientCountFor,
  updateCallEvaluationOutcome,
} from './evaluation'
import type { CallEvaluation, DimensionEvaluation, DispatchRecord, EvaluationDimensionKey, EvaluationGrade, PatientOutcome, WorldState } from '../types'

function evaluationState(id = 'cardiac_arrest', overrides: Partial<WorldState> = {}): WorldState {
  const scenario = getScenario(id)
  const expectedProtocol = Number(scenario.mpdsCard.determinantCode.split('-')[0])
  const dispatchRecord: DispatchRecord = {
    callId: id, dispatchTime: 30, triage: scenario.correctTriage, correctTriage: scenario.correctTriage,
    addressCompleteness: 'full', ambulanceETA: 10, dispatchedAt: 30, isPrank: scenario.isPrank,
  }
  return {
    ...createInitialState(),
    screen: 'playing',
    callInstanceId: 1,
    totalCalls: 1,
    currentCall: scenario,
    callerState: { ...createCallerState(scenario.callerId), revealedInfo: { ...createCallerState(scenario.callerId).revealedInfo, address: 'full', contact: true, chiefComplaint: true, purpose: true } },
    terminal: { ...createInitialState().terminal, protocolNumber: expectedProtocol, determinant: scenario.mpdsCard.determinantCode.split('-')[1] === 'E' ? 'ECHO' : null, conscious: false, breathing: false, triage: scenario.correctTriage },
    dispatchRecord,
    dispatchSent: true,
    attitudeEvidence: { ...emptyAttitudeEvidence(), supportiveTurns: 4 },
    patientStatus: { stability: 70, vitalSign: 'stable', decayRate: 0.5, initialStability: 80, died: false },
    rescue: { ...createInitialState().rescue, phase: 'success', outcome: 'success' },
    ...overrides,
  }
}

describe('五维通话评价', () => {
  it('严格覆盖态度、专业与时间阈值边界', () => {
    expect([0.9, 0.75, 0.6, 0.4, 0.39].map(ratio => attitudeRatioGrade(ratio * 100, 100)))
      .toEqual(['S', 'A', 'B', 'C', 'D'])
    expect([1, 0.85, 0.7, 0.5, 0.49].map(ratio => clinicalRatioGrade(ratio * 100, 100)))
      .toEqual(['S', 'A', 'B', 'C', 'D'])
    expect([35, 36, 60, 61, 90, 91, 120, 121, null].map(dispatchTimeGrade))
      .toEqual(['S', 'A', 'A', 'B', 'B', 'C', 'C', 'D', 'D'])
  })

  it('不再产生数字总分，并按真实救援结果给出现场叙事', () => {
    const state = evaluationState()
    const result = buildCallEvaluation(state, state.currentCall!)
    expect(result.outcome).toBe('rescued')
    expect(result.arrivalNarrative).toContain('救护车抵达')
    expect(result.dimensions.timing.grade).toBe('S')
    expect('score' in result).toBe(false)
  })

  it('失败但患者仍存活时描述为病情恶化，不误写死亡', () => {
    const state = evaluationState()
    const initial = buildCallEvaluation({ ...state, rescue: { ...state.rescue, phase: 'enroute', outcome: null } }, state.currentCall!)
    const result = updateCallEvaluationOutcome(initial, state.currentCall!, 'failed', false, '到场较晚')
    expect(result.outcome).toBe('worsened')
    expect(result.arrivalNarrative).toContain('病情已经恶化')
    expect(result.arrivalNarrative).not.toContain('失去生命体征')
  })

  it('恶作剧不计入患者人数或救援成效', () => {
    const scenario = getScenario('prank_call')
    const result = buildCallEvaluation(evaluationState('prank_call', { dispatchRecord: null, dispatchSent: false }), scenario)
    expect(result.patientCount).toBe(0)
    expect(result.dimensions.outcome.grade).toBe('NA')
  })

  it('恶作剧现场记录会区分是否浪费了救护车辆', () => {
    const scenario = getScenario('prank_call')
    const verified = buildCallEvaluation(evaluationState('prank_call', { dispatchRecord: null, dispatchSent: false }), scenario)
    const misdispatched = buildCallEvaluation(evaluationState('prank_call'), scenario)
    expect(verified.arrivalNarrative).toContain('未占用救护车辆')
    expect(misdispatched.arrivalNarrative).toContain('错误占用')
  })

  it('多人事件使用明确人数，恶作剧固定为零人', () => {
    expect(patientCountFor(getScenario('trauma_car__multi_vehicle_highway'))).toBe(3)
    expect(patientCountFor(getScenario('abdominal_pain__food_poisoning_party'))).toBe(12)
    expect(patientCountFor(getScenario('prank_call'))).toBe(0)
  })

  it('未派车与明确死亡触发安全红线，失败存活不伪造死亡', () => {
    const scenario = getScenario('cardiac_arrest')
    const notDispatched = buildCallEvaluation(evaluationState(undefined, { dispatchRecord: null, dispatchSent: false }), scenario)
    const died = buildCallEvaluation(evaluationState(undefined, { patientStatus: { ...evaluationState().patientStatus!, died: true } }), scenario)
    const worsened = updateCallEvaluationOutcome(buildCallEvaluation(evaluationState(), scenario), scenario, 'failed', false, null)
    expect(notDispatched).toMatchObject({ outcome: 'not_dispatched', safetyViolation: true, overallGrade: 'D' })
    expect(died).toMatchObject({ outcome: 'died', safetyViolation: true, overallGrade: 'D' })
    expect(worsened.outcome).toBe('worsened')
  })
})

describe('多结局矩阵', () => {
  const dimensionLabels: Record<EvaluationDimensionKey, string> = {
    attitude: '接线态度', guidance: '指导技术', knowledge: '知识储备', timing: '时间把控', outcome: '救援成效',
  }
  const dimensions = (grades: Record<EvaluationDimensionKey, EvaluationGrade>) => Object.fromEntries(
    Object.entries(grades).map(([key, grade]) => [key, {
      key, label: dimensionLabels[key as EvaluationDimensionKey], grade, evidence: [], improvement: null, correct: 1, total: 1,
    }]),
  ) as unknown as Record<EvaluationDimensionKey, DimensionEvaluation>

  it('技术满分但态度冷漠时命中冷静技术流画像', () => {
    const base = evaluationState()
    const state = evaluationState(undefined, {
      attitudeEvidence: { ...emptyAttitudeEvidence(), pressuringTurns: 4 },
      guidanceResults: base.currentCall!.guidance!.steps.map(() => 'correct'),
      handoff: { attempts: 1, selectedFactIds: [], firstAttemptCorrect: true, feedback: [], completed: true },
    })
    const call = buildCallEvaluation(state, state.currentCall!)
    expect(call.profile.id).toBe('cold_expert')
    expect(call.overallGrade).toBe('B')
  })

  it('班次汇总按患者人数统计救治情况', () => {
    const state = evaluationState()
    const call = buildCallEvaluation(state, state.currentCall!)
    const summary = buildShiftEvaluation([call], { missedCalls: [{ scenarioId: 'stroke', title: '脑卒中' }] })
    expect(summary.rescuedCount).toBe(call.patientCount)
    expect(summary.missedCount).toBe(1)
    expect(summary.dimensions.timing.grade).not.toBe('S')
  })

  it.each([
    [{ attitude: 'A', guidance: 'B', knowledge: 'B', timing: 'D', outcome: 'S' }, { criticalPatientRescued: true }, 'clutch_rescue', 'B'],
    [{ attitude: 'S', guidance: 'D', knowledge: 'A', timing: 'B', outcome: 'C' }, {}, 'warm_unsteady', 'C'],
    [{ attitude: 'B', guidance: 'B', knowledge: 'C', timing: 'S', outcome: 'S' }, {}, 'fast_unsteady', 'C'],
    [{ attitude: 'S', guidance: 'S', knowledge: 'S', timing: 'A', outcome: 'S' }, {}, 'excellent', 'S'],
  ] as const)('按固定优先级命中画像 %#', (grades, flags, profileId, grade) => {
    const values = dimensions(grades)
    const result = chooseProfile(values, baseOverall(values), { safetyViolation: false, criticalPatientRescued: false, ...flags })
    expect(result.profile.id).toBe(profileId)
    expect(result.grade).toBe(grade)
  })

  it('安全红线覆盖技术准确但态度冷漠等其他规则', () => {
    const values = dimensions({ attitude: 'D', guidance: 'S', knowledge: 'S', timing: 'S', outcome: 'D' })
    const result = chooseProfile(values, baseOverall(values), { safetyViolation: true, criticalPatientRescued: false })
    expect(result.profile.id).toBe('safety_redline')
    expect(result.grade).toBe('D')
  })

  it('救援成效按患者人数覆盖 S/A/B/C/D 边界', () => {
    const seed = buildCallEvaluation(evaluationState(), getScenario('cardiac_arrest'))
    const call = (outcome: PatientOutcome, patientCount: number, safetyViolation = false): CallEvaluation => ({
      ...seed, outcome, patientCount, safetyViolation,
    })
    expect(buildShiftEvaluation([call('rescued', 1)]).dimensions.outcome.grade).toBe('S')
    expect(buildShiftEvaluation([call('rescued', 85), call('worsened', 15)]).dimensions.outcome.grade).toBe('A')
    expect(buildShiftEvaluation([call('rescued', 70), call('worsened', 30)]).dimensions.outcome.grade).toBe('B')
    expect(buildShiftEvaluation([call('worsened', 1)]).dimensions.outcome.grade).toBe('C')
    expect(buildShiftEvaluation([call('died', 1, true)]).dimensions.outcome.grade).toBe('D')
  })
})
