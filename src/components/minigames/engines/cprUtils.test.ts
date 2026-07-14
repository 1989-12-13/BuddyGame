import { describe, it, expect } from 'vitest'
import {
  calcBpm,
  calcLiveBpm,
  bpmToIntervalMs,
  assessBpmQuality,
  assessHitQuality,
  calcRhythmScore,
  calcHitAccuracy,
  calcCprFinalScore,
  countQualities,
  rhythmQualityColor,
  hitQualityColor,
  bpmDeviationColor,
  hitQualityLabel,
  CPR_TARGET_BPM,
  CPR_TARGET_INTERVAL_MS,
  CPR_SWEET_SPOT_MS,
  CPR_GOOD_WINDOW_MS,
  CPR_BPM_GOOD_THRESHOLD,
  CPR_BPM_OK_THRESHOLD,
  CPR_COMPRESSIONS_PER_CYCLE,
  CPR_BREATHS_PER_CYCLE,
} from './cprUtils'
import { C_SUCCESS, C_WARNING, C_DANGER } from '../../../game/core/colors'

describe('calcBpm', () => {
  it('标准 110 BPM 间隔应计算为 110', () => {
    expect(calcBpm(60000 / 110)).toBe(110)
  })

  it('慢速按压 80 BPM 应计算为 80', () => {
    expect(calcBpm(60000 / 80)).toBe(80)
  })

  it('快速按压 140 BPM 应计算为 140', () => {
    expect(calcBpm(60000 / 140)).toBe(140)
  })

  it('零界值：极大间隔应返回 1', () => {
    expect(calcBpm(60000)).toBe(1)
  })
})

describe('calcLiveBpm', () => {
  it('4 次规律按压应返回预期 BPM', () => {
    const interval = 60000 / 110
    const times = [0, interval, interval * 2, interval * 3]
    expect(calcLiveBpm(times, 4)).toBe(110)
  })

  it('少于 2 次按压应返回 0', () => {
    expect(calcLiveBpm([100], 4)).toBe(0)
  })

  it('空数组应返回 0', () => {
    expect(calcLiveBpm([], 4)).toBe(0)
  })

  it('仅取最近 N 次计算', () => {
    const goodInterval = 60000 / 110
    // 前 3 次快, 后 2 次正确
    const times = [0, 300, 600, 900 + goodInterval, 900 + goodInterval * 2]
    // recent=3 只取最后 3 次, 包含 900+goodInterval 那个间隔
    const bpm = calcLiveBpm(times, 3)
    // 最后 3 次的间隔:  300, goodInterval → 平均约 (300+545)/2=422.5 → 142 BPM
    expect(bpm).not.toBe(110)
  })
})

describe('assessBpmQuality', () => {
  const targetMs = 60000 / CPR_TARGET_BPM

  it('偏差 ≤ 10 BPM 应返回 good', () => {
    expect(assessBpmQuality(targetMs)).toBe('good')
    const closeMs = 60000 / (CPR_TARGET_BPM + CPR_BPM_GOOD_THRESHOLD)
    expect(assessBpmQuality(closeMs)).toBe('good')
  })

  it('偏差 11-20 BPM 应返回 ok', () => {
    const okMs = 60000 / (CPR_TARGET_BPM + 15)
    expect(assessBpmQuality(okMs)).toBe('ok')
  })

  it('偏差 > 20 BPM 应返回 bad', () => {
    const badMs = 60000 / (CPR_TARGET_BPM + 25)
    expect(assessBpmQuality(badMs)).toBe('bad')
  })
})

describe('assessHitQuality', () => {
  it('偏差 ≤ sweet spot 应返回 perfect', () => {
    expect(assessHitQuality(0)).toBe('perfect')
    expect(assessHitQuality(CPR_SWEET_SPOT_MS)).toBe('perfect')
  })

  it('偏差在 good window 内应返回 good', () => {
    expect(assessHitQuality(CPR_SWEET_SPOT_MS + 1)).toBe('good')
    expect(assessHitQuality(CPR_GOOD_WINDOW_MS)).toBe('good')
  })

  it('偏差 > good window 应返回 miss', () => {
    expect(assessHitQuality(CPR_GOOD_WINDOW_MS + 1)).toBe('miss')
    expect(assessHitQuality(999)).toBe('miss')
  })
})

