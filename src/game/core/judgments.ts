// ============================================================
// 零点接线台 — 判断/验证共用工具函数
// ============================================================

import type { JudgmentPrompt } from '../types'

/** 检查玩家是否正确识别了恶作剧电话 */
export function isPrankVerified(judgments: JudgmentPrompt[]): boolean {
  return judgments.some(j =>
    j.questionId === 'mpds_prank_patient'
    && j.chosenOptionIndex !== null
    && j.options[j.chosenOptionIndex]?.isCorrect === true,
  )
}
