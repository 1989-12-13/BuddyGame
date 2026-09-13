import { describe, expect, it } from 'vitest'
import { createInitialState, createTerminalState } from './worldState'
import { worldReducer } from './worldReducer'
import { fillDeterminantFromProtocol } from './autoClassify'
import { SCENARIOS } from '../events/templates'
import { determinantFromCode } from '../types'
import type { WorldState } from '../types'

function beginCall(scenarioId = 'falls_elderly'): WorldState {
  const started = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: [scenarioId] })
  return worldReducer(started, { type: 'ANSWER_CALL' })
}

describe('判定码自动填写 · 纯函数', () => {
  it('协议编号定了就补齐判定等级 / 细分编码 / 冷热 / 分诊', () => {
    const state = beginCall('falls_elderly') // 病例卡判定码 17-C-2
    const filled = fillDeterminantFromProtocol({ ...state.terminal, protocolNumber: 17 }, state)

    expect(filled.determinant).toBe('CHARLIE')
    expect(filled.determinantSubcode).toBe(2)
    expect(filled.hotCold).toBe('COLD')
    expect(filled.triage).toBe('yellow')
  })

  it('分诊与冷热取病例卡权威值，而不是通用的字母映射', () => {
    // 心脏问题 19-C-1：通用映射会给 yellow / COLD，病例卡的权威值是 red / HOT
    const state = beginCall('heart_problems')
    const filled = fillDeterminantFromProtocol({ ...state.terminal, protocolNumber: 19 }, state)

    expect(filled.determinant).toBe('CHARLIE')
    expect(filled.triage).toBe('red')
    expect(filled.hotCold).toBe('HOT')
  })

  it('没有协议编号时什么都不填', () => {
    const state = beginCall()
    const terminal = createTerminalState()
    expect(fillDeterminantFromProtocol(terminal, state)).toBe(terminal)
  })

  it('玩家手动选过判定等级时不覆盖', () => {
    const state = beginCall('cardiac_arrest') // 9-E-1
    const manual = { ...state.terminal, protocolNumber: 9, determinant: 'ALPHA' as const }
    expect(fillDeterminantFromProtocol(manual, state)).toBe(manual)
  })

  it('非标准判定码（恶作剧 "Ω"）推不出等级，保持原样', () => {
    const state = beginCall('prank_call')
    const terminal = { ...createTerminalState(), protocolNumber: 26 }
    expect(fillDeterminantFromProtocol(terminal, state)).toBe(terminal)
  })
})

describe('判定码自动填写 · 跨卡片一致性', () => {
  it('每张卡自动填写的判定等级 / 冷热 / 分诊都与卡片权威值一致', () => {
    const mismatched: string[] = []
    for (const scenario of Object.values(SCENARIOS)) {
      const determinant = determinantFromCode(scenario.mpdsCard.determinantCode)
      if (!determinant) continue
      const state = { currentCall: scenario } as WorldState
      const terminal = { ...createTerminalState(), protocolNumber: scenario.mpdsCard.number }
      const filled = fillDeterminantFromProtocol(terminal, state)

      if (filled.determinant !== determinant) mismatched.push(`${scenario.id}: 判定等级`)
      if (filled.hotCold !== scenario.mpdsCard.hotCold) mismatched.push(`${scenario.id}: 冷热 ${filled.hotCold} ≠ ${scenario.mpdsCard.hotCold}`)
      if (filled.triage !== scenario.correctTriage) mismatched.push(`${scenario.id}: 分诊 ${filled.triage} ≠ ${scenario.correctTriage}`)
    }
    expect(mismatched).toEqual([])
  })
})

describe('判定码自动填写 · 接入动作', () => {
  it('SET_PROTOCOL 之后判定码与分诊一并就绪', () => {
    const state = beginCall('falls_elderly')
    const next = worldReducer(state, { type: 'SET_PROTOCOL', protocolNumber: 17 })

    expect(next.terminal.determinant).toBe('CHARLIE')
    expect(next.terminal.triage).toBe('yellow')
  })

  it('问询结束即可直接派车：不再需要手动登记判定码', () => {
    let state = beginCall('falls_elderly')
    state = worldReducer(state, { type: 'UPDATE_TERMINAL', field: 'address', value: '望江路 128 号 3 栋' })
    state = worldReducer(state, { type: 'SET_PATIENT_STATUS', field: 'conscious', value: true })
    state = worldReducer(state, { type: 'SET_PATIENT_STATUS', field: 'breathing', value: true })
    expect(state.terminal.determinant).toBeNull()

    state = worldReducer(state, { type: 'SET_PROTOCOL', protocolNumber: 17 })

    // 四项必要登记齐全（地点 / 意识 / 呼吸 / 判定码），分诊也一并就绪
    expect(state.terminal.address).toBe('望江路 128 号 3 栋')
    expect(state.terminal.conscious).toBe(true)
    expect(state.terminal.breathing).toBe(true)
    expect(state.terminal.determinant).toBe('CHARLIE')
    expect(state.terminal.triage).toBe('yellow')
  })
})
