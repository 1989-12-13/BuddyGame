// ============================================================
// engineStyles — 小游戏引擎共享布局样式
// 统一所有 engine 组件的视觉语言，消除重复内联样式
// ============================================================

import type React from 'react'

/** 容器：垂直居中、间距统一 */
export const engineWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
}

/** 数据面板（BPM、计数等指标） */
export const readoutRow: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  fontFamily: 'monospace',
}

/** 圆形按压区域 */
export function pressCircle(
  opts: {
    size?: number
    pulse?: boolean
    flashColor?: string
  } = {},
): React.CSSProperties {
  const { size = 130, pulse = false, flashColor = '#ef4444' } = opts
  return {
    width: size,
    height: size,
    borderRadius: '50%',
    background: pulse
      ? `radial-gradient(circle at 50% 50%, #fecaca, var(--bg-surface))`
      : 'radial-gradient(circle at 50% 50%, var(--border-light), var(--bg-elevated))',
    border: `4px solid ${pulse ? flashColor : 'var(--text-muted)'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    transform: pulse ? 'scale(0.9)' : 'scale(1)',
    transition: 'transform 0.08s',
    boxShadow: pulse ? `0 0 20px ${flashColor}4d` : 'none',
    position: 'relative',
  }
}

/** 进度条容器 */
export const progressTrack: React.CSSProperties = {
  width: 240,
  height: 6,
  borderRadius: 3,
  backgroundColor: 'var(--border-light)',
  overflow: 'hidden',
}

/** 进度条填充块 */
export function progressFill(percent: number, color = 'var(--danger-red)'): React.CSSProperties {
  return {
    width: `${Math.min(100, Math.max(0, percent))}%`,
    height: '100%',
    backgroundColor: color,
    transition: 'width 0.1s',
  }
}

/** 历史质量点 */
export function qualityDot(color: string): React.CSSProperties {
  return {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: color,
  }
}

/** 历史质量条容器 */
export const qualityRow: React.CSSProperties = {
  display: 'flex',
  gap: 2,
  flexWrap: 'wrap',
}

/** 反馈文字 */
export function feedbackText(color: string): React.CSSProperties {
  return {
    fontSize: 14,
    color,
    fontWeight: 'bold',
  }
}

/** 完成状态文字 */
export const doneText: React.CSSProperties = {
  fontSize: 16,
  color: '#16a34a',
  fontWeight: 'bold',
  padding: '10px 0',
}

/** 状态行 */
export const statusRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  padding: '0 4px',
}

/** 状态标签 */
export const statusLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 'bold',
  color: 'var(--text-muted)',
  fontFamily: 'monospace',
}

/** 按压提示（按钮内） */
export const pressHint: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  fontWeight: 'bold',
  textAlign: 'center',
  lineHeight: 1.3,
}

/** 按压提示-高亮版 */
export const pressHintActive: React.CSSProperties = {
  ...pressHint,
  color: 'var(--danger-red)',
}
