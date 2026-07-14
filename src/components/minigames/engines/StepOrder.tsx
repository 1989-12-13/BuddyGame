// ============================================================
// StepOrder — 步骤排序
// 打乱的步骤列表，玩家按正确顺序逐个点击
// ============================================================

import { useEffect, useRef, useState } from 'react'
import type { MiniGameProps, StepOrderSpec } from '../../../game/types'
import { isStepOrder } from '../../../game/types'
import { shuffle } from '../../../game/core/random'
import { usePauseRef } from './hooks'
import { useMiniGameFinish } from './useMiniGameFinish'
import { engineWrap } from './styles'

const WRONG_FLASH_MS = 400

export function StepOrder({ spec, onComplete, paused }: MiniGameProps) {
  if (!isStepOrder(spec)) return null
  const s: StepOrderSpec = spec
  const finished = useRef(false)
  const pausedRef = usePauseRef(paused)
  const { complete } = useMiniGameFinish(onComplete, 500)

  // 打乱步骤（惰性初始化，只执行一次）
  const shuffledRef = useRef<string[] | null>(null)
  if (shuffledRef.current === null) {
    shuffledRef.current = shuffle([...s.steps])
  }
  const shuffled = shuffledRef.current

  const [done, setDone] = useState<Set<number>>(new Set())      // 已完成步骤的索引
  const [stepIndex, setStepIndex] = useState(0)                  // 下一个应选步骤（s.steps 中的位置）
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)  // 最近点错的闪烁项

  useEffect(() => {
    if (wrongIdx !== null) {
      const t = setTimeout(() => setWrongIdx(null), WRONG_FLASH_MS)
      return () => clearTimeout(t)
    }
  }, [wrongIdx])

  const handleClick = (shufIdx: number) => {
    if (finished.current || pausedRef.current) return
    if (done.has(shufIdx)) return
    const clicked = shuffled[shufIdx]
    const correct = s.steps[stepIndex]

    if (clicked === correct) {
      const next = new Set(done)
      next.add(shufIdx)
      setDone(next)
      const newIdx = stepIndex + 1
      setStepIndex(newIdx)

      // 全部完成
      if (newIdx >= s.steps.length) {
        finished.current = true
        complete(1, true)
      }
    } else {
      setWrongIdx(shufIdx)
    }
  }

  const allDone = stepIndex >= s.steps.length
  const progress = s.steps.length > 0 ? (stepIndex / s.steps.length) * 100 : 0

  return (
    <div style={engineWrap}>
      <div style={{
        width: '100%', height: 4, borderRadius: 2,
        backgroundColor: 'var(--border)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          backgroundColor: allDone ? 'var(--accent-green)' : 'var(--accent-blue)',
          borderRadius: 2,
          transition: 'width 0.3s, background-color 0.3s',
        }} />
      </div>

      <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-secondary)' }}>
        请按正确顺序点击：第 {stepIndex + 1} 步 / 共 {s.steps.length} 步
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        {shuffled.map((step, i) => {
          const isDone = done.has(i)
          const isWrong = wrongIdx === i
          return (
            <div
              key={`step-${i}`}
              onClick={() => handleClick(i)}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: isWrong
                  ? '2px solid var(--danger-red)'
                  : isDone
                    ? '2px solid var(--accent-green)'
                    : '1px solid var(--border)',
                backgroundColor: isDone
                  ? 'var(--success-green-bg)'
                  : isWrong
                    ? 'var(--danger-red-bg)'
                    : 'var(--bg-surface)',
                cursor: isDone ? 'default' : 'pointer',
                opacity: isDone ? 0.6 : 1,
                fontSize: 'var(--fs-body-sm)',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                userSelect: 'none',
                animation: isWrong ? 'shake 0.3s ease-in-out' : undefined,
              }}
            >
              <span style={{
                flexShrink: 0,
                width: 22, height: 22, borderRadius: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)',
                backgroundColor: isDone ? 'var(--accent-green)' : 'var(--border)',
                color: isDone ? '#fff' : 'var(--text-muted)',
                marginTop: 1,
              }}>
                {isDone ? '✓' : String.fromCharCode(65 + i)}
              </span>
              <span style={{ flex: 1 }}>{step}</span>
            </div>
          )
        })}
      </div>

      {allDone && (
        <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--accent-green)', fontWeight: 'var(--fw-bold)', marginTop: 4 }}>
          ✓ 操作步骤全部正确！
        </div>
      )}
    </div>
  )
}
