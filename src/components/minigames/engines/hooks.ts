// ============================================================
// 零点接线台 — 小游戏引擎共享 hooks
// 消除各引擎间的重复逻辑：暂停引用、键盘绑定、尝试-计分、完成守卫
// 计时时钟见 useGameClock.ts，完成守卫见 useMiniGameFinish.ts
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MiniGameProps } from '../../../game/types'
import { computePassed } from './scoring'
import { useMiniGameFinish } from './useMiniGameFinish'

// -------------------- 暂停跟踪 --------------------
/** 标准化暂停引用，各引擎复用，避免每处各写一遍 useEffect + pausedRef */
export function usePauseRef(paused?: boolean) {
  const pausedRef = useRef(false)
  useEffect(() => { pausedRef.current = !!paused }, [paused])
  return pausedRef
}

// -------------------- 键盘事件绑定 --------------------
/** 标准化 Space 键绑定，消除各引擎中重复的 window.addEventListener('keydown') */
export function useKeyboard(
  key: string,
  callbacks: {
    onDown?: (e: KeyboardEvent) => void
    onUp?: (e: KeyboardEvent) => void
  },
) {
  const downRef = useRef(callbacks.onDown)
  const upRef = useRef(callbacks.onUp)
  downRef.current = callbacks.onDown
  upRef.current = callbacks.onUp

  useEffect(() => {
    const handler = (e: KeyboardEvent, type: 'down' | 'up') => {
      if (e.code !== key) return
      e.preventDefault()
      if (type === 'down') downRef.current?.(e)
      else upRef.current?.(e)
    }
    const onDown = (e: KeyboardEvent) => handler(e, 'down')
    const onUp = (e: KeyboardEvent) => handler(e, 'up')
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [key])
}

// -------------------- 尝试-计分（QuickChoice / LocationSelect 共用） --------------------
interface AttemptScoringSpec {
  /** 正确选项索引 */
  correctIndex: number
  /** 通过阈值 */
  passThreshold: number
}

export function useAttemptScoring(
  spec: AttemptScoringSpec,
  onComplete: MiniGameProps['onComplete'],
  pausedRef: React.MutableRefObject<boolean>,
) {
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const attemptsRef = useRef(0)
  const { complete } = useMiniGameFinish(onComplete, 1000)

  const handleSelect = useCallback(
    (idx: number) => {
      if (showResult || pausedRef.current) return
      attemptsRef.current += 1
      setAttempts(attemptsRef.current)
      setSelected(idx)
      setShowResult(true)

      const correct = idx === spec.correctIndex
      if (correct) {
        const score = Math.max(0.3, 1 - (attemptsRef.current - 1) * 0.3)
        complete(score, computePassed(score, spec.passThreshold))
      } else {
        setTimeout(() => {
          setShowResult(false)
          setSelected(null)
        }, 1500)
      }
    },
    [showResult, spec.correctIndex, spec.passThreshold, complete, pausedRef],
  )

  // 重置（mounted 时）
  useEffect(() => {
    attemptsRef.current = 0
    setAttempts(0)
    setSelected(null)
    setShowResult(false)
  }, [])

  return {
    selected,
    showResult,
    attempts,
    handleSelect,
    isCorrect: selected === spec.correctIndex,
  }
}
