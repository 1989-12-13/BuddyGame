import type { CSSProperties } from 'react'

/** MPDS 调度卡 leftsider（从左滑入式）
 * - top: 48 与 Hud 实际高度（minHeight 36 + padding 12 + border 1 ≈ 49px）近乎贴齐，
 *   顶部 1px 视觉呼吸；避免与 Hud 重叠（Hud 内容仍可读）
 * - bottom 保持贴底，dispatch 按钮（确认派车）放在底部最自然
 * - overflow: visible 让右侧 4px 拖拽手柄可见 */
export const modalOverlay: CSSProperties = {
  position: 'fixed',
  top: 48,
  bottom: 0,
  left: 0,
  width: 420,
  zIndex: 60,
  backgroundColor: 'var(--bg-elevated)',
  borderRight: '1px solid var(--border)',
  borderTop: '1px solid var(--border)',
  borderBottom: '1px solid var(--border)',
  borderRadius: '0 0 8px 0',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'visible',
  boxShadow: '6px 0 30px rgba(0,0,0,0.6)',
}

export const modalCard: CSSProperties = {
  width: '100%',
  height: '100%',
  backgroundColor: 'var(--bg-elevated)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderLeft: '2px solid var(--danger-red)',
  boxShadow: 'none',
}

export const modalHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  backgroundColor: 'var(--bg-surface)',
  borderBottom: '2px solid var(--danger-red)',
}

export const modalHeaderLeft: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

export const modalHeaderRight: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

export const mpdsModalBadge: CSSProperties = {
  backgroundColor: 'var(--border-light)',
  border: '2px solid var(--accent-blue)',
  borderRadius: 6,
  padding: '6px 12px',
  color: 'var(--accent-blue)',
  fontSize: 16,
  fontWeight: 900,
  fontFamily: 'monospace',
}

export const modalCloseBtn: CSSProperties = {
  padding: '4px 10px',
  backgroundColor: 'transparent',
  color: 'var(--text-muted)',
  border: '1px solid var(--border-bright)',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 'bold',
}

export const modalBody: CSSProperties = {
  flex: 1,
  padding: '10px 16px',
  overflowY: 'auto',
  minHeight: 0,
}

export const modalFooter: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  borderTop: '1px solid var(--border)',
  backgroundColor: 'var(--bg-surface)',
}

export const modalDispatchBtn: CSSProperties = {
  padding: '10px 24px',
  backgroundColor: 'var(--danger-red)',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 15,
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.15s',
}

export const modalDispatchBtnDisabled: CSSProperties = {
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-muted)',
  cursor: 'not-allowed',
  opacity: 0.55,
}

export const modalSaveBtn: CSSProperties = {
  padding: '8px 16px',
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 12,
  cursor: 'pointer',
}

export const modalEndCallBtn: CSSProperties = {
  padding: '8px 12px',
  backgroundColor: 'transparent',
  color: 'var(--text-muted)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 11,
  cursor: 'pointer',
}

export const modalWarning: CSSProperties = {
  padding: '6px 16px',
  backgroundColor: 'var(--danger-red-bg)',
  borderTop: '1px solid var(--danger-red)',
  color: 'var(--danger-red)',
  fontSize: 12,
  fontWeight: 'bold',
  textAlign: 'center',
}

/** 终端登记表单 */
export const terminalForm: CSSProperties = {
  padding: '0',
}

export const dispatchSent: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 12px',
  backgroundColor: 'var(--bg-elevated)',
  borderRadius: 6,
  border: '1px solid var(--success-green-dim)',
  flex: 1,
}

export const formField: CSSProperties = {
  marginBottom: 10,
}

export const formLabel: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 'bold',
  color: 'var(--text-secondary)',
  marginBottom: 4,
}

export const formInput: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 4,
  border: '1px solid var(--border)',
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: 13,
  fontFamily: 'monospace',
  resize: 'vertical',
  boxSizing: 'border-box',
}
