// ============================================================
// AimForce — 瞄准施力
// 拖拽施力标记到正确解剖位 → 锁定 → 施力/按压
// 支持：正面全身、侧面轮廓、肢体图解三种视图
// ============================================================

import { useEffect, useRef, useState } from 'react'
import type { AimForceSpec, MiniGameProps } from '../../../game/types'

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
}

/* ─── 共用渐变定义 ─── */
const skin = '#1a2035'
const skinHL = '#252d4a'
const skinStroke = '#3d4f6a'
const targetBlue = '#38bdf8'

const defs = (
  <defs>
    <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={skinHL} />
      <stop offset="100%" stopColor={skin} />
    </linearGradient>
    <linearGradient id="woundGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#ef4444" />
      <stop offset="50%" stopColor="#dc2626" />
      <stop offset="100%" stopColor="#b91c1c" />
    </linearGradient>
    <radialGradient id="glowRed" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(239,68,68,0.3)" />
      <stop offset="100%" stopColor="rgba(239,68,68,0)" />
    </radialGradient>
    <radialGradient id="glowBlue" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="rgba(56,189,248,0.2)" />
      <stop offset="100%" stopColor="rgba(56,189,248,0)" />
    </radialGradient>
    <filter id="shadow1">
      <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
    </filter>
  </defs>
)

