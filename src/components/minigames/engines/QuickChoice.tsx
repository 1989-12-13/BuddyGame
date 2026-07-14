// ============================================================
// QuickChoice — 快速选择题
// 纯文字版急救知识点选择题，选择正确的急救操作方法
// ============================================================

import { useMemo } from 'react'
import type { MiniGameProps, QuickChoiceSpec } from '../../../game/types'
import { isQuickChoice } from '../../../game/types'
import { usePauseRef, useAttemptScoring } from './hooks'
import { engineWrap, progressTrack } from './styles'
import { createShuffleMap } from '../../../utils/shuffleUtils'

const questionCard: React.CSSProperties = {
  fontSize: 'var(--fs-body)',
  fontWeight: 'var(--fw-bold)',
  color: 'var(--text-primary)',
  textAlign: 'left',
  padding: '12px 14px',
  lineHeight: 1.6,
  backgroundColor: 'var(--bg-elevated)',
  borderRadius: 10,
  borderLeft: '3px solid var(--accent-blue)',
  width: '100%',
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

const resultBox: React.CSSProperties = {
  fontSize: 'var(--fs-body-sm)',
  fontWeight: 'var(--fw-bold)',
  padding: '8px 14px',
  borderRadius: 8,
  textAlign: 'center',
}

export function QuickChoice({ spec, onComplete, paused }: MiniGameProps) {
  if (!isQuickChoice(spec)) return null
  const s = spec
  const pausedRef = usePauseRef(paused)

  // 打乱选项顺序，防止玩家通过位置记忆作答
  const shuffleMap = useMemo(
    () => createShuffleMap(s.options.length),
    [s.options.length],
  )
  const displayOptions = shuffleMap.toOriginal.map(i => s.options[i])
  const displayCorrectIndex = shuffleMap.toDisplay[s.correctIndex]

  const { selected, showResult, attempts, handleSelect, isCorrect } = useAttemptScoring(
    { correctIndex: displayCorrectIndex, passThreshold: s.passThreshold },
    onComplete,
    pausedRef,
  )

  return (
    <div style={engineWrap}>
      {/* 题目 */}
      <div style={questionCard}>
        {s.question}
      </div>

      {/* 选项 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        {displayOptions.map((opt, i) => {
          const isSelected = selected === i
          const isThisCorrect = i === displayCorrectIndex

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
                fontSize: 'var(--fs-body-sm)',
                cursor: showResult ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: showResult && !isSelected && !isThisCorrect ? 0.35 : 1,
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
                fontSize: 'var(--fs-small)',
                fontWeight: 'var(--fw-bold)',
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
          {isCorrect ? '✓ 回答正确！' : '✗ 答错了。绿色标注的是正确答案，记住下次要选这个哦！'}
        </div>
      )}

      {/* 尝试进度 */}
      {!showResult && (
        <div style={{ ...progressTrack, width: '100%', height: 4, borderRadius: 2, backgroundColor: 'var(--border)' }}>
          <div style={{
            height: '100%',
            borderRadius: 2,
            width: `${Math.min(100, attempts * 40)}%`,
            background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))',
            transition: 'width 0.3s',
          }} />
        </div>
      )}
    </div>
  )
}
