import type { CSSProperties } from 'react'
import { Z_TERMINAL_MODAL } from '../../../game/core/zIndex'

/** MPDS 调度卡 leftsider（从左滑入式） */
export const modalOverlay: CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  width: 420,
  zIndex: Z_TERMINAL_MODAL,
  backgroundColor: 'var(--bg-elevated)',
  borderRight: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
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
  fontSize: 'var(--fs-body)',
  fontWeight: 'var(--fw-black)',
  fontFamily: 'var(--font-mono)',
}

export const modalCloseBtn: CSSProperties = {
  padding: '4px 10px',
  backgroundColor: 'transparent',
  color: 'var(--text-muted)',
  border: '1px solid var(--border-bright)',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 'var(--fs-body)',
  fontWeight: 'var(--fw-bold)',
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
  fontSize: 'var(--fs-body-lg)',
  fontWeight: 'var(--fw-bold)',
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
  fontSize: 'var(--fs-caption)',
  cursor: 'pointer',
}

export const modalEndCallBtn: CSSProperties = {
  padding: '8px 12px',
  backgroundColor: 'transparent',
  color: 'var(--text-muted)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 'var(--fs-small)',
  cursor: 'pointer',
}

export const modalWarning: CSSProperties = {
  padding: '6px 16px',
  backgroundColor: 'var(--danger-red-bg)',
  borderTop: '1px solid var(--danger-red)',
  color: 'var(--danger-red)',
  fontSize: 'var(--fs-caption)',
  fontWeight: 'var(--fw-bold)',
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
  fontSize: 'var(--fs-body-sm)',
  fontWeight: 'var(--fw-bold)',
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
  fontSize: 'var(--fs-body-sm)',
  fontFamily: 'var(--font-mono)',
  resize: 'vertical',
  boxSizing: 'border-box',
}
