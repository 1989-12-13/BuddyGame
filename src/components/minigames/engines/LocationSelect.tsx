// ============================================================
// LocationSelect — 位置选择（止血点定位）
// 显示身体部位图 + 伤口标记，从选项中选择正确的止血点
// ============================================================

import { useMemo } from 'react'
import type { MiniGameProps, LocationSelectSpec } from '../../../game/types'
import { isLocationSelect } from '../../../game/types'
import { usePauseRef, useAttemptScoring } from './hooks'
import { engineWrap } from './styles'
import { BodySvg } from './bodyPartSvgs'
import { createShuffleMap } from '../../../utils/shuffleUtils'

const row: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  alignItems: 'flex-start',
  justifyContent: 'center',
  width: '100%',
}

const colLeft: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
}

export function LocationSelect({ spec, onComplete, paused }: MiniGameProps) {
  if (!isLocationSelect(spec)) return null
  const s: LocationSelectSpec = spec
  const pausedRef = usePauseRef(paused)

  // 打乱选项顺序，防止玩家通过位置记忆作答
  const shuffleMap = useMemo(
    () => createShuffleMap(s.options.length),
    [s.options.length],
  )
  const displayOptions = shuffleMap.toOriginal.map(i => s.options[i])
  const displayCorrectIndex = shuffleMap.toDisplay[s.correctIndex]

  const { selected, showResult, handleSelect, isCorrect } = useAttemptScoring(
    { correctIndex: displayCorrectIndex, passThreshold: s.passThreshold },
    onComplete,
    pausedRef,
  )

  return (
    <div style={engineWrap}>
      <div style={row}>
        {/* 左侧：身体部位图 + 伤口标记 */}
        <div style={colLeft}>
          <BodySvg bodyPart={s.bodyPart} />
          <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', textAlign: 'center' }}>
            {s.woundDesc}
          </div>
        </div>

        {/* 右侧：选项按钮 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
          {displayOptions.map((opt, i) => {
          const isSelected = selected === i
          const isThisCorrect = i === displayCorrectIndex
          let bg = 'var(--bg-surface)'
          let border = 'var(--border)'
          let color = 'var(--text-primary)'

          if (showResult && isSelected) {
            if (isThisCorrect) {
              bg = 'var(--accent-green)'; border = 'var(--accent-green)'; color = '#fff'
            } else {
              bg = 'var(--danger-red)'; border = 'var(--danger-red)'; color = '#fff'
            }
          } else if (showResult && isThisCorrect && !isCorrect) {
            bg = 'var(--success-green-bg)'; border = 'var(--accent-green)'; color = 'var(--accent-green)'
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={showResult}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: `2px solid ${border}`,
                backgroundColor: bg,
                color,
                fontSize: 'var(--fs-body-sm)',
                fontWeight: 'var(--fw-bold)',
                cursor: showResult ? 'default' : 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
                opacity: showResult && !isSelected && !isThisCorrect ? 0.5 : 1,
              }}
            >
              {showResult && isThisCorrect && '✓ '}
              {showResult && isSelected && !isThisCorrect && '✕ '}
              {opt}
            </button>
          )
        })}
        </div>
      </div>

      {/* 结果提示 */}
      {showResult && (
        <div style={{
          fontSize: 'var(--fs-body-sm)',
          fontWeight: 'var(--fw-bold)',
          color: isCorrect ? 'var(--accent-green)' : 'var(--danger-red)',
          padding: '4px 0',
        }}>
          {isCorrect ? '✓ 正确！位置选对了' : '✗ 不对，正确答案已标出，请重试……'}
        </div>
      )}
    </div>
  )
}
