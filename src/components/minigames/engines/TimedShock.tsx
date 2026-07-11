// ============================================================
// TimedShock — 时机识别除颤（AED）
// ECG 滚动，进入「可电击」窗口时按下 SHOCK；误击扣分
// ============================================================

import { useEffect, useRef, useState } from 'react'
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
  const [inWindow, setInWindow] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const deliveredRef = useRef<boolean[]>(new Array(s.windows).fill(false))
  const falseRef = useRef(0)
  const elapsedRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const finished = useRef(false)
  const total = s.windows * (s.windowMs + s.shockCooldownMs) + s.windowMs + 800

  const windowStart = (i: number) => i * (s.windowMs + s.shockCooldownMs)

  const isInWindow = (elapsed: number) => {
    for (let i = 0; i < s.windows; i++) {
      const st = windowStart(i)
      if (elapsed >= st && elapsed <= st + s.windowMs) return i
    }
    return -1
  }

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height
    const samples: number[] = new Array(W).fill(H / 2)
    let phase = 0
    const startT = performance.now()

    const draw = () => {
      const elapsed = performance.now() - startT
      elapsedRef.current = elapsed
      const wi = isInWindow(elapsed)
      setInWindow(wi >= 0)

      // 生成 ECG 样本
      phase += 0.25
      let y = H / 2
      const m = phase % (Math.PI * 2)
      if (m > Math.PI * 0.45 && m < Math.PI * 0.55) y = H / 2 - 26   // R 波
      else if (m > Math.PI * 0.55 && m < Math.PI * 0.62) y = H / 2 + 10
      else y = H / 2 + Math.sin(m) * 3
      samples.push(y)
      if (samples.length > W) samples.shift()

      ctx.clearRect(0, 0, W, H)
      ctx.strokeStyle = wi >= 0 ? '#ef4444' : '#27ae60'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let x = 0; x < samples.length; x++) {
        if (x === 0) ctx.moveTo(x, samples[x])
        else ctx.lineTo(x, samples[x])
      }
      ctx.stroke()

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

  const shock = () => {
    if (finished.current) return
    const wi = isInWindow(elapsedRef.current)
    if (wi >= 0 && !deliveredRef.current[wi]) {
      deliveredRef.current[wi] = true
      setDelivered(deliveredRef.current.filter(Boolean).length)
    } else {
      falseRef.current += 1
      setFalseClicks(falseRef.current)
    }
  }

  const finish = () => {
    if (finished.current) return
    finished.current = true
    const got = deliveredRef.current.filter(Boolean).length
    const score = Math.max(0, Math.min(1, got / s.windows - s.falsePenalty * falseRef.current))
    setTimeout(() => onComplete(score, score >= s.passThreshold), 700)
  }

  return (
    <div style={wrap}>
      <canvas ref={canvasRef} width={260} height={70} style={{ backgroundColor: '#0a0e17', borderRadius: 8, border: '1px solid #334155', width: 260, height: 70 }} />
      <div style={{ display: 'flex', gap: 16, fontFamily: 'monospace', alignItems: 'center' }}>
        <Readout label="除颤" value={`${delivered}/${s.windows}`} color="#27ae60" />
        <Readout label="误击" value={String(falseClicks)} color="#ef4444" />
        <div style={{ fontSize: 12, color: inWindow ? '#ef4444' : '#64748b', fontWeight: 'bold' }}>
          {inWindow ? '⚡ 可电击！' : '分析中…'}
        </div>
      </div>
      <button
        onClick={shock}
        style={{ padding: '10px 28px', borderRadius: 8, border: 'none', backgroundColor: inWindow ? '#ef4444' : '#334155', color: '#fff', fontSize: 15, fontWeight: 'bold', cursor: 'pointer', boxShadow: inWindow ? '0 0 20px #ef4444' : 'none', animation: inWindow ? 'pulse-live 0.6s ease-in-out infinite' : 'none' }}
      >
        ⚡ SHOCK 除颤
      </button>
      <div style={{ fontSize: 10, color: '#64748b' }}>仅在波形变红（可电击）时按下</div>
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
