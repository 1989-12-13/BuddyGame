// ============================================================
// 零点接线台 — COMPLETE_MINIGAME reducer 处理器
// 互动小游戏完成（记录分数，推进步骤）
// ============================================================

import type { WorldState, DialogueLine } from '../../types'
import { createEventSink, sinkEvent } from './helpers'
import { MINIGAME_STABILITY_MULT } from '../constants'

export function handleCompleteMinigame(
  state: WorldState,
  stepIndex: number,
  score: number,
  passed: boolean,
): WorldState {
  if (!state.currentCall?.guidance) return state
  if (!state.guidanceActive) return state
  if (state.callPhase !== 'guidance') return state

  const guidanceDef = state.currentCall.guidance
  const step = guidanceDef.steps[stepIndex]
  if (!step?.miniGame) return state

  const now = state.shiftElapsed
  const spec = step.miniGame
  const callerText = passed ? spec.feedback.good : spec.feedback.bad
  const operatorLine: DialogueLine = {
    speaker: 'operator',
    text: `【实操指导：${spec.title}】${passed ? '操作到位' : '操作需改进'}（评分 ${(score * 100).toFixed(0)}）`,
    timestamp: now,
  }
  const feedbackLine: DialogueLine = {
    speaker: 'caller',
    text: callerText,
    timestamp: now,
  }

  const newScores = [...state.guidanceMinigameScores]
  newScores[stepIndex] = score

  const sink = createEventSink(state)
  let newPatientStatus = state.patientStatus
  if (state.patientStatus && !state.patientStatus.died) {
    const delta = Math.round((score - 0.5) * MINIGAME_STABILITY_MULT)
    newPatientStatus = {
      ...state.patientStatus,
      stability: Math.max(0, Math.min(100, state.patientStatus.stability + delta)),
    }
    sinkEvent(
      sink,
      score >= 0.7 ? 'good' : score >= 0.4 ? 'warn' : 'bad',
      `${score >= 0.7 ? '✓' : score >= 0.4 ? '◐' : '✗'} ${spec.title}：评分 ${(score * 100).toFixed(0)}`,
      state.shiftElapsed,
    )
  }

  const nextIndex = stepIndex + 1
  const isLastStep = nextIndex >= guidanceDef.steps.length

  return {
    ...state,
    eventSeq: sink.seq,
    guidanceStepIndex: nextIndex,
    guidanceMinigameScores: newScores,
    callPhase: isLastStep ? 'closing' : 'guidance',
    patientStatus: newPatientStatus,
    patientEvents: sink.events,
    dialogueLog: [...state.dialogueLog, operatorLine, feedbackLine],
  }
}
