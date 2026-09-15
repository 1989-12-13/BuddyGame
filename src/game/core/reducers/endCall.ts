// ============================================================
// 120调度台 — END_CALL reducer
// 结束当前通话，归档五维评价；不再生成或累计 0–100 分。
// ============================================================

import type { WorldState } from '../../types'
import { buildCallEvaluation, emptyAttitudeEvidence } from '../evaluation'
import { createTerminalState } from '../worldState'
import { nextDifficulty } from '../constants'
import { getPerkChoices } from '../perks'
import type { RoguePerkId } from '../perks'

export function handleEndCall(state: WorldState, perkChoices?: RoguePerkId[]): WorldState {
  if (!state.currentCall || !state.callerState) return state

  const call = state.currentCall
  const evaluation = buildCallEvaluation(state, call)
  const nextCallIndex = state.callIndex + 1
  const isShiftOver = nextCallIndex >= state.totalCalls

  // 按本通结束时体征条剩余比例调整下一通的自适应难度（恶作剧/核实通话无患者，难度不变）
  const ps = state.patientStatus
  const difficulty = ps && !call.isPrank
    ? nextDifficulty(state.difficulty, ps.stability / ps.initialStability)
    : state.difficulty

  const shouldContinueInBackground = Boolean(
    state.dispatchRecord
    && state.patientStatus
    && !state.rescue.outcome
    && state.rescue.vehicleId,
  )
  const backgroundRescues = shouldContinueInBackground
    ? [...state.backgroundRescues, {
        id: `rescue-${state.callInstanceId}`,
        callInstanceId: state.callInstanceId,
        callId: call.id,
        scenarioTitle: call.title,
        vehicleId: state.rescue.vehicleId!,
        dispatchRecord: state.dispatchRecord!,
        patientStatus: { ...state.patientStatus! },
        guidanceResults: [...state.guidanceResults],
        guidanceMinigameScores: [...state.guidanceMinigameScores],
        guidanceRequiredTotal: call.guidance?.steps.length ?? 0,
        perks: [...state.perks],
        outcome: null,
        successScore: null,
        failureReason: null,
      }]
    : state.backgroundRescues

  return {
    ...state,
    difficulty,
    callIndex: nextCallIndex,
    callPhase: 'completed',
    currentCall: null,
    callerState: null,
    dispatchSent: false,
    dispatchRecord: null,
    ambulanceRemaining: -1,
    terminal: createTerminalState(),
    dialogueLog: [],
    pendingJudgments: [],
    patientStatus: null,
    patientEvents: [],
    rescue: { phase: 'idle', vehicleId: null, vehicleName: null, etaTotal: 0, arrivalShiftTime: null, outcome: null, successScore: null, failureReason: null },
    handoff: { attempts: 0, selectedFactIds: [], firstAttemptCorrect: null, feedback: [], completed: false },
    guidanceActive: false,
    guidanceStepIndex: 0,
    guidanceResults: [],
    guidanceMinigameScores: [],
    calmCount: 0,
    attitudeEvidence: emptyAttitudeEvidence(),
    careChecks: {},
    questionCost: 0,
    triggeredEventIds: [],
    actionEndsAt: state.shiftElapsed,
    callEvaluations: [...state.callEvaluations, evaluation],
    screen: 'playing',
    shiftCompletePending: isShiftOver,
    lastDebrief: evaluation,
    pendingPerkChoices: isShiftOver ? [] : (perkChoices ?? getPerkChoices(state.perks, 3)),
    backgroundRescues,
  }
}
