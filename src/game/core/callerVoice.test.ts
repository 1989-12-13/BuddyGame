import { describe, expect, it } from 'vitest'
import { calmPunctuation, terseFilter, voiceAnswer, type VoiceContext } from './callerVoice'
import type { CallerVoice } from '../types'
import { ALL_VOICES, getVoice } from '../npc/voices'
import { ALL_CALLER_IDS } from '../npc/personas'

const NEUTRAL: CallerVoice = { verbosity: 1, rationality: 1, medicalLiteracy: 1 }
const ctx = (stressLevel: VoiceContext['stressLevel']): VoiceContext => ({ stressLevel, relation: '邻居' })

const URGES = ['你们到底还有多久到啊？！', '快点啊啊，我真的撑不住了！', '你先别问了，先派人来好不好！']

describe('来电者回答合成 · 特质完整性', () => {
  it('每位来电者都标注了说话特质', () => {
    const missing = ALL_CALLER_IDS.filter(id => !(id in ALL_VOICES))
    expect(missing).toEqual([])
  })

  it('未知来电者回落到中性特质', () => {
    expect(getVoice('not_a_caller' as never)).toEqual(NEUTRAL)
  })
})

describe('来电者回答合成 · 中性特质不改变原文', () => {
  it('一般特质的来电者回答保持原样', () => {
    const base = '他现在没有呼吸了！'
    expect(voiceAnswer(base, NEUTRAL, ctx('恐慌'))).toBe(base)
  })

  it('空回答不会崩溃', () => {
    expect(voiceAnswer('', NEUTRAL, ctx('紧张'))).toBe('')
  })
})

describe('来电者回答合成 · 沉默寡言', () => {
  it('首尾的纯情绪分句被丢弃，信息分句保留', () => {
    const base = '不行了不行了！！他现在没有呼吸了！！你们快来啊！！'
    const out = voiceAnswer(base, { verbosity: 0, rationality: 1, medicalLiteracy: 1 }, ctx('失控'))

    expect(out).toContain('没有呼吸')
    expect(out).not.toContain('不行了')
    expect(out).not.toContain('快来')
    expect(out.length).toBeLessThan(base.length)
  })

  it('不会删掉唯一的信息分句', () => {
    expect(terseFilter('他现在没有呼吸了。')).toBe('他现在没有呼吸了。')
  })

  it('整句都模糊时不做删减', () => {
    const base = '我...我不知道...你打这个能打通吧...'
    expect(terseFilter(base)).toBe(base)
  })
})

describe('来电者回答合成 · 话痨', () => {
  it('加上铺垫与跑题，但原文完整保留', () => {
    const base = '他现在没有呼吸了。'
    const out = voiceAnswer(base, { verbosity: 2, rationality: 1, medicalLiteracy: 1 }, ctx('紧张'))

    expect(out).toContain(base)
    expect(out.length).toBeGreaterThan(base.length)
  })

  it('与催促互斥，不会叠加两个结尾', () => {
    const out = voiceAnswer('他现在没有呼吸了。', { verbosity: 2, rationality: 0, medicalLiteracy: 0 }, ctx('失控'))
    expect(URGES.some(urge => out.includes(urge))).toBe(false)
  })
})

describe('来电者回答合成 · 情绪化与理性', () => {
  it('高压下会追加催促', () => {
    const base = '他现在没有呼吸了。'
    const out = voiceAnswer(base, { verbosity: 1, rationality: 0, medicalLiteracy: 1 }, ctx('失控'))

    expect(out).toContain(base)
    expect(URGES.some(urge => out.includes(urge))).toBe(true)
  })

  it('压力不高时不催促', () => {
    const base = '他现在没有呼吸了。'
    expect(voiceAnswer(base, { verbosity: 1, rationality: 0, medicalLiteracy: 1 }, ctx('镇定'))).toBe(base)
  })

  it('理性来电者语气更平，去掉连串感叹', () => {
    const out = calmPunctuation('不行了不行了！！他现在没有呼吸了！！')
    expect(out).not.toContain('！')
    expect(out).toContain('他现在没有呼吸了')
  })

  it('医疗常识高的来电者措辞更精确', () => {
    const base = '他现在没有呼吸了。'
    const out = voiceAnswer(base, { verbosity: 1, rationality: 2, medicalLiteracy: 2 }, ctx('紧张'))
    expect(out).toContain('我尽量说准一点，')
    expect(out).toContain(base)
  })
})
