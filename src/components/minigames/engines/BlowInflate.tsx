// ============================================================
// BlowInflate — 吹气充胀（人工呼吸）
// 按住空格充胀，理想区间有效，过量胃胀气惩罚，不足无效
// ============================================================

import { useEffect, useRef, useState } from 'react'
import type { BlowInflateSpec, MiniGameProps } from '../../../game/types'

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
}

export function BlowInflate({ spec, onComplete }: MiniGameProps) {
  const s = spec as BlowInflateSpec
  const [fill, setFill] = useState(0)        // 0-1 当前充胀度
  const [good, setGood] = useState(0)        // 有效吹气次数
  const [over, setOver] = useState(0)        // 胃胀气次数
  const [timeLeft, setTimeLeft] = useState(s.durationSec)

  const holding = useRef(false)
  const holdStart = useRef(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(0)
  const finished = useRef(false)

  useEffect(() => {
    startRef.current = performance.now()
    const loop = () => {
      const elapsed = (performance.now() - startRef.current) / 1000
      setTimeLeft(Math.max(0, s.durationSec - elapsed))
      setFill((f) => {
        if (holding.current) return Math.min(1, f + 0.9 / s.idealHoldSec * (1 / 60))
        // 松手缓慢回落
        return Math.max(0, f - 0.04)
      })
      if (elapsed >= s.durationSec && !finished.current) {
        finish()
        return
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); if (!finished.current) { holding.current = true; holdStart.current = performance.now() } }
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
    const dur = (performance.now() - holdStart.current) / 1000
    if (dur >= s.overInflationSec) setOver((o) => o + 1)
    else if (dur >= s.idealHoldSec * 0.5) setGood((g) => g + 1)
    setFill(0)
  }

  const finish = () => {
    if (finished.current) return
    finished.current = true
    holding.current = false
    const score = Math.max(0, Math.min(1, good / s.targetInflations - over * 0.15))
    setTimeout(() => onComplete(score, score >= s.passThreshold), 700)
  }

  const fillColor = fill > s.overInflationSec / s.durationSec ? '#ef4444' : '#3b82f6'

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', gap: 18, fontFamily: 'monospace' }}>
        <Readout label="有效" value={String(good)} color="#16a34a" />
        <Readout label="目标" value={String(s.targetInflations)} color="#94a3b8" />
        <Readout label="胀气" value={String(over)} color="#ef4444" />
        <Readout label="剩余" value={timeLeft.toFixed(1) + 's'} color="#3b82f6" />
      </div>

      {/* 肺部充胀量表 */}
      <div style={{ width: 240, height: 26, backgroundColor: '#f1f5f9', borderRadius: 13, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ width: `${fill * 100}%`, height: '100%', backgroundColor: fillColor, transition: 'width 0.05s linear', boxShadow: `0 0 12px ${fillColor}` }} />
      </div>
      <div style={{ fontSize: 11, color: '#64748b' }}>
        按住空格吹气，充胀至中段松开（过量会胃胀气）
      </div>
      <div style={{ fontSize: 11, color: '#475569' }}>
        理想 {s.idealHoldSec}s · 过量 {s.overInflationSec}s
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
