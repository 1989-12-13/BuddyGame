import { useMemo, useState } from 'react'
import { Clock3, MapPin, Navigation, RotateCcw, ShieldAlert, Truck, Undo2, X } from 'lucide-react'
import type { Ambulance } from '../../game/core/fleet'
import { tierLabel } from '../../game/core/fleet'
import {
  findCompletedRoute,
  getAvailableNextNodes,
  getMatchingRoutes,
  routeRiskLabel,
  type RoadNode,
  type RoadSegment,
  type RoutePlan,
} from '../../game/core/routing'

interface Props {
  vehicle: Ambulance
  routes: RoutePlan[]
  priorityChannelActive?: boolean
  onConfirm: (route: RoutePlan) => void
  onCancel: () => void
}

interface Point {
  x: number
  y: number
}

const RISK_COLOR: Record<RoutePlan['risk'], string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#ef4444',
}

function nodeMap(routes: RoutePlan[]): Map<string, RoadNode> {
  const nodes = new Map<string, RoadNode>()
  for (const route of routes) {
    for (const node of route.nodes) nodes.set(node.id, node)
  }
  return nodes
}

function uniqueSegments(routes: RoutePlan[]): RoadSegment[] {
  const segments = new Map<string, RoadSegment>()
  for (const route of routes) {
    for (const segment of route.segments) {
      const edgeId = `${segment.fromId}>${segment.toId}`
      if (!segments.has(edgeId)) segments.set(edgeId, segment)
    }
  }
  return [...segments.values()]
}

