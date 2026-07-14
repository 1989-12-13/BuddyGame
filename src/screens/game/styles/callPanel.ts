import type { CSSProperties } from 'react'

/** 电话面板（全宽） */
export const phonePanel: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--bg-elevated)',
  overflow: 'hidden',
  minHeight: 0,
  border: '1px solid var(--border)',
}

export const phoneHeader: CSSProperties = {
  padding: '8px 12px',
  backgroundColor: 'var(--bg-surface)',
  borderBottom: '2px solid var(--danger-red)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

export const callLiveBar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

export const liveDot: CSSProperties = {
  fontSize: 12,
  color: 'var(--danger-red)',
  animation: 'pulse-live 1s ease-in-out infinite',
  display: 'inline-block',
}

export const liveLabel: CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  color: 'var(--danger-red)',
  fontFamily: 'monospace',
  letterSpacing: 2,
  textTransform: 'uppercase',
}

export const callTimer: CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  fontFamily: 'monospace',
  letterSpacing: 2,
}

export const targetBadge: CSSProperties = {
  marginLeft: 'auto',
  padding: '2px 8px',
  borderRadius: 10,
  border: '1px solid',
  fontSize: 12,
  fontWeight: 700,
  fontFamily: 'monospace',
}

export const phoneHeaderInfo: CSSProperties = {
  fontSize: 13,
  display: 'flex',
  gap: 6,
  color: 'var(--text-secondary)',
  fontFamily: 'monospace',
}

export const callPhaseTag: CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  fontFamily: 'monospace',
}

/** 对话区 — 通话逐字稿 */
export const dialogueArea: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minHeight: 0,
  backgroundColor: 'var(--bg-surface)',
}

export const transcript: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.7,
  fontFamily: '"Source Code Pro", "Consolas", "Courier New", monospace',
  padding: '4px 0',
  borderBottom: '1px solid var(--border-light)',
}

export const transcriptSpeaker: CSSProperties = {
  display: 'inline',
  fontWeight: 700,
  marginRight: 6,
  fontSize: 13,
}

export const transcriptText: CSSProperties = {
  display: 'inline',
}

export const streamCursor: CSSProperties = {
  display: 'inline-block',
  color: '#ef4444',
  fontSize: 14,
  marginLeft: 0,
  animation: 'pulse-live 0.7s step-end infinite',
  verticalAlign: 'baseline',
}
