// ============================================================
// 叙述式回答生成 — 活人化：情绪档位 × 说话特质 × 句子流
// ============================================================
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import type { CallerVoice } from '../../types'
import { __setRng, __resetRng } from '../random'
import { generateEventNarrative, splitSentences } from './narrative'

const COMPLAINT = '他摔倒了，后脑勺着地，一直在流血'
const NEUTRAL: CallerVoice = { verbosity: 1, rationality: 1, medicalLiteracy: 1 }

beforeEach(() => __setRng(() => 0))
afterEach(() => __resetRng())

describe('generateEventNarrative · 情绪档位', () => {
  it('镇定：完整原样、质量 clear、不扭曲', () => {
    const out = generateEventNarrative(COMPLAINT, 'male', 20, '同事', NEUTRAL)
    expect(out).toEqual({ lines: splitSentences(COMPLAINT), quality: 'clear', distorted: false })
  })

  it('紧张：逐句挤出，能完整复述但带迟疑，质量 partial', () => {
    const out = generateEventNarrative(COMPLAINT, 'female', 30, '邻居')
    expect(out.quality).toBe('partial')
    expect(out.distorted).toBe(false)
    expect(out.lines.length).toBeGreaterThan(1)
    expect(out.lines.join('')).toContain('摔倒了')
    expect(out.lines.join('')).toContain('刚刚发生的事')
  })

  it('恐慌：句子被慌乱打断、逐句断裂且出现对救援进度的追问（interjects）', () => {
    const interjects = generateEventNarrative(COMPLAINT, 'male', 60, '本人', {
      ...NEUTRAL, personality: { interjects: true },
    })
    expect(interjects.quality).toBe('partial')
    expect(interjects.distorted).toBe(true)
    // rng=0 → PACE_URGES[0] = '你们到哪儿了？！'
    expect(interjects.lines.join('')).toContain('你们到哪儿了？！')
    expect(interjects.lines.join('').toLowerCase()).toContain('我该怎么办')

    const quiet = generateEventNarrative(COMPLAINT, 'male', 60, '本人', { ...NEUTRAL, personality: {} })
    expect(quiet.lines.join('')).not.toContain('你们到哪儿了')
  })

  it('失控：只剩最核心的几个短句，质量 vague，口头动作由 panicTick 决定', () => {
    // stammer → 「就、就、就是」
    const stammer = generateEventNarrative(COMPLAINT, 'male', 85, '妻子', {
      ...NEUTRAL, personality: { panicTick: 'stammer' },
    })
    expect(stammer.quality).toBe('vague')
    expect(stammer.distorted).toBe(true)
    expect(stammer.lines.join('')).toContain('就、就、就是')
    expect(stammer.lines.join('')).toContain('真的要不行了')

    const scream = generateEventNarrative(COMPLAINT, 'female', 90, '母亲', {
      ...NEUTRAL, personality: { panicTick: 'scream' },
    })
    expect(scream.lines.join('')).toContain('啊——！')
  })
})

describe('generateEventNarrative · 说话特质分化', () => {
  it('话痨 + 低理性 在紧张时冒出一句现场杂音（跑题但仍在现场）', () => {
    const out = generateEventNarrative(COMPLAINT, 'male', 35, '友人', {
      verbosity: 2, rationality: 0, medicalLiteracy: 0,
    })
    expect(out.lines.join('')).toContain('我家里狗也在叫')
  })

  it('echoes：紧张时会无意识地复述自己的最后一句话', () => {
    const plain = generateEventNarrative(COMPLAINT, 'male', 35, '同事', { ...NEUTRAL, personality: {} })
    const echoed = generateEventNarrative(COMPLAINT, 'male', 35, '同事', { ...NEUTRAL, personality: { echoes: true } })
    expect(plain.lines.join('')).not.toContain('（自己念叨）')
    expect(echoed.lines.join('')).toContain('（自己念叨）')
  })

  it('镇定档不做任何润色 —— 完全不背叛原文', () => {
    expect(generateEventNarrative(COMPLAINT, 'male', 10, '本人', {
      verbosity: 2, rationality: 0, medicalLiteracy: 0, personality: { panicTick: 'sob', echoes: true },
    }).lines.join('')).toBe(COMPLAINT)
  })
})

describe('splitSentences · 断句', () => {
  it('按中英文句末标点切成短句', () => {
    expect(splitSentences('他摔倒了，正在流血。你们快来！真的吗?')).toEqual([
      '他摔倒了，正在流血。', '你们快来！', '真的吗?',
    ])
  })
  it('空串与无标点串安全处理', () => {
    expect(splitSentences('')).toEqual([])
    expect(splitSentences('没有标点的一段话')).toEqual(['没有标点的一段话'])
  })
})