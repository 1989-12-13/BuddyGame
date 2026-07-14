// ============================================================
// validators 状态验证测试
// ============================================================

import { describe, it, expect } from 'vitest'
import { validateState, isStateConsistent } from './validators'
import { createInitialState } from './worldState'
import type { WorldState } from '../types'

// ============================================================
// validateState
// ============================================================
describe('validateState', () => {
  it('合法初始状态 → null（无错误）', () => {
    const state = createInitialState()
    expect(validateState(state)).toBeNull()
  })

  it('totalCalls = 0 → 报错', () => {
    const state = { ...createInitialState(), totalCalls: 0 }
    expect(validateState(state)).toBe('totalCalls must be > 0')
  })

  it('totalCalls < 0 → 报错', () => {
    const state = { ...createInitialState(), totalCalls: -5 }
    expect(validateState(state)).toBe('totalCalls must be > 0')
  })

  it('callIndex < 0 → 报错', () => {
    const state = { ...createInitialState(), callIndex: -1 }
    expect(validateState(state)).toBe('callIndex must be >= 0')
  })

  it('shiftElapsed < 0 → 报错', () => {
    const state = { ...createInitialState(), shiftElapsed: -1 }
    expect(validateState(state)).toBe('shiftElapsed must be >= 0')
  })

  it('totalScore < 0 → 报错', () => {
    const state = { ...createInitialState(), totalScore: -1 }
    expect(validateState(state)).toBe('totalScore must be >= 0')
  })

  it('totalScore = 0 合法', () => {
    const state = { ...createInitialState(), totalScore: 0 }
    expect(validateState(state)).toBeNull()
  })

  it('只有一个字段异常时返回第一个（totalCalls 优先）', () => {
    const state = { ...createInitialState(), totalCalls: 0, callIndex: -1 }
    expect(validateState(state)).toBe('totalCalls must be > 0')
  })
})

// ============================================================
// isStateConsistent
// ============================================================
describe('isStateConsistent', () => {
  it('合法状态 → true', () => {
    expect(isStateConsistent(createInitialState())).toBe(true)
  })

  it('非法状态 → false', () => {
    const state = { ...createInitialState(), totalCalls: 0 }
    expect(isStateConsistent(state)).toBe(false)
  })
})
