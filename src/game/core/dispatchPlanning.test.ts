import { describe, expect, it } from 'vitest'
import type { WorldState } from '../types'
import { buildDispatchPlan, shouldAutoPlan } from './dispatchPlanning'
import { createInitialState } from './worldState'
import { worldReducer } from './worldReducer'

function classifiedCall(): WorldState {
  const started = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: ['cardiac_arrest'] })
  const answered = worldReducer(started, { type: 'ANSWER_CALL' })
  return worldReducer({ ...answered, terminal: { ...answered.terminal, address: '测试现场', contact: '138****0000', conscious: false, breathing: false } }, { type: 'SET_MPDS_DETERMINANT', determinant: 'ECHO' })
}

describe('automatic ambulance dispatch planning', () => {
  it('returns 8 route options for the single ambulance', () => {
    const plan = buildDispatchPlan(classifiedCall())
    expect(plan).not.toBeNull()
    expect(plan!.routes).toHaveLength(8)
  })

  it('returns null when ambulance is unavailable', () => {
    const state = classifiedCall()
    const busy: WorldState = {
      ...state,
      fleet: {
        ...state.fleet,
        vehicles: state.fleet.vehicles.map(v => ({
          ...v, status: 'en_route' as const, currentCallId: 'busy',
          mission: { callId: 'busy', outboundTotal: 10, onSceneTotal: 5, eventLatLng: { lat: 0, lng: 0 } },
        })),
      },
    }
    expect(buildDispatchPlan(busy)).toBeNull()
  })

  it('is deterministic for one planning snapshot', () => {
    const state = classifiedCall()
    expect(buildDispatchPlan(state)).toEqual(buildDispatchPlan(state))
  })

  it('applies priority channel after pacing', () => {
    const normal = classifiedCall()
    const priority = { ...normal, perks: ['priority_channel' as const] }
    const normalRoutes = buildDispatchPlan(normal)!.routes
    const priorityRoutes = buildDispatchPlan(priority)!.routes
    expect(priorityRoutes.map(route => route.totalEta)).toEqual(normalRoutes.map(route => route.totalEta - 5))
  })

  it('does not plan routes for a dead or resolved patient', () => {
    const state = classifiedCall()
    expect(buildDispatchPlan({ ...state, patientStatus: { ...state.patientStatus!, died: true } })).toBeNull()
    expect(buildDispatchPlan({ ...state, rescue: { ...state.rescue, outcome: 'failed' } })).toBeNull()
  })
})


describe('自动摆出路线选择', () => {
  it('条件齐备且本通还没自动开过时，直接自动摆出方案', () => {
    const state = classifiedCall()
    expect(shouldAutoPlan(state, false, null)).toBe(true)
  })

  it('同一通电话只自动开一次（玩家取消后不再反复弹）', () => {
    const state = classifiedCall()
    expect(shouldAutoPlan(state, false, state.callInstanceId)).toBe(false)
  })

  it('已经有方案在展示、或已经派过车时不再自动开', () => {
    const state = classifiedCall()
    expect(shouldAutoPlan(state, true, null)).toBe(false)
    expect(shouldAutoPlan({ ...state, dispatchSent: true }, false, null)).toBe(false)
  })

  it('条件没齐（缺联系电话）时不自动开，留给按钮去说明原因', () => {
    const state = classifiedCall()
    const noContact: WorldState = { ...state, terminal: { ...state.terminal, contact: '' } }
    expect(shouldAutoPlan(noContact, false, null)).toBe(false)
  })
})
