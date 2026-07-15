// ============================================================
// 120调度台 — 状态标签组件
// 语义色映射：success / warning / danger / info / default
// ============================================================

import type { CSSProperties } from 'react'

type TagColor = 'success' | 'warning' | 'danger' | 'info' | 'default'

interface Props {
  children: string
  color?: TagColor
  /** 自定义颜色（覆盖语义色） */
  customColor?: string
  style?: CSSProperties
}

const COLOR_MAP: Record<TagColor, { bg: string; text: string; border: string }> = {
  success: { bg: 'var(--success-green-bg)', text: 'var(--accent-green)', border: 'var(--accent-green)' },
  warning: { bg: 'var(--warning-amber-bg)', text: 'var(--accent-amber)', border: 'var(--accent-amber)' },
  danger:  { bg: 'var(--danger-red-bg)', text: 'var(--danger-red)', border: 'var(--danger-red)' },
  info:    { bg: 'var(--info-cyan-bg)', text: 'var(--accent-blue)', border: 'var(--accent-blue)' },
  default: { bg: 'var(--border-light)', text: 'var(--text-secondary)', border: 'var(--border)' },
}

export function Tag({ children, color = 'default', customColor, style }: Props) {
  const palette = COLOR_MAP[color]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 10,
      fontSize: 'var(--fs-small)',
      fontWeight: 'var(--fw-bold)',
      fontFamily: 'var(--font-mono)',
      backgroundColor: customColor ? `${customColor}18` : palette.bg,
      color: customColor ?? palette.text,
      border: `1px solid ${customColor ?? palette.border}`,
      ...style,
    } as CSSProperties}>
      {children}
    </span>
  )
}
