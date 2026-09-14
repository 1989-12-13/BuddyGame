// ============================================================
// 120调度台 — 轻量 reducer 处理器的收拢文件
// 将过于短小的 case 集中在此，避免 worldReducer.ts 膨胀
// ============================================================

import type { WorldState, TriageLevel, MpdsDeterminant } from '../../types'
import { createInitialState } from '../worldState'
import { fillDeterminantFromProtocol } from '../autoClassify'
import type { RoguePerkId } from '../perks'
import type { TerminalField } from '../actions'
import type { FragmentTargetField } from '../../types'

// -------------------- 班次 --------------------

export function handleStartShift(state: WorldState, forceScenarios?: string[]): WorldState {
  const newShift = state.shiftNumber + 1
  const useQueue = forceScenarios ?? []

  return {
    ...createInitialState(),
    screen: 'playing',
    shiftNumber: newShift,
    totalCalls: useQueue.length,
    scenarioQueue: useQueue,
  }
}

// -------------------- 终端字段 --------------------

export function handleUpdateTerminal(state: WorldState, field: TerminalField | FragmentTargetField, value: string): WorldState {
  return {
    ...state,
    terminal: { ...state.terminal, [field]: value },
  }
}

export function handleSetPatientStatus(state: WorldState, field: 'conscious' | 'breathing', value: boolean): WorldState {
  return {
    ...state,
    terminal: { ...state.terminal, [field]: value },
  }
}

export function handleSetMpdsDeterminant(state: WorldState, determinant: MpdsDeterminant): WorldState {
  // 冷热响应与分诊无条件取「病例卡权威值」，不再走通用字母映射：
  // 通用映射与病例卡存在约 1/3 的冲突（如心脏问题 19-C-1 权威为 red/HOT，通用 C→yellow/COLD），
  // 两套口径会让手动填写与自动填写打架。玩家手选字母只决定判定码本身与评分，
  // 不改变患者真实的冷热/分诊。
  const call = state.currentCall
  return {
    ...state,
    terminal: {
      ...state.terminal,
      determinant,
      ...(call ? { hotCold: call.mpdsCard.hotCold, triage: call.correctTriage } : {}),
    },
  }
}

export function handleSetDeterminantSubcode(state: WorldState, subcode: number): WorldState {
  return {
    ...state,
    terminal: { ...state.terminal, determinantSubcode: subcode },
  }
}

export function handleSetProtocol(state: WorldState, protocolNumber: number | null): WorldState {
  // 协议一定，判定码（判定等级 / 细分编码 / 冷热 / 分诊）自动补齐
  return {
    ...state,
    terminal: fillDeterminantFromProtocol({ ...state.terminal, protocolNumber }, state),
  }
}

export function handleSetTriage(state: WorldState, level: TriageLevel): WorldState {
  return {
    ...state,
    terminal: { ...state.terminal, triage: level },
  }
}

// -------------------- 事件/结果 --------------------

export function handleDismissPatientEvent(state: WorldState, eventId: string): WorldState {
  return {
    ...state,
    patientEvents: state.patientEvents.filter(e => e.id !== eventId),
  }
}

export function handleDismissRescueNotification(state: WorldState, notificationId: string): WorldState {
  const notifications = state.rescueNotifications.filter(notification => notification.id !== notificationId)
  return {
    ...state,
    rescueNotifications: notifications,
    screen: state.shiftCompletePending
      && notifications.length === 0
      && state.backgroundRescues.every(rescue => rescue.outcome)
      ? 'ending'
      : state.screen,
  }
}

/**
 * 字幕流式进度：记下「已经完整播到第几行」。
 * 并发值班切线路会给工作台换 key（整块重挂载），进度只有存在通话自己的状态里
 * 才能跨挂载续上——切回来时历史对话直接完整呈现，只补播离开期间的新行。
 */
export function handleMarkLinesStreamed(state: WorldState, throughIndex: number): WorldState {
  if (!Number.isInteger(throughIndex) || throughIndex < 0) return state
  const streamedLines = Math.max(state.streamedLines, throughIndex + 1)
  return streamedLines === state.streamedLines ? state : { ...state, streamedLines }
}

export function handleDismissDebrief(state: WorldState): WorldState {
  return {
    ...state,
    lastDebrief: null,
    screen: state.shiftCompletePending
      && state.pendingPerkChoices.length === 0
      && state.backgroundRescues.every(rescue => rescue.outcome)
      ? 'ending'
      : state.screen,
  }
}

export function handleChoosePerk(state: WorldState, perkId: RoguePerkId): WorldState {
  if (!state.pendingPerkChoices.includes(perkId)) return state
  if (state.perks.includes(perkId)) {
    return { ...state, pendingPerkChoices: [] }
  }

  return {
    ...state,
    perks: [...state.perks, perkId],
    pendingPerkChoices: [],
    screen: state.shiftCompletePending ? 'ending' : state.screen,
  }
}

// -------------------- 导航 --------------------

export function handleShowEnding(state: WorldState): WorldState {
  return { ...state, screen: 'ending' }
}

export function handleBackToTitle(): WorldState {
  return createInitialState()
}
