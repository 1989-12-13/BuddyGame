// ============================================================
// 零点接线台 — 班次评估/结局画面
// ============================================================

import { useEffect } from 'react'
import type { EndingDef } from '../game/types'
import { useAudio } from '../audio/AudioContext'

interface Props {
  ending: EndingDef
  totalScore: number
  onRestart: () => void
}

export function EndingScreen({ ending, totalScore, onRestart }: Props) {
  const audio = useAudio()

  // 进入结局画面时播放提示音
  useEffect(() => {
    audio.play('success')
  }, [audio])

  const handleRestart = () => {
    audio.play('confirm')
    onRestart()
  }
  return (
    <div style={styles.container}>
      <div style={styles.glow} />

      <div style={styles.content}>
        {/* 奖章 */}
        <div style={styles.badge}>{ending.badge}</div>

        {/* 标题 */}
        <h1 style={styles.title}>{ending.title}</h1>
        <p style={styles.subtitle}>{ending.subtitle}</p>

        <div style={styles.divider} />

        {/* 总分 */}
        <div style={styles.scoreBox}>
          <div style={styles.scoreLabel}>班次总分</div>
          <div style={styles.scoreValue}>{totalScore}</div>
          <div style={styles.scoreMax}>/ 500</div>
        </div>

        <div style={styles.divider} />

        {/* 描述 */}
        <p style={styles.description}>{ending.description}</p>

        <div style={styles.divider} />

        {/* 重新开始 */}
        <button style={styles.restartBtn} onClick={handleRestart}>
          重新值班
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4f8',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 500,
    height: 500,
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(22, 163, 74, 0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
    maxWidth: 480,
    padding: '20px',
    textAlign: 'center' as const,
  },
  badge: {
    fontSize: 20,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    margin: 0,
    fontStyle: 'italic',
  },
  divider: {
    width: 200,
    height: 1,
    backgroundColor: '#e2e8f0',
    margin: '6px 0',
  },
  scoreBox: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    padding: '12px 24px',
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    borderRadius: 8,
    border: '1px solid rgba(22, 163, 74, 0.2)',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#16a34a',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#22c55e',
    lineHeight: 1,
  },
  scoreMax: {
    fontSize: 14,
    color: '#94a3b8',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 1.8,
    padding: '0 10px',
  },
  restartBtn: {
    marginTop: 12,
    padding: '12px 48px',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#dc2626',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    letterSpacing: 2,
    transition: 'all 0.3s',
  },
}
