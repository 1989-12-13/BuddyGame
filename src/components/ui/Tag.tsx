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
  success: { bg: 'var(--success-bg)', text: 'var(--success)', border: 'var(--success)' },
  warning: { bg: 'var(--warning-bg)', text: 'var(--warning)', border: 'var(--warning)' },
  danger:  { bg: 'var(--danger-bg)', text: 'var(--danger)', border: 'var(--danger)' },
  info:    { bg: 'var(--info-bg)', text: 'var(--accent)', border: 'var(--accent)' },
  default: { bg: 'var(--line-soft)', text: 'var(--text-2)', border: 'var(--line)' },
}

export function Tag({ children, color = 'default', customColor, style }: Props) {
  const palette = COLOR_MAP[color]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 'var(--radius-xl)',
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
