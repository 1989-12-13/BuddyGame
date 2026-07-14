// ============================================================
// 零点接线台 — 小游戏完成守卫
// 统一「防重复回调 + 延时回传 onComplete(score, passed)」模式，
// 消除各引擎各写一份 finished ref + setTimeout 的重复与不一致
// ============================================================

import { useCallback, useRef } from 'react'

/**
 * 返回带守卫的 complete 函数：
 * - 同一局只会回传一次 onComplete（finished ref 拦截二次调用）
 * - 通过 setTimeout 延迟 delayMs 回传，各引擎保留各自原有延时值
 */
export function useMiniGameFinish(
  onComplete: (score: number, passed: boolean) => void,
  delayMs = 700,
) {
  const guard = useRef(false)

  const complete = useCallback(
    (score: number, passed: boolean) => {
      if (guard.current) return
      guard.current = true
      setTimeout(() => onComplete(score, passed), delayMs)
    },
    [onComplete, delayMs],
  )

  return { guard, complete }
}
