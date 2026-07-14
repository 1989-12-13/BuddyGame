// ============================================================
// cprUtils — CPR 小游戏共享工具函数
// 消除 CprGame / RhythmPress / CprRhythm 三引擎的重复逻辑
// ============================================================

import { C_SUCCESS, C_WARNING, C_DANGER } from '../../../game/core/colors'

// -------------------- 常量 --------------------

/** 标准 CPR 按压速率 (BPM) */
export const CPR_TARGET_BPM = 110

/** 每分钟按压对应的毫秒间隔 */
export const CPR_TARGET_INTERVAL_MS = 60000 / CPR_TARGET_BPM

/** 标准 CPR 单周期按压次数 */
export const CPR_COMPRESSIONS_PER_CYCLE = 30

/** 标准 CPR 单周期吹气次数 */
export const CPR_BREATHS_PER_CYCLE = 2

/** BPM 偏差阈值：10 BPM 以内为优 */
export const CPR_BPM_GOOD_THRESHOLD = 10

/** BPM 偏差阈值：20 BPM 以内为可接受 */
export const CPR_BPM_OK_THRESHOLD = 20

/** Sweet spot 窗口（毫秒）— 节拍中心 ±120ms 为 perfect */
export const CPR_SWEET_SPOT_MS = 120

/** 好按压窗口（毫秒）— 节拍中心 ±250ms 为 good */
export const CPR_GOOD_WINDOW_MS = 250

/** 两次吹气之间的暂停时间（毫秒） */
export const CPR_BREATH_PAUSE_MS = 1000

/** 吹气理想区间下限（比例 0-1 对应 30%） */
export const CPR_BLOW_IDEAL_MIN = 0.30

/** 吹气过量阈值（比例 0-1 对应 72%） */
export const CPR_BLOW_OVER_THRESHOLD = 0.72

// -------------------- 类型 --------------------

/** 按压节奏质量 */
export type RhythmQuality = 'good' | 'ok' | 'bad'

/** 节拍命中质量（基于绝对时间的节拍系统） */
export type HitQuality = 'perfect' | 'good' | 'miss'

// -------------------- BPM 计算 --------------------

/** 从两次按压间隔（毫秒）计算瞬间 BPM */
export function calcBpm(intervalMs: number): number {
  return Math.round(60000 / intervalMs)
}

/** 从最近 N 次按压的时间戳计算实时 BPM */
export function calcLiveBpm(pressTimes: number[], recentCount = 4): number {
  const recent = pressTimes.slice(-recentCount)
  const intervals: number[] = []
  for (let i = 1; i < recent.length; i++) {
    intervals.push(recent[i] - recent[i - 1])
  }
  if (intervals.length === 0) return 0
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
  return Math.round(60000 / avg)
}

/** 给定 BPM 返回对应的理想按压间隔（毫秒） */
export function bpmToIntervalMs(bpm: number): number {
  return 60000 / bpm
}

// -------------------- 节奏质量评估 --------------------

/**
 * 根据 BPM 偏差评估单次按压质量
 * 适用于 CprGame / RhythmPress 等基于 BPM 偏差的游戏
 */
export function assessBpmQuality(
  intervalMs: number,
  targetBpm: number = CPR_TARGET_BPM,
): RhythmQuality {
  const bpm = 60000 / intervalMs
  const deviation = Math.abs(bpm - targetBpm)
  if (deviation <= CPR_BPM_GOOD_THRESHOLD) return 'good'
  if (deviation <= CPR_BPM_OK_THRESHOLD) return 'ok'
  return 'bad'
}

/**
 * 根据节拍时间偏差评估单次命中质量
 * 适用于 CprRhythm 等基于绝对节拍位置的游戏
 */
export function assessHitQuality(
  deviationMs: number,
  sweetSpotMs: number = CPR_SWEET_SPOT_MS,
  goodWindowMs: number = CPR_GOOD_WINDOW_MS,
): HitQuality {
  if (deviationMs <= sweetSpotMs) return 'perfect'
  if (deviationMs <= goodWindowMs) return 'good'
  return 'miss'
}

// -------------------- 计分 --------------------

/**
 * 从节奏质量数组中计算加权得分（0-1）
 * good=1, ok=0.5, bad=0
 */
export function calcRhythmScore(qualities: RhythmQuality[]): number {
  if (qualities.length === 0) return 0
  const total = qualities.reduce((sum, q) => {
    if (q === 'good') return sum + 1
    if (q === 'ok') return sum + 0.5
    return sum
  }, 0)
  return total / qualities.length
}

/**
 * 从命中质量数组中计算准确度（0-1）
 * perfect=1, good=0.5, miss=0
 */
export function calcHitAccuracy(hits: HitQuality[]): number {
  if (hits.length === 0) return 0
  const total = hits.reduce((sum, h) => {
    if (h === 'perfect') return sum + 1
    if (h === 'good') return sum + 0.5
    return sum
  }, 0)
  return total / hits.length
}

/**
 * 计算最终 CPR 得分（0-1）
 * 综合节奏准确度与吹气过量惩罚
 */
export function calcCprFinalScore(
  rhythmScore: number,
  overBreathPenalty: number = 0,
): number {
  return Math.max(0, Math.min(1, rhythmScore * 0.8 + 0.2 - overBreathPenalty))
}

// -------------------- 视觉映射 --------------------

/** 按压节奏质量 → 颜色 */
export function rhythmQualityColor(q: RhythmQuality | null): string {
  switch (q) {
    case 'good': return C_SUCCESS
    case 'ok': return C_WARNING
    case 'bad': return C_DANGER
    default: return 'var(--text-muted)'
  }
}

/** 命中质量 → 颜色（可选默认色） */
export function hitQualityColor(q: HitQuality | null, fallback = 'var(--text-muted)'): string {
  switch (q) {
    case 'perfect': return C_SUCCESS
    case 'good': return C_WARNING
    case 'miss': return C_DANGER
    default: return fallback
  }
}

/** BPM 偏差 → 显示颜色 */
export function bpmDeviationColor(currentBpm: number, targetBpm: number): string {
  const dev = Math.abs(currentBpm - targetBpm)
  if (dev <= CPR_BPM_GOOD_THRESHOLD) return C_SUCCESS
  if (dev <= CPR_BPM_OK_THRESHOLD) return C_WARNING
  return C_DANGER
}

/** 命中质量 → 中文标签 */
export function hitQualityLabel(q: HitQuality): string {
  switch (q) {
    case 'perfect': return '完美！'
    case 'good': return '不错'
    case 'miss': return 'miss'
  }
}

/** 质量计数统计 */
export interface QualityStats {
  good: number
  ok: number
  bad: number
  total: number
}

/** 统计节奏质量分布 */
export function countQualities(qualities: RhythmQuality[]): QualityStats {
  const stats: QualityStats = { good: 0, ok: 0, bad: 0, total: qualities.length }
  for (const q of qualities) {
    if (q === 'good') stats.good++
    else if (q === 'ok') stats.ok++
    else stats.bad++
  }
  return stats
}
