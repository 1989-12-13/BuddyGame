// ============================================================
// 120调度台 — 通用评分进度条
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

export function ScoreBar({ label, value, max, color = 'var(--accent)', showValue = true, style }: Props) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-3)', minWidth: 56, textAlign: 'right' }}>
        {label}
      </span>
      <div style={{
        flex: 1, height: 8, backgroundColor: 'var(--line-soft)',
        borderRadius: 'var(--radius-sm)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 'var(--radius-sm)', backgroundColor: color,
          width: `${pct}%`, transition: 'width 0.6s ease',
        }} />
      </div>
      {showValue && (
        <span style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)', fontFamily: 'var(--font-mono)', minWidth: 40, color }}>
          {value}/{max}
        </span>
      )}
    </div>
  )
}
