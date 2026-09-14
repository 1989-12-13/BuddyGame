import { afterEach, describe, expect, it } from 'vitest'
import { worldReducer } from './worldReducer'
import { createInitialState } from './worldState'
import { applyCallEvents } from './callEvents'
import { buildDispatchPlan } from './dispatchPlanning'
import { dispatchEligibility } from './session'
import { loadCheckpoint, saveCheckpoint } from './checkpoint'
import type { WorldState, MpdsDeterminant } from '../types'
import { buildHandoffFacts } from './handoff'

/** 连续多通回归用到的场景；不是「每班固定通数」 */
const QUEUE_SCENARIOS = ['falls_elderly', 'stroke', 'cardiac_arrest']

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
  it('allows one justified re-question after a vague answer and calming', () => {
    const started = begin('falls_elderly')
    let state: WorldState = {
      ...started,
      callerState: { ...started.callerState!, stress: 90, stressLevel: '失控' as const },
    }
    state = worldReducer(state, { type: 'ASK_QUESTION', questionId: 'step1_location' })
    while (state.actionEndsAt > state.shiftElapsed) state = worldReducer(state, { type: 'TICK' })
    const beforeCalm = state
    expect(worldReducer(state, { type: 'ASK_QUESTION', questionId: 'step1_location' })).toBe(state)
    state = worldReducer(state, { type: 'CALM_CALLER' })
    expect(state.attitudeEvidence.calmingActions).toBe(1)
    while (state.actionEndsAt > state.shiftElapsed) state = worldReducer(state, { type: 'TICK' })
    state = worldReducer(state, { type: 'ASK_QUESTION', questionId: 'step1_location' })
    expect(state).not.toBe(beforeCalm)
    expect(state.callerState!.questionAttempts.step1_location).toBe(2)
    expect(state.callerState!.askedMPDS.filter(id => id === 'step1_location')).toHaveLength(1)
    while (state.actionEndsAt > state.shiftElapsed) state = worldReducer(state, { type: 'TICK' })
    expect(worldReducer(state, { type: 'ASK_QUESTION', questionId: 'step1_location' })).toBe(state)
  })
  it('records supportive and pressuring phrasing evidence, including player-caused loss of control', () => {
    const started = begin('falls_elderly')
    const supported = worldReducer(started, { type: 'ASK_QUESTION', questionId: 'step1_location', stressDelta: -5 })
    expect(supported.attitudeEvidence.supportiveTurns).toBe(1)

    const pressuredStart = {
      ...started,
      callerState: { ...started.callerState!, stress: 99, stressLevel: '紧张' as const },
    }
    const pressured = worldReducer(pressuredStart, { type: 'ASK_QUESTION', questionId: 'step1_location', stressDelta: 8 })
    expect(pressured.attitudeEvidence.pressuringTurns).toBe(1)
    expect(pressured.attitudeEvidence.playerCausedLossControl).toBe(true)
  })
  it('does not automatically end a call after arrival, and never evaluates twice', () => {
    let state = dispatch(ready())
    for (let i = 0; i < 200; i++) state = worldReducer(state, { type: 'TICK' })
    expect(state.currentCall).not.toBeNull()
    const ended = worldReducer(state, { type: 'END_CALL' })
    expect(ended.callEvaluations).toHaveLength(1)
    expect(worldReducer(ended, { type: 'TICK' })).toBe(ended)
    expect(worldReducer(ended, { type: 'END_CALL' })).toBe(ended)
  })

  it('continues an en-route rescue after hangup and resolves it once', () => {
    let state = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: ['cardiac_arrest', 'stroke'] })
    state = dispatch(ready(worldReducer(state, { type: 'ANSWER_CALL' })))
    state = worldReducer(state, { type: 'END_CALL', perkChoices: ['rapid_intake'] })
    expect(state.backgroundRescues).toHaveLength(1)
    state = worldReducer(state, { type: 'DISMISS_DEBRIEF' })
    state = worldReducer(state, { type: 'CHOOSE_PERK', perkId: 'rapid_intake' })
    const evaluationCount = state.callEvaluations.length
    for (let i = 0; i < 600 && !state.backgroundRescues[0].outcome; i++) state = worldReducer(state, { type: 'TICK' })
    expect(state.backgroundRescues[0].outcome).not.toBeNull()
    expect(state.rescueNotifications).toHaveLength(1)
    expect(state.callEvaluations).toHaveLength(evaluationCount)
    expect(state.callEvaluations.find(item => item.callInstanceId === state.backgroundRescues[0].callInstanceId)?.outcome).not.toBe('pending')
    for (let i = 0; i < 10; i++) state = worldReducer(state, { type: 'TICK' })
    expect(state.rescueNotifications).toHaveLength(1)
  })
  it('offers one stroke reroute and rejects a second or stale choice', () => {
    let state: WorldState = ready(begin('stroke'))
    const plan = buildDispatchPlan(state)!
    state = worldReducer(state, { type: 'DISPATCH', vehicleId: 'ambulance', route: plan.routes[0], routeOptions: plan.routes, callInstanceId: state.callInstanceId })
    for (let i = 0; i < 300 && !state.pendingReroute; i++) state = worldReducer(state, { type: 'TICK' })
    expect(state.pendingReroute).not.toBeNull()
    expect(state.pendingReroute!.options).toHaveLength(2)
    const alternate = state.pendingReroute!.options.find(route => route.id !== state.pendingReroute!.currentRouteId)!
    const rerouted = worldReducer(state, { type: 'REROUTE_AMBULANCE', callInstanceId: state.callInstanceId, routeId: alternate.id })
    expect(rerouted.rerouteUsed).toBe(true)
    expect(rerouted.pendingReroute).toBeNull()
    expect(rerouted.dispatchRecord!.routeId).toBe(alternate.id)
    expect(worldReducer(rerouted, { type: 'REROUTE_AMBULANCE', callInstanceId: rerouted.callInstanceId, routeId: plan.routes[0].id })).toBe(rerouted)
    expect(worldReducer(state, { type: 'REROUTE_AMBULANCE', callInstanceId: state.callInstanceId - 1, routeId: alternate.id })).toBe(state)
  })
  it('requires fact-based handoff and allows one correction', () => {
    let state = dispatch(ready(begin('falls_elderly')))
    for (let i = 0; i < 600 && !state.rescue.outcome; i++) state = worldReducer(state, { type: 'TICK' })
    const { facts, requiredIds } = buildHandoffFacts(state)
    const distractor = facts.find(fact => !fact.required)!
    const wrong = [...requiredIds.slice(1), distractor.id]
    state = worldReducer(state, { type: 'SUBMIT_HANDOFF', callInstanceId: state.callInstanceId, factIds: wrong })
    expect(state.handoff.completed).toBe(false)
    expect(state.handoff.firstAttemptCorrect).toBe(false)
    expect(state.handoff.feedback.some(line => line.startsWith('漏交接'))).toBe(true)
    state = worldReducer(state, { type: 'SUBMIT_HANDOFF', callInstanceId: state.callInstanceId, factIds: requiredIds })
    expect(state.handoff.completed).toBe(true)
    expect(state.handoff.attempts).toBe(2)
    expect(worldReducer(state, { type: 'SUBMIT_HANDOFF', callInstanceId: state.callInstanceId, factIds: requiredIds })).toBe(state)
  })
  it('persists completed progress but restarts an interrupted call safely', () => {
    let completed = begin('falls_elderly')
    completed = worldReducer(completed, { type: 'END_CALL' })
    const state = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: QUEUE_SCENARIOS })
    saveCheckpoint({ ...state, callIndex: 2, callEvaluations: [completed.callEvaluations[0], completed.callEvaluations[0]] })
    const restored = loadCheckpoint()!
    expect(restored.callIndex).toBe(2)
    expect(restored.currentCall).toBeNull()
    expect(restored.callEvaluations).toHaveLength(2)
    expect(restored.fleet.vehicles[0].status).toBe('available')
    localStorage.setItem('dispatch120-checkpoint-v3', '{broken')
    expect(loadCheckpoint()).toBeNull()
  })
  it('restores a pending background rescue with its vehicle', () => {
    let state = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: ['falls_elderly', 'stroke'] })
    state = dispatch(ready(worldReducer(state, { type: 'ANSWER_CALL' })))
    state = worldReducer(state, { type: 'END_CALL', perkChoices: ['rapid_intake'] })
    expect(saveCheckpoint(state)).toBe(true)
    const restored = loadCheckpoint()!
    expect(restored.backgroundRescues).toHaveLength(1)
    expect(restored.fleet.vehicles[0].status).toBe('en_route')
    expect(restored.currentCall).toBeNull()
  })
  it('invalidates legacy score-only checkpoints instead of fabricating evidence', () => {
    localStorage.setItem('dispatch120-checkpoint-v1', JSON.stringify({ version: 1, totalScore: 100, callScores: [100] }))
    localStorage.setItem('dispatch120-checkpoint-v2', JSON.stringify({ version: 2, totalScore: 100, callScores: [100] }))
    expect(loadCheckpoint()).toBeNull()
    expect(localStorage.getItem('dispatch120-checkpoint-v1')).toBeNull()
    expect(localStorage.getItem('dispatch120-checkpoint-v2')).toBeNull()
  })
  it('completes a multi-call queue with independent results and no deadlock', () => {
    let state = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: QUEUE_SCENARIOS })
    for (let index = 0; index < QUEUE_SCENARIOS.length; index++) {
      for (let i = 0; i < 600 && state.fleet.vehicles[0].status !== 'available'; i++) state = worldReducer(state, { type: 'TICK' })
      state = worldReducer(state, { type: 'ANSWER_CALL' })
      expect(state.currentCall!.id).toBe(QUEUE_SCENARIOS[index])
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
      expect(state.callEvaluations).toHaveLength(index + 1)
      state = worldReducer(state, { type: 'DISMISS_DEBRIEF' })
      if (state.pendingPerkChoices.length) state = worldReducer(state, { type: 'CHOOSE_PERK', perkId: state.pendingPerkChoices[0] })
    }
    expect(state.screen).toBe('ending')
  })
})
