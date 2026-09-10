import type { WorldState } from '../types'

export type PauseReason = 'manual' | 'background' | 'settings' | 'help' | 'confirm'

export function isWorldPaused(state: WorldState): boolean {
  return state.pauseReasons.length > 0 || !!state.lastDebrief || state.pendingPerkChoices.length > 0
}

export function isActionBusy(state: WorldState): boolean {
  return state.actionEndsAt > state.shiftElapsed
}

/** Shared by the task card, route planner and reducer. No hidden UI-only rules. */
export function dispatchEligibility(state: WorldState): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = []
  if (!state.currentCall || state.screen !== 'playing') reasons.push('请先接听来电')
  if (state.dispatchSent) reasons.push('救护车已经派出')
  if (state.patientStatus?.died) reasons.push('患者状态已经结算')
  if (state.rescue.outcome) reasons.push('本次救援已经结算')
  if (state.currentCall && !['questioning', 'connected'].includes(state.callPhase)) reasons.push('当前阶段不能派车')
  if (isWorldPaused(state)) reasons.push('请先继续值班')
  if (isActionBusy(state)) reasons.push('当前问询正在进行')
  if (!state.terminal.address.trim()) reasons.push('确认事发地址')
  if (state.terminal.conscious === null) reasons.push('判断意识状态')
  if (state.terminal.breathing === null) reasons.push('判断呼吸状态')
  if (!state.terminal.determinant || !state.terminal.triage) reasons.push('选择响应优先级')
  if (state.fleet.vehicles[0]?.status !== 'available') reasons.push('救护车正在周转，请保持通话')
  return { allowed: reasons.length === 0, reasons }
}
