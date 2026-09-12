import { useMemo, useState } from 'react'
import { Clock3, MapPin, Navigation, RotateCcw, ShieldAlert, Truck, Undo2, X } from 'lucide-react'
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
  routes: RoutePlan[]
  embedded?: boolean
  priorityChannelActive?: boolean
  onConfirm: (route: RoutePlan) => void
  onCancel: () => void
}

interface Point {
  x: number
  y: number
}

const RISK_COLOR: Record<RoutePlan['risk'], string> = {
  low: 'var(--sev-1)',
  medium: 'var(--sev-3)',
  high: 'var(--sev-5)',
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
  const latDelta = maxLat - minLat
  const lngDelta = maxLng - minLng
  // 确保最小跨度足够分离同 progress 不同 lane 的节点，避免重叠
  const latSpan = Math.max(0.02, latDelta)
  const lngSpan = Math.max(0.02, lngDelta)
  // 在跨度内居中，防止节点贴边
  const pad = 5
  const scale = 100 - pad * 2

  return new Map(values.map(node => [node.id, node.diagram ?? {
    x: pad + ((node.pos.lng - minLng) / lngSpan) * scale,
    y: pad + ((maxLat - node.pos.lat) / latSpan) * scale,
  }]))
}

export function RoutePlanner({ routes, embedded = false, priorityChannelActive = false, onConfirm, onCancel }: Props) {
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
    <div className={embedded ? "embedded-route" : undefined} data-testid="route-planner" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 310,
      backgroundColor: 'var(--glass-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-16)',
    }}>
      <section
        role={embedded ? "region" : "dialog"}
        aria-modal={embedded ? undefined : true}
        aria-labelledby="route-planner-title"
        style={{
          width: 'min(1040px, 96vw)',
          height: 'min(720px, 92vh)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.65fr) minmax(280px, 0.8fr)',
          gridTemplateRows: 'auto minmax(0, 1fr)',
          overflow: 'hidden',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--line)',
          backgroundColor: 'var(--bg-surface)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}
      >
        <header style={{
          gridColumn: '1 / -1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-16)',
          padding: 'var(--space-12) var(--space-16)',
          borderBottom: '1px solid var(--line)',
        }}>
          <div>
            <div id="route-planner-title" style={{ fontSize: 'var(--fs-subtitle)', fontWeight: 800, color: 'var(--text)' }}>
              城市路网 · 节点式路线规划
            </div>
            <div data-testid="route-planning-steps" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginTop: 'var(--space-8)', fontSize: 'var(--fs-micro)' }}>
              <span style={{ color: 'var(--success)' }}>✓ 系统自动配车</span>
              <span style={{ color: 'var(--text-3)' }}>→</span>
              <strong style={{ color: 'var(--warning)' }}>2 逐节点选择</strong>
              <span style={{ color: 'var(--text-3)' }}>→</span>
              <span style={{ color: completedRoute ? 'var(--success)' : 'var(--text-3)' }}>3 确认派车</span>
            </div>
          </div>
          <button aria-label="关闭路线规划" onClick={onCancel} style={iconButtonStyle}>
            <X size={17} />
          </button>
        </header>

        <div className="route-map-panel" style={{ minWidth: 0, minHeight: 0, padding: 'var(--space-14)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 'var(--space-10)'}}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-10)'}}>
            <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-2)' }}>
              当前节点：<strong style={{ color: 'var(--text)' }}>{nodes.get(selectedNodeIds[selectedNodeIds.length - 1] ?? '')?.label ?? '急救站'}</strong>
              {' · '}下一步可选 {availableNextNodes.length} 个节点
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-6)'}}>
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
            minHeight: 520,
            overflow: 'hidden',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--line)',
            background: 'radial-gradient(circle at 50% 45%, var(--bg-raised), var(--bg-deep))',
          }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
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
                    stroke={isSelected ? 'var(--accent)' : isNext ? 'var(--warning)' : 'var(--text-3)'}
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
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : isNext ? 'var(--warning)' : 'var(--line)'}`,
                    backgroundColor: 'color-mix(in srgb, var(--bg-deep) 88%, transparent)',
                    color: isSelected ? 'var(--accent)' : isNext ? 'var(--warning)' : 'var(--text-2)',
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
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: `2px solid ${selected ? 'var(--accent)' : available ? 'var(--warning)' : 'var(--line)'}`,
                    backgroundColor: selected ? 'var(--accent)' : available ? 'var(--bg-surface)' : 'var(--bg-raised)',
                    color: selected ? 'var(--bg-deep)' : available ? 'var(--warning)' : 'var(--text-3)',
                    opacity: hiddenBranch ? 0.22 : disabled && !selected ? 0.48 : 1,
                    cursor: available ? 'pointer' : 'default',
                    zIndex: available || selected ? 3 : 2,
                    boxShadow: available ? '0 0 0 5px color-mix(in srgb, var(--warning) 15%, transparent)' : 'none',
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
                  top: `calc(${point.y}% + 23px)`,
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  color: emphasized ? 'var(--text)' : 'var(--text-3)',
                  opacity: emphasized ? 1 : 0.6,
                  fontSize: 9,
                  fontWeight: emphasized ? 700 : 500,
                }}>
                  {node.label}
                </span>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-6)', color: 'var(--text-3)', fontSize: 'var(--fs-micro)' }}>
            <span>路段文字：</span>
            {['畅通', '车流较大', '拥堵', '维修施工', '学校特殊路段', '事故占道'].map(label => (
              <span key={label} style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', backgroundColor: 'var(--bg-raised)' }}>{label}</span>
            ))}
          </div>
        </div>

        <aside className="route-summary-panel" style={{ minHeight: 0, padding: 'var(--space-14)', display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', overflowY: 'auto' }}>
          {priorityChannelActive && (
            <div style={{ padding: 'var(--space-8) var(--space-10)', borderRadius: 'var(--radius-md)', color: 'var(--warning)', backgroundColor: 'var(--warning-dim)', fontSize: 'var(--fs-small)' }}>
              优先通道已生效：所有路线 ETA -5 秒
            </div>
          )}

          {!activeRoute ? (
            <div style={{ fontSize: 'var(--fs-caption)', fontWeight: 700, color: 'var(--text)' }}>沿道路文字逐段选择</div>
          ) : (
            <>
              <div style={{ padding: 'var(--space-12)', borderRadius: 'var(--radius-lg)', border: `1px solid ${RISK_COLOR[activeRoute.risk]}`, backgroundColor: 'var(--bg-raised)' }}>
                <div style={{ fontSize: 'var(--fs-body)', fontWeight: 800, color: 'var(--text)' }}>当前选定路线</div>
                <div style={{ display: 'flex', gap: 'var(--space-12)', marginTop: 'var(--space-10)', fontSize: 'var(--fs-small)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-4)', color: 'var(--accent)' }}><Clock3 size={13} />ETA {activeRoute.totalEta} 秒</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-4)', color: RISK_COLOR[activeRoute.risk] }}><ShieldAlert size={13} />{routeRiskLabel(activeRoute.risk)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)'}}>
                {activeRoute.segments.map((segment, index) => {
                  const fromIndex = selectedNodeIds.indexOf(segment.fromId)
                  const traversed = fromIndex >= 0 && selectedNodeIds[fromIndex + 1] === segment.toId
                  const current = selectedNodeIds[selectedNodeIds.length - 1] === segment.fromId
                  const fromLabel = nodes.get(segment.fromId)?.label ?? `节点 ${index + 1}`
                  const toLabel = nodes.get(segment.toId)?.label ?? `节点 ${index + 2}`
                  return (
                    <div key={segment.id} style={{ padding: 'var(--space-6) var(--space-8)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', opacity: traversed || current ? 1 : 0.58 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-6)', fontSize: 'var(--fs-micro)' }}>
                        <span style={{ color: 'var(--text-2)' }}>{fromLabel} → {toLabel}</span>
                        <strong style={{ padding: 'var(--space-1) var(--space-4)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--line)', color: 'var(--text)' }}>{segment.conditionLabel}</strong>
                      </div>
                      <div style={{ marginTop: 'var(--space-2)', fontSize: 9, color: 'var(--text-3)' }}>{segment.description}</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)'}}>
            <div style={{ minHeight: 30, fontSize: 'var(--fs-micro)', lineHeight: 1.5, color: completedRoute ? 'var(--success)' : 'var(--text-3)' }}>
              {completedRoute ? '已到达事件现场，可以确认派车' : '必须沿相邻节点抵达事件现场后才能派车'}
            </div>
            <button
              onClick={() => completedRoute && onConfirm(completedRoute)}
              disabled={!completedRoute}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-6)',
                width: '100%', padding: 'var(--space-10) var(--space-12)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--danger)',
                backgroundColor: completedRoute ? 'var(--danger)' : 'var(--bg-raised)',
                color: completedRoute ? 'var(--on-danger)' : 'var(--text-3)',
                fontSize: 'var(--fs-caption)', fontWeight: 800, cursor: completedRoute ? 'pointer' : 'not-allowed',
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
  padding: 'var(--space-4)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  background: 'transparent',
  color: 'var(--text-3)',
  cursor: 'pointer',
} as const

const smallButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
  padding: 'var(--space-4) var(--space-6)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--line)',
  backgroundColor: 'var(--bg-raised)',
  color: 'var(--text-2)',
  fontSize: 'var(--fs-micro)',
  cursor: 'pointer',
} as const
