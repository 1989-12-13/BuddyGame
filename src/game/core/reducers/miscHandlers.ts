// ============================================================
// 零点接线台 — 轻量 reducer 处理器的收拢文件
// 将过于短小的 case 集中在此，避免 worldReducer.ts 膨胀
// ============================================================

import type { WorldState, TriageLevel, MpdsDeterminant } from '../../types'
import { createInitialState, buildScenarioQueue } from '../worldState'
import { determinantToHotCold, determinantToTriage } from '../../types'
import type { RoguePerkId } from '../perks'
import type { TerminalField } from '../actions'
import type { FragmentTargetField } from '../../types'

// -------------------- 班次 --------------------

export function handleStartShift(state: WorldState, forceScenarios?: string[]): WorldState {
  const newShift = state.shiftNumber + 1
  const useQueue = forceScenarios ?? buildScenarioQueue()

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
  return {
    ...state,
    terminal: {
      ...state.terminal,
      determinant,
      hotCold: determinantToHotCold(determinant),
      triage: determinantToTriage(determinant),
    },
  }
}

export function handleSetDeterminantSubcode(state: WorldState, subcode: number): WorldState {
  return {
    ...state,
    terminal: { ...state.terminal, determinantSubcode: subcode },
  }
}

export function handleSetProtocol(state: WorldState, protocolNumber: number): WorldState {
  return {
    ...state,
    terminal: { ...state.terminal, protocolNumber },
  }
}

export function handleSetTriage(state: WorldState, level: TriageLevel): WorldState {
  return {
    ...state,
    terminal: { ...state.terminal, triage: level },
  }
}

// -------------------- 车辆选择 --------------------

export function handleSelectVehicle(state: WorldState, vehicleId: string): WorldState {
  const v = state.fleet.vehicles.find(x => x.id === vehicleId && x.status === 'available')
  if (!v) return state
  return {
    ...state,
    fleet: { ...state.fleet, selectedVehicleId: v.id },
  }
}

// -------------------- 事件/结果 --------------------

export function handleDismissPatientEvent(state: WorldState, eventId: string): WorldState {
  return {
    ...state,
    patientEvents: state.patientEvents.filter(e => e.id !== eventId),
  }
}

export function handleDismissDebrief(state: WorldState): WorldState {
  return {
    ...state,
    lastDebrief: null,
    screen: state.shiftCompletePending && state.pendingPerkChoices.length === 0
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

export function handleBackToTitle(_state: WorldState): WorldState {
  return createInitialState()
}
