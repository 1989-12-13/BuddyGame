// ============================================================
// 零点接线台 — ANSWER_GUIDANCE reducer 处理器
// 回答急救指导（记录结果，直接推进下一步）
// ============================================================

import type { WorldState, DialogueLine } from '../../types'
import { createEventSink, sinkEvent } from './helpers'
import { GUIDANCE_CORRECT_BONUS, GUIDANCE_INCORRECT_PENALTY } from '../constants'

export function handleAnswerGuidance(
  state: WorldState,
  stepIndex: number,
  selectedIndex: number,
): WorldState {
  if (!state.currentCall?.guidance) return state
  if (!state.guidanceActive) return state
  if (state.callPhase !== 'guidance') return state

  const guidanceDef = state.currentCall.guidance
  const step = guidanceDef.steps[stepIndex]
  if (!step) return state

  const isCorrect = selectedIndex === step.correctIndex
  const now = state.shiftElapsed

  const callerText = isCorrect ? step.feedback.callerCorrect : step.feedback.callerIncorrect

  const operatorLine: DialogueLine = {
    speaker: 'operator',
    text: step.instruction,
    timestamp: now,
  }
  const feedbackLine: DialogueLine = {
    speaker: 'caller',
    text: callerText,
    timestamp: now,
  }

  const newResults = [...state.guidanceResults]
  newResults[stepIndex] = isCorrect ? 'correct' : 'incorrect'

  const sink = createEventSink(state)
  let newPatientStatus = state.patientStatus
  if (state.patientStatus && !state.patientStatus.died) {
    if (isCorrect) {
      newPatientStatus = { ...state.patientStatus, stability: Math.min(100, state.patientStatus.stability + GUIDANCE_CORRECT_BONUS) }
      sinkEvent(sink, 'good', `✓ ${step.prompt}：操作正确`, state.shiftElapsed)
    } else {
      newPatientStatus = { ...state.patientStatus, stability: Math.max(0, state.patientStatus.stability - GUIDANCE_INCORRECT_PENALTY) }
      sinkEvent(sink, 'bad', `✗ ${step.prompt}：操作错误，患者情况恶化`, state.shiftElapsed)
    }
  }

  const nextIndex = stepIndex + 1
  const isLastStep = nextIndex >= guidanceDef.steps.length

  return {
    ...state,
    eventSeq: sink.seq,
    guidanceStepIndex: nextIndex,
    guidanceResults: newResults,
    callPhase: isLastStep ? 'closing' : 'guidance',
    patientStatus: newPatientStatus,
    patientEvents: sink.events,
    dialogueLog: [...state.dialogueLog, operatorLine, feedbackLine],
  }
}
