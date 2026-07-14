// ============================================================
// perks 天赋系统测试
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { hasPerk, getPerkChoices, ROGUE_PERKS } from './perks'
import { __setRng, __resetRng } from './random'
import type { RoguePerkId } from './perks'

beforeEach(() => __resetRng())

// ============================================================
// hasPerk
// ============================================================
describe('hasPerk', () => {
  it('已拥有 → true', () => {
    expect(hasPerk(['rapid_intake', 'calm_script'], 'calm_script')).toBe(true)
  })

  it('未拥有 → false', () => {
    expect(hasPerk(['rapid_intake'], 'calm_script')).toBe(false)
  })

  it('空 perks 数组 → false', () => {
    expect(hasPerk([], 'rapid_intake')).toBe(false)
  })

  it('所有 perk 都存在', () => {
    const allIds = Object.keys(ROGUE_PERKS) as RoguePerkId[]
    allIds.forEach(id => {
      expect(ROGUE_PERKS[id]).toBeDefined()
      expect(ROGUE_PERKS[id].id).toBe(id)
    })
  })
})

// ============================================================
// getPerkChoices
// ============================================================
describe('getPerkChoices', () => {
  it('默认返回 3 个选项', () => {
    const choices = getPerkChoices([])
    expect(choices).toHaveLength(3)
  })

  it('不返回已拥有的 perk', () => {
    const owned: RoguePerkId[] = ['rapid_intake', 'calm_script', 'priority_channel']
    const choices = getPerkChoices(owned)
    // 总共有 6 个 perk，已拥有 3 个，应该返回剩余 3 个
    expect(choices).toHaveLength(3)
    expect(choices).not.toContain('rapid_intake')
    expect(choices).not.toContain('calm_script')
    expect(choices).not.toContain('priority_channel')
  })

  it('可用选项不足 count 时返回尽可能多的', () => {
    const owned: RoguePerkId[] = ['rapid_intake', 'calm_script', 'priority_channel', 'field_first_aid', 'address_memory']
    const choices = getPerkChoices(owned, 3)
    expect(choices).toHaveLength(1) // 只剩 1 个
    expect(choices[0]).toBe('protocol_hint')
  })

  it('全部拥有时返回空数组', () => {
    const allIds = Object.keys(ROGUE_PERKS) as RoguePerkId[]
    const choices = getPerkChoices(allIds, 3)
    expect(choices).toHaveLength(0)
  })

  it('count=0 返回空数组', () => {
    const choices = getPerkChoices([], 0)
    expect(choices).toHaveLength(0)
  })

  it('count=2 返回 2 个', () => {
    const choices = getPerkChoices([], 2)
    expect(choices).toHaveLength(2)
  })

  it('随机注入后顺序可确定', () => {
    // 固定 rng 让 shuffle 产生固定顺序，验证结果一致
    __setRng(() => 0.5)
    const a = getPerkChoices([])
    const b = getPerkChoices([])
    expect(a).toEqual(b)
  })

  it('选项不重复', () => {
    const choices = getPerkChoices([], 6)
    const unique = new Set(choices)
    expect(unique.size).toBe(choices.length)
  })
})

// ============================================================
// ROGUE_PERKS 数据完整性
// ============================================================
describe('ROGUE_PERKS', () => {
  it('共 6 个 perk', () => {
    expect(Object.keys(ROGUE_PERKS)).toHaveLength(6)
  })

  it('每个 perk 有非空 title/description/effect', () => {
    Object.values(ROGUE_PERKS).forEach(p => {
      expect(p.title).toBeTruthy()
      expect(p.description).toBeTruthy()
      expect(p.effect).toBeTruthy()
    })
  })

  it('category 合法', () => {
    const validCategories = ['time', 'info', 'control', 'guidance']
    Object.values(ROGUE_PERKS).forEach(p => {
      expect(validCategories).toContain(p.category)
    })
  })
})
