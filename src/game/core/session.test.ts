import { afterEach, describe, expect, it } from 'vitest'
import { worldReducer } from './worldReducer'
import { createInitialState } from './worldState'
import { CAMPAIGN_IDS } from './campaign'
import { applyCallEvents } from './callEvents'
import { buildDispatchPlan } from './dispatchPlanning'
import { dispatchEligibility } from './session'
import { loadCheckpoint, saveCheckpoint } from './checkpoint'
import type { WorldState, MpdsDeterminant } from '../types'

function begin(id = 'cardiac_arrest') {
  return worldReducer(worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: [id] }), { type: 'ANSWER_CALL' })
}
function ready(state = begin()) {
  return { ...state, terminal: { ...state.terminal, address: '已核实的位置', conscious: false, breathing: false, determinant: 'ECHO' as const, triage: 'red' as const } }
}
function dispatch(state: WorldState) {
  const plan = buildDispatchPlan(state)!
  return worldReducer(state, { type: 'DISPATCH', vehicleId: 'ambulance', route: plan.routes[0], callInstanceId: state.callInstanceId })
}
afterEach(() => localStorage.clear())
describe('workbench state boundaries', () => {
  it('uses real active ticks for questions and rejects rapid repeat actions', () => {
    const first = worldReducer(begin(), { type: 'ASK_QUESTION', questionId: 'step1_location' })
    expect(first.shiftElapsed).toBe(0)
    expect(first.actionEndsAt).toBe(2)
    expect(worldReducer(first, { type: 'ASK_QUESTION', questionId: 'step2_event' })).toBe(first)
    const advanced = worldReducer(first, { type: 'TICK' })
    expect(advanced.patientStatus!.stability).toBeLessThan(first.patientStatus!.stability)
    expect(advanced.shiftElapsed).toBe(1)
  })
  it('freezes the world for nested reasons and only resumes after all are cleared', () => {
    let state = dispatch(ready())
    state = worldReducer(state, { type: 'PAUSE', reason: 'background' })
    state = worldReducer(state, { type: 'PAUSE', reason: 'settings' })
    expect(worldReducer(state, { type: 'TICK' })).toBe(state)
    state = worldReducer(state, { type: 'RESUME', reason: 'settings' })
    expect(worldReducer(state, { type: 'TICK' })).toBe(state)
    state = worldReducer(state, { type: 'RESUME' })
    expect(worldReducer(state, { type: 'TICK' }).ambulanceRemaining).toBe(state.ambulanceRemaining - 1)
  })
  it('shares missing-data and unavailable-vehicle reasons with dispatch', () => {
    const state = begin()
    expect(dispatchEligibility(state).reasons).toContain('确认事发地址')
    expect(buildDispatchPlan(state)).toBeNull()
    const available = ready(state)
    const plan = buildDispatchPlan(available)!
    const busy = { ...available, fleet: { ...available.fleet, vehicles: available.fleet.vehicles.map(v => ({ ...v, status: 'returning' as const })) } }
    expect(dispatchEligibility(busy).reasons).toContain('救护车正在周转，请保持通话')
    expect(worldReducer(busy, { type: 'DISPATCH', vehicleId: 'ambulance', route: plan.routes[0] })).toBe(busy)
  })
  it('rejects stale route confirmation and duplicate guidance or invalid scores', () => {
    const state = ready()
    const route = buildDispatchPlan(state)!.routes[0]
    expect(worldReducer(state, { type: 'DISPATCH', vehicleId: 'ambulance', route, callInstanceId: state.callInstanceId - 1 })).toBe(state)
    const started = dispatch(state)
    const answered = worldReducer(started, { type: 'ANSWER_GUIDANCE', callInstanceId: started.callInstanceId, stepIndex: 0, selectedIndex: 0 })
    expect(answered.guidanceStepIndex).toBe(0)
    expect(worldReducer(answered, { type: 'ANSWER_GUIDANCE', stepIndex: 1, selectedIndex: 0 })).toBe(answered)
    const continued = worldReducer(answered, { type: 'CONTINUE_GUIDANCE', callInstanceId: started.callInstanceId, stepIndex: 0 })
    expect(continued.guidanceStepIndex).toBe(1)
    expect(worldReducer(continued, { type: 'CONTINUE_GUIDANCE', callInstanceId: started.callInstanceId, stepIndex: 0 })).toBe(continued)
    expect(worldReducer(answered, { type: 'ANSWER_GUIDANCE', callInstanceId: started.callInstanceId, stepIndex: 0, selectedIndex: 0 })).toBe(answered)
    const mgIndex = started.currentCall!.guidance!.steps.findIndex(step => step.miniGame)
    const mg = { ...started, guidanceStepIndex: mgIndex }
    for (const score of [NaN, Infinity, -1, 1.1]) expect(worldReducer(mg, { type: 'COMPLETE_MINIGAME', stepIndex: mgIndex, score, passed: true })).toBe(mg)
    const completed = worldReducer(mg, { type: 'COMPLETE_MINIGAME', stepIndex: mgIndex, score: 0, passed: true })
    expect(completed.guidanceResults[mgIndex]).toBe('incorrect')
  })
  it('triggers crossed time thresholds exactly once and explicit question events', () => {
    const state = begin()
    const scenario = { ...state.currentCall!, specialEvents: [
      { id: 'time', trigger: 'time_elapsed' as const, triggerValue: '3', type: 'caller_speaks' as const, dialogue: '一条延迟提醒' },
      { id: 'ask', trigger: 'after_question' as const, triggerValue: 'step4_vitals', type: 'caller_panic' as const, dialogue: '请再确认呼吸' },
    ] }
    const after = applyCallEvents({ ...state, currentCall: scenario, shiftElapsed: 8 }, 'time_elapsed')
    expect(after.triggeredEventIds).toEqual(['time'])
    expect(applyCallEvents(after, 'time_elapsed')).toBe(after)
    expect(applyCallEvents(after, 'after_question', 'step1_location')).toBe(after)
    expect(applyCallEvents(after, 'after_question', 'step4_vitals').triggeredEventIds).toEqual(['time', 'ask'])
  })
  it('does not automatically end a call after arrival, and never scores twice', () => {
    let state = dispatch(ready())
    for (let i = 0; i < 200; i++) state = worldReducer(state, { type: 'TICK' })
    expect(state.currentCall).not.toBeNull()
    const ended = worldReducer(state, { type: 'END_CALL' })
    expect(ended.callScores).toHaveLength(1)
    expect(worldReducer(ended, { type: 'TICK' })).toBe(ended)
    expect(worldReducer(ended, { type: 'END_CALL' })).toBe(ended)
  })
  it('persists completed progress but restarts an interrupted call safely', () => {
    const state = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: CAMPAIGN_IDS })
    saveCheckpoint({ ...state, callIndex: 2, callScores: [78, 85], totalScore: 163 })
    const restored = loadCheckpoint()!
    expect(restored.callIndex).toBe(2)
    expect(restored.currentCall).toBeNull()
    expect(restored.totalScore).toBe(163)
    expect(restored.fleet.vehicles[0].status).toBe('available')
    localStorage.setItem('dispatch120-checkpoint-v1', '{broken')
    expect(loadCheckpoint()).toBeNull()
  })
  it('completes all five campaign calls with independent results and no deadlock', () => {
    let state = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: CAMPAIGN_IDS })
    for (let index = 0; index < CAMPAIGN_IDS.length; index++) {
      while (state.fleet.vehicles[0].status !== 'available') state = worldReducer(state, { type: 'ADVANCE_TURNAROUND' })
      state = worldReducer(state, { type: 'ANSWER_CALL' })
      expect(state.currentCall!.id).toBe(CAMPAIGN_IDS[index])
      const call = state.currentCall!
      const map: Record<string, MpdsDeterminant> = { E: 'ECHO', D: 'DELTA', C: 'CHARLIE', B: 'BRAVO', A: 'ALPHA' }
      state = ready(state)
      state = worldReducer(state, { type: 'SET_MPDS_DETERMINANT', determinant: map[call.mpdsCard.determinantCode.split('-')[1]] })
      state = dispatch(state)
      for (let i = 0; i < (call.guidance?.steps.length ?? 0); i++) {
        const step = call.guidance!.steps[i]
        state = worldReducer(state, step.miniGame ? { type: 'COMPLETE_MINIGAME', callInstanceId: state.callInstanceId, stepIndex: i, score: 1, passed: true } : { type: 'ANSWER_GUIDANCE', callInstanceId: state.callInstanceId, stepIndex: i, selectedIndex: step.correctIndex })
        state = worldReducer(state, { type: 'CONTINUE_GUIDANCE', callInstanceId: state.callInstanceId, stepIndex: i })
      }
      for (let i = 0; i < 600 && !state.rescue.outcome; i++) state = worldReducer(state, { type: 'TICK' })
      expect(state.rescue.outcome).not.toBeNull()
      state = worldReducer(state, { type: 'END_CALL' })
      expect(state.callScores).toHaveLength(index + 1)
      state = worldReducer(state, { type: 'DISMISS_DEBRIEF' })
      if (state.pendingPerkChoices.length) state = worldReducer(state, { type: 'CHOOSE_PERK', perkId: state.pendingPerkChoices[0] })
    }
    expect(state.screen).toBe('ending')
    expect(state.callHistory).toHaveLength(5)
  })
})
