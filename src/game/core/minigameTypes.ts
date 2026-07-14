// ============================================================
// 零点接线台 — 场景小游戏类型定义
// ============================================================

/** 小游戏标识 */
export type MiniGameId = 'cpr_rhythm' | 'bleed_control' | 'obstetric_sequence' | 'flush_timer' | null

/** 每次按压/操作的评分 */
export type HitQuality = 'perfect' | 'good' | 'miss'

export interface HitRecord {
  index: number
  quality: HitQuality
  /** 与理想节拍的偏差（毫秒） */
  deviationMs: number
  timestamp: number
}

/** 小游戏完成后的结果摘要 */
export interface MiniGameResult {
  miniGameId: MiniGameId
  totalActions: number
  perfectCount: number
  goodCount: number
  missCount: number
  accuracy: number          // 0-1
  passed: boolean
}
