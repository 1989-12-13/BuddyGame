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
// getDispatchTimingState 阈值: <50 normal, 50-80 warning, >80 overtime
// ============================================================
describe('getDispatchTimingState', () => {
  it('<50 秒 → normal', () => {
    expect(getDispatchTimingState(0)).toBe('normal')
    expect(getDispatchTimingState(30)).toBe('normal')
    expect(getDispatchTimingState(49)).toBe('normal')
  })

  it('50-80 秒 → warning', () => {
    expect(getDispatchTimingState(50)).toBe('warning')
    expect(getDispatchTimingState(65)).toBe('warning')
    expect(getDispatchTimingState(80)).toBe('warning')
  })

  it('>80 秒 → overtime', () => {
    expect(getDispatchTimingState(81)).toBe('overtime')
    expect(getDispatchTimingState(110)).toBe('overtime')
    expect(getDispatchTimingState(999)).toBe('overtime')
  })
})

// ============================================================
// crossedDispatchWarning (WARN=50, CRITICAL=80)
// ============================================================
describe('crossedDispatchWarning', () => {
  it('从 normal 进入 warning（49→50）→ true', () => {
    expect(crossedDispatchWarning(49, 50)).toBe(true)
  })

  it('从 warning 进入 overtime（80→81）→ true', () => {
    expect(crossedDispatchWarning(80, 81)).toBe(true)
  })

  it('一直停留在 normal → false', () => {
    expect(crossedDispatchWarning(10, 20)).toBe(false)
    expect(crossedDispatchWarning(30, 49)).toBe(false)
  })

  it('一直停留在 warning → false', () => {
    expect(crossedDispatchWarning(55, 65)).toBe(false)
  })

  it('一直停留在 overtime → false', () => {
    expect(crossedDispatchWarning(85, 90)).toBe(false)
  })

  it('从 normal 直接跳到 overtime（30→85）→ true', () => {
    expect(crossedDispatchWarning(30, 85)).toBe(true)
  })

  it('刚好碰到 50 边界（49→49）→ false', () => {
    expect(crossedDispatchWarning(49, 49)).toBe(false)
  })

  it('刚好碰到 80 边界（50→80）→ false', () => {
    expect(crossedDispatchWarning(50, 80)).toBe(false)
  })

  it('刚好从 80 到 81 → true', () => {
    expect(crossedDispatchWarning(80, 81)).toBe(true)
  })

  it('正常递减（时间不应递减，但防御性测试）', () => {
    expect(crossedDispatchWarning(55, 40)).toBe(false)
  })
})

// ============================================================
// formatPlayerDeterminantCode（无变化）
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
