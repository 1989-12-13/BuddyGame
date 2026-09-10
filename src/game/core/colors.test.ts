import { describe, it, expect } from 'vitest'
import {
  C_SUCCESS, C_DANGER, C_DARK_DANGER, C_WARNING, C_AMBER, C_INFO, C_DEEP_BLUE,
  VITAL_SIGN_COLORS, HIT_QUALITY_COLORS, RHYTHM_QUALITY_COLORS,
} from './colors'

describe('语义色常量', () => {
  it('所有语义色都是有效的设计令牌引用', () => {
    const colors = [C_SUCCESS, C_DANGER, C_DARK_DANGER, C_WARNING, C_AMBER, C_INFO, C_DEEP_BLUE]
    colors.forEach(c => {
      expect(c).toMatch(/^var\(--[a-z0-9-]+\)$/)
    })
  })

  it('映射到预期的语义令牌', () => {
    expect(C_SUCCESS).toBe('var(--success)')
    expect(C_DANGER).toBe('var(--danger)')
    expect(C_DARK_DANGER).toBe('var(--danger-strong)')
  })
})

describe('颜色映射表', () => {
  it('VITAL_SIGN_COLORS 包含所有体征等级', () => {
    expect(VITAL_SIGN_COLORS).toHaveProperty('stable')
    expect(VITAL_SIGN_COLORS).toHaveProperty('warning')
    expect(VITAL_SIGN_COLORS).toHaveProperty('critical')
    expect(VITAL_SIGN_COLORS).toHaveProperty('arrest')
    expect(VITAL_SIGN_COLORS.stable).toBe('var(--sev-1)')
  })

  it('HIT_QUALITY_COLORS 包含所有命中等级', () => {
    expect(HIT_QUALITY_COLORS).toHaveProperty('perfect')
    expect(HIT_QUALITY_COLORS).toHaveProperty('good')
    expect(HIT_QUALITY_COLORS).toHaveProperty('miss')
    expect(HIT_QUALITY_COLORS.perfect).toBe('var(--sev-1)')
  })

  it('RHYTHM_QUALITY_COLORS 包含所有节奏等级', () => {
    expect(RHYTHM_QUALITY_COLORS).toHaveProperty('good')
    expect(RHYTHM_QUALITY_COLORS).toHaveProperty('ok')
    expect(RHYTHM_QUALITY_COLORS).toHaveProperty('bad')
    expect(RHYTHM_QUALITY_COLORS.bad).toBe('var(--sev-5)')
  })

  it('所有映射值都是有效的设计令牌引用', () => {
    const allMaps = [VITAL_SIGN_COLORS, HIT_QUALITY_COLORS, RHYTHM_QUALITY_COLORS]
    allMaps.forEach(map => {
      Object.values(map).forEach(v => {
        expect(v).toMatch(/^var\(--[a-z0-9-]+\)$/)
      })
    })
  })
})
