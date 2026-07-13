// ============================================================
// 零点接线台 — 抽象城市俯视图（SVG，地图主背景）
// 三站点 + 事件点 + 救护车沿路径插值移动
// ============================================================

import type { CSSProperties } from 'react'
import type { WorldState } from '../../game/types'

interface Props {
  state: WorldState
}

// 站点坐标（viewBox 1200×700）
interface Pt { x: number; y: number }
const STATIONS: Record<string, { name: string; pos: Pt }> = {
  ambulance_a: { name: '望京站', pos: { x: 200, y: 160 } },
  ambulance_b: { name: '中关村站', pos: { x: 220, y: 560 } },
  ambulance_c: { name: '方庄站', pos: { x: 1000, y: 560 } },
}

// 事件发生点（按 baseStation 粗映射，否则中心）
function eventPos(state: WorldState): Pt {
  const bs = state.currentCall?.baseStation ?? ''
  if (bs.includes('望京') || bs.includes('朝阳北')) return { x: 520, y: 280 }
  if (bs.includes('中关村') || bs.includes('海淀')) return { x: 480, y: 440 }
  if (bs.includes('方庄') || bs.includes('丰台')) return { x: 820, y: 420 }
  return { x: 600, y: 350 }
}

/** 线性插值 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

export function CityMap({ state }: Props) {
  const hasCall = state.currentCall !== null
  const isPrank = state.currentCall?.isPrank ?? false
  const evPos = eventPos(state)

  // 救护车位置：起点（车辆归属站） → 终点（事件点）
  const rescue = state.rescue
  const vehicleId = rescue.vehicleId
  const startPt = vehicleId ? (STATIONS[vehicleId]?.pos ?? { x: 600, y: 350 }) : evPos
  const total = rescue.etaTotal || 1
  const remaining = state.ambulanceRemaining < 0 ? total : state.ambulanceRemaining
  const progress = rescue.phase === 'arrived' || rescue.phase === 'success' || rescue.phase === 'failed'
    ? 1
    : 1 - remaining / total
  const ambX = lerp(startPt.x, evPos.x, progress)
  const ambY = lerp(startPt.y, evPos.y, progress)
  const showAmbulance = rescue.phase !== 'idle' && vehicleId

  return (
    <div style={styles.wrap}>
      <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" style={styles.svg}>
        {/* 背景 */}
        <rect x={0} y={0} width={1200} height={700} fill="#0a0e14" />

        {/* 网格 */}
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={700} stroke="#1e252e" strokeWidth={1} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 100} x2={1200} y2={i * 100} stroke="#1e252e" strokeWidth={1} />
        ))}

        {/* 主干道（亮一点） */}
        <path d="M 0 350 L 1200 350" stroke="#2a323e" strokeWidth={3} />
        <path d="M 600 0 L 600 700" stroke="#2a323e" strokeWidth={3} />

        {/* 救护车行驶路径（虚线） */}
        {showAmbulance && (
          <line
            x1={startPt.x} y1={startPt.y} x2={evPos.x} y2={evPos.y}
            stroke="#ffb000" strokeWidth={2} strokeDasharray="6 6" opacity={0.55}
          />
        )}

        {/* 站点 */}
        {Object.entries(STATIONS).map(([id, info]) => {
          const v = state.fleet.vehicles.find(x => x.id === id)
          const busy = v?.status !== 'available'
          return (
            <g key={id}>
              <circle cx={info.pos.x} cy={info.pos.y} r={26}
                fill={busy ? '#1e252e' : '#0d2818'}
                stroke={busy ? '#3a4452' : '#16a34a'} strokeWidth={2} />
              <circle cx={info.pos.x} cy={info.pos.y} r={36}
                fill="none" stroke={busy ? '#3a4452' : '#16a34a'} strokeWidth={1}
                opacity={busy ? 0.2 : 0.4} />
              <text x={info.pos.x} y={info.pos.y + 4} textAnchor="middle"
                fontSize={11} fill="#8b949e" fontFamily="monospace">{info.name}</text>
              <text x={info.pos.x} y={info.pos.y + 50} textAnchor="middle"
                fontSize={10} fill={busy ? '#6e7681' : '#16a34a'}
                fontFamily="monospace" fontWeight="bold">
                {busy ? '○ 执勤中' : '● 待命'}
              </text>
            </g>
          )
        })}

        {/* 事件点 */}
        {hasCall && !isPrank && (
          <g>
            <circle cx={evPos.x} cy={evPos.y} r={20}
              fill="rgba(255,59,59,0.18)" stroke="#ff3b3b" strokeWidth={2}>
              <animate attributeName="r" values="20;32;20" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={evPos.x} cy={evPos.y} r={6} fill="#ff3b3b" />
            <text x={evPos.x} y={evPos.y - 30} textAnchor="middle"
              fontSize={12} fill="#ff5454" fontFamily="monospace" fontWeight="bold">
              事件现场
            </text>
          </g>
        )}
        {hasCall && isPrank && (
          <g>
            <text x={evPos.x} y={evPos.y} textAnchor="middle"
              fontSize={14} fill="#6e7681" fontFamily="monospace">? 待核实</text>
          </g>
        )}

        {/* 救护车 */}
        {showAmbulance && (
          <AmbulanceSvg x={ambX} y={ambY} tier={state.fleet.vehicles.find(v => v.id === vehicleId)?.tier} />
        )}

        {/* 到达结果 */}
        {rescue.phase === 'success' && (
          <ResultBadge x={evPos.x} y={evPos.y - 60} text="✓ 救治成功" color="#16a34a" />
        )}
        {rescue.phase === 'failed' && (
          <ResultBadge x={evPos.x} y={evPos.y - 60} text="✕ 救治失败" color="#ff3b3b" />
        )}
      </svg>

      {/* 角标 */}
      <div style={styles.corner}>
        <span style={styles.cornerLabel}>DISTRICT MAP</span>
        <span style={styles.cornerSub}>
          {hasCall ? (isPrank ? '核实中' : '事故响应中') : '待命'}
        </span>
      </div>
    </div>
  )
}

function AmbulanceSvg({ x, y, tier }: { x: number; y: number; tier?: string }) {
  const color = tier === 'MICU' ? '#a855f7' : tier === 'ALS' ? '#ff3b3b' : '#8b949e'
  return (
    <g style={{ transition: 'transform 0.9s linear' }}>
      <circle cx={x} cy={y} r={14} fill={color} opacity={0.25}>
        <animate attributeName="r" values="14;20;14" dur="1s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r={10} fill={color} stroke="#fff" strokeWidth={1.5} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fill="#fff" fontWeight="bold">+</text>
    </g>
  )
}

function ResultBadge({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  return (
    <g>
      <rect x={x - 60} y={y - 14} width={120} height={24} rx={4}
        fill="#0a0e14" stroke={color} strokeWidth={1.5} />
      <text x={x} y={y + 3} textAnchor="middle"
        fontSize={13} fill={color} fontFamily="monospace" fontWeight="bold">{text}</text>
    </g>
  )
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#0a0e14',
    overflow: 'hidden',
  },
  svg: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  corner: {
    position: 'absolute',
    top: 12,
    left: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    pointerEvents: 'none',
  },
  cornerLabel: {
    fontSize: 11,
    color: '#6e7681',
    fontFamily: 'monospace',
    letterSpacing: 2,
    fontWeight: 700,
  },
  cornerSub: {
    fontSize: 13,
    color: '#ffb000',
    fontFamily: 'monospace',
    fontWeight: 700,
  },
}
