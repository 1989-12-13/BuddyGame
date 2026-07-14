import { describe, it, expect } from 'vitest'
import {
  DUR_INSTANT, DUR_QUICK, DUR_NORMAL, DUR_EASE, DUR_EMPHASIS,
  EASE_OUT_FAST, EASE_OUT, EASE_SPRING,
  slideInRight, fadeInUp, scalePop, pageTransition, staggerList,
  KEYFRAMES_SLIDE_IN_RIGHT, KEYFRAMES_FADE_IN_UP,
} from './presets'

describe('动画时长常量', () => {
  it('时长值递增', () => {
    const values = [DUR_INSTANT, DUR_QUICK, DUR_NORMAL, DUR_EASE, DUR_EMPHASIS]
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1])
    }
  })

  it('时长值在合理范围内', () => {
    expect(DUR_INSTANT).toBeLessThanOrEqual(0.1)
    expect(DUR_EMPHASIS).toBeGreaterThanOrEqual(0.4)
  })
})

describe('动画变体结构', () => {
  it('slideInRight 包含 hidden/visible/exit', () => {
    expect(slideInRight).toHaveProperty('hidden')
    expect(slideInRight).toHaveProperty('visible')
    expect(slideInRight).toHaveProperty('exit')
    expect(slideInRight.hidden).toHaveProperty('opacity')
    expect(slideInRight.visible).toHaveProperty('x')
  })

  it('fadeInUp 包含 hidden/visible/exit', () => {
    expect(fadeInUp).toHaveProperty('hidden')
    expect(fadeInUp).toHaveProperty('visible')
    expect(fadeInUp.hidden).toHaveProperty('y')
  })

  it('scalePop 包含 spring transition', () => {
    expect(scalePop.visible).toHaveProperty('transition')
    const transition = (scalePop.visible as Record<string, unknown>)['transition'] as Record<string, unknown>
    expect(transition.type).toBe('spring')
  })

  it('pageTransition 包含 hidden/visible/exit', () => {
    expect(pageTransition).toHaveProperty('hidden')
    expect(pageTransition).toHaveProperty('visible')
    expect(pageTransition).toHaveProperty('exit')
  })

  it('staggerList 含 container 和 item', () => {
    expect(staggerList).toHaveProperty('container')
    expect(staggerList).toHaveProperty('item')
    expect(staggerList.container.visible.transition).toHaveProperty('staggerChildren')
  })
})

describe('关键帧字符串', () => {
  it('KEYFRAMES_SLIDE_IN_RIGHT 包含 keyframes 定义', () => {
    expect(KEYFRAMES_SLIDE_IN_RIGHT).toContain('@keyframes')
    expect(KEYFRAMES_SLIDE_IN_RIGHT).toContain('slide-in-right')
  })

  it('KEYFRAMES_FADE_IN_UP 包含 keyframes 定义', () => {
    expect(KEYFRAMES_FADE_IN_UP).toContain('@keyframes')
    expect(KEYFRAMES_FADE_IN_UP).toContain('fade-in-up')
  })
})

describe('缓动曲线', () => {
  it('EASE_OUT_FAST 是长度 4 的 cubic-bezier 数组', () => {
    expect(EASE_OUT_FAST).toHaveLength(4)
    EASE_OUT_FAST.forEach(v => expect(typeof v).toBe('number'))
  })

  it('EASE_OUT 是长度 4 的 cubic-bezier 数组', () => {
    expect(EASE_OUT).toHaveLength(4)
  })

  it('EASE_SPRING 包含 type/stiffness/damping', () => {
    expect(EASE_SPRING.type).toBe('spring')
    expect(EASE_SPRING.stiffness).toBe(300)
    expect(EASE_SPRING.damping).toBe(25)
  })
})
