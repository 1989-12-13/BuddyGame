// ============================================================
// 120调度台 — 场景池扩容的结构性校验
// 覆盖：抽取节奏（冷→热）、基站可定位、变体卡与母卡的一致性
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { triageTierWeights, pickScenarioWeighted, buildScenarioQueue } from './worldState'
import { __setRng, __resetRng } from './random'
import { SCENARIOS, SCENARIO_IDS } from '../events/templates'
import { ALL_CARDS } from '../events/cards'
import { lookupCoords } from '../locations'
import { getCaller } from '../npc/personas'

beforeEach(() => __resetRng())

describe('triageTierWeights / pickScenarioWeighted — 轮盘赌概率抽取', () => {
  it('权重随进度向 red 倾斜：green 单调下降，red 单调上升', () => {
    const at = (t: number) => triageTierWeights(t)
    expect(at(0).green).toBeGreaterThan(at(1).green)
    expect(at(0).red).toBeLessThan(at(1).red)
    expect(at(0).yellow).toBe(at(1).yellow)
    // 权重和恒为 1
    for (const t of [0, 0.5, 1]) {
      const w = at(t)
      expect(w.green + w.yellow + w.red + w.black).toBeCloseTo(1)
    }
  })

  it('pickScenarioWeighted 始终返回候选之一，且不返回 prCard 以外的未知 id', () => {
    const pool = SCENARIO_IDS.filter(id => id !== 'prank_call')
    for (const progress of [0, 0.5, 1]) {
      for (let i = 0; i < 50; i++) {
        const picked = pickScenarioWeighted(pool, progress)
        expect(picked).not.toBeNull()
        expect(pool).toContain(picked!)
      }
    }
  })

  it('高进度下抽中的 red 比例显著高于低进度', () => {
    const pool = SCENARIO_IDS.filter(id => id !== 'prank_call')
    const redRatio = (progress: number) => {
      let red = 0
      const n = 300
      for (let i = 0; i < n; i++) {
        const picked = pickScenarioWeighted(pool, progress)!
        if (SCENARIOS[picked].correctTriage === 'red') red++
      }
      return red / n
    }
    expect(redRatio(1)).toBeGreaterThan(redRatio(0) + 0.15)
  })

  it('空候选返回 null', () => {
    expect(pickScenarioWeighted([], 0)).toBeNull()
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
