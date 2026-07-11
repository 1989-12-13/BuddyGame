// ============================================================
// TimedShock — 时机识别除颤（AED）
// ECG 滚动 + 充电倒计时，在"可电击"窗口放电
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
  const [windowState, setWindowState] = useState<'analyzing' | 'charging' | 'shockable' | 'cooldown'>('analyzing')
  const [charge, setCharge] = useState(0)       // 充电进度 0-1
  const [shockFlash, setShockFlash] = useState(false)
  const [successFlash, setSuccessFlash] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const deliveredRef = useRef<boolean[]>(new Array(s.windows).fill(false))
  const falseRef = useRef(0)
  const elapsedRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const finished = useRef(false)
  const total = s.windows * (s.windowMs + s.shockCooldownMs) + s.windowMs + 800

  const windowStart = (i: number) => i * (s.windowMs + s.shockCooldownMs)
  const chargeStart = (i: number) => windowStart(i) - 1200  // 充电提前 1.2 秒

  const isInWindow = (elapsed: number) => {
    for (let i = 0; i < s.windows; i++) {
      const st = windowStart(i)
      if (elapsed >= st && elapsed <= st + s.windowMs) return i
    }
    return -1
  }

  const isCharging = (elapsed: number) => {
    for (let i = 0; i < s.windows; i++) {
      const st = chargeStart(i)
      const end = windowStart(i)
      if (elapsed >= st && elapsed < end) return { idx: i, progress: (elapsed - st) / (end - st) }
    }
    return null
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
      const ch = isCharging(elapsed)

      // 状态判断
      if (wi >= 0) {
        setWindowState('shockable')
        setCharge(1)
      } else if (ch) {
        setWindowState('charging')
        setCharge(ch.progress)
      } else {
        setWindowState('analyzing')
        setCharge(0)
      }

      // 生成 ECG 样本
      phase += 0.2
      let y = H / 2
      const m = phase % (Math.PI * 2)

      if (wi >= 0) {
        // 可电击心律 — 粗颤 VF
        const rapid = phase * 3
        y = H / 2 + Math.sin(rapid) * 18 + Math.sin(rapid * 2.7) * 8 + Math.sin(rapid * 0.3) * 4
      } else if (ch) {
        // 充电中 — 仍为 VF 但幅度稍减
        const rapid = phase * 2.8
        y = H / 2 + Math.sin(rapid) * 14 + Math.sin(rapid * 2.5) * 6
      } else {
        // 窦性/分析中 — 正常 ECG
        if (m > Math.PI * 0.2 && m < Math.PI * 0.3) y = H / 2 - 22
        else if (m > Math.PI * 0.3 && m < Math.PI * 0.38) y = H / 2 + 8
        else y = H / 2 + Math.sin(m) * 3
      }
      samples.push(y)
      if (samples.length > W) samples.shift()

      ctx.clearRect(0, 0, W, H)

      // 绘制网格
      ctx.strokeStyle = 'rgba(203,213,225,0.2)'
      ctx.lineWidth = 0.5
      for (let gx = 0; gx < W; gx += 20) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke()
      }
      for (let gy = 0; gy < H; gy += 10) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
      }

      // 绘制 ECG 波形
      const color = wi >= 0 ? '#ef4444' : ch ? '#f59e0b' : '#16a34a'
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.shadowColor = color
      ctx.shadowBlur = wi >= 0 ? 6 : 0
      ctx.beginPath()
      for (let x = 0; x < samples.length; x++) {
        if (x === 0) ctx.moveTo(x, samples[x])
        else ctx.lineTo(x, samples[x])
      }
      ctx.stroke()
      ctx.shadowBlur = 0

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
      // 成功除颤
      deliveredRef.current[wi] = true
      setDelivered(deliveredRef.current.filter(Boolean).length)
      setSuccessFlash(true)
      setTimeout(() => setSuccessFlash(false), 500)
    } else {
      // 误击
      falseRef.current += 1
      setFalseClicks(falseRef.current)
    }
    // 点击按钮闪烁效果
    setShockFlash(true)
    setTimeout(() => setShockFlash(false), 300)
  }, [])

  const finish = () => {
    if (finished.current) return
    finished.current = true
    const got = deliveredRef.current.filter(Boolean).length
    const score = Math.max(0, Math.min(1, got / s.windows - s.falsePenalty * falseRef.current))
    setTimeout(() => onComplete(score, score >= s.passThreshold), 700)
  }

  const allDelivered = delivered >= s.windows

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
      {/* 状态标签 */}
      <div style={{ fontSize: 12, color: statusColor, fontWeight: 'bold', letterSpacing: 1 }}>
        {statusText}
      </div>

      {/* ECG 监控 */}
      <canvas ref={canvasRef} width={260} height={80}
        style={{ backgroundColor: '#0a0e17', borderRadius: 8, border: '1px solid #1a2640', width: 260, height: 80 }} />

      {/* 充电进度条 */}
      {windowState === 'charging' && (
        <div style={{ width: 260, height: 6, borderRadius: 3, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
          <div style={{
            width: `${charge * 100}%`, height: '100%',
            backgroundColor: '#f59e0b',
            transition: 'width 0.05s linear',
            boxShadow: '0 0 10px rgba(245,158,11,0.4)',
          }} />
        </div>
      )}

      {/* 计分板 */}
      <div style={{ display: 'flex', gap: 18, fontFamily: 'monospace', alignItems: 'center' }}>
        <Readout label="除颤" value={`${delivered}/${s.windows}`} color={allDelivered ? '#059669' : '#16a34a'} />
        <Readout label="误击" value={String(falseClicks)} color="#ef4444" />
      </div>

      {/* SHOCK 按钮 */}
      <button
        onClick={shock}
        disabled={finished.current}
        style={{
          padding: '12px 36px', borderRadius: 8, border: 'none',
          background: shockFlash
            ? 'linear-gradient(135deg, #fca5a5, #ef4444)'
            : windowState === 'shockable'
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : '#1e293b',
          color: '#fff',
          fontSize: 15, fontWeight: 'bold',
          cursor: finished.current ? 'not-allowed' : 'pointer',
          boxShadow: windowState === 'shockable'
            ? '0 0 25px rgba(239,68,68,0.5), inset 0 0 20px rgba(255,255,255,0.1)'
            : 'none',
          animation: windowState === 'shockable' ? 'pulse-live 0.5s ease-in-out infinite' : 'none',
          transform: shockFlash ? 'scale(0.92)' : 'scale(1)',
          transition: 'all 0.12s',
          opacity: finished.current ? 0.5 : 1,
        }}
      >
        ⚡ SHOCK 除颤
      </button>

      {/* 操作提示 */}
      <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', lineHeight: 1.4 }}>
        {windowState === 'shockable'
          ? '点击 SHOCK 放电！'
          : windowState === 'charging'
            ? '等待充电完成…'
            : '分析心律中，请勿触碰患者'}
      </div>

      {/* 除颤成功闪光 */}
      {successFlash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
          backgroundColor: 'rgba(5,150,105,0.08)',
          transition: 'opacity 0.2s',
        }} />
      )}
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
