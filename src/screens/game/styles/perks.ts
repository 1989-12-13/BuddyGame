import type { CSSProperties } from 'react'

/** 肉鸽收益选择 */
export const perkScreen: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-12)',
  padding: 'var(--space-24)',
  backgroundColor: 'var(--bg-surface)',
}

export const perkHeader: CSSProperties = {
  fontSize: 'var(--fs-caption)',
  color: 'var(--accent-strong)',
  fontFamily: 'var(--font-mono)',
  letterSpacing: 2,
  fontWeight: 'var(--fw-extrabold)',
}

export const perkTitle: CSSProperties = {
  margin: 0,
  color: 'var(--text)',
  fontSize: 'var(--fs-heading)',
}

export const perkSubtitle: CSSProperties = {
  margin: 0,
  color: 'var(--text-3)',
  fontSize: 'var(--fs-body-sm)',
  maxWidth: 560,
  textAlign: 'center',
  lineHeight: 1.5,
}

export const perkGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 'var(--space-12)',
  width: 'min(720px, 100%)',
  marginTop: 'var(--space-8)',
}

export const perkCard: CSSProperties = {
  minHeight: 150,
  padding: 'var(--space-14) var(--space-16)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--bg-raised)',
  color: 'var(--text)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-8)',
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

export const perkCategory: CSSProperties = {
  fontSize: 'var(--fs-micro)',
  color: 'var(--accent-strong)',
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
  color: 'var(--text-2)',
  lineHeight: 1.5,
  flex: 1,
}

export const perkEffect: CSSProperties = {
  alignSelf: 'flex-start',
  padding: 'var(--space-4) var(--space-8)',
  border: '1px solid var(--accent-strong)',
  borderRadius: 999,
  color: 'var(--accent-strong)',
  fontSize: 'var(--fs-small)',
  fontWeight: 'var(--fw-extrabold)',
}
