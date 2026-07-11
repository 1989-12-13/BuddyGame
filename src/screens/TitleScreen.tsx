// ============================================================
// 零点接线台 — 标题画面
// ============================================================

import { useState, useEffect } from 'react'

interface Props {
  onStart: () => void
  onLevelSelect?: () => void
  onKnowledge?: () => void
}

export function TitleScreen({ onStart, onLevelSelect, onKnowledge }: Props) {
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 800)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={styles.container}>
      <div style={styles.glow} />

      <div style={styles.content}>
        <div style={styles.icon}>📞</div>

        <h1 style={styles.title}>120 调度台</h1>
        <p style={styles.subtitle}>120 急救调度模拟</p>

        <p style={styles.tagline}>
          接听来电 · 问询登记 · MPDS 分诊 · 快速派车
        </p>

        <div style={styles.divider} />

        {/* 按钮区 */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            style={{
              ...styles.startBtn,
              marginTop: 0,
              opacity: blink ? 1 : 0.6,
            }}
            onClick={() => onStart()}
          >
            开始值班
          </button>
          {onLevelSelect && (
            <button
              onClick={onLevelSelect}
              style={styles.levelSelectBtn}
            >
              📋 选关
            </button>
          )}
          {onKnowledge && (
            <button
              onClick={onKnowledge}
              style={styles.knowledgeBtn}
            >
              📖 知识库
            </button>
          )}
        </div>

        <p style={styles.version}>v1.0</p>
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
    width: 400,
    height: 400,
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(220, 38, 38, 0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    zIndex: 1,
    maxWidth: 520,
    padding: '20px',
    maxHeight: '100vh',
    overflowY: 'auto',
  },
  icon: {
    fontSize: 60,
    marginBottom: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
    letterSpacing: 4,
    textShadow: '0 0 20px rgba(220, 38, 38, 0.12)',
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    margin: 0,
    letterSpacing: 6,
    textTransform: 'uppercase' as const,
  },
  divider: {
    width: 200,
    height: 1,
    backgroundColor: '#e2e8f0',
    margin: '8px 0',
  },
  tagline: {
    textAlign: 'center' as const,
    color: '#64748b',
    fontSize: 16,
    marginTop: 4,
    letterSpacing: 1,
    fontWeight: 500,
  },
  startBtn: {
    marginTop: 12,
    padding: '14px 56px',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#dc2626',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    letterSpacing: 2,
    boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)',
    transition: 'all 0.5s',
  },
  levelSelectBtn: {
    padding: '14px 28px',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#475569',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  knowledgeBtn: {
    padding: '14px 28px',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e40af',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  version: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 16,
  },
}
