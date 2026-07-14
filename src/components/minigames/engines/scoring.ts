// ============================================================
// 零点接线台 — 小游戏计分纯函数
// 把「score >= passThreshold」判定从各引擎抽出，便于单测与统一语义
// ============================================================

/** 达标判定：分数是否不低于通过阈值 */
export function computePassed(score: number, passThreshold: number): boolean {
  return score >= passThreshold
}
