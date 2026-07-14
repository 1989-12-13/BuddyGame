import { describe, it, expect } from 'vitest'
import {
  C_SUCCESS, C_DANGER, C_DARK_DANGER, C_WARNING, C_AMBER, C_INFO, C_DEEP_BLUE,
  VITAL_SIGN_COLORS, HIT_QUALITY_COLORS, RHYTHM_QUALITY_COLORS,
} from './colors'

describe('语义色常量', () => {
  it('所有语义色是有效的十六进制颜色', () => {
    const colors = [C_SUCCESS, C_DANGER, C_DARK_DANGER, C_WARNING, C_AMBER, C_INFO, C_DEEP_BLUE]
    colors.forEach(c => {
      expect(c).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  it('亮色值不为空', () => {
    expect(C_SUCCESS).toBe('#16a34a')
    expect(C_DANGER).toBe('#ef4444')
    expect(C_DARK_DANGER).toBe('#dc2626')
  })
})

describe('颜色映射表', () => {
  it('VITAL_SIGN_COLORS 包含所有体征等级', () => {
    expect(VITAL_SIGN_COLORS).toHaveProperty('stable')
    expect(VITAL_SIGN_COLORS).toHaveProperty('warning')
    expect(VITAL_SIGN_COLORS).toHaveProperty('critical')
    expect(VITAL_SIGN_COLORS).toHaveProperty('arrest')
    expect(VITAL_SIGN_COLORS.stable).toBe(C_SUCCESS)
  })

  it('HIT_QUALITY_COLORS 包含所有命中等级', () => {
    expect(HIT_QUALITY_COLORS).toHaveProperty('perfect')
    expect(HIT_QUALITY_COLORS).toHaveProperty('good')
    expect(HIT_QUALITY_COLORS).toHaveProperty('miss')
    expect(HIT_QUALITY_COLORS.perfect).toBe(C_SUCCESS)
  })

  it('RHYTHM_QUALITY_COLORS 包含所有节奏等级', () => {
    expect(RHYTHM_QUALITY_COLORS).toHaveProperty('good')
    expect(RHYTHM_QUALITY_COLORS).toHaveProperty('ok')
    expect(RHYTHM_QUALITY_COLORS).toHaveProperty('bad')
    expect(RHYTHM_QUALITY_COLORS.bad).toBe(C_DANGER)
  })

  it('所有映射值都是有效的十六进制颜色', () => {
    const allMaps = [VITAL_SIGN_COLORS, HIT_QUALITY_COLORS, RHYTHM_QUALITY_COLORS]
    allMaps.forEach(map => {
      Object.values(map).forEach(v => {
        expect(v).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })
  })
})
