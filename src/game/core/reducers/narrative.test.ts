// ============================================================
// 叙述式回答生成 — 活人化：情绪档位 × 说话特质 × 句子流
// ============================================================
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import type { CallerVoice } from '../../types'
import { __setRng, __resetRng } from '../random'
import { generateEventNarrative, generateAgeNarrative, generateLocationNarrative, generateVitalsNarrative, splitSentences } from './narrative'

const COMPLAINT = '他摔倒了，后脑勺着地，一直在流血'
const NEUTRAL: CallerVoice = { verbosity: 1, rationality: 1, medicalLiteracy: 1 }

beforeEach(() => __setRng(() => 0))
afterEach(() => __resetRng())

describe('generateEventNarrative · 情绪档位', () => {
  it('镇定：完整原样、质量 clear、不扭曲', () => {
    const out = generateEventNarrative(COMPLAINT, '男性', 20, '同事', NEUTRAL)
    expect(out).toEqual({ lines: splitSentences(COMPLAINT), quality: 'clear', distorted: false })
  })

  it('紧张：逐句挤出，能完整复述但带迟疑，质量 partial', () => {
    const out = generateEventNarrative(COMPLAINT, '女性', 30, '邻居')
    expect(out.quality).toBe('partial')
    expect(out.distorted).toBe(false)
    expect(out.lines.length).toBeGreaterThan(1)
    expect(out.lines.join('')).toContain('摔倒了')
  })

  it('恐慌：句子被慌乱打断、质量 partial、扭曲', () => {
    const interjects = generateEventNarrative(COMPLAINT, '男性', 60, '本人', {
      ...NEUTRAL, personality: { interjects: true },
    })
    expect(interjects.quality).toBe('partial')
    expect(interjects.distorted).toBe(true)
    // rng=0 → useUrge=true, useWhatToDo=true
    expect(interjects.lines.join('')).toContain('摔倒了')

    const quiet = generateEventNarrative(COMPLAINT, '男性', 60, '本人', { ...NEUTRAL, personality: {} })
    expect(quiet.quality).toBe('partial')
  })

  it('失控：质量 vague、扭曲，40%概率丢失信息只挤出恐慌行为', () => {
    // rng=0 → < 0.4 → 只输出恐慌行为，不含信息
    const noInfo = generateEventNarrative(COMPLAINT, '男性', 85, '妻子', {
      ...NEUTRAL, personality: { panicTick: 'stammer' },
    })
    expect(noInfo.quality).toBe('vague')
    expect(noInfo.distorted).toBe(true)
    expect(noInfo.lines.join('')).toContain('就、就、就是')

    // rng → 0.5 → >= 0.4 → 挤出半句信息 + 恐慌行为
    __setRng(() => 0.5)
    const withInfo = generateEventNarrative(COMPLAINT, '男性', 85, '妻子', {
      ...NEUTRAL, personality: { panicTick: 'scream' },
    })
    expect(withInfo.quality).toBe('vague')
    expect(withInfo.lines.join('')).toContain('摔倒了')
  })
})

describe('generateEventNarrative · 说话特质分化', () => {
  it('话痨 + 低理性 在紧张时可能冒出一句现场杂音', () => {
    // rng=0 → aside 概率 35% → 0 < 0.35 → 出现
    const out = generateEventNarrative(COMPLAINT, '男性', 35, '友人', {
      verbosity: 2, rationality: 0, medicalLiteracy: 0,
    })
    expect(out.lines.join('')).toMatch(/狗也在叫|旁边人在|楼上也在|灯还在闪/)
  })

  it('镇定档不做任何润色 —— 完全不背叛原文', () => {
    expect(generateEventNarrative(COMPLAINT, '男性', 10, '本人', {
      verbosity: 2, rationality: 0, medicalLiteracy: 0, personality: { panicTick: 'sob', echoes: true },
    }).lines.join('')).toBe(COMPLAINT)
  })
})

describe('generateAgeNarrative · 按关系区分知晓度', () => {
  it('本人：直接报年龄', () => {
    expect(generateAgeNarrative('45岁左右', 10, '本人')).toEqual(['45岁左右。'])
  })

  it('家属：大致清楚', () => {
    expect(generateAgeNarrative('45岁左右', 10, '妻子')).toContain('45岁左右。')
  })

  it('熟人：知道大概但不精确', () => {
    const lines = generateAgeNarrative('45岁左右', 10, '朋友')
    expect(lines.join('')).toContain('大概')
    expect(lines.join('')).toContain('确定')
  })

  it('路人：只能目测年龄段，说不出精确数字', () => {
    const lines = generateAgeNarrative('45岁左右', 10, '路人')
    expect(lines.join('')).toContain('四十来岁')
    expect(lines.join('')).not.toContain('45')
  })

  it('失控：路人连年龄段都说不清', () => {
    const lines = generateAgeNarrative('45岁左右', 80, '路人')
    expect(lines.join('')).not.toContain('45')
    expect(lines.join('')).toContain('不知道')
  })
})

describe('generateLocationNarrative · 失控档位', () => {
  it('失控：不再直接报地址，输出恐慌行为', () => {
    const out = generateLocationNarrative('望京西园三区', '朝阳区望京街道附近', 80)
    expect(out.quality).toBe('vague')
    expect(out.distorted).toBe(true)
  })
})

describe('generateVitalsNarrative · 失控档位', () => {
  it('失控：50%概率不报体征只输出恐慌行为', () => {
    // rng=0 → < 0.5 → 不报体征
    const out = generateVitalsNarrative('怎么叫都不醒', '没有呼吸了', 80)
    expect(out.length).toBeLessThanOrEqual(3)
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
