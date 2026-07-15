import { describe, expect, it } from 'vitest'
import { getScenario } from '../events/templates'
import type { DispatchRecord, JudgmentPrompt, WorldState } from '../types'
import { buildDebrief } from './debrief'
import { buildDispatchPlan } from './dispatchPlanning'
import { worldReducer } from './worldReducer'
import { createCallerState, createInitialState, createTerminalState } from './worldState'

function dispatchWithPlannedRoute(state: WorldState): WorldState {
  const plan = buildDispatchPlan(state)
  if (!plan) throw new Error('Expected an automatic dispatch plan')
  return worldReducer(state, {
    type: 'DISPATCH',
    vehicleId: 'ambulance',
    route: plan.routes[0],
  })
}

function makeDebriefState(
  scenarioId: string,
  overrides: Partial<WorldState> & { dispatchRecord?: DispatchRecord | null } = {},
): WorldState {
  const scenario = getScenario(scenarioId)
  const callerState = createCallerState(scenario.callerId, 20)
  callerState.revealedInfo = {
    ...callerState.revealedInfo,
    address: 'full',
    contact: true,
    chiefComplaint: true,
    age: true,
    gender: true,
    consciousness: true,
    breathing: true,
    purpose: true,
  }

  return {
    ...createInitialState(),
    callerState,
    terminal: {
      ...createTerminalState(),
      determinant: scenario.mpdsCard.determinantCode.includes('-E-')
        ? 'ECHO'
        : scenario.mpdsCard.determinantCode.includes('-D-')
          ? 'DELTA'
          : scenario.mpdsCard.determinantCode.includes('-C-')
            ? 'CHARLIE'
            : scenario.mpdsCard.determinantCode.includes('-B-')
              ? 'BRAVO'
              : 'ALPHA',
    },
    dispatchRecord: {
      callId: scenario.id,
      dispatchTime: 40,
      triage: scenario.correctTriage,
      correctTriage: scenario.correctTriage,
      isPrank: scenario.isPrank ?? false,
      addressCompleteness: 'full',
      ambulanceETA: 4,
      dispatchedAt: 40,
    },
    guidanceResults: ['correct', 'correct'],
    callScores: [92],
    ...overrides,
  }
}

describe('buildDebrief', () => {
  it('resolves a strong call as a good patient outcome', () => {
    const scenario = getScenario('cardiac_arrest')
    const debrief = buildDebrief(makeDebriefState(scenario.id), scenario)

    expect(debrief.outcomeTier).toBe('good')
    expect(debrief.outcomeTitle).toContain('好结局')
    expect(debrief.reviewPoints.some(point => point.includes('时间控制合格'))).toBe(true)
  })

  it('resolves missing dispatch as a bad outcome', () => {
    const scenario = getScenario('cardiac_arrest')
    const debrief = buildDebrief(makeDebriefState(scenario.id, {
      dispatchRecord: null,
      callScores: [30],
    }), scenario)

    expect(debrief.outcomeTier).toBe('bad')
    expect(debrief.patientStatus).toContain('风险')
    expect(debrief.reviewPoints.some(point => point.includes('未形成有效派车记录'))).toBe(true)
  })

  it('resolves a close triage miss as a normal patient outcome', () => {
    const scenario = getScenario('cardiac_arrest')
    const debrief = buildDebrief(makeDebriefState(scenario.id, {
      dispatchRecord: {
        callId: scenario.id,
        dispatchTime: 40,
        triage: 'yellow',
        correctTriage: scenario.correctTriage,
        isPrank: false,
        addressCompleteness: 'full',
        ambulanceETA: 5,
        dispatchedAt: 40,
      },
      callScores: [70],
    }), scenario)

    expect(debrief.outcomeTier).toBe('normal')
    expect(debrief.reviewPoints.some(point => point.includes('接近正确答案'))).toBe(true)
  })

  it('resolves a verified prank as a special outcome', () => {
    const scenario = getScenario('prank_call')
    const verifiedJudgment: JudgmentPrompt = {
      id: 'prank-check',
      questionId: 'mpds_prank_patient',
      dialogueIndex: 0,
      question: '是否为真实患者？',
      options: [
        { label: '真实患者', fills: [], isCorrect: false },
        { label: '恶作剧', fills: [], isCorrect: true },
      ],
      chosenOptionIndex: 1,
    }
    const debrief = buildDebrief(makeDebriefState(scenario.id, {
      dispatchRecord: null,
      callScores: [100],
      pendingJudgments: [verifiedJudgment],
    }), scenario)

    expect(debrief.outcomeTier).toBe('special')
    expect(debrief.isPrankHandledCorrectly).toBe(true)
  })

  it('stores structured dispatch data in lastDebrief and clears the active call after END_CALL', () => {
    const started = worldReducer(createInitialState(), { type: 'START_SHIFT' })
    const withScenario = {
      ...started,
      scenarioQueue: ['cardiac_arrest'],
      totalCalls: 1,
    }
    const answered = worldReducer(withScenario, { type: 'ANSWER_CALL' })
    const classified = worldReducer(answered, { type: 'SET_MPDS_DETERMINANT', determinant: 'ECHO' })
    const triaged = worldReducer(classified, { type: 'SET_TRIAGE', level: 'red' })
    const dispatched = dispatchWithPlannedRoute(triaged)
    const ended = worldReducer(dispatched, { type: 'END_CALL' })

    expect(ended.currentCall).toBeNull()
    expect(ended.dispatchRecord).toBeNull()
    expect(ended.callerState).toBeNull()
    expect(ended.lastDebrief?.scenarioId).toBe('cardiac_arrest')
    expect(ended.lastDebrief?.dispatchTime).toBe(dispatched.dispatchRecord?.dispatchTime)
    expect(ended.lastDebrief?.breakdown.speed).toBeGreaterThan(0)
    expect(ended.lastDebrief?.breakdown.triage).toBeGreaterThan(0)
    expect(ended.screen).toBe('playing')
    expect(worldReducer(ended, { type: 'DISMISS_DEBRIEF' }).screen).toBe('ending')
  })

  it('offers a shift perk after non-final calls and applies the selected perk', () => {
    const started = worldReducer(createInitialState(), { type: 'START_SHIFT' })
    const withScenario = {
      ...started,
      scenarioQueue: ['cardiac_arrest', 'stroke'],
      totalCalls: 2,
    }
    const answered = worldReducer(withScenario, { type: 'ANSWER_CALL' })
    const classified = worldReducer(answered, { type: 'SET_MPDS_DETERMINANT', determinant: 'ECHO' })
    const triaged = worldReducer(classified, { type: 'SET_TRIAGE', level: 'red' })
    const ended = worldReducer(dispatchWithPlannedRoute(triaged), { type: 'END_CALL' })

    expect(ended.pendingPerkChoices).toHaveLength(3)

    const picked = ended.pendingPerkChoices[0]
    const upgraded = worldReducer(ended, { type: 'CHOOSE_PERK', perkId: picked })

    expect(upgraded.perks).toContain(picked)
    expect(upgraded.pendingPerkChoices).toHaveLength(0)
  })
})
