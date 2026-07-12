// ============================================================
// AimForce — 瞄准施力
// 拖拽施力标记到正确解剖位 → 锁定 → 持续按压/冲击
// ============================================================

import { useEffect, useRef, useState } from 'react'
import type { AimForceSpec, MiniGameProps } from '../../../game/types'

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
}

const skin = '#f5d0b0'
const skinStroke = '#c9a98b'

const glowBlue = { fill: 'rgba(59,130,246,0.06)', stroke: '#58a6ff', strokeWidth: 0.8, strokeDasharray: '2 2', opacity: 0.7 }

const targetMark = (tx: number, ty: number) => (
  <>
    <line x1={tx - 4} y1={ty} x2={tx + 4} y2={ty} stroke="#58a6ff" strokeWidth={0.6} opacity={0.5} />
    <line x1={tx} y1={ty - 4} x2={tx} y2={ty + 4} stroke="#58a6ff" strokeWidth={0.6} opacity={0.5} />
  </>
)

function getDefaultPos(bodyType: string): [number, number] {
  switch (bodyType) {
    case 'arm': return [22, 55]
    case 'leg': return [25, 55]
    case 'head': return [50, 30]
    case 'chest': return [50, 60]
    default: return [50, 20]
  }
}

export function AimForce({ spec, onComplete, paused }: MiniGameProps) {
  const s = spec as AimForceSpec
  const hideGuide = s.hideTargetGuide
  const bodyType = s.bodyDiagram ?? 'full'
  const isHoldMode = s.holdSec !== undefined  // 持续按压模式

  const [defX, defY] = getDefaultPos(bodyType)
  const [mx, setMx] = useState(defX)
  const [my, setMy] = useState(defY)
  const [phase, setPhase] = useState<'aim' | 'press' | 'done'>('aim')
  const [progress, setProgress] = useState(0)   // 持续按压进度 0-1
  const [flash, setFlash] = useState(false)

  const dragging = useRef(false)
  const holdTimer = useRef<number>(0)
  const holdStart = useRef(0)
  const finished = useRef(false)
  const pausedRef = useRef(false)
  const progressRef = useRef(0)
  useEffect(() => { pausedRef.current = !!paused }, [paused])
  useEffect(() => { progressRef.current = progress }, [progress])

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
    if (phase !== 'aim' || pausedRef.current) return
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    toNorm(e)
  }
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragging.current) toNorm(e)
  }
  const onPointerUp = () => {
    dragging.current = false
    // 持续按压模式：拖入目标区域后自动进入按压阶段
    if (isHoldMode && inTarget && phase === 'aim') setPhase('press')
  }

  // 持续按压逻辑（接续已有 progress）
  const startHold = () => {
    if (finished.current || phase !== 'press' || pausedRef.current) return
    const sec = s.holdSec ?? 3
    holdStart.current = performance.now() - progressRef.current * sec * 1000
    const tick = () => {
      if (pausedRef.current || finished.current) {
        holdTimer.current = 0
        return
      }
      const elapsed = (performance.now() - holdStart.current) / 1000
      const p = Math.min(1, elapsed / sec)
      setProgress(p)
      setFlash(true)
      setTimeout(() => setFlash(false), 150)
      if (p >= 1) { finishHold(); return }
      holdTimer.current = window.setTimeout(tick, 80)
    }
    tick()
  }

  const stopHold = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = 0 }
  }

  const finishHold = () => {
    if (finished.current) return
    finished.current = true
    setPhase('done')
    const total = aimScore * (0.6 + 0.4 * progress)
    setTimeout(() => onComplete(total, total >= s.passThreshold), 700)
  }

  // paused 切换：恢复时若仍在 press 阶段且玩家未曾 pointerUp，自动接续 tick
  useEffect(() => {
    if (!paused && phase === 'press' && !holdTimer.current && !finished.current && progressRef.current > 0 && progressRef.current < 1) {
      startHold()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused])

  // 冲击模式（非持续按压，现有海姆立克等用）
  // ... kept for backward compatibility but simplified

  useEffect(() => {
    return () => { if (holdTimer.current) clearTimeout(holdTimer.current) }
  }, [])

  const isLocal = bodyType === 'arm' || bodyType === 'leg' || bodyType === 'head' || bodyType === 'chest'

  return (
    <div style={wrap}>
      <svg
        viewBox="0 0 100 100"
        width={isLocal ? 200 : 160}
        height={isLocal ? 180 : 220}
        style={{
          backgroundColor: '#11151c',
          borderRadius: 10,
          border: '1px solid #2a323e',
          cursor: phase === 'aim' ? 'crosshair' : 'default',
          touchAction: 'none',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fadcbc" />
            <stop offset="100%" stopColor={skin} />
          </linearGradient>
          <linearGradient id="wg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff5454" />
            <stop offset="50%" stopColor="#ff3b3b" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
          <radialGradient id="gr" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(239,68,68,0.3)" />
            <stop offset="100%" stopColor="rgba(239,68,68,0)" />
          </radialGradient>
          <filter id="sh">
            <feDropShadow dx={0} dy={1} stdDeviation={2} floodColor="#000" floodOpacity={0.35} />
          </filter>
        </defs>

        {bodyType === 'arm' ? (
          /* ── 手臂 ── */
          <g filter="url(#sh)">
            <path d="M8 10 Q6 20 7 38 Q7 44 10 48 L14 50 Q18 52 20 50 L24 48 Q28 44 28 38 Q30 20 26 10 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.7} />
            <ellipse cx={18} cy={50} rx={7} ry={3.5} fill="#fadcbc" stroke={skinStroke} strokeWidth={0.6} />
            <path d="M10 52 Q8 60 9 70 Q9 78 11 82 L13 84 Q16 86 19 86 Q22 86 24 84 L26 82 Q28 78 28 70 Q29 60 27 52 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.7} />
            <rect x={12} y={84} width={12} height={3} rx={1.5} fill="#fadcbc" stroke={skinStroke} strokeWidth={0.5} />
            <path d="M12 88 Q10 92 12 98 L12 100 Q13 102 16 102 Q19 102 21 100 L22 98 Q24 92 23 88 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.7} />
            {/* 伤口 */}
            <circle cx={18} cy={74} r={4} fill="url(#gr)" />
            <path d="M13 72 L23 72 M13 74 L23 74 M13 76 L23 76" stroke="url(#wg)" strokeWidth={1.8} strokeLinecap="round" fill="none" />
            <text x={29} y={77} fill="#ff3b3b" fontSize={3.8} fontWeight="bold">伤口</text>
            <line x1={26} y1={74} x2={23} y2={74} stroke="#ff3b3b" strokeWidth={0.5} opacity={0.6} />
            {/* 近心端 */}
            <line x1={85} y1={18} x2={35} y2={18} stroke="#58a6ff" strokeWidth={0.7} strokeDasharray="2 1.5" opacity={0.5} />
            <polygon points="35,15 32,18 35,21" fill="#58a6ff" opacity={0.5} />
            <text x={65} y={14} fill="#58a6ff" fontSize={3.5} fontWeight="bold" opacity={0.6}>近心端→</text>
            {/* 目标 */}
            <circle cx={s.targetX} cy={s.targetY} r={s.aimTolerance} {...glowBlue} />
            {targetMark(s.targetX, s.targetY)}
            {!hideGuide && <circle cx={mx} cy={my} r={4} fill={inTarget ? '#00ff88' : '#ff3b3b'} stroke="#fff" strokeWidth={1.2} style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }} />}
            <text x={s.targetX + 8} y={s.targetY + 1} fill="#58a6ff" fontSize={3.8} fontWeight="bold" opacity={0.5}>肱动脉止血点</text>
          </g>
        ) : bodyType === 'leg' ? (
          /* ── 腿部 ── */
          <g filter="url(#sh)">
            <path d="M14 6 Q10 18 12 34 Q12 40 14 44 L18 46 Q22 48 26 46 L30 44 Q34 40 34 34 Q36 18 32 6 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.7} />
            <ellipse cx={24} cy={48} rx={8} ry={3.5} fill="#fadcbc" stroke={skinStroke} strokeWidth={0.6} />
            <path d="M14 50 Q12 58 13 68 Q13 76 15 80 L17 82 Q20 84 24 84 Q28 84 30 82 L32 80 Q34 76 34 68 Q35 58 33 50 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.7} />
            <rect x={16} y={82} width={16} height={3} rx={1.5} fill="#fadcbc" stroke={skinStroke} strokeWidth={0.5} />
            <path d="M14 86 Q12 90 14 95 Q15 98 18 100 Q24 100 26 98 Q28 96 28 92 Q28 88 26 86 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.7} />
            {/* 伤口 */}
            <circle cx={22} cy={72} r={4} fill="url(#gr)" />
            <path d="M18 70 L26 70 M18 72 L26 72 M18 74 L26 74" stroke="url(#wg)" strokeWidth={1.8} strokeLinecap="round" fill="none" />
            <text x={32} y={76} fill="#ff3b3b" fontSize={3.8} fontWeight="bold">伤口</text>
            <line x1={29} y1={72} x2={26} y2={72} stroke="#ff3b3b" strokeWidth={0.5} opacity={0.6} />
            {/* 近心端 */}
            <line x1={85} y1={16} x2={40} y2={16} stroke="#58a6ff" strokeWidth={0.7} strokeDasharray="2 1.5" opacity={0.5} />
            <polygon points="40,13 37,16 40,19" fill="#58a6ff" opacity={0.5} />
            <text x={65} y={12} fill="#58a6ff" fontSize={3.5} fontWeight="bold" opacity={0.6}>近心端→</text>
            {/* 目标 */}
            <circle cx={s.targetX} cy={s.targetY} r={s.aimTolerance} {...glowBlue} />
            {targetMark(s.targetX, s.targetY)}
            {!hideGuide && <circle cx={mx} cy={my} r={4} fill={inTarget ? '#00ff88' : '#ff3b3b'} stroke="#fff" strokeWidth={1.2} style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }} />}
            <text x={s.targetX + 8} y={s.targetY + 1} fill="#58a6ff" fontSize={3.8} fontWeight="bold" opacity={0.5}>股动脉止血点</text>
          </g>
        ) : bodyType === 'head' ? (
          /* ── 头部 ── */
          <g filter="url(#sh)">
            <ellipse cx={50} cy={48} rx={38} ry={40} fill="url(#sg)" stroke={skinStroke} strokeWidth={0.8} />
            <path d="M14 35 Q18 8 35 4 Q42 2 50 2 Q58 2 65 4 Q82 8 86 35 Q80 16 65 10 Q56 7 50 7 Q44 7 35 10 Q20 16 14 35 Z" fill="#3d2b1f" />
            {/* 面部 */}
            <ellipse cx={34} cy={32} rx={3} ry={2} fill="#fff" stroke={skinStroke} strokeWidth={0.3} />
            <circle cx={35} cy={32} r={1.2} fill="#2d1b0e" />
            <ellipse cx={66} cy={32} rx={3} ry={2} fill="#fff" stroke={skinStroke} strokeWidth={0.3} />
            <circle cx={65} cy={32} r={1.2} fill="#2d1b0e" />
            <path d="M48 34 L47 42 Q50 44 53 42 L52 34 Z" fill="#d4b89a" stroke={skinStroke} strokeWidth={0.3} opacity={0.5} />
            <path d="M40 48 Q45 51 50 50 Q55 51 60 48" fill="none" stroke={skinStroke} strokeWidth={0.5} opacity={0.4} />
            <ellipse cx={14} cy={32} rx={2.5} ry={4} fill="#fadcbc" stroke={skinStroke} strokeWidth={0.3} />
            <ellipse cx={86} cy={32} rx={2.5} ry={4} fill="#fadcbc" stroke={skinStroke} strokeWidth={0.3} />
            {/* 伤口 */}
            <circle cx={50} cy={46} r={5} fill="url(#gr)" />
            <path d="M45 44 L55 48 M45 46 L55 50 M47 43 L53 47" stroke="url(#wg)" strokeWidth={1.8} strokeLinecap="round" fill="none" />
            <text x={42} y={62} fill="#ff3b3b" fontSize={3.8} fontWeight="bold">伤口</text>
            {/* 近心端 */}
            <line x1={70} y1={44} x2={84} y2={36} stroke="#58a6ff" strokeWidth={0.7} strokeDasharray="2 1.5" opacity={0.5} />
            <polygon points="84,33 87,36 84,39" fill="#58a6ff" opacity={0.5} />
            <text x={72} y={42} fill="#58a6ff" fontSize={3.5} fontWeight="bold" opacity={0.6}>近心端→</text>
            {/* 目标 */}
            <circle cx={s.targetX} cy={s.targetY} r={s.aimTolerance} {...glowBlue} />
            {targetMark(s.targetX, s.targetY)}
            {!hideGuide && <circle cx={mx} cy={my} r={4} fill={inTarget ? '#00ff88' : '#ff3b3b'} stroke="#fff" strokeWidth={1.2} style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }} />}
            <text x={s.targetX - 22} y={s.targetY + 12} fill="#58a6ff" fontSize={3.8} fontWeight="bold" opacity={0.5}>颞动脉止血点</text>
          </g>
        ) : bodyType === 'chest' ? (
          /* ── 胸部 ── */
          <g filter="url(#sh)">
            <rect x={42} y={4} width={16} height={10} rx={3} fill="url(#sg)" stroke={skinStroke} strokeWidth={0.6} />
            <path d="M28 12 Q16 14 12 24 Q10 28 12 32 L16 32 Q14 26 16 22 Q20 16 30 14 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.6} />
            <path d="M72 12 Q84 14 88 24 Q90 28 88 32 L84 32 Q86 26 84 22 Q80 16 70 14 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.6} />
            <path d="M16 18 Q30 13 42 15 L50 16 Q58 15 70 13 L84 18" fill="none" stroke="#8a7a6a" strokeWidth={0.7} opacity={0.35} />
            <path d="M22 20 Q18 34 20 48 Q22 58 26 64 L74 64 Q78 58 80 48 Q82 34 78 20 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.7} />
            <path d="M28 30 Q50 26 72 30" fill="none" stroke="#8a7a6a" strokeWidth={0.3} opacity={0.12} />
            <path d="M24 42 Q50 38 76 42" fill="none" stroke="#8a7a6a" strokeWidth={0.3} opacity={0.12} />
            {/* 伤口 */}
            <circle cx={50} cy={50} r={5} fill="url(#gr)" />
            <path d="M45 48 L55 52 M44 50 L56 50 M46 52 L54 48" stroke="url(#wg)" strokeWidth={1.8} strokeLinecap="round" fill="none" />
            <text x={52} y={62} fill="#ff3b3b" fontSize={3.8} fontWeight="bold">伤口</text>
            <line x1={49} y1={58} x2={49} y2={55} stroke="#ff3b3b" strokeWidth={0.5} opacity={0.6} />
            {/* 近心端 */}
            <line x1={55} y1={28} x2={68} y2={18} stroke="#58a6ff" strokeWidth={0.7} strokeDasharray="2 1.5" opacity={0.5} />
            <polygon points="68,15 71,18 68,21" fill="#58a6ff" opacity={0.5} />
            <text x={58} y={26} fill="#58a6ff" fontSize={3.5} fontWeight="bold" opacity={0.6}>近心端→</text>
            {/* 目标 */}
            <circle cx={s.targetX} cy={s.targetY} r={s.aimTolerance} {...glowBlue} />
            {targetMark(s.targetX, s.targetY)}
            {!hideGuide && <circle cx={mx} cy={my} r={4} fill={inTarget ? '#00ff88' : '#ff3b3b'} stroke="#fff" strokeWidth={1.2} style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }} />}
            <text x={s.targetX + 8} y={s.targetY + 1} fill="#58a6ff" fontSize={3.8} fontWeight="bold" opacity={0.5}>锁骨下动脉止血点</text>
          </g>
        ) : bodyType === 'full' && s.showSideView ? (
          /* ── 侧面（海姆立克）─ */
          <g filter="url(#sh)">
            <ellipse cx={50} cy={55} rx={35} ry={40} fill="rgba(59,130,246,0.03)" />
            <path d="M40 5 Q42 1 48 1 Q55 1 58 4 Q60 6 60 10 Q60 8 55 6 Q50 5 45 6 Q40 8 40 10 Z" fill="#4a3728" />
            <path d="M40 10 Q40 4 45 3 L50 2 Q55 3 58 6 Q60 9 60 14 Q60 18 58 20 L56 22 Q54 24 52 24 L46 24 Q44 24 42 22 L40 20 Q38 18 38 14 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.6} />
            <circle cx={54} cy={12} r={0.7} fill="#b1bac4" />
            <path d="M55 15 Q56 14 57 15" fill="none" stroke="#b1bac4" strokeWidth={0.5} />
            <path d="M42 22 Q44 24 45 26 Q46 28 45 30 L41 30 Q40 28 40 24 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.6} />
            <path d="M39 30 Q36 36 36 42 Q36 48 38 52 L38 58 Q39 60 42 62 L44 62 Q46 60 47 58 L48 52 Q49 48 49 42 Q49 36 47 30 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.6} />
            <path d="M47 30 Q55 32 58 38 Q59 42 58 46 L56 47 Q55 42 52 37 Q49 34 47 33 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.6} />
            <path d="M38 60 Q36 64 37 68 Q38 70 42 71 L44 71 Q47 70 48 68 Q50 64 48 60 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.6} />
            <path d="M39 70 Q38 76 39 84 Q40 88 42 90 L44 90 Q46 88 47 84 Q48 76 47 70 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.6} />
            <path d="M40 88 Q39 92 40 98 Q41 100 43 100 L44 100 Q46 100 46 98 Q47 92 46 88 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.6} />
            {!hideGuide && <circle cx={mx} cy={my} r={4} fill={inTarget ? '#00ff88' : '#ff3b3b'} stroke="#fff" strokeWidth={1.2} style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }} />}
            <circle cx={s.targetX} cy={s.targetY} r={s.aimTolerance} {...glowBlue} />
          </g>
        ) : (
          /* ── 全身正面 ── */
          <g filter="url(#sh)">
            <ellipse cx={50} cy={14} rx={10} ry={8} fill="#4a3728" />
            <ellipse cx={50} cy={18} rx={9} ry={7} fill="url(#sg)" stroke={skinStroke} strokeWidth={0.6} />
            <rect x={45} y={26} width={10} height={4} rx={2} fill="url(#sg)" stroke={skinStroke} strokeWidth={0.5} />
            <path d="M35 30 Q32 32 30 36 L70 36 Q68 32 65 30 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.6} />
            <rect x={30} y={36} width={6} height={24} rx={3} fill="url(#sg)" stroke={skinStroke} strokeWidth={0.5} />
            <rect x={64} y={36} width={6} height={24} rx={3} fill="url(#sg)" stroke={skinStroke} strokeWidth={0.5} />
            <path d="M38 30 Q36 42 38 54 Q40 62 42 66 L58 66 Q60 62 62 54 Q64 42 62 30 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.6} />
            <rect x={30} y={58} width={5} height={28} rx={2.5} fill="url(#sg)" stroke={skinStroke} strokeWidth={0.5} />
            <rect x={65} y={58} width={5} height={28} rx={2.5} fill="url(#sg)" stroke={skinStroke} strokeWidth={0.5} />
            <path d="M38 64 Q34 68 36 72 L64 72 Q66 68 62 64 Z" fill="url(#sg)" stroke={skinStroke} strokeWidth={0.6} />
            <rect x={40} y={72} width={8} height={20} rx={4} fill="url(#sg)" stroke={skinStroke} strokeWidth={0.5} />
            <rect x={52} y={72} width={8} height={20} rx={4} fill="url(#sg)" stroke={skinStroke} strokeWidth={0.5} />
            <rect x={40} y={90} width={7} height={18} rx={3.5} fill="url(#sg)" stroke={skinStroke} strokeWidth={0.5} />
            <rect x={53} y={90} width={7} height={18} rx={3.5} fill="url(#sg)" stroke={skinStroke} strokeWidth={0.5} />
            <circle cx={s.targetX} cy={s.targetY} r={s.aimTolerance} {...glowBlue} />
            {!hideGuide && <circle cx={mx} cy={my} r={4} fill={inTarget ? '#00ff88' : '#ff3b3b'} stroke="#fff" strokeWidth={1.2} style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' }} />}
          </g>
        )}
      </svg>

      {phase === 'aim' && (
        <div style={{ fontSize: 11, color: inTarget ? '#00ff88' : '#6e7681', padding: '4px 0' }}>
          {inTarget && isHoldMode ? '✓ 位置准确，松手开始按压' : inTarget ? '位置准确 ✓' : isHoldMode ? '拖拽到伤口近心端的动脉位置' : '拖拽施力点到目标位置'}
        </div>
      )}

      {phase === 'press' && (
        isHoldMode ? (
          /* ── 持续按压模式 ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
            {/* 压力按钮 */}
            <div
              onPointerDown={startHold}
              onPointerUp={stopHold}
              onPointerLeave={stopHold}
              style={{
                width: 130, height: 130, borderRadius: '50%',
                background: flash
                  ? 'radial-gradient(circle at 50% 50%, #fee2e2, #11151c)'
                  : 'radial-gradient(circle at 50% 50%, #2a323e, #1a1f29)',
                border: `4px solid ${flash ? '#ff5454' : '#6e7681'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', userSelect: 'none',
                transition: 'transform 0.1s, border-color 0.1s',
                transform: flash ? 'scale(0.92)' : 'scale(1)',
                boxShadow: flash ? '0 0 25px rgba(239,68,68,0.3)' : 'none',
              }}
            >
              <span style={{ fontSize: 14, color: flash ? '#ff5454' : '#8b949e', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.3 }}>
                按住不放{'\n'}持续施压
              </span>
            </div>
            {/* 压力进度条 */}
            <div style={{ width: '80%', maxWidth: 180, height: 8, borderRadius: 4, backgroundColor: '#2a323e', overflow: 'hidden' }}>
              <div style={{
                width: `${progress * 100}%`, height: '100%',
                borderRadius: 4,
                background: progress >= 1 ? '#00ff88' : 'linear-gradient(90deg, #58a6ff, #00ff88)',
                transition: 'width 0.08s linear, background-color 0.3s',
              }} />
            </div>
            <div style={{ fontSize: 10, color: '#6e7681' }}>
              持续按压 {Math.round((progress) * (s.holdSec ?? 3))}/{(s.holdSec ?? 3)} 秒
            </div>
            {progress >= 1 && <div style={{ fontSize: 13, color: '#00ff88', fontWeight: 'bold' }}>✓ 按压完成</div>}
          </div>
        ) : (
          /* ── 冲击模式（保留给海姆立克等） ── */
          <div style={{ fontSize: 11, color: '#6e7681' }}>
            冲击模式（点击以下按钮）
          </div>
        )
      )}

      {phase === 'done' && !isHoldMode && (
        <div style={{ fontSize: 13, color: '#00ff88', fontWeight: 'bold' }}>
          ✓ 操作完成
        </div>
      )}
    </div>
  )
}
