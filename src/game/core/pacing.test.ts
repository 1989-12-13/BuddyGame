import { describe, it, expect } from 'vitest'
import { worldReducer } from './worldReducer'
import { createInitialState } from './worldState'
import { buildDispatchPlan } from './dispatchPlanning'
import { CAMPAIGN_IDS } from './campaign'
import { availableCareChecks } from './waitingCare'
import { loadCheckpoint, saveCheckpoint } from './checkpoint'
import type { WorldState } from '../types'

function ticks(state: WorldState, count: number) { for (let i = 0; i < count; i++) state = worldReducer(state, { type: 'TICK' }); return state }
function ready(state: WorldState) { return { ...state, terminal: { ...state.terminal, address: '已确认入口', conscious: true, breathing: true, determinant: 'DELTA' as const, triage: state.currentCall!.correctTriage } } }
function start(id = 'hemorrhage') { return ready(worldReducer(worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: [id] }), { type: 'ANSWER_CALL' })) }
function send(state: WorldState) { return worldReducer(state, { type: 'DISPATCH', callInstanceId: state.callInstanceId, vehicleId: 'ambulance', route: buildDispatchPlan(state)!.routes[0] }) }

describe('campaign care pacing', () => {
  it('supports a 15+ minute scripted care run without counting pause, debrief or turnaround', () => {
    let state = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: CAMPAIGN_IDS })
    for (const id of CAMPAIGN_IDS) {
      for (let i = 0; i < 100 && state.fleet.vehicles[0].status !== 'available'; i++) state = worldReducer(state, { type: 'ADVANCE_TURNAROUND' })
      expect(state.fleet.vehicles[0].status).toBe('available')
      state = worldReducer(state, { type: 'ANSWER_CALL' })
      expect(state.currentCall!.id).toBe(id)
      state = send(ready(ticks(state, 45)))
      for (const [index, step] of state.currentCall!.guidance!.steps.entries()) {
        state = ticks(state, step.miniGame?.kind === 'cpr' ? 42 : step.miniGame?.kind === 'rhythmPress' ? 30 : step.miniGame ? 15 : 8)
        expect(state.rescue.outcome).toBeNull()
        state = worldReducer(state, step.miniGame ? { type: 'COMPLETE_MINIGAME', stepIndex: index, score: 1, passed: true, callInstanceId: state.callInstanceId } : { type: 'ANSWER_GUIDANCE', stepIndex: index, selectedIndex: step.correctIndex, callInstanceId: state.callInstanceId })
        state = worldReducer(state, { type: 'CONTINUE_GUIDANCE', stepIndex: index, callInstanceId: state.callInstanceId })
      }
      for (let i = 0; i < 600 && !state.rescue.outcome; i++) {
        for (const check of availableCareChecks(state)) state = worldReducer(state, { type: 'CARE_CHECK', callInstanceId: state.callInstanceId, checkId: check.id, selectedIndex: check.correctIndex })
        state = ticks(state, 1)
      }
      expect(state.rescue.outcome).toBe('success')
      expect(Object.keys(state.careChecks)).toHaveLength(6)
      state = worldReducer(state, { type: 'END_CALL' })
      const active = state.activePlaySeconds
      expect(ticks(state, 60).activePlaySeconds).toBe(active)
      state = worldReducer(state, { type: 'DISMISS_DEBRIEF' })
      if (state.pendingPerkChoices.length) state = worldReducer(state, { type: 'CHOOSE_PERK', perkId: state.pendingPerkChoices[0] })
    }
    expect(state.screen).toBe('ending')
    expect(state.activePlaySeconds).toBeGreaterThanOrEqual(900)
    expect(state.activePlaySeconds).toBeLessThan(1500)
    console.info('Scripted active call time (not a human playtest):', state.activePlaySeconds, 'seconds')
  })
  it('rejects early, stale, invalid and repeated care checks and freezes measurements', () => {
    let state = send(start())
    const action = { type: 'CARE_CHECK' as const, callInstanceId: state.callInstanceId, checkId: 'access', selectedIndex: 0 }
    expect(worldReducer(state, action)).toBe(state)
    state = ticks(state, 22)
    expect(worldReducer(state, { ...action, selectedIndex: NaN })).toBe(state)
    expect(worldReducer(state, { ...action, callInstanceId: 0 })).toBe(state)
    state = worldReducer(state, action)
    expect(worldReducer(state, action)).toBe(state)
    const paused = worldReducer(state, { type: 'PAUSE', reason: 'settings' })
    expect(ticks(paused, 90)).toBe(paused)
  })
  it('persists active time only at completed-call boundaries and accepts old checkpoints', () => {
    localStorage.clear()
    let state = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: CAMPAIGN_IDS })
    state = worldReducer(ticks(worldReducer(state, { type: 'ANSWER_CALL' }), 40), { type: 'END_CALL' })
    saveCheckpoint(state)
    expect(loadCheckpoint()!.activePlaySeconds).toBe(40)
    const saved = JSON.parse(localStorage.getItem('dispatch120-checkpoint-v1')!)
    delete saved.activeSeconds
    localStorage.setItem('dispatch120-checkpoint-v1', JSON.stringify(saved))
    expect(loadCheckpoint()!.activePlaySeconds).toBe(0)
    localStorage.clear()
  })
})
