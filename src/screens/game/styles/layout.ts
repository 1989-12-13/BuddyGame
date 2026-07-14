import type { CSSProperties } from 'react'
import { Z_FLOAT_CARD, Z_SPLIT_BAR } from '../../../game/core/zIndex'

/** 容器布局样式 */
export const container: CSSProperties = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--bg)',
  color: 'var(--text-primary)',
  overflow: 'hidden',
}

/** 主区（地图 + 浮层） */
export const mainArea: CSSProperties = {
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
  minHeight: 0,
}

/** 浮动卡片（居中弹窗） */
export const floatCard: CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  backgroundColor: 'rgba(17, 21, 28, 0.88)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '24px 32px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  backdropFilter: 'blur(6px)',
  zIndex: Z_FLOAT_CARD,
}

/** 可拖拽分隔条 */
export const splitBar: CSSProperties = {
  flex: 'none',
  height: 10,
  backgroundColor: 'var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'row-resize',
  userSelect: 'none',
  transition: 'background-color 0.15s',
  position: 'relative',
  zIndex: Z_SPLIT_BAR,
  flexShrink: 0,
}

export const splitBarHandle: CSSProperties = {
  display: 'flex',
  gap: 4,
  alignItems: 'center',
  pointerEvents: 'none',
}

export const splitBarDot: CSSProperties = {
  width: 4,
  height: 4,
  borderRadius: '50%',
  backgroundColor: 'var(--text-muted)',
}

/** 等待接听 — 紧急调度台 */
export const centerMessage: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  backgroundColor: 'var(--bg-surface)',
}

export const answerBtn: CSSProperties = {
  padding: '14px 48px',
  fontSize: 'var(--fs-heading)',
  fontWeight: 'var(--fw-bold)',
  backgroundColor: 'var(--danger-red)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  animation: 'pulse-alert 1.5s ease-in-out infinite',
  letterSpacing: 4,
}
