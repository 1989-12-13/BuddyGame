import { describe, it, expect } from 'vitest'
import { computePassed } from './scoring'

describe('computePassed', () => {
  it('达标：分数等于阈值算通过', () => {
    expect(computePassed(0.6, 0.6)).toBe(true)
  })

  it('达标：分数高于阈值算通过', () => {
    expect(computePassed(0.9, 0.6)).toBe(true)
  })

  it('不达标：分数低于阈值算失败', () => {
    expect(computePassed(0.59, 0.6)).toBe(false)
  })

  it('边界：满分与零分', () => {
    expect(computePassed(1, 0.6)).toBe(true)
    expect(computePassed(0, 0.6)).toBe(false)
  })
})
