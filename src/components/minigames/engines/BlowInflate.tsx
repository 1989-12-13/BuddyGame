// ============================================================
// BlowInflate — 吹气充胀（人工呼吸）
// 按住空格/点击吹气，胸部起伏可视化
// 理想区间有效，过量胃胀气惩罚，不足无效
// ============================================================

import { useEffect, useRef, useState } from 'react'
import type { BlowInflateSpec, MiniGameProps } from '../../../game/types'

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
}

/** 每秒填充速率（不受帧率影响） */
const FILL_RATE = 0.28  // 约 3.6 秒填满 0-1

/** 每秒泄气速率 */
const DECAY_RATE = 0.35

export function BlowInflate({ spec, onComplete }: MiniGameProps) {
  const s = spec as BlowInflateSpec
  const [good, setGood] = useState(0)
  const [over, setOver] = useState(0)
  const [timeLeft, setTimeLeft] = useState(s.durationSec)
  const [showBurst, setShowBurst] = useState(false)
  const [fill, setFill] = useState(0)

  const holding = useRef(false)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(0)
  const lastTRef = useRef(0)
  const finished = useRef(false)
  const fillRef = useRef(0)       // 实时 fill，避免 state 滞后

  const idealMin = 0.30
  const overThreshold = 0.72

  useEffect(() => {
    startRef.current = performance.now()
    lastTRef.current = performance.now()

    const loop = (now: number) => {
      const dt = Math.min((now - lastTRef.current) / 1000, 0.05) // 上限 50ms
      lastTRef.current = now

      const elapsed = (performance.now() - startRef.current) / 1000
      setTimeLeft(Math.max(0, s.durationSec - elapsed))

      if (holding.current) {
        fillRef.current = Math.min(1, fillRef.current + FILL_RATE * dt)
      } else {
        fillRef.current = Math.max(0, fillRef.current - DECAY_RATE * dt)
      }
      setFill(fillRef.current)

      if (elapsed >= s.durationSec && !finished.current) {
        finish()
        return
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); if (!finished.current) holding.current = true }
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); release() }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const release = () => {
    if (!holding.current) return
    holding.current = false

    const f = fillRef.current  // 用 ref 读到实时值
    if (f >= overThreshold) {
      setOver((o) => o + 1)
    } else if (f >= idealMin) {
      setGood((g) => g + 1)
      setShowBurst(true)
      setTimeout(() => setShowBurst(false), 400)
    }
    fillRef.current = 0
    setFill(0)
  }

  const finish = () => {
    if (finished.current) return
    finished.current = true
    holding.current = false
    const score = Math.max(0, Math.min(1, good / s.targetInflations - over * 0.15))
    setTimeout(() => onComplete(score, score >= s.passThreshold), 700)
  }

  const barColor =
    fill >= overThreshold ? '#ef4444' :
    fill >= idealMin ? '#059669' :
    fill > 0 ? '#3b82f6' : '#e2e8f0'

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', gap: 18, fontFamily: 'monospace' }}>
        <Readout label="有效" value={String(good)} color="#16a34a" />
        <Readout label="目标" value={String(s.targetInflations)} color="#94a3b8" />
        <Readout label="胀气" value={String(over)} color="#ef4444" />
        <Readout label="剩余" value={timeLeft.toFixed(1) + 's'} color="#3b82f6" />
      </div>

      {/* 成功吹气提示 */}
      {showBurst && (
        <div style={{ fontSize: 14, color: '#059669', fontWeight: 'bold' }}>
          ✓ 吹气成功
        </div>
      )}

      {/* 进度条 */}
      <div style={{ width: 260, position: 'relative' }}>
        {/* 刻度尺 */}
        <div style={{ position: 'relative', width: '100%', height: 10, marginBottom: 2 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 4, height: 2, backgroundColor: '#cbd5e1', borderRadius: 1 }} />
          {/* 理想区起始刻度 */}
          <div style={{ position: 'absolute', left: `${idealMin * 100}%`, top: 0, width: 2, height: 10, backgroundColor: '#059669', borderRadius: 1 }} />
          {/* 过量区起始刻度 */}
          <div style={{ position: 'absolute', left: `${overThreshold * 100}%`, top: 0, width: 2, height: 10, backgroundColor: '#ef4444', borderRadius: 1 }} />
          {/* 标签 */}
          <div style={{ position: 'absolute', left: 0, top: 0, fontSize: 8, color: '#94a3b8' }}>不足</div>
          <div style={{ position: 'absolute', left: `${idealMin * 100 + 4}%`, top: 0, fontSize: 8, color: '#059669', fontWeight: 'bold' }}>理想</div>
          <div style={{ position: 'absolute', left: `${overThreshold * 100 + 4}%`, top: 0, fontSize: 8, color: '#ef4444', fontWeight: 'bold' }}>过量</div>
        </div>
        {/* 填充条 */}
        <div style={{ width: '100%', height: 20, backgroundColor: '#f1f5f9', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{
            width: `${fill * 100}%`, height: '100%',
            backgroundColor: barColor,
            transition: 'width 0.03s linear',
            boxShadow: fill > 0 ? `0 0 8px ${barColor}` : 'none',
          }} />
        </div>
        {/* 当前状态文字 */}
        <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 4 }}>
          {fill === 0 ? '按住空格吹气' :
           fill >= overThreshold ? '⚠️ 吹气过量！' :
           fill >= idealMin ? `✅ 理想区 (${(fill * 100).toFixed(0)}%)` :
           `⬆️ 继续吹气 (${(fill * 100).toFixed(0)}%)`}
        </div>
      </div>
    </div>
  )
}

function Readout({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 48 }}>
      <div style={{ fontSize: 9, color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color, textShadow: `0 0 8px ${color}55` }}>{value}</div>
    </div>
  )
}
