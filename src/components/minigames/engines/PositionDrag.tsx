// ============================================================
// PositionDrag — 摆位拖拽（复苏体位）
// 刻度盘旋转：旋转指针至目标角度（面部朝向）
// ============================================================

import { useEffect, useRef, useState } from 'react'
import type { MiniGameProps, PositionDragSpec } from '../../../game/types'
import { Readout } from '../Readout'

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
}

export function PositionDrag({ spec, onComplete, paused }: MiniGameProps) {
  const s = spec as PositionDragSpec

  const [angle, setAngle] = useState(0)
  const dragging = useRef(false)
  const lastX = useRef(0)
  const finished = useRef(false)
  const pausedRef = useRef(false)
  useEffect(() => { pausedRef.current = !!paused }, [paused])

  const dev = Math.abs(((angle - s.targetAngle + 540) % 360) - 180)
  const aligned = dev <= s.angleTolerance
  const score = Math.max(0, 1 - dev / (s.angleTolerance * 3))

  const onPointerDown = (e: React.PointerEvent) => {
    if (pausedRef.current) return
    dragging.current = true
    lastX.current = e.clientX
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || pausedRef.current) return
    const dx = e.clientX - lastX.current
    lastX.current = e.clientX
    setAngle((a) => Math.max(0, Math.min(180, a + dx * 0.6)))
  }
  const onPointerUp = () => { dragging.current = false }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished.current || pausedRef.current) return
      if (e.code === 'ArrowLeft') setAngle((a) => Math.max(0, a - 3))
      if (e.code === 'ArrowRight') setAngle((a) => Math.min(180, a + 3))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const confirm = () => {
    if (finished.current || pausedRef.current) return
    finished.current = true
    setTimeout(() => onComplete(score, score >= s.passThreshold), 600)
  }

  const rad = -90  // 0° 朝上
  const tipX = (a: number) => 90 + 58 * Math.cos(((a + rad) * Math.PI) / 180)
  const tipY = (a: number) => 90 + 58 * Math.sin(((a + rad) * Math.PI) / 180)

  const arcPath = (from: number, to: number, r: number) => {
    const f = ((from + rad) * Math.PI) / 180
    const t = ((to + rad) * Math.PI) / 180
    const x1 = 90 + r * Math.cos(f), y1 = 90 + r * Math.sin(f)
    const x2 = 90 + r * Math.cos(t), y2 = 90 + r * Math.sin(t)
    const large = to - from > 180 ? 1 : 0
    return `M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2}`
  }

  return (
    <div style={wrap}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
        目标：{s.bodyLabel}
      </div>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          width: 280,
          height: 260,
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'ew-resize',
          touchAction: 'none',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <svg width={200} height={200} viewBox="0 0 180 180">
          {/* 刻度盘底色 */}
          <circle cx={90} cy={90} r={68} fill="var(--border-light)" stroke="var(--border)" strokeWidth={1} />

          {/* 刻度标记（每 15°） */}
          {Array.from({ length: 13 }).map((_, i) => {
            const deg = i * 15
            const inner = deg % 30 === 0 ? 58 : 63
            const outer = 67
            const sx = 90 + outer * Math.cos(((deg - 90 + rad) * Math.PI) / 180)
            const sy = 90 + outer * Math.sin(((deg - 90 + rad) * Math.PI) / 180)
            const ex = 90 + inner * Math.cos(((deg - 90 + rad) * Math.PI) / 180)
            const ey = 90 + inner * Math.sin(((deg - 90 + rad) * Math.PI) / 180)
            return (
              <line key={i} x1={ex} y1={ey} x2={sx} y2={sy}
                stroke={deg % 30 === 0 ? 'var(--text-muted)' : 'var(--border-bright)'} strokeWidth={deg % 30 === 0 ? 1 : 0.5} />
            )
          })}

          {/* 角度标签 */}
          <text x={90} y={6} textAnchor="middle" fontSize={7} fill="var(--text-muted)">0°</text>
          <text x={90} y={178} textAnchor="middle" fontSize={7} fill="var(--text-muted)">180°</text>
          <text x={8} y={93} textAnchor="middle" fontSize={7} fill="var(--text-muted)" transform="rotate(-90,8,93)">90°</text>
          <text x={172} y={93} textAnchor="middle" fontSize={7} fill="var(--text-muted)" transform="rotate(90,172,93)">90°</text>

          {/* 目标扇形区域 */}
          <path
            d={arcPath(90 - s.targetAngle, 90 + s.targetAngle, 58)}
            stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 3"
            fill="rgba(59,130,246,0.06)"
          />
          {/* 目标终点小旗 */}
          <text
            x={tipX(90 - s.targetAngle)} y={tipY(90 - s.targetAngle) - 6}
            textAnchor="middle" fontSize={7} fill="#3b82f6"
            fontWeight="bold"
          >
            ▼ 目标 {s.targetAngle}°
          </text>

          {/* 中心圈 */}
          <circle cx={90} cy={90} r={22} fill="#fff" stroke="var(--border-bright)" strokeWidth={1} />
          <circle cx={90} cy={90} r={18} fill="var(--bg-surface)" />

          {/* 人脸方向图标 */}
          <g transform={`rotate(${angle - 90}, 90, 90)`}>
            {/* 面部朝向三角箭头 */}
            <polygon
              points="90,45 83,65 97,65"
              fill={aligned ? '#16a34a' : '#b1bac4'}
              opacity={0.7}
            />
            {/* 面部圆（脸的轮廓） */}
            <circle cx={90} cy={78} r={10}
              fill={aligned ? 'rgba(5,150,105,0.12)' : 'rgba(71,85,105,0.08)'}
              stroke={aligned ? '#16a34a' : 'var(--text-muted)'}
              strokeWidth={0.6} />
          </g>

          {/* 中心小圆点 */}
          <circle cx={90} cy={90} r={2.5} fill="var(--text-secondary)" />

          {/* 当前角度指示条 */}
          <line x1={90} y1={90} x2={tipX(angle)} y2={tipY(angle)}
            stroke={aligned ? '#16a34a' : '#b1bac4'}
            strokeWidth={aligned ? 2 : 1.2}
            opacity={aligned ? 0.8 : 0.4}
          />

          {/* 对齐成功 */}
          {aligned && (
            <g>
              <circle cx={90} cy={90} r={68}
                fill="none" stroke="#16a34a" strokeWidth={1.5} opacity={0.4}>
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
              <text x={90} y={172} textAnchor="middle" fill="#16a34a" fontSize={8} fontWeight="bold">
                ✓ 到位
              </text>
            </g>
          )}
        </svg>

        {/* 拖拽提示 */}
        {!aligned && angle < s.targetAngle * 0.8 && (
          <div style={{
            position: 'absolute', bottom: 14, left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 9, color: 'var(--text-muted)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            ← 拖拽旋转 →
          </div>
        )}
      </div>

      <div style={{
        display: 'flex', gap: 20, fontFamily: 'monospace',
        backgroundColor: '#fff', padding: '6px 16px',
        borderRadius: 8, border: '1px solid var(--border)',
      }}>
        <Readout label="当前" value={`${angle.toFixed(0)}°`} color="var(--text-primary)" />
        <Readout label="偏差" value={`${dev.toFixed(0)}°`} color={aligned ? '#16a34a' : '#d97706'} />
        <Readout label="目标" value={`${s.targetAngle}°`} color="var(--text-muted)" />
      </div>

      <button
        disabled={!aligned}
        onClick={confirm}
        style={{
          padding: '8px 24px', borderRadius: 6, border: 'none',
          background: aligned
            ? 'linear-gradient(135deg, #16a34a, #047857)'
            : 'var(--border-light)',
          color: aligned ? '#fff' : 'var(--text-muted)',
          fontSize: 13, fontWeight: 'bold',
          cursor: aligned ? 'pointer' : 'not-allowed',
          opacity: aligned ? 1 : 0.5,
          transition: 'all 0.2s',
          boxShadow: aligned ? '0 2px 12px rgba(5,150,105,0.3)' : 'none',
        }}
      >
        确认摆位
      </button>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
        ← 拖拽或按方向键 → 旋转指针至目标角度
      </div>
    </div>
  )
}