describe('calcRhythmScore', () => {
  it('全员 good 应得 1.0', () => {
    expect(calcRhythmScore(['good', 'good', 'good'])).toBe(1)
  })

  it('一半 good 一半 ok 应得 0.75', () => {
    expect(calcRhythmScore(['good', 'ok'])).toBe(0.75)
  })

  it('全员 bad 应得 0', () => {
    expect(calcRhythmScore(['bad', 'bad'])).toBe(0)
  })

  it('空数组应得 0', () => {
    expect(calcRhythmScore([])).toBe(0)
  })

  it('混合阵容计算正确', () => {
    expect(calcRhythmScore(['good', 'ok', 'bad'])).toBeCloseTo(0.5)
  })
})

describe('calcHitAccuracy', () => {
  it('全员 perfect 应得 1.0', () => {
    expect(calcHitAccuracy(['perfect', 'perfect'])).toBe(1)
  })

  it('全员 miss 应得 0', () => {
    expect(calcHitAccuracy(['miss', 'miss'])).toBe(0)
  })

  it('空数组应得 0', () => {
    expect(calcHitAccuracy([])).toBe(0)
  })
})

describe('calcCprFinalScore', () => {
  it('完美节奏无惩罚应得 1.0', () => {
    expect(calcCprFinalScore(1, 0)).toBe(1)
  })

  it('中等节奏应得中间值', () => {
    const score = calcCprFinalScore(0.5, 0)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1)
  })

  it('吹气过量应扣分', () => {
    const noPenalty = calcCprFinalScore(1, 0)
    const withPenalty = calcCprFinalScore(1, 0.3)
    expect(withPenalty).toBeLessThan(noPenalty)
  })

  it('分数裁剪在 [0, 1] 范围内', () => {
    expect(calcCprFinalScore(1, 0.5)).toBeGreaterThanOrEqual(0)
    expect(calcCprFinalScore(-10, 0)).toBeGreaterThanOrEqual(0)
    expect(calcCprFinalScore(10, 0)).toBeLessThanOrEqual(1)
  })
})

describe('countQualities', () => {
  it('统计正确分布', () => {
    const result = countQualities(['good', 'ok', 'bad', 'good'])
    expect(result).toEqual({ good: 2, ok: 1, bad: 1, total: 4 })
  })

  it('空数组', () => {
    expect(countQualities([])).toEqual({ good: 0, ok: 0, bad: 0, total: 0 })
  })
})

describe('颜色映射函数', () => {
  it('rhythmQualityColor 映射正确', () => {
    expect(rhythmQualityColor('good')).toBe(C_SUCCESS)
    expect(rhythmQualityColor('ok')).toBe(C_WARNING)
    expect(rhythmQualityColor('bad')).toBe(C_DANGER)
    expect(rhythmQualityColor(null)).toBe('var(--text-muted)')
  })

  it('hitQualityColor 映射正确', () => {
    expect(hitQualityColor('perfect')).toBe(C_SUCCESS)
    expect(hitQualityColor('good')).toBe(C_WARNING)
    expect(hitQualityColor('miss')).toBe(C_DANGER)
    expect(hitQualityColor(null)).toBe('var(--text-muted)')
    expect(hitQualityColor(null, '#fff')).toBe('#fff')
  })

  it('bpmDeviationColor 映射正确', () => {
    expect(bpmDeviationColor(CPR_TARGET_BPM, CPR_TARGET_BPM)).toBe(C_SUCCESS)
    expect(bpmDeviationColor(CPR_TARGET_BPM + 15, CPR_TARGET_BPM)).toBe(C_WARNING)
    expect(bpmDeviationColor(CPR_TARGET_BPM + 25, CPR_TARGET_BPM)).toBe(C_DANGER)
  })
})

describe('hitQualityLabel', () => {
  it('返回正确的中文标签', () => {
    expect(hitQualityLabel('perfect')).toBe('完美！')
    expect(hitQualityLabel('good')).toBe('不错')
    expect(hitQualityLabel('miss')).toBe('miss')
  })
})

describe('常量验证', () => {
  it('CPR 核心常量值正确', () => {
    expect(CPR_TARGET_BPM).toBe(110)
    expect(CPR_TARGET_INTERVAL_MS).toBe(60000 / 110)
    expect(CPR_COMPRESSIONS_PER_CYCLE).toBe(30)
    expect(CPR_BREATHS_PER_CYCLE).toBe(2)
    expect(CPR_SWEET_SPOT_MS).toBe(120)
    expect(CPR_GOOD_WINDOW_MS).toBe(250)
    expect(CPR_BPM_GOOD_THRESHOLD).toBe(10)
    expect(CPR_BPM_OK_THRESHOLD).toBe(20)
  })
})
