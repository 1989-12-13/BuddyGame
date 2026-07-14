// ============================================================
// dispatchTiming 派车计时模块测试
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  getDispatchTimingState,
  crossedDispatchWarning,
  formatPlayerDeterminantCode,
} from './dispatchTiming'

// ============================================================
// getDispatchTimingState
// ============================================================
describe('getDispatchTimingState', () => {
  it('<45 秒 → normal', () => {
    expect(getDispatchTimingState(0)).toBe('normal')
    expect(getDispatchTimingState(30)).toBe('normal')
    expect(getDispatchTimingState(44)).toBe('normal')
  })

  it('45-60 秒 → warning', () => {
    expect(getDispatchTimingState(45)).toBe('warning')
    expect(getDispatchTimingState(55)).toBe('warning')
    expect(getDispatchTimingState(60)).toBe('warning')
  })

  it('>60 秒 → overtime', () => {
    expect(getDispatchTimingState(61)).toBe('overtime')
    expect(getDispatchTimingState(90)).toBe('overtime')
    expect(getDispatchTimingState(999)).toBe('overtime')
  })
})

// ============================================================
// crossedDispatchWarning
// ============================================================
describe('crossedDispatchWarning', () => {
  it('从 normal 进入 warning（44→45）→ true', () => {
    expect(crossedDispatchWarning(44, 45)).toBe(true)
  })

  it('从 warning 进入 overtime（60→61）→ true', () => {
    expect(crossedDispatchWarning(60, 61)).toBe(true)
  })

  it('一直停留在 normal → false', () => {
    expect(crossedDispatchWarning(10, 20)).toBe(false)
    expect(crossedDispatchWarning(30, 44)).toBe(false)
  })

  it('一直停留在 warning → false', () => {
    expect(crossedDispatchWarning(50, 55)).toBe(false)
  })

  it('一直停留在 overtime → false', () => {
    expect(crossedDispatchWarning(70, 80)).toBe(false)
  })

  it('从 normal 直接跳到 overtime（30→65）→ true', () => {
    expect(crossedDispatchWarning(30, 65)).toBe(true)
  })

  it('刚好碰到 45 边界（从 45 到 45）→ false', () => {
    expect(crossedDispatchWarning(45, 45)).toBe(false)
  })

  it('刚好碰到 60 边界（从 60 到 60）→ false', () => {
    expect(crossedDispatchWarning(60, 60)).toBe(false)
  })

  it('正常递减（时间不应递减，但防御性测试）', () => {
    expect(crossedDispatchWarning(45, 30)).toBe(false)
  })
})

// ============================================================
// formatPlayerDeterminantCode
// ============================================================
describe('formatPlayerDeterminantCode', () => {
  it('有 determinant 时格式为 "协议号-字母-?"', () => {
    expect(formatPlayerDeterminantCode(6, 'ALPHA')).toBe('6-A-?')
    expect(formatPlayerDeterminantCode(21, 'DELTA')).toBe('21-D-?')
  })

  it('无 determinant 时格式为 "协议号-?-?"', () => {
    expect(formatPlayerDeterminantCode(6, null)).toBe('6-?-?')
  })

  it('determinant 取首字母', () => {
    expect(formatPlayerDeterminantCode(1, 'ECHO')).toBe('1-E-?')
    expect(formatPlayerDeterminantCode(33, 'ECHO')).toBe('33-E-?')
  })
})
