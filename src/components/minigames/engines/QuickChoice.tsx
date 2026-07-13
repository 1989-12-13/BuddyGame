// ============================================================
// QuickChoice — 快速选择题
// 纯文字版急救知识点选择题，选择正确的急救操作方法
// ============================================================

import { useRef, useState } from 'react'
import type { MiniGameProps, QuickChoiceSpec } from '../../../game/types'

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const questionCard: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 'bold',
  color: 'var(--text-primary)',
  textAlign: 'left',
  padding: '12px 14px',
  lineHeight: 1.6,
  backgroundColor: 'var(--bg-elevated)',
  borderRadius: 10,
  borderLeft: '3px solid var(--accent-blue)',
  width: '100%',
  maxWidth: 300,
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

const resultBox: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 'bold',
  padding: '8px 14px',
  borderRadius: 8,
  textAlign: 'center',
}

const progressBar: React.CSSProperties = {
  width: '100%',
  maxWidth: 300,
  height: 4,
  borderRadius: 2,
  backgroundColor: 'var(--border)',
  overflow: 'hidden',
}

export function QuickChoice({ spec, onComplete }: MiniGameProps) {
  const s = spec as QuickChoiceSpec
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const finished = useRef(false)
  const attemptsRef = useRef(0)

  const handleSelect = (idx: number) => {
    if (finished.current || showResult) return
    attemptsRef.current += 1
    setSelected(idx)
    setShowResult(true)

    const correct = idx === s.correctIndex
    if (correct) {
      finished.current = true
      const score = Math.max(0.3, 1 - (attemptsRef.current - 1) * 0.3)
      setTimeout(() => onComplete(score, score >= s.passThreshold), 1000)
    } else {
      setTimeout(() => {
        setShowResult(false)
        setSelected(null)
      }, 1500)
    }
  }

  const isCorrect = selected === s.correctIndex

  return (
    <div style={wrap}>
      {/* 题目 */}
      <div style={questionCard}>
        {s.question}
      </div>

      {/* 选项 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: 300 }}>
        {s.options.map((opt, i) => {
          const isSelected = selected === i
          const isThisCorrect = i === s.correctIndex

          let bg = 'var(--bg-surface)'
          let border = 'var(--border)'
          let color = 'var(--text-primary)'

          if (showResult && isSelected) {
            if (isThisCorrect) {
              bg = 'var(--success-green-bg)'; border = 'var(--success-green)'; color = 'var(--success-green)'
            } else {
              bg = 'var(--danger-red-bg)'; border = 'var(--danger-red)'; color = 'var(--danger-red)'
            }
          } else if (showResult && isThisCorrect && !isCorrect) {
            bg = 'var(--success-green-bg)'; border = 'var(--success-green)'; color = 'var(--success-green)'
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={showResult}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: `1.5px solid ${border}`,
                backgroundColor: bg,
                color,
                fontSize: 13,
                cursor: showResult ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: showResult && !isSelected && !isThisCorrect ? 0.35 : 1,
              }}
              onMouseEnter={(e) => {
                if (!showResult) e.currentTarget.style.borderColor = 'var(--accent-blue)'
              }}
              onMouseLeave={(e) => {
                if (!showResult) e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: isThisCorrect && showResult ? 'var(--success-green)' : isSelected && showResult ? 'var(--danger-red)' : 'var(--bg-elevated)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 'bold',
                flexShrink: 0,
              }}>
                {isThisCorrect && showResult ? '✓' : isSelected && showResult ? '✕' : OPTION_LABELS[i]}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
            </button>
          )
        })}
      </div>

      {/* 反馈 */}
      {showResult && (
        <div style={{
          ...resultBox,
          backgroundColor: isCorrect ? 'var(--success-green-bg)' : 'var(--danger-red-bg)',
          color: isCorrect ? 'var(--success-green)' : 'var(--danger-red)',
        }}>
          {isCorrect ? '✓ 回答正确！' : '✗ 答错了，正确答案已标出'}
        </div>
      )}

      {/* 尝试进度 */}
      {!showResult && (
        <div style={progressBar}>
          <div style={{
            height: '100%',
            borderRadius: 2,
            width: `${(attemptsRef.current / 2) * 100}%`,
            background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))',
            transition: 'width 0.3s',
          }} />
        </div>
      )}
    </div>
  )
}
