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

describe('在途事件 · 只影响 ETA，不再打断玩家', () => {
  it('路况更新会写进对话与 ETA，但不再要求玩家二次决策', () => {
    let state = ready(beginCall('falls_elderly'))
    const plan = buildDispatchPlan(state)!
    state = worldReducer(state, {
      type: 'DISPATCH',
      vehicleId: 'ambulance',
      route: plan.routes[0],
      callInstanceId: state.callInstanceId,
    })

    state = ticks(state, 300)

    // 路况仍然发生：对话里留下路况更新记录
    expect(state.dialogueLog.some(line => line.text.includes('路况更新'))).toBe(true)
    // 但改道状态已从状态机移除，玩家不会被中途打断
    expect('pendingReroute' in state).toBe(false)
    expect(state.rescue.etaTotal).toBeGreaterThan(0)
  })
})
