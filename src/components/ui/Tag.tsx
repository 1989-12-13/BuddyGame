// ============================================================
// 零点接线台 — 状态标签组件
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
  success: { bg: 'rgba(22, 163, 74, 0.12)', text: '#16a34a', border: '#16a34a' },
  warning: { bg: 'rgba(217, 119, 6, 0.12)', text: '#d97706', border: '#d97706' },
  danger:  { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', border: '#ef4444' },
  info:    { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6', border: '#3b82f6' },
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
      fontSize: 11,
      fontWeight: 700,
      fontFamily: 'monospace',
      backgroundColor: customColor ? `${customColor}18` : palette.bg,
      color: customColor ?? palette.text,
      border: `1px solid ${customColor ?? palette.border}`,
      ...style,
    } as CSSProperties}>
      {children}
    </span>
  )
}
