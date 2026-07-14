// ============================================================
// 零点接线台 — ANSWER_GUIDANCE reducer 处理器
// 回答急救指导（记录结果，直接推进下一步）
// ============================================================

import type { WorldState, DialogueLine } from '../../types'
import { createEventSink, sinkEvent, isGuidanceActive, advanceGuidanceStep } from './helpers'
import { GUIDANCE_CORRECT_BONUS, GUIDANCE_INCORRECT_PENALTY } from '../constants'
import { stabilityToVitalSign } from '../worldState'

export function handleAnswerGuidance(
  state: WorldState,
  stepIndex: number,
  selectedIndex: number,
): WorldState {
  if (!isGuidanceActive(state)) return state
  const guidanceDef = state.currentCall!.guidance!
  const step = guidanceDef.steps[stepIndex]
  if (!step) return state

  const isCorrect = selectedIndex === step.correctIndex
  const now = state.shiftElapsed

  const operatorLine: DialogueLine = {
    speaker: 'operator',
    text: step.instruction,
    timestamp: now,
  }
  const feedbackLine: DialogueLine = {
    speaker: 'caller',
    text: isCorrect ? step.feedback.callerCorrect : step.feedback.callerIncorrect,
    timestamp: now,
  }

  const newResults = [...state.guidanceResults]
  newResults[stepIndex] = isCorrect ? 'correct' : 'incorrect'

  const sink = createEventSink(state)
  let newPatientStatus = state.patientStatus
  if (state.patientStatus && !state.patientStatus.died) {
    if (isCorrect) {
      const newStability = Math.min(100, state.patientStatus.stability + GUIDANCE_CORRECT_BONUS)
      newPatientStatus = { ...state.patientStatus, stability: newStability, vitalSign: stabilityToVitalSign(newStability) }
      sinkEvent(sink, 'good', `✓ ${step.prompt}：操作正确`, state.shiftElapsed)
    } else {
      const newStability = Math.max(0, state.patientStatus.stability - GUIDANCE_INCORRECT_PENALTY)
      newPatientStatus = { ...state.patientStatus, stability: newStability, vitalSign: stabilityToVitalSign(newStability) }
      sinkEvent(sink, 'bad', `✗ ${step.prompt}：操作错误，患者情况恶化`, state.shiftElapsed)
    }
  }

  const nextIndex = stepIndex + 1
  const stepInfo = advanceGuidanceStep(state, nextIndex)

  return {
    ...state,
    eventSeq: sink.seq,
    ...stepInfo,
    guidanceResults: newResults,
    patientStatus: newPatientStatus,
    patientEvents: sink.events,
    dialogueLog: [...state.dialogueLog, operatorLine, feedbackLine],
  }
}
