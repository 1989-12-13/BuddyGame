// ============================================================
// HoldPressure — 按压止血
// 按住保持压力，血量下降；松手血量回升，需维持到目标秒数
// ============================================================

import { useEffect, useRef, useState } from 'react'
import type { HoldPressureSpec, MiniGameProps } from '../../../game/types'

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
}

export function HoldPressure({ spec, onComplete }: MiniGameProps) {
  const s = spec as HoldPressureSpec
  const [blood, setBlood] = useState(100)        // 0 安全，100 危险
  const [safeTime, setSafeTime] = useState(0)
  const [holding, setHolding] = useState(false)

  const held = useRef(false)
  const bloodRef = useRef(100)
  const safeRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef(0)
  const finished = useRef(false)
  const maxTime = s.holdSec * 3 + 6

  useEffect(() => {
    lastRef.current = performance.now()
    const loop = () => {
      const now = performance.now()
      const dt = (now - lastRef.current) / 1000
      lastRef.current = now
      if (held.current) bloodRef.current = Math.max(0, bloodRef.current - s.regainPerSec * dt)
      else bloodRef.current = Math.min(100, bloodRef.current + s.bleedRatePerSec * dt)
      setBlood(bloodRef.current)
      if (held.current && bloodRef.current < 30) {
        safeRef.current += dt
        setSafeTime(safeRef.current)
      }
      if ((safeRef.current >= s.holdSec || safeRef.current >= maxTime) && !finished.current) {
        finish()
        return
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    const onDown = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); press(true) } }
    const onUp = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); press(false) } }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const press = (v: boolean) => {
    if (finished.current) return
    held.current = v
    setHolding(v)
  }

  const finish = () => {
    if (finished.current) return
    finished.current = true
    held.current = false
    setHolding(false)
    const reached = safeRef.current >= s.holdSec
    const score = reached ? 1 : Math.max(0, Math.min(1, safeRef.current / s.holdSec))
    setTimeout(() => onComplete(score, score >= s.passThreshold), 700)
  }

  const bloodColor = blood < 30 ? '#22c55e' : blood < 70 ? '#ffb000' : '#ff5454'

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', gap: 18, fontFamily: 'monospace' }}>
        <Readout label="血量" value={blood.toFixed(0)} color={bloodColor} />
        <Readout label="维持" value={safeTime.toFixed(1) + 's'} color="#58a6ff" />
        <Readout label="目标" value={s.holdSec + 's'} color="var(--text-muted)" />
      </div>

      <div style={{ width: 240, height: 26, backgroundColor: 'var(--border-light)', borderRadius: 13, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${blood}%`, height: '100%', backgroundColor: bloodColor, transition: 'width 0.05s linear', boxShadow: `0 0 12px ${bloodColor}` }} />
      </div>

      <div
        onPointerDown={() => press(true)}
        onPointerUp={() => press(false)}
        onPointerLeave={() => press(false)}
        style={{ width: 140, height: 140, borderRadius: '50%', backgroundColor: 'var(--border-light)', border: `3px solid ${holding ? '#22c55e' : '#ff3b3b'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none', transition: 'border-color 0.1s, transform 0.09s', transform: holding ? 'scale(0.94)' : 'scale(1)' }}
      >
        <span style={{ fontSize: 13, color: '#ff3b3b', fontWeight: 'bold', textAlign: 'center' }}>按住施压\n空格/点击</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>保持按压直到血量降至安全区并维持</div>
    </div>
  )
}

function Readout({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 50 }}>
      <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color, textShadow: `0 0 8px ${color}55` }}>{value}</div>
    </div>
  )
}
