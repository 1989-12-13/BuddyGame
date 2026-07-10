// ============================================================
// 零点接线台 — 班次评估/结局画面
// ============================================================

import type { EndingDef } from '../game/types'

interface Props {
  ending: EndingDef
  totalScore: number
  onRestart: () => void
}

export function EndingScreen({ ending, totalScore, onRestart }: Props) {
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
        <button style={styles.restartBtn} onClick={onRestart}>
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
    backgroundColor: '#0a0a1a',
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
    background: 'radial-gradient(circle, rgba(39, 174, 96, 0.12) 0%, transparent 70%)',
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
    color: '#ecf0f1',
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    margin: 0,
    fontStyle: 'italic',
  },
  divider: {
    width: 200,
    height: 1,
    backgroundColor: '#2c3e50',
    margin: '6px 0',
  },
  scoreBox: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    padding: '12px 24px',
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    borderRadius: 8,
    border: '1px solid rgba(39, 174, 96, 0.3)',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#27ae60',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2ecc71',
    lineHeight: 1,
  },
  scoreMax: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  description: {
    fontSize: 14,
    color: '#bdc3c7',
    lineHeight: 1.8,
    padding: '0 10px',
  },
  restartBtn: {
    marginTop: 12,
    padding: '12px 48px',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    letterSpacing: 2,
    transition: 'all 0.3s',
  },
}
