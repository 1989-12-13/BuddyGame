import type { CSSProperties } from 'react'

/** 肉鸽收益选择 */
export const perkScreen: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: 24,
  backgroundColor: 'var(--bg-surface)',
}

export const perkHeader: CSSProperties = {
  fontSize: 'var(--fs-caption)',
  color: 'var(--accent-cyan-bright)',
  fontFamily: 'var(--font-mono)',
  letterSpacing: 2,
  fontWeight: 'var(--fw-extrabold)',
}

export const perkTitle: CSSProperties = {
  margin: 0,
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-heading)',
}

export const perkSubtitle: CSSProperties = {
  margin: 0,
  color: 'var(--text-muted)',
  fontSize: 'var(--fs-body-sm)',
  maxWidth: 560,
  textAlign: 'center',
  lineHeight: 1.5,
}

export const perkGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  width: 'min(720px, 100%)',
  marginTop: 8,
}

export const perkCard: CSSProperties = {
  minHeight: 150,
  padding: '14px 16px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export const perkCategory: CSSProperties = {
  fontSize: 'var(--fs-micro)',
  color: 'var(--accent-cyan-bright)',
  fontFamily: 'var(--font-mono)',
  letterSpacing: 1.2,
  fontWeight: 'var(--fw-extrabold)',
}

export const perkName: CSSProperties = {
  fontSize: 'var(--fs-title)',
  fontWeight: 'var(--fw-extrabold)',
}

export const perkDesc: CSSProperties = {
  fontSize: 'var(--fs-caption)',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
  flex: 1,
}

export const perkEffect: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '4px 8px',
  border: '1px solid var(--accent-cyan-bright)',
  borderRadius: 999,
  color: 'var(--accent-cyan-bright)',
  fontSize: 'var(--fs-small)',
  fontWeight: 'var(--fw-extrabold)',
}
