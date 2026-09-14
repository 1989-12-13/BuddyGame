import { describe, expect, it } from 'vitest'
import { worldReducer } from './worldReducer'
import { createInitialState } from './worldState'
import { buildDispatchPlan } from './dispatchPlanning'
import type { WorldState } from '../types'

const CORRECTION_ID = 'falls_consciousness_correction'

function beginCall(scenarioId = 'falls_elderly'): WorldState {
  const started = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: [scenarioId] })
  return worldReducer(started, { type: 'ANSWER_CALL' })
}

function ticks(state: WorldState, count: number): WorldState {
  let next = state
  for (let i = 0; i < count; i++) next = worldReducer(next, { type: 'TICK' })
  return next
}

function ready(state: WorldState): WorldState {
  return {
    ...state,
    terminal: {
      ...state.terminal,
      address: '已确认入口',
      contact: '138****0000',
      conscious: true,
      breathing: true,
      determinant: 'DELTA',
      triage: state.currentCall!.correctTriage,
    },
  }
}

describe('交叉信息 · 来电者改口', () => {
  it('定时触发的改口会插入冲突报告与重新判断卡', () => {
    let state = beginCall()
    expect(state.pendingJudgments).toHaveLength(0)

    state = ticks(state, 46)

    expect(state.dialogueLog.some(line => line.text.includes('他没应我'))).toBe(true)

    const card = state.pendingJudgments.find(judgment => judgment.questionId === CORRECTION_ID)
    expect(card).toBeDefined()
    expect(card!.options.filter(option => option.isCorrect)).toHaveLength(1)
  })

  it('改口事件只会触发一次', () => {
    let state = ticks(beginCall(), 46)
    expect(state.pendingJudgments.filter(j => j.questionId === CORRECTION_ID)).toHaveLength(1)

    state = ticks(state, 120)

    expect(state.pendingJudgments.filter(j => j.questionId === CORRECTION_ID)).toHaveLength(1)
  })
})

describe('在途事件 · 泛化到所有场景', () => {
  it('非脑卒中场景派车后同样会出现改道决策', () => {
    let state = ready(beginCall('falls_elderly'))
    const plan = buildDispatchPlan(state)!
    state = worldReducer(state, {
      type: 'DISPATCH',
      vehicleId: 'ambulance',
      route: plan.routes[0],
      routeOptions: plan.routes,
      callInstanceId: state.callInstanceId,
    })

    for (let i = 0; i < 300 && !state.pendingReroute; i++) state = worldReducer(state, { type: 'TICK' })

    expect(state.pendingReroute).not.toBeNull()
    expect(state.pendingReroute!.options).toHaveLength(2)
  })
})
