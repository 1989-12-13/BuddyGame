// ============================================================
// 零点接线台 — Reducer 共享帮助函数
// ============================================================

import type { PatientEvent, JudgmentPrompt } from '../../types'
import { rng } from '../random'

// -------------------- 即时反馈事件工厂 --------------------
let _eventSeq = 0
export function ev(kind: PatientEvent['kind'], text: string, at: number): PatientEvent {
  _eventSeq += 1
  return { id: `ev_${Date.now()}_${_eventSeq}`, kind, text, createdAt: at }
}

/** 推入一个事件（不重复） */
export function pushEvent(events: PatientEvent[], e: PatientEvent): PatientEvent[] {
  return [...events, e]
}

/** 对玩家错误判断的"实际正确项"友好化（用于 toast） */
export function judgmentCorrectAnswer(j: JudgmentPrompt): string {
  const correct = j.options.find(o => o.isCorrect)
  return correct?.label ?? '—'
}

/** 由来电者tone映射初始压力值 */
export function toneToInitialStress(tone: string): number {
  const map: Record<string, number> = {
    镇定: 25,
    紧张: 50,
    恐慌: 65,
    失控: 85,
  }
  return map[tone] ?? 40
}
