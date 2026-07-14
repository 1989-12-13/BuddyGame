// ============================================================
// EndingScreen — 样式对象与辅助样式函数（从 EndingScreen.tsx 提取）
// ============================================================

import type { CSSProperties } from 'react'
import { C_SUCCESS, C_WARNING, C_DANGER } from '../game/core/colors'

export const SAVE_THRESHOLD = 60 // 每通 ≥60 分视为"救回"

export function ratingColor(rating: string): string {
  switch (rating) {
    case 'gold': return C_WARNING
    case 'silver': return 'var(--text-secondary)'
    case 'bronze': return C_WARNING
    default: return C_DANGER
  }
}

export function badgeStyle(rating: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 16px',
    borderRadius: 4,
    border: `1px solid ${ratingColor(rating)}`,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    color: ratingColor(rating),
    fontSize: 'var(--fs-caption)',
    fontWeight: 'var(--fw-bold)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: 1,
  }
}

export function scoreBoxStyle(rating: string): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    padding: '12px 28px',
    borderRadius: 6,
    border: `1px solid ${ratingColor(rating)}40`,
    backgroundColor: `${ratingColor(rating)}10`,
  }
}

export function scoreValueStyle(rating: string): CSSProperties {
  return {
    fontSize: 'var(--fs-score)',
    fontWeight: 'var(--fw-extrabold)',
    color: ratingColor(rating),
    lineHeight: 1,
    fontFamily: 'var(--font-mono)',
    textShadow: `0 0 20px ${ratingColor(rating)}40`,
  }
}

export function savedSummaryStyle(saved: number, total: number): CSSProperties {
  return {
    fontSize: 'var(--fs-body)',
    fontWeight: 'var(--fw-extrabold)',
    fontFamily: 'var(--font-mono)',
    color: saved === total ? C_SUCCESS : saved > total / 2 ? C_WARNING : C_DANGER,
    letterSpacing: 1,
  }
}

export function callCardStyle(saved: boolean): CSSProperties {
  return {
    width: 78,
    padding: '8px 6px',
    borderRadius: 6,
    border: `1px solid ${saved ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.25)'}`,
    backgroundColor: saved ? 'rgba(22, 163, 74, 0.05)' : 'rgba(220, 38, 38, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  }
}

export function callCardScoreStyle(saved: boolean): CSSProperties {
  return {
    fontSize: 'var(--fs-title)',
    fontWeight: 'var(--fw-extrabold)',
    color: saved ? C_SUCCESS : C_DANGER,
    fontFamily: 'var(--font-mono)',
    lineHeight: 1,
  }
}

export function callCardStatusStyle(saved: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    fontSize: 'var(--fs-micro)',
    color: saved ? C_SUCCESS : C_DANGER,
    fontFamily: 'var(--font-mono)',
    fontWeight: 'var(--fw-semibold)',
  }
}

export function callCardBarFillStyle(saved: boolean, score: number): CSSProperties {
  return {
    width: `${Math.min(100, score)}%`,
    height: '100%',
    backgroundColor: saved ? C_SUCCESS : C_DANGER,
    transition: 'width 0.6s ease-out',
  }
}

export function ecgLineStyle(rating: string): CSSProperties {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: `linear-gradient(90deg, transparent, ${ratingColor(rating)}, transparent)`,
    opacity: 0.4,
    zIndex: 0,
  }
}

export const styles: Record<string, CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg)',
    position: 'relative',
    overflow: 'hidden',
    animation: 'fade-in 0.6s ease-out',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
    maxWidth: 520,
    padding: '20px',
    maxHeight: '100vh',
    overflowY: 'auto',
    textAlign: 'center' as const,
  },
  badgeWrap: {
    marginBottom: 4,
  },
  title: {
    fontSize: 'var(--fs-heading-xl)',
    fontWeight: 'var(--fw-extrabold)',
    color: 'var(--text-primary)',
    margin: 0,
    fontFamily: 'var(--font-mono)',
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 'var(--fs-body)',
    color: 'var(--text-muted)',
    margin: 0,
    fontStyle: 'italic',
    fontFamily: 'var(--font-body)',
  },
  divider: {
    width: 220,
    height: 1,
    background: 'linear-gradient(90deg, transparent, var(--border-bright), transparent)',
    margin: '8px 0',
  },
  scoreLabel: {
    fontSize: 'var(--fs-body)',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 'var(--fw-semibold)',
  },
  scoreMax: {
    fontSize: 'var(--fs-caption)',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  callsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
  },
  callsHeaderText: {
    fontSize: 'var(--fs-caption)',
    color: 'var(--text-muted)',
    fontWeight: 'var(--fw-bold)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  cardsGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    justifyContent: 'center',
    maxWidth: 420,
  },
  callCardNum: {
    fontSize: 'var(--fs-micro)',
    color: 'var(--text-muted)',
    fontWeight: 'var(--fw-bold)',
    fontFamily: 'var(--font-mono)',
  },
  callCardInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
  },
  callCardMax: {
    fontSize: 'var(--fs-micro)',
    color: 'var(--text-dim)',
    fontWeight: 'var(--fw-medium)',
  },
  callCardBar: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginTop: 2,
  },
  description: {
    fontSize: 'var(--fs-body)',
    color: 'var(--text-secondary)',
    lineHeight: 1.8,
    padding: '0 10px',
    fontFamily: 'var(--font-body)',
  },
  restartBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    padding: '12px 48px',
    fontSize: 'var(--fs-subtitle)',
    fontWeight: 'var(--fw-bold)',
    color: '#fff',
    backgroundColor: C_DANGER,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    letterSpacing: 2,
    fontFamily: 'var(--font-mono)',
    boxShadow: `0 0 16px ${C_DANGER}40`,
    transition: 'all 0.3s',
  },
}