function projectNodes(nodes: Map<string, RoadNode>): Map<string, Point> {
  const values = [...nodes.values()]
  const lats = values.map(node => node.pos.lat)
  const lngs = values.map(node => node.pos.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latSpan = Math.max(0.001, maxLat - minLat)
  const lngSpan = Math.max(0.001, maxLng - minLng)

  return new Map(values.map(node => [node.id, {
    x: 8 + ((node.pos.lng - minLng) / lngSpan) * 84,
    y: 8 + ((maxLat - node.pos.lat) / latSpan) * 84,
  }]))
}

export function RoutePlanner({ vehicle, routes, priorityChannelActive = false, onConfirm, onCancel }: Props) {
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(['route-start'])
  const nodes = useMemo(() => nodeMap(routes), [routes])
  const segments = useMemo(() => uniqueSegments(routes), [routes])
  const points = useMemo(() => projectNodes(nodes), [nodes])
  const matchingRoutes = getMatchingRoutes(routes, selectedNodeIds)
  const availableNextNodes = getAvailableNextNodes(routes, selectedNodeIds)
  const availableIds = new Set(availableNextNodes.map(node => node.id))
  const selectedIds = new Set(selectedNodeIds)
  const activeRoute = selectedNodeIds.length > 1 && matchingRoutes.length === 1 ? matchingRoutes[0] : null
  const completedRoute = findCompletedRoute(routes, selectedNodeIds)

  const chooseNode = (nodeId: string) => {
    if (!availableIds.has(nodeId)) return
    setSelectedNodeIds(current => [...current, nodeId])
  }

  const undo = () => setSelectedNodeIds(current => current.length > 1 ? current.slice(0, -1) : current)
  const reset = () => setSelectedNodeIds(['route-start'])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 310,
      backgroundColor: 'rgba(2, 6, 23, 0.72)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="route-planner-title"
        style={{
          width: 'min(1040px, 96vw)',
          height: 'min(720px, 92vh)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.65fr) minmax(280px, 0.8fr)',
          gridTemplateRows: 'auto minmax(0, 1fr)',
          overflow: 'hidden',
          borderRadius: 12,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-surface)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}
      >
        <header style={{
          gridColumn: '1 / -1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '13px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div id="route-planner-title" style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              城市路网 · 节点式路线规划
            </div>
            <div style={{ marginTop: 3, fontSize: 11, color: 'var(--text-muted)' }}>
              读取道路文字状态，在共享路口逐段选择，直至到达事件现场
            </div>
          </div>
          <button aria-label="关闭路线规划" onClick={onCancel} style={iconButtonStyle}>
            <X size={17} />
          </button>
        </header>

        <div style={{ minWidth: 0, minHeight: 0, padding: 14, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              当前节点：<strong style={{ color: 'var(--text-primary)' }}>{nodes.get(selectedNodeIds[selectedNodeIds.length - 1] ?? '')?.label ?? '急救站'}</strong>
              {' · '}下一步可选 {availableNextNodes.length} 个节点
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={undo} disabled={selectedNodeIds.length <= 1} style={smallButtonStyle}>
                <Undo2 size={13} /> 撤回
              </button>
              <button onClick={reset} disabled={selectedNodeIds.length <= 1} style={smallButtonStyle}>
                <RotateCcw size={13} /> 重置
              </button>
            </div>
          </div>

          <div style={{
            position: 'relative',
            flex: 1,
            minHeight: 350,
            overflow: 'hidden',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'radial-gradient(circle at 50% 45%, var(--bg-elevated), var(--bg-deep))',
          }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              {segments.map(segment => {
                const from = points.get(segment.fromId)
                const to = points.get(segment.toId)
                if (!from || !to) return null
                const fromIndex = selectedNodeIds.indexOf(segment.fromId)
                const isSelected = fromIndex >= 0 && selectedNodeIds[fromIndex + 1] === segment.toId
                const isNext = selectedNodeIds[selectedNodeIds.length - 1] === segment.fromId && availableIds.has(segment.toId)
                const visible = isSelected || isNext || selectedNodeIds.length === 1
                return (
                  <line
                    key={segment.id}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={isSelected ? 'var(--accent-cyan)' : isNext ? 'var(--accent-gold)' : 'var(--text-muted)'}
                    strokeWidth={isSelected ? 1.4 : isNext ? 1.1 : 0.65}
                    opacity={visible ? (isSelected ? 1 : 0.72) : 0.14}
                    vectorEffect="non-scaling-stroke"
                  />
                )
              })}
            </svg>

            {segments.map((segment, index) => {
              const from = points.get(segment.fromId)
              const to = points.get(segment.toId)
              if (!from || !to) return null
              const fromIndex = selectedNodeIds.indexOf(segment.fromId)
              const isSelected = fromIndex >= 0 && selectedNodeIds[fromIndex + 1] === segment.toId
              const isNext = selectedNodeIds[selectedNodeIds.length - 1] === segment.fromId && availableIds.has(segment.toId)
              const visible = isSelected || isNext || selectedNodeIds.length === 1
              const dx = to.x - from.x
              const dy = to.y - from.y
              const length = Math.max(1, Math.hypot(dx, dy))
              const offset = index % 2 === 0 ? 2.1 : -2.1
              const x = (from.x + to.x) / 2 + (dy / length) * offset
              const y = (from.y + to.y) / 2 - (dx / length) * offset
              return (
                <span
                  key={`${segment.fromId}-${segment.toId}-condition`}
                  title={segment.description}
                  style={{
                    position: 'absolute',
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2,
                    padding: '2px 5px',
                    borderRadius: 4,
                    border: `1px solid ${isSelected ? 'var(--accent-cyan)' : isNext ? 'var(--accent-gold)' : 'var(--border)'}`,
                    backgroundColor: 'color-mix(in srgb, var(--bg-deep) 88%, transparent)',
                    color: isSelected ? 'var(--accent-cyan)' : isNext ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    opacity: visible ? 1 : 0.22,
                    fontSize: 8,
                    fontWeight: 800,
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}
                >
                  {segment.conditionLabel}
                </span>
              )
            })}

            {[...nodes.values()].map(node => {
              const point = points.get(node.id)
              if (!point) return null
              const selected = selectedIds.has(node.id)
              const available = availableIds.has(node.id)
              const disabled = !available
              const hiddenBranch = !selected && !available && selectedNodeIds.length > 1 && !matchingRoutes.some(route => route.nodes.some(item => item.id === node.id))
              return (
                <button
                  key={node.id}
                  aria-label={`选择节点 ${node.label}`}
                  title={available ? `前往 ${node.label}` : node.label}
                  onClick={() => chooseNode(node.id)}
                  disabled={disabled}
                  style={{
                    position: 'absolute',
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: node.kind === 'station' || node.kind === 'incident' ? 32 : 25,
                    height: node.kind === 'station' || node.kind === 'incident' ? 32 : 25,
                    borderRadius: '50%',
                    border: `2px solid ${selected ? 'var(--accent-cyan)' : available ? 'var(--accent-gold)' : 'var(--border)'}`,
                    backgroundColor: selected ? 'var(--accent-cyan)' : available ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                    color: selected ? 'var(--bg-deep)' : available ? 'var(--accent-gold)' : 'var(--text-muted)',
                    opacity: hiddenBranch ? 0.22 : disabled && !selected ? 0.48 : 1,
                    cursor: available ? 'pointer' : 'default',
                    zIndex: available || selected ? 3 : 2,
                    boxShadow: available ? '0 0 0 5px color-mix(in srgb, var(--accent-gold) 15%, transparent)' : 'none',
                  }}
                >
                  {node.kind === 'incident' ? <MapPin size={14} /> : node.kind === 'station' ? <Truck size={14} /> : <span style={{ fontSize: 9, fontWeight: 900 }}>●</span>}
                </button>
              )
            })}

            {[...nodes.values()].map(node => {
              const point = points.get(node.id)
              if (!point) return null
              const emphasized = selectedIds.has(node.id) || availableIds.has(node.id)
              return (
                <span key={`${node.id}-label`} style={{
                  position: 'absolute',
                  left: `${point.x}%`,
                  top: `calc(${point.y}% + 19px)`,
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  color: emphasized ? 'var(--text-primary)' : 'var(--text-muted)',
                  opacity: emphasized ? 1 : 0.6,
                  fontSize: 9,
                  fontWeight: emphasized ? 700 : 500,
                }}>
                  {node.label}
                </span>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 10 }}>
            <span>路段文字：</span>
            {['畅通', '车流较大', '拥堵', '维修施工', '学校特殊路段', '事故占道'].map(label => (
              <span key={label} style={{ padding: '2px 5px', borderRadius: 4, border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>{label}</span>
            ))}
          </div>
        </div>

        <aside style={{ minHeight: 0, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>系统自动配车</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8 }}>
              <Truck size={19} color="var(--accent-cyan)" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{vehicle.name}</div>
                <div style={{ marginTop: 2, fontSize: 10, color: 'var(--text-muted)' }}>
                  {tierLabel(vehicle.tier)} · 能力 {vehicle.capability}/5 · 速度 {vehicle.speed}/3
                </div>
              </div>
            </div>
          </div>

          {priorityChannelActive && (
            <div style={{ padding: '8px 10px', borderRadius: 7, color: 'var(--accent-gold)', backgroundColor: 'var(--accent-gold-dim)', fontSize: 11 }}>
              优先通道已生效：所有路线 ETA -5 秒
            </div>
          )}

          {!activeRoute ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>根据道路文字继续选择</div>
              <div style={{ marginTop: 6, fontSize: 11, lineHeight: 1.7, color: 'var(--text-muted)' }}>
                这张路网包含入口分叉、中段分叉和中心交汇点。相同道路由多条方案共享，途中需要多次权衡拥堵、维修施工和学校特殊路段。
              </div>
            </div>
          ) : (
            <>
              <div style={{ padding: 12, borderRadius: 8, border: `1px solid ${RISK_COLOR[activeRoute.risk]}`, backgroundColor: 'var(--bg-elevated)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{activeRoute.label}</div>
                <div style={{ marginTop: 5, fontSize: 11, lineHeight: 1.55, color: 'var(--text-muted)' }}>{activeRoute.summary}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent-cyan)' }}><Clock3 size={13} />ETA {activeRoute.totalEta} 秒</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: RISK_COLOR[activeRoute.risk] }}><ShieldAlert size={13} />{routeRiskLabel(activeRoute.risk)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeRoute.segments.map((segment, index) => {
                  const fromIndex = selectedNodeIds.indexOf(segment.fromId)
                  const traversed = fromIndex >= 0 && selectedNodeIds[fromIndex + 1] === segment.toId
                  const current = selectedNodeIds[selectedNodeIds.length - 1] === segment.fromId
                  const fromLabel = nodes.get(segment.fromId)?.label ?? `节点 ${index + 1}`
                  const toLabel = nodes.get(segment.toId)?.label ?? `节点 ${index + 2}`
                  return (
                    <div key={segment.id} style={{ padding: '7px 8px', borderRadius: 6, border: '1px solid var(--border)', opacity: traversed || current ? 1 : 0.58 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 10 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{fromLabel} → {toLabel}</span>
                        <strong style={{ padding: '1px 4px', borderRadius: 3, border: '1px solid var(--border)', color: 'var(--text-primary)' }}>{segment.conditionLabel}</strong>
                      </div>
                      <div style={{ marginTop: 3, fontSize: 9, color: 'var(--text-muted)' }}>{segment.description}</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ minHeight: 30, fontSize: 10, lineHeight: 1.5, color: completedRoute ? 'var(--success-green)' : 'var(--text-muted)' }}>
              {completedRoute ? `已到达事件现场，可确认 ${completedRoute.label}` : '必须沿相邻节点抵达事件现场后才能派车'}
            </div>
            <button
              onClick={() => completedRoute && onConfirm(completedRoute)}
              disabled={!completedRoute}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                width: '100%', padding: '10px 12px', borderRadius: 7,
                border: '1px solid var(--danger-red)',
                backgroundColor: completedRoute ? 'var(--danger-red)' : 'var(--bg-elevated)',
                color: completedRoute ? '#fff' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 800, cursor: completedRoute ? 'pointer' : 'not-allowed',
              }}
            >
              <Navigation size={15} /> 确认路线并派车
            </button>
          </div>
        </aside>
      </section>
    </div>
  )
}

const iconButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 5,
  border: 'none',
  borderRadius: 5,
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
} as const

const smallButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '5px 7px',
  borderRadius: 5,
  border: '1px solid var(--border)',
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-secondary)',
  fontSize: 10,
  cursor: 'pointer',
} as const
