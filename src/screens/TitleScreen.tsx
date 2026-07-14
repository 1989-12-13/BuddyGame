// ============================================================
// 零点接线台 — 标题画面（调度台暗色主题 + ECG 波形）
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { Play, Map, BookOpen, Phone } from 'lucide-react'
import { useAudio } from '../audio/AudioContext'
import { styles } from './TitleScreen.styles'

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
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0" />
              <stop offset="15%" stopColor="#16a34a" stopOpacity="0.8" />
              <stop offset="85%" stopColor="#16a34a" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
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
          backgroundColor: blink ? '#16a34a' : 'var(--bg)',
          border: '1px solid #16a34a',
          boxShadow: blink ? '0 0 6px rgba(22, 163, 74, 0.4)' : 'none',
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
          120 <Phone size={40} color="#dc2626" strokeWidth={2.5} style={{ verticalAlign: 'middle', marginTop: -4 }} /> 调度台
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

