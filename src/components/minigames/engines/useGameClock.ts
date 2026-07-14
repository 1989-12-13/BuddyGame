// ============================================================
// 零点接线台 — 小游戏计时时钟
// 正确的 rAF 倒计时 + 暂停累积：暂停期间不推进，恢复后续算。
// 修复旧 RhythmPress 中 pausedAccumRef 永不赋值导致「假暂停」的问题。
// ============================================================

import { useEffect, useRef } from 'react'

export interface GameClockCallbacks {
  /** 每帧回调；返回 true 表示提前结束（会触发 onFinish） */
  onTick?: (elapsedSec: number, dtSec: number) => boolean | void
  /** 到达时长或被 onTick 提前结束时回调一次 */
  onFinish: () => void
}

/**
 * 驱动一个 durationSec 的倒计时时钟。
 * @returns finishedRef 已结束标记（仅供引擎读取，勿手动置位）
 */
export function useGameClock(
  durationSec: number,
  pausedRef: React.MutableRefObject<boolean>,
  callbacks: GameClockCallbacks,
) {
  const finished = useRef(false)
  const startRef = useRef(0)
  const pausedAtRef = useRef(0)
  const pausedAccumRef = useRef(0)
  const prevElapsedRef = useRef(0)
  const onTickRef = useRef(callbacks.onTick)
  const onFinishRef = useRef(callbacks.onFinish)
  onTickRef.current = callbacks.onTick
  onFinishRef.current = callbacks.onFinish

  useEffect(() => {
    startRef.current = performance.now()
    finished.current = false
    pausedAtRef.current = 0
    pausedAccumRef.current = 0
    prevElapsedRef.current = 0

    const loop = () => {
      const now = performance.now()

      if (pausedRef.current) {
        // 进入暂停：记录暂停起点（不推进计时）
        if (!pausedAtRef.current) pausedAtRef.current = now
        requestAnimationFrame(loop)
        return
      }
      // 离开暂停：把暂停时长累加到偏移量
      if (pausedAtRef.current) {
        pausedAccumRef.current += now - pausedAtRef.current
        pausedAtRef.current = 0
      }

      const elapsedMs = now - startRef.current - pausedAccumRef.current
      const elapsedSec = Math.max(0, elapsedMs / 1000)
      const dtSec = Math.min(0.1, elapsedSec - prevElapsedRef.current)
      prevElapsedRef.current = elapsedSec

      const shouldEnd = onTickRef.current?.(elapsedSec, dtSec)
      if (shouldEnd === true || elapsedSec >= durationSec) {
        if (!finished.current) {
          finished.current = true
          onFinishRef.current?.()
        }
        return
      }

      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)
    return () => {
      // 卸载时不触发 onFinish
    }
  }, [durationSec]) // eslint-disable-line react-hooks/exhaustive-deps

  return { finishedRef: finished }
}
