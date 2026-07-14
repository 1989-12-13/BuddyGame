import type { CSSProperties } from 'react'

/** 急救指导 — 背景遮罩 */
export const guidanceOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 900,
  backgroundColor: 'rgba(0,0,0,0.55)',
  backdropFilter: 'blur(3px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'fade-in 0.2s ease',
}

export const guidanceWindow: CSSProperties = {
  width: 420,
  maxHeight: '85vh',
  backgroundColor: 'var(--bg-elevated)',
  borderRadius: 14,
  border: '1px solid var(--danger-red-border)',
  boxShadow: '0 0 0 1px rgba(220,38,38,0.15), var(--shadow-lg)',
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
  borderBottom: '1px solid var(--danger-red-border)',
  backgroundColor: 'rgba(220,38,38,0.06)',
}

/** 指导面板 */
export const guidancePanel: CSSProperties = {
  padding: '14px 16px',
  backgroundColor: 'var(--bg-surface)',
  borderRadius: 10,
  flex: 1,
  minHeight: 60,
  overflowY: 'auto',
  boxShadow: '0 0 0 1px var(--danger-red-border), var(--shadow-md)',
}

export const guidanceTitle: CSSProperties = {
  fontSize: 17,
  fontWeight: 'bold',
  color: 'var(--danger-red)',
  marginBottom: 8,
  letterSpacing: 0.5,
}

export const guidanceIntro: CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  marginBottom: 10,
  padding: '10px 12px',
  backgroundColor: 'var(--warning-amber-bg)',
  borderRadius: 8,
  borderLeft: '2px solid var(--warning-amber)',
  lineHeight: 1.6,
}

export const guidanceStep: CSSProperties = {
  marginTop: 10,
}

export const guidancePrompt: CSSProperties = {
  fontSize: 14,
  fontWeight: 'bold',
  color: 'var(--text-primary)',
  marginBottom: 6,
  padding: '6px 0',
}

export const guidanceOption: CSSProperties = {
  padding: '10px 14px',
  border: '1.5px solid var(--border)',
  borderRadius: 8,
  backgroundColor: 'var(--bg-elevated)',
  cursor: 'pointer',
  fontSize: 13,
  color: 'var(--text-primary)',
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
  borderRadius: 12,
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
  borderRadius: 8,
  textAlign: 'center',
  boxShadow: 'var(--shadow-sm)',
}

export const closingSummaryLabel: CSSProperties = {
  fontSize: 10,
  color: 'var(--text-muted)',
  marginBottom: 2,
}

export const closingSummaryValue: CSSProperties = {
  fontSize: 13,
  fontWeight: 'bold',
  color: 'var(--text-primary)',
}

export const endCallBtn: CSSProperties = {
  width: '100%',
  maxWidth: 280,
  padding: '10px 24px',
  backgroundColor: 'var(--danger-red)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'all 0.15s',
}
