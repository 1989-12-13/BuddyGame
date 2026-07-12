// ============================================================
// 零点接线台 — 标题画面（调度台暗色主题 + ECG 波形）
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { Play, Map, BookOpen, Phone } from 'lucide-react'
import { useAudio } from '../audio/AudioContext'

interface Props {
  onStart: () => void
  onLevelSelect?: () => void
  onKnowledge?: () => void
}

export function TitleScreen({ onStart, onLevelSelect, onKnowledge }: Props) {
  const [blink, setBlink] = useState(true)
  const [clock, setClock] = useState('')
  const audio = useAudio()

  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 800)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      setClock(`${h}:${m}:${s}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  const handleStart = useCallback(() => {
    audio.play('success')
    onStart()
  }, [audio, onStart])

  const handleLevelSelect = useCallback(() => {
    audio.play('confirm')
    onLevelSelect?.()
  }, [audio, onLevelSelect])

  const handleKnowledge = useCallback(() => {
    audio.play('confirm')
    onKnowledge?.()
  }, [audio, onKnowledge])

  return (
    <div style={styles.container}>
      {/* Scanline overlay */}
      <div style={styles.scanline} />

      {/* ECG waveform */}
      <div style={styles.ecgContainer}>
        <svg
          width="100%"
          height="120"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={styles.ecgSvg}
        >
          <defs>
            <linearGradient id="ecg-fade" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
              <stop offset="15%" stopColor="#22c55e" stopOpacity="0.8" />
              <stop offset="85%" stopColor="#22c55e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g style={styles.ecgGroup}>
            <path
              d="M0,60 L80,60 L90,60 L95,55 L100,65 L105,30 L110,90 L115,60 L200,60 L280,60 L290,60 L295,55 L300,65 L305,30 L310,90 L315,60 L400,60 L480,60 L490,60 L495,55 L500,65 L505,30 L510,90 L515,60 L600,60 L680,60 L690,60 L695,55 L700,65 L705,30 L710,90 L715,60 L800,60 L880,60 L890,60 L895,55 L900,65 L905,30 L910,90 L915,60 L1000,60 L1080,60 L1090,60 L1095,55 L1100,65 L1105,30 L1110,90 L1115,60 L1200,60"
              fill="none"
              stroke="url(#ecg-fade)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      {/* Corner brackets — terminal frame */}
      <div style={styles.cornerTL} />
      <div style={styles.cornerTR} />
      <div style={styles.cornerBL} />
      <div style={styles.cornerBR} />

      {/* Status bar — top-left corner */}
      <div style={styles.statusBar}>
        <span style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: blink ? '#22c55e' : 'var(--bg)',
          border: '1px solid #22c55e',
          boxShadow: blink ? '0 0 6px rgba(34, 197, 94, 0.4)' : 'none',
          transition: 'all 0.1s',
        }} />
        <span style={styles.statusText}>SYSTEM ONLINE</span>
        <span style={styles.statusSep}>|</span>
        <span style={styles.statusText}>{clock}</span>
        <span style={styles.statusSep}>|</span>
        <span style={styles.statusText}>CH-120</span>
      </div>

      <div style={styles.content}>
        {/* Title */}
        <h1 style={styles.title}>
          120 <Phone size={40} color="#ff3b3b" strokeWidth={2.5} style={{ verticalAlign: 'middle', marginTop: -4 }} /> 调度台
        </h1>
        <p style={styles.subtitle}>EMERGENCY DISPATCH SIMULATOR</p>

        <div style={styles.divider} />

        <p style={styles.tagline}>
          接听来电 · 问询登记 · MPDS 分诊 · 快速派车
        </p>

        {/* 按钮区 */}
        <div style={styles.buttonRow}>
          <button
            style={{
              ...styles.startBtn,
              opacity: blink ? 1 : 0.85,
            }}
            onClick={handleStart}
          >
            <Play size={16} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />开始值班
          </button>
          {onLevelSelect && (
            <button
              onClick={handleLevelSelect}
              style={styles.secondaryBtn}
            >
              <Map size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />选关
            </button>
          )}
          {onKnowledge && (
            <button
              onClick={handleKnowledge}
              style={styles.secondaryBtn}
            >
              <BookOpen size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />知识库
            </button>
          )}
        </div>

        <p style={styles.version}>v1.0 // BUILD-{clock.split(':').join('')}</p>
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
    backgroundColor: 'var(--bg)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'var(--font-body)',
    animation: 'fade-in 0.6s ease-out',
  },
  scanline: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, transparent 0%, rgba(34, 197, 94, 0.015) 50%, transparent 100%)',
    pointerEvents: 'none',
    animation: 'scanline-sweep 8s linear infinite',
    zIndex: 1,
  },
  ecgContainer: {
    position: 'absolute',
    bottom: '15%',
    left: 0,
    right: 0,
    pointerEvents: 'none',
    zIndex: 1,
    opacity: 0.5,
  },
  ecgSvg: {
    animation: 'ecg-glow 3s ease-in-out infinite',
  },
  ecgGroup: {
    animation: 'ecg-scroll 4s linear infinite',
  },
  cornerTL: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 30,
    height: 30,
    borderTop: '2px solid rgba(34, 197, 94, 0.2)',
    borderLeft: '2px solid rgba(34, 197, 94, 0.2)',
    zIndex: 2,
  },
  cornerTR: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 30,
    height: 30,
    borderTop: '2px solid rgba(34, 197, 94, 0.2)',
    borderRight: '2px solid rgba(34, 197, 94, 0.2)',
    zIndex: 2,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 30,
    height: 30,
    borderBottom: '2px solid rgba(34, 197, 94, 0.2)',
    borderLeft: '2px solid rgba(34, 197, 94, 0.2)',
    zIndex: 2,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 30,
    height: 30,
    borderBottom: '2px solid rgba(34, 197, 94, 0.2)',
    borderRight: '2px solid rgba(34, 197, 94, 0.2)',
    zIndex: 2,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    zIndex: 3,
    maxWidth: 520,
    padding: '20px',
    maxHeight: '100vh',
    overflowY: 'auto',
  },
  statusBar: {
    position: 'absolute',
    top: 24,
    left: 60,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 16px',
    borderRadius: 4,
    border: '1px solid var(--border)',
    backgroundColor: 'rgba(34, 197, 94, 0.04)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    zIndex: 3,
  },
  statusText: {
    color: '#22c55e',
    fontWeight: 600,
    letterSpacing: 1,
  },
  statusSep: {
    color: 'var(--text-dim)',
  },
  title: {
    fontSize: 42,
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: 0,
    letterSpacing: 6,
    fontFamily: 'var(--font-mono)',
    textShadow: '0 0 30px rgba(34, 197, 94, 0.12)',
  },
  subtitle: {
    fontSize: 12,
    color: 'var(--text-muted)',
    margin: 0,
    letterSpacing: 4,
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
  },
  divider: {
    width: 220,
    height: 1,
    background: 'linear-gradient(90deg, transparent, var(--border-bright), transparent)',
    margin: '10px 0',
  },
  tagline: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 2,
    fontWeight: 500,
  },
  buttonRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  startBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '14px 56px',
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    backgroundColor: '#dc2626',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    letterSpacing: 3,
    fontFamily: 'var(--font-mono)',
    boxShadow: '0 0 20px rgba(255, 59, 59, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
    transition: 'all 0.3s',
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '14px 28px',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    letterSpacing: 1,
    transition: 'all 0.2s',
  },
  version: {
    fontSize: 10,
    color: 'var(--text-dim)',
    marginTop: 20,
    fontFamily: 'var(--font-mono)',
    letterSpacing: 1,
  },
}
