import { describe, expect, it } from 'vitest'
import { buildTurn, buildTurnOptions, describeFacts, nextProtocolId, QUALITY_LABEL, type TurnOption } from './dialogueTurn'
import { createInitialState } from './worldState'
import { worldReducer } from './worldReducer'
import type { WorldState } from '../types'

function beginCall(scenarioId = 'falls_elderly'): WorldState {
  const started = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: [scenarioId] })
  return worldReducer(started, { type: 'ANSWER_CALL' })
}

function withCaller(state: WorldState, patch: Partial<NonNullable<WorldState['callerState']>>): WorldState {
  if (!state.callerState) throw new Error('当前没有来电者状态')
  return { ...state, callerState: { ...state.callerState, ...patch } }
}

function askAction(option: TurnOption) {
  if (option.action.type !== 'ASK_QUESTION') throw new Error(`期望 ASK_QUESTION，实际是 ${option.action.type}`)
  return option.action
}

describe('对话回合 · 顺序交给协议', () => {
  it('没有通话时不产生选项', () => {
    expect(buildTurnOptions(createInitialState())).toEqual([])
  })

  it('开局自动指向协议第一步，并给出两种措辞', () => {
    const state = beginCall()
    expect(nextProtocolId(state)).toBe('step1_location')

    const advances = buildTurnOptions(state).filter(option => option.kind === 'advance')
    expect(advances).toHaveLength(2)
    expect(askAction(advances[0])).toMatchObject({ questionId: 'step1_location', stressDelta: -5, extraTime: 1 })
    expect(askAction(advances[1])).toMatchObject({ questionId: 'step1_location', stressDelta: 6, extraTime: -1 })
  })

  it('问过之后协议自动推进到下一步', () => {
    const state = beginCall()
    const first = buildTurnOptions(state).find(option => option.kind === 'advance')!
    const next = worldReducer(state, first.action)

    expect(nextProtocolId(state)).toBe('step1_location')
    expect(nextProtocolId(next)).toBe('step2_event')
  })

  it('玩家选定的措辞会写进对话流', () => {
    const state = beginCall()
    const gentle = buildTurnOptions(state).find(option => option.kind === 'advance')!
    const next = worldReducer(state, gentle.action)

    const operatorLines = next.dialogueLog.filter(line => line.speaker === 'operator')
    expect(operatorLines[operatorLines.length - 1]?.text).toBe(askAction(gentle).spokenLine)
  })
})

describe('对话回合 · 每回合必须保留真实取舍', () => {
  it('选项数量保持在 2–4 之间', () => {
    const options = buildTurnOptions(beginCall())
    expect(options.length).toBeGreaterThanOrEqual(2)
    expect(options.length).toBeLessThanOrEqual(4)
  })

  it('放慢与加快的代价方向相反（效率 vs 情绪）', () => {
    const [gentle, press] = buildTurnOptions(beginCall())
      .filter(option => option.kind === 'advance')
      .map(askAction)

    expect(gentle.stressDelta).toBeLessThan(0)
    expect(gentle.extraTime).toBeGreaterThan(0)
    expect(press.stressDelta).toBeGreaterThan(0)
    expect(press.extraTime).toBeLessThan(0)
  })

  it('开局可以抢问意识与呼吸（跳过当前步骤）', () => {
    const shortcut = buildTurnOptions(beginCall()).find(option => option.kind === 'shortcut')
    expect(shortcut).toBeDefined()
    expect(askAction(shortcut!).questionId).toBe('step4_vitals')
  })
})

describe('对话回合 · 情绪与复核', () => {
  it('情绪偏高时提供安抚选项', () => {
    const state = withCaller(beginCall(), { stress: 80, stressLevel: '失控' })
    const calm = buildTurnOptions(state).find(option => option.kind === 'calm')

    expect(calm).toBeDefined()
    expect(calm!.action).toEqual({ type: 'CALM_CALLER' })
  })

  it('情绪平稳时不提供安抚', () => {
    const state = withCaller(beginCall(), { stress: 20, stressLevel: '镇定' })
    expect(buildTurnOptions(state).some(option => option.kind === 'calm')).toBe(false)
  })

  it('已问但没听清、且情绪已回落时提供复核选项', () => {
    const state = withCaller(beginCall(), {
      stress: 40,
      stressLevel: '紧张',
      questionAttempts: { step1_location: 1 },
      questionQuality: { step1_location: 'partial' },
      questionStress: { step1_location: 55 },
    })

    const confirm = buildTurnOptions(state).find(option => option.kind === 'confirm')
    expect(confirm).toBeDefined()
    expect(askAction(confirm!).questionId).toBe('step1_location')
  })

  it('情绪仍高于提问时不给复核选项', () => {
    const state = withCaller(beginCall(), {
      stress: 70,
      stressLevel: '恐慌',
      questionAttempts: { step1_location: 1 },
      questionQuality: { step1_location: 'partial' },
      questionStress: { step1_location: 55 },
    })
    expect(buildTurnOptions(state).some(option => option.kind === 'confirm')).toBe(false)
  })
})

describe('对话回合 · 信息质量可见化', () => {
  it('刚接听时关键信息都标记为未获取', () => {
    expect(describeFacts(beginCall()).map(fact => fact.quality))
      .toEqual(['unknown', 'unknown', 'unknown', 'unknown', 'unknown'])
  })

  it('紧张到影响回答时给出因果提示，并指向安抚', () => {
    const turn = buildTurn(withCaller(beginCall(), { stress: 70, stressLevel: '恐慌' }))

    expect(turn.degraded).toBe(true)
    expect(turn.notice).toContain('安抚')
  })

  it('情绪平稳时不再提示情绪影响', () => {
    const turn = buildTurn(withCaller(beginCall(), { stress: 20, stressLevel: '镇定' }))

    expect(turn.degraded).toBe(false)
    expect(turn.notice ?? '').not.toContain('越紧张')
  })

  it('每个质量档位都有中文说明', () => {
    expect(QUALITY_LABEL).toEqual({ clear: '清晰', partial: '基本可用', vague: '模糊', unknown: '未获取' })
  })
})

describe('对话回合 · 安抚是提升信息质量的手段', () => {
  it('安抚逐次压低压力，直到可以给出准确信息', () => {
    let state = withCaller(beginCall(), { stress: 85, stressLevel: '失控' })
    const drops: number[] = []

    for (let i = 0; i < 6; i++) {
      const before = state.callerState!.stress
      state = worldReducer(state, { type: 'CALM_CALLER' })
      drops.push(before - state.callerState!.stress)
      while (state.actionEndsAt > state.shiftElapsed) state = worldReducer(state, { type: 'TICK' })
    }

    // 递减但保留下限，不会崩塌到「安抚没用」
    expect(drops[0]).toBeGreaterThan(drops[2])
    expect(drops[5]).toBeGreaterThanOrEqual(8)
    // 六次安抚后进入「能给出准确信息」的区间
    expect(state.callerState!.stress).toBeLessThan(25)
    expect(state.callerState!.stressLevel).toBe('镇定')
  })
})
