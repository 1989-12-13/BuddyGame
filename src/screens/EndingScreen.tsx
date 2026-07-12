// ============================================================
// 零点接线台 — 班次评估/结局画面（暗色调度台主题 + 通话卡片）
// ============================================================

import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import type { EndingDef } from '../game/types'
import { RotateCcw, Trophy, ShieldCheck, ShieldAlert, Skull } from 'lucide-react'
import { useAudio } from '../audio/AudioContext'

interface Props {
  ending: EndingDef
  totalScore: number
  callScores?: number[]
  onRestart: () => void
}

const SAVE_THRESHOLD = 60 // 每通 ≥60 分视为"救回"

function ratingColor(rating: string): string {
  switch (rating) {
    case 'gold': return '#ffb000'
    case 'silver': return '#8b949e'
    case 'bronze': return '#d97706'
    default: return '#ff3b3b'
  }
}

function badgeStyle(rating: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 16px',
    borderRadius: 4,
    border: `1px solid ${ratingColor(rating)}`,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    color: ratingColor(rating),
    fontSize: 12,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    letterSpacing: 1,
  }
}

function scoreBoxStyle(rating: string): CSSProperties {
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

function scoreValueStyle(rating: string): CSSProperties {
  return {
    fontSize: 48,
    fontWeight: 800,
    color: ratingColor(rating),
    lineHeight: 1,
    fontFamily: 'var(--font-mono)',
    textShadow: `0 0 20px ${ratingColor(rating)}40`,
  }
}

function savedSummaryStyle(saved: number, total: number): CSSProperties {
  return {
    fontSize: 14,
    fontWeight: 800,
    fontFamily: 'var(--font-mono)',
    color: saved === total ? '#00ff88' : saved > total / 2 ? '#ffb000' : '#ff3b3b',
    letterSpacing: 1,
  }
}

function callCardStyle(saved: boolean): CSSProperties {
  return {
    width: 78,
    padding: '8px 6px',
    borderRadius: 6,
    border: `1px solid ${saved ? 'rgba(0, 255, 136, 0.25)' : 'rgba(255, 59, 59, 0.25)'}`,
    backgroundColor: saved ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 59, 59, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  }
}

function callCardScoreStyle(saved: boolean): CSSProperties {
  return {
    fontSize: 20,
    fontWeight: 800,
    color: saved ? '#00ff88' : '#ff3b3b',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1,
  }
}

function callCardStatusStyle(saved: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    fontSize: 10,
    color: saved ? '#00ff88' : '#ff3b3b',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
  }
}

function callCardBarFillStyle(saved: boolean, score: number): CSSProperties {
  return {
    width: `${Math.min(100, score)}%`,
    height: '100%',
    backgroundColor: saved ? '#00ff88' : '#ff3b3b',
    transition: 'width 0.6s ease-out',
  }
}

function ecgLineStyle(rating: string): CSSProperties {
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

const styles: Record<string, CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0e14',
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
    fontSize: 30,
    fontWeight: 800,
    color: '#e6edf3',
    margin: 0,
    fontFamily: 'var(--font-mono)',
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 13,
    color: '#6e7681',
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
    fontSize: 13,
    color: '#8b949e',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
  },
  scoreMax: {
    fontSize: 14,
    color: '#6e7681',
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
    fontSize: 12,
    color: '#6e7681',
    fontWeight: 700,
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
    fontSize: 10,
    color: '#6e7681',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
  },
  callCardInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
  },
  callCardMax: {
    fontSize: 9,
    color: '#484f58',
    fontWeight: 500,
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
    fontSize: 13,
    color: '#8b949e',
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
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    backgroundColor: '#dc2626',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    letterSpacing: 2,
    fontFamily: 'var(--font-mono)',
    boxShadow: '0 0 16px rgba(255, 59, 59, 0.25)',
    transition: 'all 0.3s',
  },
}

export function EndingScreen({ ending, totalScore, callScores, onRestart }: Props) {
  const audio = useAudio()

  useEffect(() => {
    audio.play('success')
  }, [audio])

  const handleRestart = () => {
    audio.play('confirm')
    onRestart()
  }

  const calls = callScores ?? []
  const savedCount = calls.filter(s => s >= SAVE_THRESHOLD).length
  const totalCalls = calls.length || 5

  const rating = totalScore >= 350 ? 'gold' : totalScore >= 250 ? 'silver' : totalScore >= 150 ? 'bronze' : 'fail'

  return (
    <div style={styles.container}>
      <div style={ecgLineStyle(rating)} />

      <div style={styles.content}>
        {/* Rating badge */}
        <div style={styles.badgeWrap}>
          <div style={badgeStyle(rating)}>
            {rating === 'gold' && <><Trophy size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />金牌调度员</>}
            {rating === 'silver' && <><Trophy size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />银牌调度员</>}
            {rating === 'bronze' && <><Trophy size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />铜牌调度员</>}
            {rating === 'fail' && <><Skull size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />需要复训</>}
          </div>
        </div>

        {/* Title */}
        <h1 style={styles.title}>{ending.title}</h1>
        <p style={styles.subtitle}>{ending.subtitle}</p>

        <div style={styles.divider} />

        {/* Total score */}
        <div style={scoreBoxStyle(rating)}>
          <span style={styles.scoreLabel}>班次总分</span>
          <span style={scoreValueStyle(rating)}>{totalScore}</span>
          <span style={styles.scoreMax}>/ 500</span>
        </div>

        {/* Per-call cards */}
        {calls.length > 0 && (
          <>
            <div style={styles.divider} />
            <div style={styles.callsHeader}>
              <span style={styles.callsHeaderText}>今晚接警记录</span>
              <span style={savedSummaryStyle(savedCount, totalCalls)}>
                救回 {savedCount} / {totalCalls} 人
              </span>
            </div>
            <div style={styles.cardsGrid}>
              {calls.map((score, i) => {
                const saved = score >= SAVE_THRESHOLD
                return (
                  <div key={i} style={callCardStyle(saved)} className="animate-card-reveal">
                    <div style={styles.callCardNum}>{String(i + 1).padStart(2, '0')}</div>
                    <div style={styles.callCardInfo}>
                      <div style={callCardScoreStyle(saved)}>
                        {score}
                        <span style={styles.callCardMax}>/100</span>
                      </div>
                      <div style={callCardStatusStyle(saved)}>
                        {saved ? <><ShieldCheck size={10} style={{ marginRight: 1, verticalAlign: 'text-bottom' }} />救回</> : <><ShieldAlert size={10} style={{ marginRight: 1, verticalAlign: 'text-bottom' }} />错失</>}
                      </div>
                    </div>
                    <div style={styles.callCardBar}>
                      <div style={callCardBarFillStyle(saved, score)} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div style={styles.divider} />

        {/* Description / outcome narrative */}
        <p style={styles.description}>{ending.description}</p>

        <div style={styles.divider} />

        {/* Restart */}
        <button style={styles.restartBtn} onClick={handleRestart}>
          <RotateCcw size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />重新值班
        </button>
      </div>
    </div>
  )
}
