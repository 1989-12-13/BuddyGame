// ============================================================
// 120调度台 — COMPLETE_MINIGAME reducer 处理器
// 互动小游戏完成：记录分数，玩家核对反馈后再推进。
// ============================================================

import type { WorldState, DialogueLine } from '../../types'
import { createEventSink, sinkEvent, isGuidanceActive } from './helpers'
import { MINIGAME_STABILITY_MULT } from '../constants'
import { stabilityToVitalSign } from '../worldState'

export function handleCompleteMinigame(
  state: WorldState,
  stepIndex: number,
  score: number,
  passed: boolean,
): WorldState {
  if (!isGuidanceActive(state)) return state
  const guidanceDef = state.currentCall!.guidance!
  const step = guidanceDef.steps[stepIndex]
  if (!step?.miniGame || stepIndex !== state.guidanceStepIndex || state.guidanceResults[stepIndex] != null || !Number.isFinite(score) || score < 0 || score > 1) return state
  passed = score >= step.miniGame.passThreshold

  const now = state.shiftElapsed
  const spec = step.miniGame
  const operatorLine: DialogueLine = {
    speaker: 'operator',
    text: `【实操指导：${spec.title}】${passed ? '操作到位' : '操作需改进'}（评分 ${(score * 100).toFixed(0)}分）`,
    timestamp: now,
  }
  const feedbackLine: DialogueLine = {
    speaker: 'caller',
    text: passed ? spec.feedback.good : spec.feedback.bad,
    timestamp: now,
  }

  const newScores = [...state.guidanceMinigameScores]
  newScores[stepIndex] = score

  const newResults = [...state.guidanceResults]
  newResults[stepIndex] = passed ? 'correct' : 'incorrect'

  const sink = createEventSink(state)
  let newPatientStatus = state.patientStatus
  if (state.patientStatus && !state.patientStatus.died) {
    const delta = Math.round((score - 0.5) * MINIGAME_STABILITY_MULT)
    const newStability = Math.max(0, Math.min(100, state.patientStatus.stability + delta))
    newPatientStatus = {
      ...state.patientStatus,
      stability: newStability,
      vitalSign: stabilityToVitalSign(newStability),
    }
    sinkEvent(
      sink,
      score >= 0.7 ? 'good' : score >= 0.4 ? 'warn' : 'bad',
      `${score >= 0.7 ? '✓' : score >= 0.4 ? '◐' : '✗'} ${spec.title}：评分 ${(score * 100).toFixed(0)}`,
      state.shiftElapsed,
    )
  }

  return {
    ...state,
    eventSeq: sink.seq,
    guidanceResults: newResults,
    guidanceMinigameScores: newScores,
    patientStatus: newPatientStatus,
    patientEvents: sink.events,
    dialogueLog: [...state.dialogueLog, operatorLine, feedbackLine],
  }
}
