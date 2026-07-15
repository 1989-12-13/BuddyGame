// ============================================================
// 120调度台 — MAKE_JUDGMENT reducer 处理器
// 玩家从临床判断选择题中选择答案
// 判断结果仅影响终端信息填充和指导事件，不改变患者体征
// ============================================================

import type { WorldState } from '../../types'
import { createEventSink, sinkEvent, judgmentCorrectAnswer } from './helpers'

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
  const isCorrect = !!selectedOption?.isCorrect
  if (isCorrect) {
    sinkEvent(sink, 'good', `✓ 判断准确：${judgment.question.slice(0, 18)}…`, state.shiftElapsed)
  } else {
    const correctLabel = judgmentCorrectAnswer(judgment)
    sinkEvent(sink, 'bad', `✗ 误判 · 实际应为：${correctLabel}`, state.shiftElapsed)
  }

  return {
    ...state,
    eventSeq: sink.seq,
    pendingJudgments: newJudgments,
    terminal: newTerminal,
    patientEvents: sink.events,
  }
}