export function AimForce({ spec, onComplete }: MiniGameProps) {
  const s = spec as AimForceSpec
  const isSideView = s.showSideView
  const hideGuide = s.hideTargetGuide
  const bodyType = s.bodyDiagram ?? 'full'
  const isArm = bodyType === 'arm'

  const [mx, setMx] = useState(isArm ? 22 : 50)
  const [my, setMy] = useState(isArm ? 55 : 20)
  const [phase, setPhase] = useState<'aim' | 'thrust' | 'done'>('aim')
  const [thrusts, setThrusts] = useState(0)
  const [flash, setFlash] = useState(false)

  const dragging = useRef(false)
  const thrustTimes = useRef<number[]>([])
  const finished = useRef(false)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const dist = Math.hypot(mx - s.targetX, my - s.targetY)
  const inTarget = dist <= s.aimTolerance
  const aimScore = Math.max(0.4, 1 - dist / (s.aimTolerance * 2.5))

  const toNorm = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMx(Math.max(0, Math.min(100, x)))
    setMy(Math.max(0, Math.min(100, y)))
  }

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (phase !== 'aim') return
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    toNorm(e)
  }
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging.current) toNorm(e)
  }
  const onPointerUp = () => { dragging.current = false }

  const lock = () => { if (inTarget) setPhase('thrust') }

  const thrust = () => {
    if (phaseRef.current !== 'thrust' || finished.current) return
    const now = performance.now()
    thrustTimes.current.push(now)
    const n = thrustTimes.current.length
    setThrusts(n)
    setFlash(true)
    setTimeout(() => setFlash(false), 90)
    if (n >= s.thrusts) finish()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); thrust() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finish = () => {
    if (finished.current) return
    finished.current = true
    const pts = thrustTimes.current
    let thrustScore = 0
    if (pts.length >= 2) {
      const ivals: number[] = []
      for (let i = 1; i < pts.length; i++) ivals.push(pts[i] - pts[i - 1])
      const tolFrac = 0.4
      let sum = 0
      for (const iv of ivals) {
        const dev = Math.abs(iv - s.thrustWindowMs) / s.thrustWindowMs
        sum += Math.max(0, 1 - dev / tolFrac)
      }
      thrustScore = sum / ivals.length
    } else {
      thrustScore = pts.length > 0 ? 0.5 : 0
    }
    const total = Math.max(0, Math.min(1, aimScore * (0.5 + 0.5 * thrustScore)))
    setPhase('done')
    setTimeout(() => onComplete(total, total >= s.passThreshold), 700)
  }

  return (
    <div style={wrap}>
      <svg
        viewBox="0 0 100 100"
        width={isArm ? 220 : 160}
        height={isArm ? 170 : 220}
        style={{
          backgroundColor: '#0d1121',
          borderRadius: 10,
          border: '1px solid #1e2a4a',
          cursor: phase === 'aim' ? 'crosshair' : 'pointer',
          touchAction: 'none',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {defs}

        {isArm ? (
          /* ===== 手臂示意图（止血近心端压力点） ===== */
          <g filter="url(#shadow1)">
            {/* 背景光晕 */}
            <circle cx={19} cy={28} r={30} fill="url(#glowBlue)" />

            {/* 上臂 */}
            <path d="M8 10 Q6 20 7 38 Q7 44 10 48 L14 50 Q18 52 20 50 L24 48 Q28 44 28 38 Q30 20 26 10 Z"
              fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.8} />
            {/* 肱二头肌轮廓 */}
            <path d="M10 18 Q13 28 14 38" fill="none" stroke="#2d3a55" strokeWidth={0.6} opacity={0.5} />
            <path d="M24 18 Q21 28 20 38" fill="none" stroke="#2d3a55" strokeWidth={0.6} opacity={0.5} />

            {/* 肘 */}
            <ellipse cx={18} cy={50} rx={8} ry={4} fill={skinHL} stroke={skinStroke} strokeWidth={0.8} />

            {/* 前臂 */}
            <path d="M10 52 Q8 60 9 70 Q9 78 11 82 L13 84 Q16 86 19 86 Q22 86 24 84 L26 82 Q28 78 28 70 Q29 60 27 52 Z"
              fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.8} />
            {/* 前臂肌肉 */}
            <path d="M12 60 Q15 70 15 80" fill="none" stroke="#2d3a55" strokeWidth={0.5} opacity={0.4} />
            <path d="M22 60 Q20 70 19 80" fill="none" stroke="#2d3a55" strokeWidth={0.5} opacity={0.4} />

            {/* 手腕 */}
            <rect x={12} y={84} width={12} height={3} rx={1.5} fill={skinHL} stroke={skinStroke} strokeWidth={0.6} />

            {/* 手 */}
            <path d="M12 88 Q10 92 12 98 L12 100 Q13 102 16 102 Q19 102 21 100 L22 98 Q24 92 23 88 Z"
              fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.8} />

            {/* 伤口（前臂中段）— 立体感 */}
            <circle cx={16} cy={74} r={4} fill="url(#glowRed)" />
            <path d="M11 72 L21 72 M11 74 L21 74 M11 76 L21 76"
              stroke="url(#woundGrad)" strokeWidth={2} strokeLinecap="round" fill="none" />
            <circle cx={16} cy={74} r={2} fill="#ef4444" opacity={0.8} />

            {/* 血滴 */}
            <circle cx={14} cy={87} r={1.2} fill="#ef4444" opacity={0.5} />
            <circle cx={20} cy={89} r={0.8} fill="#ef4444" opacity={0.3} />
            <circle cx={13} cy={91} r={1} fill="#ef4444" opacity={0.35} />

            {/* 标注：伤口 */}
            <text x={36} y={77} fill="#ef4444" fontSize={4.2} fontWeight="bold" filter="url(#shadow1)">伤口</text>
            <line x1={32} y1={74} x2={23} y2={74} stroke="#ef4444" strokeWidth={0.6} opacity={0.6} />

            {/* 箭头：近心端方向 */}
            <line x1={85} y1={18} x2={35} y2={18} stroke={targetBlue} strokeWidth={0.8} strokeDasharray="2 1.5" opacity={0.6} />
            <polygon points="35,15 32,18 35,21" fill={targetBlue} opacity={0.6} />
            <text x={65} y={14} fill={targetBlue} fontSize={3.8} fontWeight="bold" opacity={0.7}>近心端→</text>

            {/* 止血点区域 */}
            <circle cx={s.targetX} cy={s.targetY} r={s.aimTolerance}
              fill="rgba(56,189,248,0.06)" stroke={targetBlue} strokeWidth={0.8} strokeDasharray="2 2" opacity={0.7} />
            {/* 止血点十字标记 */}
            <line x1={s.targetX - 5} y1={s.targetY} x2={s.targetX + 5} y2={s.targetY}
              stroke={targetBlue} strokeWidth={0.6} opacity={0.5} />
            <line x1={s.targetX} y1={s.targetY - 5} x2={s.targetX} y2={s.targetY + 5}
              stroke={targetBlue} strokeWidth={0.6} opacity={0.5} />

            {/* 施力标记 */}
            {!hideGuide && (
              <circle cx={mx} cy={my} r={4} fill={inTarget ? '#059669' : '#dc2626'}
                stroke="#fff" strokeWidth={1.2}
                style={{ transition: 'fill 0.12s', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }} />
            )}

            {/* 标注：止血点 */}
            <text x={s.targetX + 8} y={s.targetY + 1.5}
              fill={targetBlue} fontSize={4.2} fontWeight="bold" opacity={0.5}>肱动脉止血点</text>
          </g>
        ) : isSideView ? (
          /* ===== 侧面轮廓（海姆立克）— 精细人体轮廓 ===== */
          <g filter="url(#shadow1)">
            {/* 背景光晕 */}
            <ellipse cx={50} cy={55} rx={35} ry={40} fill="rgba(56,189,248,0.03)" />

            {/* 头发 */}
            <path d="M40 5 Q42 1 48 1 Q55 1 58 4 Q60 6 60 10 Q60 8 55 6 Q50 5 45 6 Q40 8 40 10 Z"
              fill="#0f172a" />

            {/* 头部侧面轮廓 */}
            <path d="M40 10 Q40 4 45 3 L50 2 Q55 3 58 6 Q60 9 60 14 Q60 18 58 20 L56 22 Q54 24 52 24 L46 24 Q44 24 42 22 L40 20 Q38 18 38 14 Z"
              fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.7} />
            {/* 面部特征 */}
            <circle cx={54} cy={12} r={0.8} fill="#475569" /> {/* 眼睛 */}
            <path d="M55 15 Q56 14 57 15" fill="none" stroke="#475569" strokeWidth={0.6} /> {/* 鼻子（侧面） */}
            <path d="M56 17 Q57 18 57 19" fill="none" stroke="#475569" strokeWidth={0.5} /> {/* 嘴唇 */}
            {/* 下巴到颈部 */}
            <path d="M42 22 Q44 24 45 26 Q46 28 45 30 L41 30 Q40 28 40 24 Z"
              fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.7} />

            {/* 躯干 - 侧面轮廓 */}
            <path d="M39 30 Q36 36 36 42 Q36 48 38 52 L38 58 Q39 60 42 62 L44 62 Q46 60 47 58 L48 52 Q49 48 49 42 Q49 36 47 30 Z"
              fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.7} />
            {/* 胸部轮廓（侧面） */}
            <path d="M44 34 Q46 40 46 45" fill="none" stroke="#2d3a55" strokeWidth={0.5} opacity={0.4} />
            {/* 腹部标记 - 脐 */}
            <circle cx={47} cy={52} r={0.8} fill="#2d3a55" opacity={0.5} />

            {/* 肩膀/上臂 */}
            <path d="M47 30 Q55 32 58 38 Q59 42 58 46 L56 47 Q55 42 52 37 Q49 34 47 33 Z"
              fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.7} />
            {/* 前臂（侧面，自然弯曲） */}
            <path d="M56 44 Q60 48 62 54 Q63 58 61 60 L59 60 Q58 56 56 52 Q54 48 55 46 Z"
              fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.6} opacity={0.8} />

            {/* 髋/骨盆 */}
            <path d="M38 60 Q36 64 37 68 Q38 70 42 71 L44 71 Q47 70 48 68 Q50 64 48 60 Z"
              fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.7} />

            {/* 大腿（侧面） */}
            <path d="M39 70 Q38 76 39 84 Q40 88 42 90 L44 90 Q46 88 47 84 Q48 76 47 70 Z"
              fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.7} />
            {/* 小腿 */}
            <path d="M40 88 Q39 92 40 98 Q41 100 43 100 L44 100 Q46 100 46 98 Q47 92 46 88 Z"
              fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.7} />

            {/* 施力标记 */}
            {!hideGuide && (
              <circle cx={mx} cy={my} r={4} fill={inTarget ? '#059669' : '#dc2626'}
                stroke="#fff" strokeWidth={1.2}
                style={{ transition: 'fill 0.12s', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }} />
            )}
          </g>
        ) : (
          /* ===== 正面全身图（默认） ===== */
          <g filter="url(#shadow1)">
            {/* 背景光晕 */}
            <ellipse cx={50} cy={60} rx={35} ry={50} fill="rgba(56,189,248,0.03)" />

            {/* 头发 */}
            <ellipse cx={50} cy={14} rx={12} ry={10} fill="#0f172a" />
            <ellipse cx={50} cy={14} rx={10} ry={8} fill="#1a2035" />

            {/* 头部 */}
            <ellipse cx={50} cy={18} rx={10} ry={8} fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.7} />
            {/* 面部特征 */}
            <circle cx={46} cy={17} r={0.9} fill="#475569" />
            <circle cx={54} cy={17} r={0.9} fill="#475569" />
            <path d="M48 21 Q50 22 52 21" fill="none" stroke="#475569" strokeWidth={0.6} />
            {/* 颈部 */}
            <rect x={45} y={26} width={10} height={4} rx={2} fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.6} />

            {/* 肩膀 */}
            <path d="M35 30 Q32 32 30 36 L70 36 Q68 32 65 30 Z"
              fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.7} />
            {/* 上臂 */}
            <rect x={30} y={36} width={6} height={24} rx={3} fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.6} />
            <rect x={64} y={36} width={6} height={24} rx={3} fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.6} />

            {/* 躯干 */}
            <path d="M38 30 Q36 42 38 54 Q40 62 42 66 L58 66 Q60 62 62 54 Q64 42 62 30 Z"
              fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.7} />
            {/* 胸部轮廓 */}
            <ellipse cx={50} cy={40} rx={8} ry={4} fill="none" stroke="#2d3a55" strokeWidth={0.5} opacity={0.4} />

            {/* 前臂 */}
            <rect x={30} y={58} width={5} height={28} rx={2.5} fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.6} />
            <rect x={65} y={58} width={5} height={28} rx={2.5} fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.6} />

            {/* 髋/骨盆 */}
            <path d="M38 64 Q34 68 36 72 L64 72 Q66 68 62 64 Z"
              fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.7} />

            {/* 大腿 */}
            <rect x={40} y={72} width={8} height={20} rx={4} fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.6} />
            <rect x={52} y={72} width={8} height={20} rx={4} fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.6} />
            {/* 小腿 */}
            <rect x={40} y={90} width={7} height={18} rx={3.5} fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.6} />
            <rect x={53} y={90} width={7} height={18} rx={3.5} fill="url(#skinGrad)" stroke={skinStroke} strokeWidth={0.6} />

            {/* 目标区域 */}
            <circle cx={s.targetX} cy={s.targetY} r={s.aimTolerance}
              fill="rgba(56,189,248,0.06)" stroke={targetBlue} strokeWidth={0.8} strokeDasharray="2 2" opacity={0.7} />

            {/* 施力标记 */}
            {!hideGuide && (
              <circle cx={mx} cy={my} r={4} fill={inTarget ? '#059669' : '#dc2626'}
                stroke="#fff" strokeWidth={1.2}
                style={{ transition: 'fill 0.12s', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }} />
            )}
          </g>
        )}
      </svg>

      {phase === 'aim' && (
        <>
          <div style={{
            fontSize: 11,
            color: inTarget ? '#059669' : '#94a3b8',
          }}>
            {inTarget ? '位置准确 ✓' : (isArm ? '拖拽到上臂内侧止血点' : '拖拽施力点到正确位置')}
          </div>
          <button
            disabled={!inTarget}
            onClick={lock}
            style={{
              padding: '7px 20px', borderRadius: 6, border: 'none',
              backgroundColor: inTarget ? '#059669' : '#1e293b',
              color: inTarget ? '#fff' : '#64748b',
              fontSize: 13, fontWeight: 'bold',
              cursor: inTarget ? 'pointer' : 'not-allowed',
              opacity: inTarget ? 1 : 0.5,
              transition: 'all 0.2s',
            }}
          >
            {isArm ? '确认止血点并施压' : '锁定位置'}
          </button>
        </>
      )}

      {phase === 'thrust' && (
        <>
          <div
            onPointerDown={thrust}
            style={{
              width: 120, height: 120, borderRadius: '50%',
              background: flash ? 'radial-gradient(circle at 50% 50%, #2d1b1b, #1e293b)' : 'radial-gradient(circle at 50% 50%, #1e293b, #0f172a)',
              border: `3px solid ${flash ? '#ef4444' : '#475569'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', userSelect: 'none',
              transition: 'transform 0.09s, border-color 0.09s',
              transform: flash ? 'scale(0.88)' : 'scale(1)',
              boxShadow: flash ? '0 0 20px rgba(239,68,68,0.3)' : 'none',
            }}
          >
            <span style={{
              fontSize: 13, color: '#fca5a5', fontWeight: 'bold',
              textAlign: 'center', lineHeight: 1.4,
            }}>
              {isArm ? '持续施压' : '腹部冲击'}{'\n'}按空格
            </span>
          </div>
          <div style={{
            fontSize: 12, color: '#94a3b8', fontFamily: 'monospace',
            display: 'flex', gap: 4,
          }}>
            {Array.from({ length: s.thrusts }).map((_, i) => (
              <div key={i} style={{
                width: 24, height: 24, borderRadius: '50%',
                backgroundColor: i < thrusts ? '#059669' : '#1e293b',
                border: '1px solid #334155',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: i < thrusts ? '#fff' : '#475569',
                transition: 'all 0.2s',
              }}>
                {i < thrusts ? '✓' : (i + 1)}
              </div>
            ))}
          </div>
        </>
      )}

      {phase === 'done' && (
        <div style={{
          fontSize: 13, color: '#4ade80', fontWeight: 'bold',
          padding: '6px 0',
        }}>
          ✓ {isArm ? '止血点定位并施压完成' : '操作完成'}
        </div>
      )}
    </div>
  )
}
