// ============================================================
// 零点接线台 — 状态验证
// ============================================================

import type { WorldState } from '../types'

export function validateState(state: WorldState): string | null {
  if (!state) return 'State is null or undefined'
  if (state.totalCalls <= 0) return 'totalCalls must be > 0'
  if (state.callIndex < 0) return 'callIndex must be >= 0'
  if (state.shiftElapsed < 0) return 'shiftElapsed must be >= 0'
  if (state.totalScore < 0) return 'totalScore must be >= 0'
  return null
}

export function isStateConsistent(state: WorldState): boolean {
  return validateState(state) === null
}
