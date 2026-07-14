import { describe, it, expect } from 'vitest'
import {
  inferCallerDemographics,
  pickSpeaker,
  SPEAKER_POOL,
  type CallerDemographics,
} from './ttsSpeakers'

describe('inferCallerDemographics', () => {
  it('小孩关系 → child / male', () => {
    expect(inferCallerDemographics('小孩', '小朋友')).toEqual<CallerDemographics>({
      gender: 'male',
      ageBucket: 'child',
    })
  })

  it('典型男性关系 → male / adult', () => {
    for (const rel of ['丈夫', '儿子', '父亲', '工友', '同事', '室友', '家属']) {
      const d = inferCallerDemographics(rel, '某某')
      expect(d.gender).toBe('male')
      expect(d.ageBucket).toBe('adult')
    }
  })

  it('典型女性关系 → female / adult', () => {
    for (const rel of ['妻子', '母亲', '女儿']) {
      const d = inferCallerDemographics(rel, '某某')
      expect(d.gender).toBe('female')
      expect(d.ageBucket).toBe('adult')
    }
  })

  it('歧义关系 + 常见女性用字 → female', () => {
    for (const name of ['张秀兰', '李娜', '王芳', '陈美', '林梅']) {
      const d = inferCallerDemographics('邻居', name)
      expect(d.gender).toBe('female')
    }
  })

  it('歧义关系 + 常见男性用字 → male', () => {
    for (const name of ['赵磊', '李强', '王伟', '陈刚', '周峰']) {
      const d = inferCallerDemographics('本人', name)
      expect(d.gender).toBe('male')
    }
  })

  it('无法判断 → 默认 male/adult', () => {
    const d = inferCallerDemographics('路人', '某某')
    expect(d).toEqual<CallerDemographics>({ gender: 'male', ageBucket: 'adult' })
  })
})

describe('pickSpeaker', () => {
  it('小孩 → child 音色', () => {
    expect(pickSpeaker('小孩', '小朋友')).toBe(SPEAKER_POOL.child)
  })

  it('丈夫 → male_adult 音色', () => {
    expect(pickSpeaker('丈夫', '李建国')).toBe(SPEAKER_POOL.male_adult)
  })

  it('妻子 → female_adult 音色', () => {
    expect(pickSpeaker('妻子', '王丽')).toBe(SPEAKER_POOL.female_adult)
  })

  it('路人王晓（末字"晓"） → male_adult 音色', () => {
    expect(pickSpeaker('路人', '王晓')).toBe(SPEAKER_POOL.male_adult)
  })

  it('默认音色池覆盖 5 个 key', () => {
    for (const key of ['male_adult', 'female_adult', 'male_elderly', 'female_elderly', 'child']) {
      expect(SPEAKER_POOL[key]).toBeTruthy()
    }
  })

  it('童声音色使用用户控制台确认的天才童声', () => {
    expect(SPEAKER_POOL.child).toBe('zh_male_tiancaitongsheng_mars_bigtts')
  })
})