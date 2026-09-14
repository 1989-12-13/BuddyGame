// ============================================================
// 120调度台 — ANSWER_GUIDANCE reducer 处理器
// 回答急救指导：记录结果，玩家核对反馈后再推进。
// ============================================================

import type { WorldState, DialogueLine } from '../../types'
import { createEventSink, sinkEvent, isGuidanceActive } from './helpers'
import { guidanceStabilityGain, guidanceStabilityPenalty, stabilityRecoveryCap } from '../constants'
import { stabilityToVitalSign } from '../worldState'

export function handleAnswerGuidance(
  state: WorldState,
  stepIndex: number,
  selectedIndex: number,
): WorldState {
  if (!isGuidanceActive(state)) return state
  const guidanceDef = state.currentCall!.guidance!
  const step = guidanceDef.steps[stepIndex]
  if (!step || step.miniGame || stepIndex !== state.guidanceStepIndex || state.guidanceResults[stepIndex] != null || !Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= step.options.length) return state

  const isCorrect = selectedIndex === step.correctIndex
  const now = state.shiftElapsed

  const operatorLine: DialogueLine = {
    speaker: 'operator',
    text: `我的选择：${step.options[selectedIndex]}`,
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
  let vitalsPulse: WorldState['vitalsPulse'] = null
  if (state.patientStatus && !state.patientStatus.died) {
    // 百分比模型：做对恢复已损失的体征，做错扣当前体征的一定比例。
    // black 档（心搏骤停等）恢复上限放开到 100，其他档位不越过起始体征。
    const triage = state.currentCall?.correctTriage ?? 'yellow'
    if (isCorrect) {
      const gain = guidanceStabilityGain(state.patientStatus.stability, state.patientStatus.initialStability)
      const newStability = Math.min(
        stabilityRecoveryCap(triage, state.patientStatus.initialStability),
        state.patientStatus.stability + gain,
      )
      vitalsPulse = { delta: newStability - state.patientStatus.stability, seq: state.eventSeq + 1 }
      newPatientStatus = { ...state.patientStatus, stability: newStability, vitalSign: stabilityToVitalSign(newStability) }
      sinkEvent(sink, 'good', `✓ ${step.prompt}：操作正确`, state.shiftElapsed)
    } else {
      const newStability = Math.max(0, state.patientStatus.stability - guidanceStabilityPenalty(state.patientStatus.stability))
      vitalsPulse = { delta: newStability - state.patientStatus.stability, seq: state.eventSeq + 1 }
      newPatientStatus = { ...state.patientStatus, stability: newStability, vitalSign: stabilityToVitalSign(newStability) }
      sinkEvent(sink, 'bad', `✗ ${step.prompt}：操作错误，患者情况恶化`, state.shiftElapsed)
    }
  }

  return {
    ...state,
    eventSeq: sink.seq,
    guidanceResults: newResults,
    patientStatus: newPatientStatus,
    vitalsPulse,
    patientEvents: sink.events,
    dialogueLog: [...state.dialogueLog, operatorLine, feedbackLine],
  }
}
