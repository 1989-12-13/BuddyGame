import { describe, expect, it } from 'vitest'
import { buildConflictReport, buildVerificationCall, pickSupplementCaller } from './supplementCall'
import { getScenario } from '../events/templates'
import { getCaller } from '../npc/personas'
import { createInitialState } from './worldState'
import {
  answerLine,
  createShiftState,
  resolveVerification,
  tickShift,
  DEFAULT_SHIFT_CONFIG,
  type ShiftConfig,
  type ShiftLine,
  type ShiftState,
} from './shift'

function config(overrides: Partial<ShiftConfig> = {}): ShiftConfig {
  return { ...DEFAULT_SHIFT_CONFIG, queue: [], ...overrides }
}

const SCENARIO = getScenario('falls_elderly')

describe('交叉核实 · 派生规则', () => {
  it('冲突方向与初报相反', () => {
    const report = buildConflictReport(SCENARIO)
    expect(report.field).toBe('breathing')
    expect(report.supplement).not.toBe(report.primary)
    expect(report.opening).toContain('家属')
  })

  it('第二位来电者不会与初报是同一人', () => {
    for (const id of ['falls_elderly', 'chest_pain', 'hemorrhage', 'stroke', 'cardiac_arrest']) {
      const scenario = getScenario(id)
      const picked = pickSupplementCaller(scenario.id, scenario.callerId)
      expect(picked).not.toBe(scenario.callerId)
      expect(getCaller(picked)).toBeDefined()
    }
  })

  it('派生场景被标记为核实通话，且不携带救援链路', () => {
    const call = buildVerificationCall(SCENARIO)
    expect(call.isVerification).toBe(true)
    expect(call.id).not.toBe(SCENARIO.id)
    expect(call.guidance).toBeNull()
    expect(call.mpdsQuestions).toEqual([])
    expect(call.specialEvents).toEqual([])
  })
})

/** 构造：一条已派车的初报线路 + 一个待派第二位来电者的事故 */
function shiftWithDispatchedPrimary(): ShiftState {
  const base = createShiftState(config())
  const primary = {
    ...base.lines[0],
    phase: 'active',
    scenarioId: SCENARIO.id,
    incidentId: 'inc-1',
    vehicleId: 'ambulance',
    world: {
      ...createInitialState(),
      screen: 'playing',
      currentCall: SCENARIO,
      dispatchSent: true,
      callIndex: 0,
      totalCalls: 1,
      shiftElapsed: 30,
    },
  } as unknown as ShiftLine

  return {
    ...base,
    incidents: [{
      id: 'inc-1',
      scenarioId: SCENARIO.id,
      primaryLineId: primary.id,
      supplementLineId: null,
      supplementAt: 0,
      resolved: false,
      resolution: null,
    }],
    lines: [primary, base.lines[1], base.lines[2]],
  }
}

describe('交叉核实 · 班次层流程', () => {
  it('已派车的事故会引来第二位来电者，占用另一条空闲线路', () => {
    const next = tickShift(shiftWithDispatchedPrimary())

    const supplement = next.lines.find(line => line.role === 'supplement')
    expect(supplement).toBeDefined()
    expect(supplement!.phase).toBe('ringing')
    expect(supplement!.incidentId).toBe('inc-1')
    expect(next.incidents[0].supplementLineId).toBe(supplement!.id)
  })

  it('未派车的事故不会引来第二位来电者', () => {
    const state = shiftWithDispatchedPrimary()
    const noDispatch: ShiftState = {
      ...state,
      lines: state.lines.map((line, i) => (i === 0
        ? { ...line, world: { ...line.world, dispatchSent: false }, vehicleId: null }
        : line)),
    }

    expect(tickShift(noDispatch).lines.some(line => line.role === 'supplement')).toBe(false)
  })

  it('接听第二位来电者会注入核实通话，且不拥有患者', () => {
    let shift = tickShift(shiftWithDispatchedPrimary())
    const supplementId = shift.lines.find(line => line.role === 'supplement')!.id

    shift = answerLine(shift, supplementId)
    const line = shift.lines.find(item => item.id === supplementId)!

    expect(line.phase).toBe('active')
    expect(line.world.currentCall?.isVerification).toBe(true)
    expect(line.world.patientStatus).toBeNull()
    expect(line.verification).not.toBeNull()
    expect(line.verification!.report.primary).toBe(SCENARIO.fourElements.condition.breathing)
  })

  it('采纳最新观察会结束该通电话并标记事故已解决', () => {
    let shift = tickShift(shiftWithDispatchedPrimary())
    const supplementId = shift.lines.find(line => line.role === 'supplement')!.id
    shift = answerLine(shift, supplementId)

    shift = resolveVerification(shift, supplementId, 'adopt')
    const line = shift.lines.find(item => item.id === supplementId)!

    expect(line.phase).toBe('done')
    expect(line.verification!.resolution).toBe('adopt')
    expect(line.world.terminal.conditionNote).toContain('交叉核实')
    expect(shift.incidents[0].resolved).toBe(true)
  })

  it('维持初报同样结束通话，但记录为需现场复核', () => {
    let shift = tickShift(shiftWithDispatchedPrimary())
    const supplementId = shift.lines.find(line => line.role === 'supplement')!.id
    shift = answerLine(shift, supplementId)

    shift = resolveVerification(shift, supplementId, 'reject')
    const line = shift.lines.find(item => item.id === supplementId)!

    expect(line.verification!.resolution).toBe('reject')
    expect(line.world.terminal.conditionNote).toContain('需现场复核')
  })

  it('再追问只允许一次，第二次会强制做出决定', () => {
    let shift = tickShift(shiftWithDispatchedPrimary())
    const supplementId = shift.lines.find(line => line.role === 'supplement')!.id
    shift = answerLine(shift, supplementId)

    shift = resolveVerification(shift, supplementId, 'probe')
    expect(shift.lines.find(l => l.id === supplementId)!.phase).toBe('active')
    expect(shift.lines.find(l => l.id === supplementId)!.verification!.probed).toBe(true)

    shift = resolveVerification(shift, supplementId, 'probe')
    const line = shift.lines.find(l => l.id === supplementId)!
    expect(line.phase).toBe('done')
    expect(line.verification!.resolution).not.toBeNull()
    expect(shift.incidents[0].resolved).toBe(true)
  })

  it('核实通话不会占用救护车', () => {
    let shift = tickShift(shiftWithDispatchedPrimary())
    const supplementId = shift.lines.find(line => line.role === 'supplement')!.id
    shift = answerLine(shift, supplementId)

    expect(shift.lines.find(l => l.id === supplementId)!.vehicleId).toBeNull()
  })
})
