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

export function BlowInflate({ spec, onComplete }: MiniGameProps) {
  const s = spec as BlowInflateSpec
  const [fill, setFill] = useState(0)        // 0-1 当前充胀度
  const [good, setGood] = useState(0)        // 有效吹气次数
  const [over, setOver] = useState(0)        // 胃胀气次数
  const [timeLeft, setTimeLeft] = useState(s.durationSec)
  const [showBurst, setShowBurst] = useState(false) // 成功吹气的爆发效果

  const holding = useRef(false)
  const holdStart = useRef(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(0)
  const finished = useRef(false)

  // 理想区间
  const idealMin = 0.35
  const idealMax = s.idealHoldSec / (s.idealHoldSec + 0.5)
  const overThreshold = 0.88  // fill 超过此值 = 胃胀气

  useEffect(() => {
    startRef.current = performance.now()
    const loop = () => {
      const elapsed = (performance.now() - startRef.current) / 1000
      setTimeLeft(Math.max(0, s.durationSec - elapsed))
      setFill((f) => {
        if (holding.current) return Math.min(1, f + 0.018)
        return Math.max(0, f - 0.06)
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

    if (fill >= overThreshold) {
      // 过量 → 胃胀气
      setOver((o) => o + 1)
    } else if (fill >= idealMin) {
      // 有效吹气
      setGood((g) => g + 1)
      setShowBurst(true)
      setTimeout(() => setShowBurst(false), 400)
    }
    // 低于 idealMin = 不足，无效
    setFill(0)
  }

  const finish = () => {
    if (finished.current) return
    finished.current = true
    holding.current = false
    const score = Math.max(0, Math.min(1, good / s.targetInflations - over * 0.15))
    setTimeout(() => onComplete(score, score >= s.passThreshold), 700)
  }

  // 计算当前充胀的指示颜色
  const barColor =
    fill >= overThreshold ? '#ef4444' :
    fill >= idealMin ? '#059669' :
    fill > 0 ? '#3b82f6' : '#e2e8f0'

  // 胸部"隆起"幅度
  const chestScale = 1 + fill * 0.25

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', gap: 18, fontFamily: 'monospace' }}>
        <Readout label="有效" value={String(good)} color="#16a34a" />
        <Readout label="目标" value={String(s.targetInflations)} color="#94a3b8" />
        <Readout label="胀气" value={String(over)} color="#ef4444" />
        <Readout label="剩余" value={timeLeft.toFixed(1) + 's'} color="#3b82f6" />
      </div>

      {/* 胸部起伏可视化 */}
      <div style={{
        width: 160, height: 120,
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        border: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        transition: 'box-shadow 0.1s',
        boxShadow: showBurst ? '0 0 30px rgba(5,150,105,0.3)' : 'none',
      }}>
        {/* 躯干轮廓 */}
        <svg width={120} height={100} viewBox="0 0 120 100">
          <defs>
            <radialGradient id="lungGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={fill > 0 ? '#e0f2fe' : '#f1f5f9'} />
              <stop offset="100%" stopColor={fill > 0 ? '#bae6fd' : '#e2e8f0'} />
            </radialGradient>
          </defs>
          {/* 肩膀 */}
          <path d="M20 20 Q15 22 12 28 Q10 32 12 36 L18 36 Q15 30 18 26 Z" fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.5} />
          <path d="M100 20 Q105 22 108 28 Q110 32 108 36 L102 36 Q105 30 102 26 Z" fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.5} />
          {/* 胸部/肺部 */}

          <g transform={`translate(60, 52) scale(${chestScale > 1.15 ? chestScale * 0.95 : chestScale}, ${chestScale})`}>
            <ellipse cx={0} cy={0} rx={36} ry={28} fill="url(#lungGrad)" stroke="#94a3b8" strokeWidth={1} />
            {/* 气管 */}
            <rect x={-4} y={-36} width={8} height={10} rx={3} fill="#fadcbc" stroke="#c9a98b" strokeWidth={0.6} />
            {/* 左右肺叶轮廓 */}
            <ellipse cx={-12} cy={-2} rx={14} ry={20} fill="none" stroke="#cbd5e1" strokeWidth={0.5} opacity={0.5} />
            <ellipse cx={12} cy={-2} rx={14} ry={20} fill="none" stroke="#cbd5e1" strokeWidth={0.5} opacity={0.5} />
            {/* 心脏 */}
            <path d="M-4 6 Q-8 2 -6 -2 Q-4 -4 0 0 Q4 -4 6 -2 Q8 2 4 6 Z" fill="#ef4444" opacity={0.4} />
          </g>
          {/* 成功吹气标记 */}
          {showBurst && (
            <g>
              <text x={60} y={14} textAnchor="middle" fill="#059669" fontSize={7} fontWeight="bold">
                ✓ 吹气成功
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* 充胀量进度条 + 理想区指示 */}
      <div style={{ width: 240, position: 'relative', height: 28 }}>
        {/* 背景 */}
        <div style={{ width: '100%', height: 28, backgroundColor: '#f1f5f9', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', position: 'relative' }}>
          {/* 理想区（绿色） */}
          <div style={{
            position: 'absolute', left: `${idealMin * 100}%`, top: 0,
            width: `${(idealMax - idealMin) * 100}%`, height: '100%',
            backgroundColor: 'rgba(5,150,105,0.12)',
            borderLeft: '1px dashed rgba(5,150,105,0.3)',
            borderRight: '1px dashed rgba(5,150,105,0.3)',
          }} />
          {/* 过量区（红色） */}
          <div style={{
            position: 'absolute', left: `${overThreshold * 100}%`, top: 0,
            width: `${(1 - overThreshold) * 100}%`, height: '100%',
            backgroundColor: 'rgba(239,68,68,0.1)',
            borderLeft: '1px dashed rgba(239,68,68,0.3)',
          }} />
          {/* 填充量 */}
          <div style={{
            width: `${fill * 100}%`, height: '100%',
            backgroundColor: barColor,
            transition: 'width 0.04s linear, background-color 0.12s',
            boxShadow: fill > 0 ? `0 0 12px ${barColor}` : 'none',
            position: 'relative', zIndex: 1,
          }} />
        </div>
        {/* 刻度标签 */}
        <div style={{ fontSize: 8, color: '#94a3b8', display: 'flex', justifyContent: 'space-between', padding: '2px 4px 0' }}>
          <span>不足</span>
          <span style={{ color: '#059669' }}>理想区</span>
          <span style={{ color: '#ef4444' }}>过量</span>
        </div>
      </div>

      <div style={{ fontSize: 11, color: '#64748b' }}>
        按住空格吹气，观察胸部隆起，在<span style={{ color: '#059669', fontWeight: 'bold' }}>理想区</span>松手
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
