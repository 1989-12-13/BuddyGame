// ============================================================
// 零点接线台 — 通用评分进度条
// 特性：标签 + 进度条 + 最大值/当前值显示
// ============================================================

import type { CSSProperties } from 'react'

interface Props {
  label: string
  value: number
  max: number
  color?: string
  /** 是否显示数值 */
  showValue?: boolean
  /** 额外样式 */
  style?: CSSProperties
}

export function ScoreBar({ label, value, max, color = 'var(--accent-blue)', showValue = true, style }: Props) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 56, textAlign: 'right' }}>
        {label}
      </span>
      <div style={{
        flex: 1, height: 8, backgroundColor: 'var(--border-light)',
        borderRadius: 4, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 4, backgroundColor: color,
          width: `${pct}%`, transition: 'width 0.6s ease',
        }} />
      </div>
      {showValue && (
        <span style={{ fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace', minWidth: 40, color }}>
          {value}/{max}
        </span>
      )}
    </div>
  )
}
