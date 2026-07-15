// ============================================================
// 120调度台 — 游戏可调常量（调参 = 改这一个文件即可）
// ============================================================

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
/** 安抚一次的时间成本（基础值） */
export const CALM_TIME_COST_BASE = 2
/** 安抚一次的时间成本（技能加成） */
export const CALM_TIME_COST_PERK = 1

// -------------------- 判断/指导分值 --------------------
/** 正确判断增加的患者稳定性 */
export const JUDGMENT_CORRECT_BONUS = 6
/** 错误判断扣除的患者稳定性 */
export const JUDGMENT_INCORRECT_PENALTY = 5
/** 正确指导增加的患者稳定性 */
export const GUIDANCE_CORRECT_BONUS = 5
/** 错误指导扣除的患者稳定性 */
export const GUIDANCE_INCORRECT_PENALTY = 4
/** 小游戏 delta 倍率（score-0.5）× 此值 */
export const MINIGAME_STABILITY_MULT = 20

// -------------------- 派车计时阈值 --------------------

/** 派车黄金时间上限（秒）— 满分 35 */
export const DISPATCH_GOLD_TIME = 27
/** 派车良好时间上限（秒）— 30 分 */
export const DISPATCH_SILVER_TIME = 43
/** 派车及格时间上限（秒）— 20 分 */
export const DISPATCH_BRONZE_TIME = 60
/** 派车差评时间上限（秒）— 10 分 */
export const DISPATCH_COPPER_TIME = 90

/** 派车警告阈值（秒）— 超过显示黄色警告 */
export const DISPATCH_WARN_TIME = 45
/** 派车严重阈值（秒）— 超过显示红色警告 */
export const DISPATCH_CRITICAL_TIME = 60

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
