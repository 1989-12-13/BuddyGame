// ============================================================
// 120调度台 — 游戏可调常量（调参 = 改这一个文件即可）
// ============================================================

import type { TriageLevel } from '../types'

// -------------------- 来电者压力层 --------------------
/** 镇定上限（exclusive） */
export const STRESS_CALM_MAX = 25
/** 紧张上限（exclusive） */
export const STRESS_TENSE_MAX = 50
/** 恐慌上限（exclusive） */
export const STRESS_PANIC_MAX = 75
/** 压力最大值 */
export const STRESS_MAX = 100

/** 来电者语态 → 初始压力值 */
export const TONE_INITIAL_STRESS: Record<string, number> = {
  镇定: 25,
  紧张: 50,
  恐慌: 65,
  失控: 85,
}

// -------------------- 安抚 --------------------
/** 安抚一次降低的压力（基础值） */
export const CALM_STRESS_DROP_BASE = 20
/** 安抚一次降低的压力（技能加成） */
export const CALM_STRESS_DROP_PERK = 30
/**
 * 安抚效果随次数线性递减（每次少降这么多）。
 * 旧实现是 20/(1+次数)，第 3 次就只剩 6.7，导致「安抚换准确信息」在数值上不成立。
 */
export const CALM_STRESS_DROP_DECAY = 4
/** 安抚效果下限：保留一个可用值，避免收益崩塌到「安抚无用」 */
export const CALM_STRESS_DROP_FLOOR = 8
/** 安抚一次的时间成本（基础值） */
export const CALM_TIME_COST_BASE = 2
/** 安抚一次的时间成本（技能加成） */
export const CALM_TIME_COST_PERK = 1

// -------------------- 指导体征变化（百分比模型） --------------------
/**
 * 体征变化采用百分比模型，收益/损失随病情自然缩放：
 * - 做对：恢复「已损失体征」的一定比例（initialStability - stability），越危险挽回越多；
 * - 做错：扣除「当前体征」的一定比例，越拖越弱但始终存在。
 */
export const GUIDANCE_CORRECT_RECOVERY_RATIO = 0.35
export const GUIDANCE_INCORRECT_PENALTY_RATIO = 0.10
/** 小游戏：得分折算系数，score ≥0.5 恢复已损失的，<0.5 扣当前的 */
export const MINIGAME_RECOVERY_RATIO = 0.50
export const MINIGAME_PENALTY_RATIO = 0.10

// -------------------- black（濒死）逆转机制 --------------------
/**
 * black 患者起始体征极低且衰减极快，电话指导（CPR / 除颤）是唯一逆转手段：
 * 恢复上限放开到 100。其他档位急救指导只算「稳住」，恢复上限为起始体征。
 */
export function stabilityRecoveryCap(triage: TriageLevel, initialStability: number): number {
  return triage === 'black' ? 100 : initialStability
}

/** 正确指导：恢复已损失体征的比例值 */
export function guidanceStabilityGain(stability: number, initialStability: number): number {
  return Math.round((initialStability - stability) * GUIDANCE_CORRECT_RECOVERY_RATIO)
}
/** 错误指导：扣除当前体征的比例值（至少 1 点，避免低体征时惩罚归零） */
export function guidanceStabilityPenalty(stability: number): number {
  return Math.max(1, Math.round(stability * GUIDANCE_INCORRECT_PENALTY_RATIO))
}
/** 小游戏：按得分折算的体征变化，正=恢复已损失，负=扣当前 */
export function minigameStabilityDelta(stability: number, initialStability: number, score: number): number {
  if (score >= 0.5) {
    return Math.round((initialStability - stability) * (score - 0.5) * 2 * MINIGAME_RECOVERY_RATIO)
  }
  return -Math.max(1, Math.round(stability * (0.5 - score) * 2 * MINIGAME_PENALTY_RATIO))
}

// -------------------- 派车计时阈值 --------------------

/** 派车黄金时间上限（秒）— 满分 35 */
export const DISPATCH_GOLD_TIME = 35
/** 派车良好时间上限（秒）— 30 分 */
export const DISPATCH_SILVER_TIME = 50
/** 派车及格时间上限（秒）— 20 分 */
export const DISPATCH_BRONZE_TIME = 75
/** 派车差评时间上限（秒）— 10 分 */
export const DISPATCH_COPPER_TIME = 110

/** 派车警告阈值（秒）— 超过显示黄色警告 */
export const DISPATCH_WARN_TIME = 50
/** 派车严重阈值（秒）— 超过显示红色警告 */
export const DISPATCH_CRITICAL_TIME = 80

// -------------------- 评分系数 --------------------

/** 派车速度满分 */
export const SPEED_SCORE_PERFECT = 35
/** 派车速度良好分 */
export const SPEED_SCORE_GOOD = 30
/** 派车速度及格分 */
export const SPEED_SCORE_BRONZE = 20
/** 派车速度差评分 */
export const SPEED_SCORE_COPPER = 10
/** 派车速度极差分 */
export const SPEED_SCORE_BAD = 5

/** 分诊完全匹配分 */
export const TRIAGE_PERFECT_SCORE = 20
/** 分诊差一档分 */
export const TRIAGE_OFFBY1_SCORE = 10
/** 地址完整度分 */
export const ADDRESS_FULL_SCORE = 10
export const ADDRESS_PARTIAL_SCORE = 6
export const ADDRESS_VAGUE_SCORE = 3
/** 联系方式得分 */
export const CONTACT_SCORE = 5
/** 主诉得分 */
export const COMPLAINT_SCORE = 10
/** 目的得分 */
export const PURPOSE_SCORE = 5

/** 急救指导满分 */
export const GUIDANCE_MAX_SCORE = 10
/** 信息质量加分上限 */
export const INFO_QUALITY_MAX_BONUS = 5

// -------------------- 生命体征阈值 --------------------

/** stability ≥ 此值为 stable */
export const VITAL_STABLE_THRESHOLD = 70
/** stability ≥ 此值为 warning */
export const VITAL_WARNING_THRESHOLD = 40
/** stability ≥ 此值为 critical */
export const VITAL_CRITICAL_THRESHOLD = 15

// -------------------- 自适应难度（体征衰减跨通话系数） --------------------

/** 首局难度：体征衰减略慢于基准，给玩家熟悉操作的空间 */
export const DIFFICULTY_INITIAL = 0.9
/** 难度系数下限（玩家挣扎时衰减最慢到基准的 0.8 倍） */
export const DIFFICULTY_MIN = 0.8
/** 难度系数上限（衰减最快为基准速率的 1.5 倍） */
export const DIFFICULTY_MAX = 1.5

/**
 * 根据上一通结束时体征条剩余比例调整下一通难度：
 * 剩余越多说明玩家越从容，下一通衰减越快；手忙脚乱则放缓。
 */
export function nextDifficulty(current: number, remainingRatio: number): number {
  const delta = remainingRatio >= 0.7 ? +0.2 : remainingRatio >= 0.4 ? +0.1 : remainingRatio > 0 ? -0.1 : -0.15
  return Math.max(DIFFICULTY_MIN, Math.min(DIFFICULTY_MAX, current + delta))
}
