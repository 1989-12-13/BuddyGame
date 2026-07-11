// ============================================================
// PositionDrag — 摆位拖拽（复苏体位/侧卧）
// 拖拽旋转身体到目标角度后确认
// 支持：简洁条状（默认）和精细人体图（useDetailedFigure）
// ============================================================

import { useEffect, useRef, useState } from 'react'
import type { MiniGameProps, PositionDragSpec } from '../../../game/types'

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
}

/* ─── 渐变与滤镜 ─── */
const skin = '#1a2035'
const skinHL = '#252d4a'
const skinStroke = '#3d4f6a'

export function PositionDrag({ spec, onComplete }: MiniGameProps) {
  const s = spec as PositionDragSpec
  const detailed = s.useDetailedFigure

  const [angle, setAngle] = useState(0)
  const dragging = useRef(false)
  const lastX = useRef(0)
  const finished = useRef(false)

  const dev = Math.abs(((angle - s.targetAngle + 540) % 360) - 180)
  const aligned = dev <= s.angleTolerance
  const score = Math.max(0, 1 - dev / (s.angleTolerance * 3))

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    lastX.current = e.clientX
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - lastX.current
    lastX.current = e.clientX
    setAngle((a) => Math.max(0, Math.min(180, a + dx * 0.6)))
  }
  const onPointerUp = () => { dragging.current = false }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished.current) return
      if (e.code === 'ArrowLeft') setAngle((a) => Math.max(0, a - 3))
      if (e.code === 'ArrowRight') setAngle((a) => Math.min(180, a + 3))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const confirm = () => {
    if (finished.current) return
    finished.current = true
    setTimeout(() => onComplete(score, score >= s.passThreshold), 600)
  }

  const figureColor = aligned ? '#059669' : '#dc2626'
  const figureBg = aligned ? '#0a2a1a' : '#2a0a0a'

  return (
    <div style={wrap}>
      <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: 0.5 }}>
        目标姿态：{s.bodyLabel}
      </div>

      {/* 旋转舞台 */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          width: 260,
          height: 200,
          backgroundColor: '#0a0e17',
          borderRadius: 10,
          border: '1px solid #1a2640',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          cursor: 'ew-resize',
          touchAction: 'none',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* 参考地面线 */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 40,
          height: 1, backgroundColor: '#1a2640',
        }} />

        {/* 目标角度参考线（虚影） */}
        <div style={{
          position: 'absolute', left: '50%', bottom: 40, width: 2, height: 130,
          background: `linear-gradient(to top, rgba(56,189,248,0.3), rgba(56,189,248,0.05))`,
          transformOrigin: 'bottom center',
          transform: `translateX(-50%) rotate(${s.targetAngle}deg)`,
        }} />

        {/* 目标姿态小标签 */}
        <div style={{
          position: 'absolute', right: 16, top: 12,
          fontSize: 9, color: 'rgba(56,189,248,0.5)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <svg width={8} height={8} viewBox="0 0 8 8">
            <line x1={0} y1={4} x2={6} y2={4} stroke="rgba(56,189,248,0.5)" strokeWidth={1} />
            <polygon points="6,3 8,4 6,5" fill="rgba(56,189,248,0.5)" />
          </svg>
          目标姿态
        </div>

        {detailed ? (
          /* ===== 精细人体图 ===== */
          <div style={{
            position: 'absolute', left: '50%', bottom: 40,
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${angle}deg)`,
            transition: dragging.current ? 'none' : 'none',
          }}>
            <svg width={70} height={150} viewBox="0 0 70 150">
              <defs>
                <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={skinHL} />
                  <stop offset="100%" stopColor={skin} />
                </linearGradient>
                <filter id="bodyShadow">
                  <feDropShadow dx={1} dy={1} stdDeviation={2} floodColor="#000" floodOpacity={0.5} />
                </filter>
              </defs>

              <g filter="url(#bodyShadow)">
                {/* ---- 头部 ---- */}
                {/* 头发 */}
                <ellipse cx={35} cy={6} rx={14} ry={10} fill="#0f172a" />
                <ellipse cx={35} cy={6} rx={12} ry={8} fill="#1a2035" />
                {/* 头型 */}
                <ellipse cx={35} cy={11} rx={12} ry={10} fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.6} />
                {/* 头发细节 */}
                <path d="M24 8 Q28 3 35 2 Q42 3 46 8" fill="none" stroke="#0f172a" strokeWidth={1.5} />
                {/* 眼睛 */}
                <ellipse cx={31} cy={10} rx={1.5} ry={1} fill="#475569" />
                <ellipse cx={39} cy={10} rx={1.5} ry={1} fill="#475569" />
                {/* 眉毛 */}
                <path d="M29 8 Q31 7 33 8" fill="none" stroke="#334155" strokeWidth={0.6} />
                <path d="M37 8 Q39 7 41 8" fill="none" stroke="#334155" strokeWidth={0.6} />
                {/* 鼻子 */}
                <path d="M35 12 Q36 14 35 15" fill="none" stroke="#475569" strokeWidth={0.5} />
                {/* 嘴 */}
                <path d="M32 17 Q35 18.5 38 17" fill="none" stroke="#475569" strokeWidth={0.6} />
                {/* 下巴 */}
                <path d="M26 18 Q32 22 38 22 Q44 22 44 18" fill="none" stroke={skinStroke} strokeWidth={0.4} opacity={0.5} />
                {/* 颈部 */}
                <rect x={30} y={20} width={10} height={5} rx={2} fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.5} />

                {/* ---- 躯干 ---- */}
                {/* 肩膀 */}
                <path d="M18 25 Q16 27 15 31 L55 31 Q54 27 52 25 Z"
                  fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.6} />
                {/* 躯干主体 */}
                <path d="M21 26 Q18 38 19 52 Q20 60 22 64 L48 64 Q50 60 51 52 Q52 38 49 26 Z"
                  fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.6} />
                {/* 胸部轮廓 */}
                <ellipse cx={35} cy={38} rx={9} ry={5} fill="none" stroke="#2d3a55" strokeWidth={0.5} opacity={0.5} />
                {/* 锁骨 */}
                <path d="M24 30 Q30 28 35 29 Q40 28 46 30" fill="none" stroke="#2d3a55" strokeWidth={0.4} opacity={0.4} />
                {/* 腹部线条 */}
                <line x1={30} y1={48} x2={40} y2={48} stroke="#2d3a55" strokeWidth={0.4} opacity={0.3} />
                {/* 脐 */}
                <circle cx={35} cy={52} r={1} fill="#2d3a55" opacity={0.4} />

                {/* ---- 左臂（垂于身侧） ---- */}
                <path d="M18 27 Q12 30 10 38 Q9 44 10 50 L13 50 Q12 44 13 38 Q14 32 19 29 Z"
                  fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.5} />
                {/* 手 */}
                <ellipse cx={11} cy={52} rx={2.5} ry={2} fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.4} />

                {/* ---- 右臂（微屈于身前，模拟侧卧） ---- */}
                <path d="M52 27 Q58 30 60 36 Q61 40 60 44 L57 44 Q57 40 56 36 Q54 32 51 29 Z"
                  fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.5} />
                {/* 前臂（弯曲） */}
                <path d="M58 38 Q55 46 52 52 Q51 54 52 55 L55 55 Q57 52 59 46 Z"
                  fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.5} />
                {/* 手 */}
                <ellipse cx={53} cy={56} rx={2.5} ry={2} fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.4} />

                {/* ---- 髋部 ---- */}
                <path d="M24 62 Q20 66 22 70 L48 70 Q50 66 46 62 Z"
                  fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.6} />

                {/* ---- 左腿 ---- */}
                <path d="M24 69 Q22 76 23 86 Q24 92 26 98 L30 98 Q32 92 32 86 Q33 76 30 69 Z"
                  fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.5} />
                {/* 膝盖 */}
                <ellipse cx={27} cy={88} rx={4} ry={2.5} fill={skinHL} stroke={skinStroke} strokeWidth={0.4} />
                {/* 小腿 */}
                <path d="M25 96 Q24 104 25 112 Q26 116 28 120 L30 120 Q32 116 32 112 Q33 104 31 96 Z"
                  fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.5} />
                {/* 足 */}
                <ellipse cx={29} cy={121} rx={4} ry={2} fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.4} />

                {/* ---- 右腿 ---- */}
                <path d="M38 69 Q36 76 37 86 Q38 92 40 98 L44 98 Q46 92 46 86 Q47 76 44 69 Z"
                  fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.5} />
                {/* 膝盖 */}
                <ellipse cx={41} cy={88} rx={4} ry={2.5} fill={skinHL} stroke={skinStroke} strokeWidth={0.4} />
                {/* 小腿 */}
                <path d="M39 96 Q38 104 39 112 Q40 116 42 120 L44 120 Q46 116 46 112 Q47 104 45 96 Z"
                  fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.5} />
                {/* 足 */}
                <ellipse cx={43} cy={121} rx={4} ry={2} fill="url(#bodyGrad)" stroke={skinStroke} strokeWidth={0.4} />

                {/* ---- 体位对齐指示 ---- */}
                {aligned && (
                  <>
                    {/* 头偏一侧指示 */}
                    <line x1={35} y1={0} x2={35} y2={-8} stroke="#059669" strokeWidth={1.2} />
                    <polygon points="35,-6 33,-9 37,-9" fill="#059669" />
                    {/* 绿色轮廓光晕 */}
                    <ellipse cx={35} cy={55} rx={35} ry={75} fill="none" stroke="#059669" strokeWidth={0.6}
                      opacity={0.3} strokeDasharray="3 3" />
                  </>
                )}
              </g>
            </svg>
          </div>
        ) : (
          /* ===== 简洁条状（默认） ===== */
          <div style={{
            position: 'absolute', left: '50%', bottom: 40,
            width: 28, height: 130,
            background: `linear-gradient(to top, ${figureBg}, ${aligned ? '#0d3320' : '#331515'})`,
            border: `1px solid ${figureColor}`,
            borderRadius: 10,
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${angle}deg)`,
            boxShadow: aligned ? `0 0 20px rgba(5,150,105,0.3)` : 'none',
            transition: dragging.current ? 'none' : 'background-color 0.3s, border-color 0.3s',
          }} />
        )}
      </div>

      <div style={{
        display: 'flex', gap: 20, fontFamily: 'monospace',
        backgroundColor: '#0d1121', padding: '6px 16px',
        borderRadius: 8, border: '1px solid #1a2640',
      }}>
        <Readout label="旋转" value={angle.toFixed(0) + '°'} color="#e2e8f0" />
        <Readout label="偏差" value={dev.toFixed(0) + '°'} color={aligned ? '#059669' : '#f59e0b'} />
        <Readout label="目标" value={`±${s.angleTolerance}°`} color="#64748b" />
      </div>

      <button
        disabled={!aligned}
        onClick={confirm}
        style={{
          padding: '8px 24px', borderRadius: 6, border: 'none',
          background: aligned
            ? 'linear-gradient(135deg, #059669, #047857)'
            : '#1e293b',
          color: aligned ? '#fff' : '#64748b',
          fontSize: 13, fontWeight: 'bold',
          cursor: aligned ? 'pointer' : 'not-allowed',
          opacity: aligned ? 1 : 0.5,
          transition: 'all 0.2s',
          boxShadow: aligned ? '0 2px 12px rgba(5,150,105,0.3)' : 'none',
        }}
      >
        确认摆位
      </button>
      <div style={{ fontSize: 10, color: '#475569' }}>
        ← 拖动或按方向键 → 旋转身体
      </div>
    </div>
  )
}

function Readout({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 50 }}>
      <div style={{ fontSize: 9, color: '#475569', marginBottom: 2 }}>{label}</div>
      <div style={{
        fontSize: 17, fontWeight: 900, color,
        textShadow: `0 0 10px ${color}33`,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </div>
  )
}
