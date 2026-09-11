import type { CSSProperties } from 'react'

/** 问询区域 */
export const questionArea: CSSProperties = {
  borderTop: '1px solid var(--line)',
  padding: 'var(--space-6) var(--space-10)',
  backgroundColor: 'var(--bg-surface)',
  flex: 1,
  minHeight: 60,
  overflowY: 'auto',
}

export const qSection: CSSProperties = {
  marginBottom: 'var(--space-6)',
}

export const qSectionTitle: CSSProperties = {
  fontSize: 'var(--fs-caption)',
  fontWeight: 'var(--fw-bold)',
  color: 'var(--text-3)',
  marginBottom: 'var(--space-2)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  borderBottom: '1px solid var(--line)',
  paddingBottom: 'var(--space-2)',
}

/** 5步协议步骤列表 */
export const protocolStepsList: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
  marginBottom: 'var(--space-4)',
}

export const protocolStepRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-10)',
  padding: 'var(--space-8) var(--space-10)',
  borderRadius: 'var(--radius-md)',
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
  fontSize: 'var(--fs-caption)',
  fontWeight: 'var(--fw-black)',
  fontFamily: 'var(--font-mono)',
  flexShrink: 0,
}

export const protocolStepBtn: CSSProperties = {
  padding: 'var(--space-4) var(--space-12)',
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  backgroundColor: 'var(--warning)',
  color: 'var(--on-accent)',
  fontSize: 'var(--fs-small)',
  fontWeight: 'var(--fw-bold)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s',
  fontFamily: 'var(--font-mono)',
  minWidth: 56,
}

export const qBtnSmall: CSSProperties = {
  padding: 'var(--space-2) var(--space-8)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid',
  fontSize: 'var(--fs-small)',
  lineHeight: '1.3',
  textAlign: 'center',
}

export const qGrid: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--space-4)',
}

export const qBtn: CSSProperties = {
  padding: 'var(--space-4) var(--space-10)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid',
  fontSize: 'var(--fs-body-sm)',
  transition: 'all 0.15s',
  lineHeight: '1.4',
}

/** 来电者压力条 */
export const stressBar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-6)',
  padding: 'var(--space-2) 0',
}

export const stressTrack: CSSProperties = {
  flex: 1,
  height: 7,
  backgroundColor: 'var(--line)',
  borderRadius: 'var(--radius-sm)',
  overflow: 'hidden',
}

export const stressFill: CSSProperties = {
  height: '100%',
  borderRadius: 'var(--radius-sm)',
  transition: 'width 0.5s ease, background-color 0.3s ease',
}

/** 底部工具栏 */
export const bottomToolbar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-10)',
  padding: 'var(--space-6) var(--space-10)',
  borderTop: '1px solid var(--line)',
  backgroundColor: 'var(--bg-surface)',
}

export const terminalBtn: CSSProperties = {
  padding: 'var(--space-8) var(--space-16)',
  borderRadius: 'var(--radius-md)',
  border: '2px solid',
  backgroundColor: 'transparent',
  color: 'var(--text-2)',
  fontSize: 'var(--fs-body)',
  fontWeight: 'var(--fw-bold)',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
  letterSpacing: 0.5,
  transition: 'all 0.2s',
}

export const calmBtn: CSSProperties = {
  padding: 'var(--space-4) var(--space-12)',
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  backgroundColor: 'var(--accent)',
  color: 'var(--on-accent)',
  fontSize: 'var(--fs-small)',
  fontWeight: 'var(--fw-bold)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s',
  fontFamily: 'var(--font-mono)',
  minWidth: 56,
}
