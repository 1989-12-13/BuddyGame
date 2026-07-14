import type { CSSProperties } from 'react'

/** 问询区域 */
export const questionArea: CSSProperties = {
  borderTop: '1px solid var(--border)',
  padding: '6px 10px',
  backgroundColor: 'var(--bg-surface)',
  flex: 1,
  minHeight: 60,
  overflowY: 'auto',
}

export const qSection: CSSProperties = {
  marginBottom: 6,
}

export const qSectionTitle: CSSProperties = {
  fontSize: 12,
  fontWeight: 'bold',
  color: 'var(--text-muted)',
  marginBottom: 3,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  borderBottom: '1px solid var(--border)',
  paddingBottom: 2,
}

/** 5步协议步骤列表 */
export const protocolStepsList: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginBottom: 4,
}

export const protocolStepRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid',
  transition: 'all 0.25s',
}

export const protocolStepNum: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 900,
  fontFamily: 'monospace',
  flexShrink: 0,
}

export const protocolStepBtn: CSSProperties = {
  padding: '4px 12px',
  borderRadius: 4,
  border: 'none',
  backgroundColor: 'var(--warning-amber)',
  color: '#fff',
  fontSize: 11,
  fontWeight: 'bold',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s',
  fontFamily: 'monospace',
}

export const qBtnSmall: CSSProperties = {
  padding: '3px 8px',
  borderRadius: 4,
  border: '1px solid',
  fontSize: 11,
  lineHeight: '1.3',
  textAlign: 'center',
}

export const qGrid: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
}

export const qBtn: CSSProperties = {
  padding: '5px 10px',
  borderRadius: 4,
  border: '1px solid',
  fontSize: 13,
  transition: 'all 0.15s',
  lineHeight: '1.4',
}

/** 来电者压力条 */
export const stressBar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '2px 0',
}

export const stressTrack: CSSProperties = {
  flex: 1,
  height: 7,
  backgroundColor: 'var(--border)',
  borderRadius: 4,
  overflow: 'hidden',
}

export const stressFill: CSSProperties = {
  height: '100%',
  borderRadius: 4,
  transition: 'width 0.5s ease, background-color 0.3s ease',
}

/** 底部工具栏 */
export const bottomToolbar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 10px',
  borderTop: '1px solid var(--border)',
  backgroundColor: 'var(--bg-surface)',
}

export const terminalBtn: CSSProperties = {
  padding: '8px 16px',
  borderRadius: 6,
  border: '2px solid',
  backgroundColor: 'transparent',
  color: '#b1bac4',
  fontSize: 14,
  fontWeight: 'bold',
  cursor: 'pointer',
  fontFamily: 'monospace',
  letterSpacing: 0.5,
  transition: 'all 0.2s',
}

export const calmBtn: CSSProperties = {
  padding: '5px 12px',
  borderRadius: 4,
  border: '1px solid var(--accent-blue)',
  backgroundColor: 'rgba(14, 165, 233, 0.08)',
  color: '#b1bac4',
  fontSize: 13,
  fontWeight: 'bold',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
