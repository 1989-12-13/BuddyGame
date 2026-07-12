// ============================================================
// StepOrder — 步骤排序
// 打乱的步骤列表，玩家按正确顺序逐个点击
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import type { MiniGameProps, StepOrderSpec } from '../../../game/types'

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
}

export function StepOrder({ spec, onComplete }: MiniGameProps) {
  const s = spec as StepOrderSpec
  const finished = useRef(false)

  // 打乱步骤
  const shuffled = useMemo(
    () => [...s.steps].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [done, setDone] = useState<Set<number>>(new Set())      // 已完成步骤的索引
  const [stepIndex, setStepIndex] = useState(0)                  // 下一个应选步骤（s.steps 中的位置）
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)  // 最近点错的闪烁项

  useEffect(() => {
    if (wrongIdx !== null) {
      const t = setTimeout(() => setWrongIdx(null), 400)
      return () => clearTimeout(t)
    }
  }, [wrongIdx])

  const handleClick = (shufIdx: number) => {
    if (finished.current) return
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
        setTimeout(() => onComplete(1, true), 500)
      }
    } else {
      setWrongIdx(shufIdx)
    }
  }

  const allDone = stepIndex >= s.steps.length
  const progress = s.steps.length > 0 ? (stepIndex / s.steps.length) * 100 : 0

  return (
    <div style={wrap}>
      <div style={{
        width: '100%', height: 4, borderRadius: 2,
        backgroundColor: 'var(--border)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          backgroundColor: allDone ? '#22c55e' : '#58a6ff',
          borderRadius: 2,
          transition: 'width 0.3s, background-color 0.3s',
        }} />
      </div>

      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
        按正确顺序点击步骤（第 {stepIndex + 1}/{s.steps.length} 步）
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        {shuffled.map((step, i) => {
          const isDone = done.has(i)
          const isWrong = wrongIdx === i
          return (
            <div
              key={`${step}-${i}`}
              onClick={() => handleClick(i)}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: isWrong
                  ? '2px solid #ff5454'
                  : isDone
                    ? '2px solid #22c55e'
                    : '1px solid #d1d9e8',
                backgroundColor: isDone
                  ? 'rgba(5,150,105,0.06)'
                  : isWrong
                    ? 'rgba(239,68,68,0.06)'
                    : '#fff',
                cursor: isDone ? 'default' : 'pointer',
                opacity: isDone ? 0.6 : 1,
                fontSize: 13,
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
                fontSize: 11, fontWeight: 'bold',
                backgroundColor: isDone ? '#22c55e' : 'var(--border)',
                color: isDone ? '#fff' : 'var(--text-muted)',
                marginTop: 1,
              }}>
                {isDone ? '✓' : Array.from(done).indexOf(i) !== -1 ? '' : String.fromCharCode(65 + i)}
              </span>
              <span style={{ flex: 1 }}>{step}</span>
            </div>
          )
        })}
      </div>

      {allDone && (
        <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 'bold', marginTop: 4 }}>
          ✓ 操作步骤全部正确！
        </div>
      )}
    </div>
  )
}
