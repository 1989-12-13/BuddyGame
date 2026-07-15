// ============================================================
// 120调度台 — 通用进度条组件
// 支持方向、颜色层级、动画过渡
// ============================================================

import type { CSSProperties } from 'react'

interface Props {
  /** 0-100 百分比 */
  value: number
  /** 进度条颜色 */
  color?: string
  /** 轨道颜色 */
  trackColor?: string
  /** 高度（px） */
  height?: number
  /** 是否显示圆角 */
  rounded?: boolean
  /** 动画持续时间（s） */
  duration?: number
  style?: CSSProperties
}

export function ProgressBar({
  value,
  color = 'var(--danger-red)',
  trackColor,
  height = 8,
  rounded = true,
  duration = 0.5,
  style,
}: Props) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div style={{
      width: '100%',
      height,
      backgroundColor: trackColor ?? 'var(--border)',
      borderRadius: rounded ? height / 2 : 0,
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        backgroundColor: color,
        borderRadius: rounded ? height / 2 : 0,
        transition: `width ${duration}s ease, background-color 0.3s ease`,
      }} />
    </div>
  )
}
