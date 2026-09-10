// ============================================================
// 120调度台 — ANSWER_CALL reducer 处理器
// 接听电话：初始化通话状态
// ============================================================

import type { WorldState, DialogueLine } from '../../types'
import { createCallerState, createTerminalState, createPatientStatus } from '../worldState'
import { getScenario } from '../../events/templates'
import { getCaller } from '../../npc/personas'
import { toneToInitialStress } from './helpers'
import { CARE_WINDOWS } from '../pacing'

export function handleAnswerCall(state: WorldState): WorldState {
  if (state.callIndex >= state.totalCalls || state.currentCall || state.lastDebrief || state.pendingPerkChoices.length) return state

  const scenarioId = state.scenarioQueue[state.callIndex]
  if (!scenarioId) return state

  const scenario = getScenario(scenarioId)
  const callerProfile = getCaller(scenario.callerId)
  const initialStress = toneToInitialStress(callerProfile.tone)
  const callerState = createCallerState(scenario.callerId, initialStress)

  const openingLine: DialogueLine = {
    speaker: 'caller',
    text: scenario.openingLine,
    timestamp: state.shiftElapsed,
  }

  const systemLine: DialogueLine = {
    speaker: 'system',
    text: `【来电号码: ${scenario.phoneNumber} · 基站定位: ${scenario.baseStation} · 来电者情绪: ${callerState.stressLevel}】`,
    timestamp: state.shiftElapsed,
  }

  const terminal = createTerminalState()
  const patientStatus = scenario.isPrank ? null : createPatientStatus(scenario.correctTriage)
  if (patientStatus && CARE_WINDOWS[scenarioId]) patientStatus.decayRate *= 0.4

  return {
    ...state,
    currentCall: scenario,
    callInstanceId: state.callInstanceId + 1,
    actionEndsAt: state.shiftElapsed,
    calmCount: 0,
    triggeredEventIds: [],
    careChecks: {},
    callPhase: 'questioning',
    callStartTime: state.shiftElapsed,
    callerState,
    patientStatus,
    patientEvents: [],
    rescue: { phase: 'idle', vehicleId: null, vehicleName: null, etaTotal: 0, arrivalShiftTime: null, outcome: null, successScore: null, failureReason: null },
    rerouteOptions: [],
    pendingReroute: null,
    rerouteUsed: false,
    handoff: { attempts: 0, selectedFactIds: [], firstAttemptCorrect: null, feedback: [], completed: false },
    terminal,
    dispatchSent: false,
    dispatchRecord: null,
    ambulanceRemaining: -1,
    questionCost: 0,
    guidanceActive: false,
    guidanceStepIndex: 0,
    guidanceResults: [],
    guidanceMinigameScores: [],
    pendingJudgments: [],
    lastDebrief: null,
    pendingPerkChoices: [],
    dialogueLog: [systemLine, openingLine],
  }
}
