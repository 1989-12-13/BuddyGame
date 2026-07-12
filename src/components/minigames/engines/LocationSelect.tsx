// ============================================================
// LocationSelect — 位置选择（止血点定位）
// 显示身体部位图 + 伤口标记，从选项中选择正确的止血点
// ============================================================

import { useRef, useState } from 'react'
import type { MiniGameProps, LocationSelectSpec } from '../../../game/types'

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
}

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

export function LocationSelect({ spec, onComplete }: MiniGameProps) {
  const s = spec as LocationSelectSpec
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
      <div style={row}>
        {/* 左侧：身体部位图 + 伤口标记 */}
        <div style={colLeft}>
          <svg viewBox="0 0 100 100" width={180} height={160}
            style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <defs>
          <radialGradient id="lsWound" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(239,68,68,0.4)" />
            <stop offset="100%" stopColor="rgba(239,68,68,0)" />
          </radialGradient>
        </defs>

        {s.bodyPart === 'arm' && (
          <g>
            <path d="M8 10 Q6 20 7 38 Q7 44 10 48 L14 50 Q18 52 20 50 L24 48 Q28 44 28 38 Q30 20 26 10 Z" fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.7} />
            <ellipse cx={18} cy={50} rx={7} ry={3.5} fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.6} />
            <path d="M10 52 Q8 60 9 70 Q9 78 11 82 L13 84 Q16 86 19 86 Q22 86 24 84 L26 82 Q28 78 28 70 Q29 60 27 52 Z" fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.7} />
            <rect x={12} y={84} width={12} height={3} rx={1.5} fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.5} />
            {/* 伤口 — 不规则切口 */}
            <path d="M14 73 Q16 71 18 74 Q20 72 22 75.5 Q19 77 16 75.5 Q14 76 14 73 Z" fill="#cc3333" stroke="#881111" strokeWidth={0.6} />
            <text x={30} y={77} fill="#ff3b3b" fontSize={4} fontWeight="bold">伤口</text>
          </g>
        )}

        {s.bodyPart === 'leg' && (
          <g>
            <path d="M14 6 Q10 18 12 34 Q12 40 14 44 L18 46 Q22 48 26 46 L30 44 Q34 40 34 34 Q36 18 32 6 Z" fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.7} />
            <ellipse cx={24} cy={48} rx={8} ry={3.5} fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.6} />
            <path d="M14 50 Q12 58 13 68 Q13 76 15 80 L17 82 Q20 84 24 84 Q28 84 30 82 L32 80 Q34 76 34 68 Q35 58 33 50 Z" fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.7} />
            {/* 伤口 — 不规则切口 */}
            <path d="M19 71 Q21 69 23 72 Q25 70 27 73.5 Q24 75 21 74 Q19 74 19 71 Z" fill="#cc3333" stroke="#881111" strokeWidth={0.6} />
            <text x={30} y={76} fill="#ff3b3b" fontSize={4} fontWeight="bold">伤口</text>
          </g>
        )}

        {s.bodyPart === 'head' && (
          <g>
            <ellipse cx={50} cy={48} rx={38} ry={40} fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.8} />
            <path d="M14 35 Q18 8 35 4 Q42 2 50 2 Q58 2 65 4 Q82 8 86 35 Q80 16 65 10 Q56 7 50 7 Q44 7 35 10 Q20 16 14 35 Z" fill="#3d2b1f" />
            <ellipse cx={34} cy={32} rx={3} ry={2} fill="#fff" stroke="#c9a98b" strokeWidth={0.3} />
            <circle cx={35} cy={32} r={1.2} fill="#2d1b0e" />
            <ellipse cx={66} cy={32} rx={3} ry={2} fill="#fff" stroke="#c9a98b" strokeWidth={0.3} />
            <circle cx={65} cy={32} r={1.2} fill="#2d1b0e" />
            {/* 伤口 — 钝器挫伤 */}
            <circle cx={50} cy={48} r={4} fill="url(#lsWound)" />
            <circle cx={50} cy={48} r={2.5} fill="#aa2222" />
            <circle cx={49} cy={47} r={1} fill="rgba(0,0,0,0.3)" />
            <text x={42} y={64} fill="#ff3b3b" fontSize={4} fontWeight="bold">伤口</text>
          </g>
        )}

        {s.bodyPart === 'chest' && (
          <g>
            <rect x={42} y={4} width={16} height={10} rx={3} fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.6} />
            <path d="M28 12 Q16 14 12 24 Q10 28 12 32 L16 32 Q14 26 16 22 Q20 16 30 14 Z" fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.6} />
            <path d="M72 12 Q84 14 88 24 Q90 28 88 32 L84 32 Q86 26 84 22 Q80 16 70 14 Z" fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.6} />
            <path d="M22 20 Q18 34 20 48 Q22 58 26 64 L74 64 Q78 58 80 48 Q82 34 78 20 Z" fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.7} />
            {/* 伤口 — 穿刺伤 */}
            <path d="M47 47 Q49 45 51 49 Q53 46 55 51 Q52 54 49 52 Q46 54 47 47 Z" fill="#cc3333" stroke="#881111" strokeWidth={0.6} />
            <circle cx={50} cy={49} r={1.5} fill="#991111" />
            <text x={52} y={62} fill="#ff3b3b" fontSize={4} fontWeight="bold">伤口</text>
          </g>
        )}
      </svg>

          {/* 伤口描述 */}
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
            {s.woundDesc}
          </div>
        </div>

        {/* 右侧：选项按钮 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
          {s.options.map((opt, i) => {
          const isSelected = selected === i
          const isThisCorrect = i === s.correctIndex
          let bg = '#fff'
          let border = 'var(--border)'
          let color = 'var(--text-primary)'

          if (showResult && isSelected) {
            if (isThisCorrect) {
              bg = '#22c55e'; border = '#22c55e'; color = '#fff'
            } else {
              bg = '#ff5454'; border = '#ff5454'; color = '#fff'
            }
          } else if (showResult && isThisCorrect && !isCorrect) {
            // 答错时高亮正确答案
            bg = 'rgba(5,150,105,0.1)'; border = '#22c55e'; color = '#22c55e'
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
                fontSize: 13,
                fontWeight: 'bold',
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
          fontSize: 13,
          fontWeight: 'bold',
          color: isCorrect ? '#22c55e' : '#ff5454',
          padding: '4px 0',
        }}>
          {isCorrect ? '✓ 正确！找到了近心端止血点' : '✗ 不对，正确答案已标出。请重试…'}
        </div>
      )}
    </div>
  )
}
