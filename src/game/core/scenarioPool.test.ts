// ============================================================
// 120调度台 — 场景池扩容的结构性校验
// 覆盖：抽取节奏（冷→热）、基站可定位、变体卡与母卡的一致性
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { paceQueue, buildScenarioQueue } from './worldState'
import { __setRng, __resetRng } from './random'
import { SCENARIOS, SCENARIO_IDS } from '../events/templates'
import { ALL_CARDS } from '../events/cards'
import { lookupCoords } from '../locations'
import { getCaller } from '../npc/personas'
import type { TriageLevel } from '../types'

beforeEach(() => __resetRng())

const RANK: Record<TriageLevel, number> = { green: 0, yellow: 1, red: 2, black: 3 }

describe('paceQueue — 冷→热爬升', () => {
  it('输出与输入是同一个集合，不新增也不丢卡', () => {
    const input = SCENARIO_IDS.filter(id => id !== 'prank_call').slice(0, 12)
    const output = paceQueue(input)
    expect(output).toHaveLength(input.length)
    expect(new Set(output)).toEqual(new Set(input))
  })

  it('相邻两通的严重度不倒退', () => {
    for (let trial = 0; trial < 20; trial++) {
      __setRng(() => 0.42 + trial * 0.001)
      const output = paceQueue(SCENARIO_IDS.filter(id => id !== 'prank_call'))
      const ranks = output.map(id => RANK[SCENARIOS[id].correctTriage])
      for (let i = 1; i < ranks.length; i++) {
        expect(ranks[i], `${output[i - 1]} → ${output[i]} 严重度倒退`).toBeGreaterThanOrEqual(ranks[i - 1])
      }
    }
  })

  it('同档位之间不是固定顺序（会打散）', () => {
    const greens = SCENARIO_IDS.filter(id => id !== 'prank_call' && SCENARIOS[id].correctTriage === 'green')
    expect(greens.length).toBeGreaterThan(2)
    const orders = new Set<string>()
    for (let trial = 0; trial < 12; trial++) {
      // tiebreak 必须每次调用都不同，否则稳定排序会把输入顺序原样还回来
      let n = trial
      __setRng(() => {
        n = (n * 1103515245 + 12345) % 2147483648
        return (n / 2147483648)
      })
      orders.add(paceQueue(greens).join(','))
    }
    expect(orders.size).toBeGreaterThan(1)
  })

  it('空队列与单元素队列原样返回', () => {
    expect(paceQueue([])).toEqual([])
    expect(paceQueue(['chest_pain'])).toEqual(['chest_pain'])
  })
})

describe('buildScenarioQueue 接入节奏后仍满足既有约束', () => {
  it('长度、唯一性与恶作剧位置约束都保持', () => {
    __setRng(() => 0.1)
    const queue = buildScenarioQueue(5)
    expect(queue).toHaveLength(5)
    expect(new Set(queue).size).toBe(5)
    expect(queue[0]).not.toBe('prank_call')
    expect(queue[queue.length - 1]).not.toBe('prank_call')
  })
})

describe('baseStation 必须能被地图定位', () => {
  it('每张卡（含变体）的 baseStation 都能查到坐标', () => {
    const missing = ALL_CARDS
      .filter(card => !card.isPrank)
      .filter(card => lookupCoords(card.baseStation) === null)
      .map(card => `${card.id}: ${card.baseStation}`)
    expect(missing, `以下基站无法定位:\n${missing.join('\n')}`).toEqual([])
  })
})

describe('变体卡与母卡的一致性', () => {
  const variants = ALL_CARDS.filter(c => c.variantOf)

  it('当前卡片池里存在变体（扩容机制的落点）', () => {
    expect(variants.length).toBeGreaterThan(0)
  })

  it('变体 id 以「母卡id__」开头，且母卡存在', () => {
    for (const v of variants) {
      expect(v.id.startsWith(`${v.variantOf}__`), `${v.id} 的前缀不匹配 ${v.variantOf}`).toBe(true)
      expect(SCENARIOS[v.variantOf!], `变体 ${v.id} 的母卡 ${v.variantOf} 不存在`).toBeDefined()
    }
  })

  it('变体与母卡共用协议号 / 标题 / 判定码 / 分诊 / 冷热', () => {
    for (const v of variants) {
      const base = SCENARIOS[v.variantOf!]
      expect(v.mpdsCard).toEqual(base.mpdsCard)
      expect(v.correctTriage).toBe(base.correctTriage)
      expect(v.title).toBe(base.title)
    }
  })

  it('变体真的换掉了来电者、开场白与结局之外的情境', () => {
    for (const v of variants) {
      const base = SCENARIOS[v.variantOf!]
      expect(v.openingLine, `${v.id} 开场白与母卡相同`).not.toBe(base.openingLine)
    }
  })

  it('变体的来电者池每一位都能被解析', () => {
    for (const v of variants) {
      expect(v.callerPool?.length, `${v.id} 缺少 callerPool`).toBeGreaterThan(0)
      for (const id of v.callerPool!) {
        expect(() => getCaller(id), `${v.id} 的来电者 ${id} 未在 personas 中注册`).not.toThrow()
      }
      expect(v.callerPool).toContain(v.callerId)
    }
  })
})
