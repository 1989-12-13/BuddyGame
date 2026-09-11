import type { CSSProperties } from 'react'

/** 急救指导 — 背景遮罩 */
export const guidanceOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 900,
  backgroundColor: 'var(--scrim)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'fade-in 0.2s ease',
}

export const guidanceWindow: CSSProperties = {
  width: 420,
  maxHeight: '85vh',
  backgroundColor: 'var(--bg-raised)',
  borderRadius: 'var(--radius-2xl)',
  border: '1px solid var(--danger-line)',
  boxShadow: '0 0 0 1px var(--danger-line), var(--shadow-lg)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  animation: 'fade-in-up 0.25s ease',
}

export const guidanceWindowHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '14px 18px',
  borderBottom: '1px solid var(--danger-line)',
  backgroundColor: 'var(--danger-bg)',
}

/** 指导面板 */
export const guidancePanel: CSSProperties = {
  padding: '14px 16px',
  backgroundColor: 'var(--bg-surface)',
  borderRadius: 'var(--radius-xl)',
  flex: 1,
  minHeight: 60,
  overflowY: 'auto',
  border: '1px solid var(--line)',
  boxShadow: 'none',
}

export const guidanceTitle: CSSProperties = {
  fontSize: 'var(--fs-subtitle)',
  fontWeight: 'var(--fw-bold)',
  color: 'var(--text)',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 8,
  letterSpacing: 0.5,
}

export const guidanceIntro: CSSProperties = {
  fontSize: 'var(--fs-body-sm)',
  color: 'var(--text-2)',
  marginBottom: 10,
  padding: '10px 12px',
  backgroundColor: 'var(--bg-raised)',
  borderRadius: 'var(--radius-lg)',
  borderLeft: '2px solid var(--accent)',
  lineHeight: 1.6,
}

export const guidanceStep: CSSProperties = {
  marginTop: 10,
}

export const guidancePrompt: CSSProperties = {
  fontSize: 'var(--fs-body)',
  fontWeight: 'var(--fw-bold)',
  color: 'var(--text)',
  marginBottom: 6,
  padding: '6px 0',
}

export const guidanceOption: CSSProperties = {
  padding: '10px 14px',
  border: '1.5px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--bg-raised)',
  cursor: 'pointer',
  fontSize: 'var(--fs-body-sm)',
  color: 'var(--text)',
  textAlign: 'left',
  transition: 'all 0.12s ease',
}

/** 收尾阶段 */
export const closingPanel: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  padding: '20px 16px',
  flex: 1,
  minHeight: 60,
  overflowY: 'auto',
}

export const closingStatusCard: CSSProperties = {
  width: '100%',
  maxWidth: 280,
  padding: '20px 16px',
  backgroundColor: 'var(--bg-surface)',
  borderRadius: 'var(--radius-2xl)',
  textAlign: 'center',
  boxShadow: 'var(--shadow-md)',
}

export const closingSummaryGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  width: '100%',
  maxWidth: 280,
}

export const closingSummaryItem: CSSProperties = {
  padding: '10px 12px',
  backgroundColor: 'var(--bg-surface)',
  borderRadius: 'var(--radius-lg)',
  textAlign: 'center',
  boxShadow: 'var(--shadow-sm)',
}

export const closingSummaryLabel: CSSProperties = {
  fontSize: 'var(--fs-micro)',
  color: 'var(--text-3)',
  marginBottom: 2,
}

export const closingSummaryValue: CSSProperties = {
  fontSize: 'var(--fs-body-sm)',
  fontWeight: 'var(--fw-bold)',
  color: 'var(--text)',
}

export const endCallBtn: CSSProperties = {
  width: '100%',
  maxWidth: 280,
  padding: '10px 24px',
  backgroundColor: 'var(--danger)',
  color: 'var(--on-danger)',
  border: 'none',
  borderRadius: 'var(--radius-lg)',
  fontSize: 'var(--fs-body)',
  fontWeight: 'var(--fw-bold)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'all 0.15s',
}
