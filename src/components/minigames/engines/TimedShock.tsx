// ============================================================
// TimedShock — 时机识别除颤（AED）
// 在心室颤动（VF）窗口内放电除颤
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MiniGameProps, TimedShockSpec } from '../../../game/types'

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
}

export function TimedShock({ spec, onComplete }: MiniGameProps) {
  const s = spec as TimedShockSpec
  const [delivered, setDelivered] = useState(0)
  const [falseClicks, setFalseClicks] = useState(0)
  const [windowState, setWindowState] = useState<'analyzing' | 'charging' | 'shockable'>('analyzing')
  const [charge, setCharge] = useState(0)
  const shockWaveRef = useRef(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const deliveredRef = useRef<boolean[]>(new Array(s.windows).fill(false))
  const falseRef = useRef(0)
  const elapsedRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const finished = useRef(false)

  const total = s.windows * (s.windowMs + s.shockCooldownMs) + s.windowMs + 800
  const chargeLeadMs = 1200

  const windowStart = (i: number) => i * (s.windowMs + s.shockCooldownMs)
  const chargeStartMs = (i: number) => Math.max(0, windowStart(i) - chargeLeadMs)

  const isInWindow = (elapsed: number) => {
    for (let i = 0; i < s.windows; i++) {
      const st = windowStart(i)
      if (elapsed >= st && elapsed <= st + s.windowMs) return i
    }
    return -1
  }

  const getCharge = (elapsed: number): number => {
    for (let i = 0; i < s.windows; i++) {
      const cs = chargeStartMs(i)
      const ws = windowStart(i)
      if (elapsed >= cs && elapsed < ws) return (elapsed - cs) / (ws - cs)
    }
    return 0
  }

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height
    const samples: number[] = new Array(W).fill(H / 2)
    const startT = performance.now()
    let phase = 0

    const draw = () => {
      const elapsed = performance.now() - startT
      elapsedRef.current = elapsed
      const wi = isInWindow(elapsed)
      const ch = getCharge(elapsed)

      if (wi >= 0) {
        setWindowState('shockable')
        setCharge(1)
      } else if (ch > 0) {
        setWindowState('charging')
        setCharge(ch)
      } else {
        setWindowState('analyzing')
        setCharge(0)
      }

      // ECG 样本
      phase += 0.2
      let y = H / 2
      const m = phase % (Math.PI * 2)

      if (wi >= 0) {
        // 可电击 — 粗颤 VF
        const r = phase * 2.8
        y = H / 2 + Math.sin(r) * 20 + Math.sin(r * 2.7) * 8 + Math.sin(r * 0.3) * 5
      } else if (ch > 0) {
        // 心律渐变为 VF
        const r = phase * 2.5
        y = H / 2 + Math.sin(r) * 12 + Math.sin(r * 2.3) * 5
      } else {
        // 正常窦性
        if (m > 0.15 && m < 0.25) y = H / 2 - 24
        else if (m > 0.25 && m < 0.32) y = H / 2 + 10
        else y = H / 2 + Math.sin(m) * 3
      }
      samples.push(y)
      if (samples.length > W) samples.shift()

      ctx.clearRect(0, 0, W, H)

      // 网格
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 0.5
      for (let gx = 0; gx < W; gx += 20) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke() }
      for (let gy = 0; gy < H; gy += 10) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke() }

      // 波形
      const waveColor = wi >= 0 ? '#ef4444' : ch > 0 ? '#f59e0b' : '#16a34a'
      ctx.strokeStyle = waveColor
      ctx.lineWidth = 2
      ctx.shadowColor = waveColor
      ctx.shadowBlur = wi >= 0 ? 8 : 2
      ctx.beginPath()
      for (let x = 0; x < samples.length; x++) {
        if (x === 0) ctx.moveTo(x, samples[x])
        else ctx.lineTo(x, samples[x])
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      // 放电波特效
      if (shockWaveRef.current) {
        ctx.clearRect(0, 0, W, H)
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.fillRect(0, 0, W, H)
        shockWaveRef.current = false
      }

      if ((deliveredRef.current.filter(Boolean).length >= s.windows || elapsed >= total) && !finished.current) {
        finish()
        return
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shock = useCallback(() => {
    if (finished.current) return
    const wi = isInWindow(elapsedRef.current)
    if (wi >= 0 && !deliveredRef.current[wi]) {
      deliveredRef.current[wi] = true
      setDelivered(deliveredRef.current.filter(Boolean).length)
      shockWaveRef.current = true
    } else {
      falseRef.current += 1
      setFalseClicks(falseRef.current)
    }
  }, [])

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    const got = deliveredRef.current.filter(Boolean).length
    const score = Math.max(0, Math.min(1, got / s.windows - s.falsePenalty * falseRef.current))
    setTimeout(() => onComplete(score, score >= s.passThreshold), 700)
  }, [s, onComplete])

  const statusText =
    windowState === 'shockable' ? '⚡ 可电击！立即除颤！' :
    windowState === 'charging' ? '🔋 充电中…' :
    '🔍 分析心律中…'

  const statusColor =
    windowState === 'shockable' ? '#ef4444' :
    windowState === 'charging' ? '#f59e0b' :
    '#64748b'

  return (
    <div style={wrap}>
      {/* 状态 */}
      <div style={{ fontSize: 12, color: statusColor, fontWeight: 'bold', letterSpacing: 1 }}>
        {statusText}
      </div>

      {/* ECG 屏幕 */}
      <canvas ref={canvasRef} width={260} height={80}
        style={{ backgroundColor: '#0a0e17', borderRadius: 8, border: '1px solid #1a2640', width: 260, height: 80 }} />

      {/* 充电进度 */}
      {windowState === 'charging' && (
        <div style={{ width: 260, height: 6, borderRadius: 3, backgroundColor: '#1e293b', overflow: 'hidden' }}>
          <div style={{
            width: `${charge * 100}%`, height: '100%',
            backgroundColor: '#f59e0b',
            transition: 'width 0.05s linear',
            boxShadow: '0 0 10px rgba(245,158,11,0.4)',
          }} />
        </div>
      )}

      {/* 计分 */}
      <div style={{ display: 'flex', gap: 18, fontFamily: 'monospace', alignItems: 'center' }}>
        <Readout label="除颤" value={`${delivered}/${s.windows}`} color={delivered >= s.windows ? '#059669' : '#16a34a'} />
        <Readout label="误击" value={String(falseClicks)} color="#ef4444" />
      </div>

      {/* SHOCK 按钮 */}
      <button
        onClick={shock}
        disabled={finished.current}
        style={{
          padding: '12px 36px', borderRadius: 8, border: 'none',
          background: windowState === 'shockable'
            ? 'linear-gradient(135deg, #dc2626, #991b1b)'
            : '#1e293b',
          color: '#fff',
          fontSize: 15, fontWeight: 'bold',
          cursor: finished.current ? 'not-allowed' : 'pointer',
          boxShadow: windowState === 'shockable'
            ? '0 0 30px rgba(239,68,68,0.6), inset 0 0 20px rgba(255,255,255,0.08)'
            : 'none',
          animation: windowState === 'shockable' ? 'pulse-live 0.5s ease-in-out infinite' : 'none',
          transition: 'all 0.12s',
          opacity: finished.current ? 0.5 : 1,
        }}
      >
        ⚡ SHOCK
      </button>

      {/* 操作提示 */}
      <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', lineHeight: 1.4 }}>
        {windowState === 'shockable'
          ? '点击 SHOCK 放电除颤！'
          : windowState === 'charging'
            ? '等待充电完成，请勿触碰患者'
            : '分析中…'}
      </div>
    </div>
  )
}

function Readout({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 52 }}>
      <div style={{ fontSize: 9, color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color, textShadow: `0 0 8px ${color}55` }}>{value}</div>
    </div>
  )
}
