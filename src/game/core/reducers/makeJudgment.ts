// ============================================================
// 120调度台 — MAKE_JUDGMENT reducer 处理器
// 玩家从临床判断选择题中选择答案
// ============================================================

import type { WorldState } from '../../types'
import { createEventSink, sinkEvent, judgmentCorrectAnswer } from './helpers'
import { JUDGMENT_CORRECT_BONUS, JUDGMENT_INCORRECT_PENALTY } from '../constants'
import { stabilityToVitalSign } from '../worldState'

export function handleMakeJudgment(
  state: WorldState,
  judgmentId: string,
  chosenOptionIndex: number,
): WorldState {
  const idx = state.pendingJudgments.findIndex(j => j.id === judgmentId)
  if (idx < 0) return state

  const judgment = state.pendingJudgments[idx]
  const updatedJudgment = { ...judgment, chosenOptionIndex }
  const newJudgments = [...state.pendingJudgments]
  newJudgments[idx] = updatedJudgment

  const selectedOption = updatedJudgment.options[chosenOptionIndex]
  let newTerminal = { ...state.terminal }
  if (selectedOption) {
    for (const fill of selectedOption.fills) {
      if (fill.field === 'conscious') {
        newTerminal = { ...newTerminal, conscious: fill.value as boolean }
      } else if (fill.field === 'breathing') {
        newTerminal = { ...newTerminal, breathing: fill.value as boolean }
      } else if (fill.field === 'protocolNumber') {
        newTerminal = { ...newTerminal, protocolNumber: parseInt(fill.value as string, 10) || null }
      } else {
        newTerminal = { ...newTerminal, [fill.field]: fill.value }
      }
    }
  }

  const sink = createEventSink(state)
  let newPatientStatus = state.patientStatus
  if (state.patientStatus && !state.patientStatus.died) {
    const isCorrect = !!selectedOption?.isCorrect
    if (isCorrect) {
      const newStability = Math.min(100, state.patientStatus.stability + JUDGMENT_CORRECT_BONUS)
      newPatientStatus = { ...state.patientStatus, stability: newStability, vitalSign: stabilityToVitalSign(newStability) }
      sinkEvent(sink, 'good', `✓ 判断准确：${judgment.question.slice(0, 18)}…`, state.shiftElapsed)
    } else {
      const newStability = Math.max(0, state.patientStatus.stability - JUDGMENT_INCORRECT_PENALTY)
      newPatientStatus = { ...state.patientStatus, stability: newStability, vitalSign: stabilityToVitalSign(newStability) }
      const correctLabel = judgmentCorrectAnswer(judgment)
      sinkEvent(sink, 'bad', `✗ 误判 · 实际应为：${correctLabel}`, state.shiftElapsed)
    }
  }

  return {
    ...state,
    eventSeq: sink.seq,
    pendingJudgments: newJudgments,
    terminal: newTerminal,
    patientStatus: newPatientStatus,
    patientEvents: sink.events,
  }
}
