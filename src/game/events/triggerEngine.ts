// ============================================================
// 120调度台 — 场景触发器（简化版）
// ============================================================

import type { WorldState } from '../types'

/** 是否可以接听下一通电话 */
export function canAnswerNextCall(state: WorldState): boolean {
  return (
    state.screen === 'playing' &&
    state.callPhase === 'completed' &&
    state.callIndex < state.totalCalls
  )
}

/** 是否可以派车 */
export function canDispatch(state: WorldState): boolean {
  return (
    state.screen === 'playing' &&
    state.currentCall !== null &&
    !state.dispatchSent &&
    (state.callPhase === 'questioning' || state.callPhase === 'connected')
  )
}
