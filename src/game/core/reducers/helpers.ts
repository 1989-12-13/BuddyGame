// ============================================================
// 120调度台 — Reducer 共享帮助函数
// ============================================================

import type { PatientEvent, JudgmentPrompt, WorldState } from '../../types'
import { TONE_INITIAL_STRESS } from '../constants'

// -------------------- 即时反馈事件工厂 --------------------
/** 用 state 派生的确定性序列号生成事件 ID，替换 Date.now() + 全局可变计数器 */
export function ev(seq: number, kind: PatientEvent['kind'], text: string, at: number): PatientEvent {
  return { id: `ev_${seq}`, kind, text, createdAt: at }
}

// -------------------- 确定性事件汇集器 --------------------
/** 事件汇集器：事件 ID 由 WorldState.eventSeq 单调递增派生，调用方拿不到 seq 就无法出错 */
export interface EventSink {
  events: PatientEvent[]
  seq: number
}

export function createEventSink(state: WorldState): EventSink {
  return { events: [...state.patientEvents], seq: state.eventSeq }
}

/** 向汇集器追加一个事件（ID 自动递增），不重复 */
export function sinkEvent(sink: EventSink, kind: PatientEvent['kind'], text: string, at: number): void {
  sink.events.push(ev(sink.seq++, kind, text, at))
}

/** 对玩家错误判断的"实际正确项"友好化（用于 toast） */
export function judgmentCorrectAnswer(j: JudgmentPrompt): string {
  const correct = j.options.find(o => o.isCorrect)
  return correct?.label ?? '—'
}

/** 由来电者tone映射初始压力值 */
export function toneToInitialStress(tone: string): number {
  return TONE_INITIAL_STRESS[tone] ?? 40
}

// -------------------- Guidance 步骤推进公用逻辑 --------------------
/** 检查 guidance 阶段是否活跃（三条件：有 guidance、guidanceActive、phase === guidance） */
export function isGuidanceActive(state: WorldState): boolean {
  return !!(state.currentCall?.guidance && state.guidanceActive && state.callPhase === 'guidance')
}

/** 返回推进下一步后的 { guidanceStepIndex, callPhase } */
export function advanceGuidanceStep(state: WorldState, nextIndex: number) {
  const guidanceDef = state.currentCall!.guidance!
  const isLastStep = nextIndex >= guidanceDef.steps.length
  return {
    guidanceStepIndex: nextIndex,
    callPhase: isLastStep ? ('closing' as const) : ('guidance' as const),
  }
}
