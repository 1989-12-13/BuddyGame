// ============================================================
// 120调度台 — Leaflet 真实地图 + CartoDB Dark Matter 瓦片
// 跨通话显示所有占用车辆（en_route/on_scene/returning）
// ============================================================

import { Fragment, useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { WorldState } from '../../game/types'
import { STATION_COORDS, DEFAULT_CENTER, DEFAULT_ZOOM, lookupCoords, type LatLng } from '../../game/locations'
import type { Ambulance, AmbulanceStatus } from '../../game/core/fleet'
import { positionAlongRoute, roadConditionColor } from '../../game/core/routing'
import {
  stationIconFor,
  ambulanceIconFor,
  EVENT_ICON,
  EVENT_ICON_DIM,
  EVENT_ICON_HISTORY,
} from './mapMarkers'

interface Props {
  state: WorldState
  /** 点击地图上的救护车 → 拉出该任务历史对话 */
  onAmbulanceClick?: (vehicleId: string, callId: string) => void
}

// -------------------- 辅助：lat/lng 线性插值 --------------------
// -------------------- 缩放控件（放在左下角） --------------------
function ZoomControl() {
  const map = useMap()
  useEffect(() => {
    const zoomControl = L.control.zoom({ position: 'bottomleft' })
    zoomControl.addTo(map)
    return () => { zoomControl.remove() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

// -------------------- 视口自适应：站点 + 事件点（不含救护车当前位置，避免每秒重 fit） --------------------
function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap()
  // key 基于点的集合签名，只在 mission 数量/位置变化时触发，不在救护车移动时触发
  const key = useMemo(() => points.map(p => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join('|') || 'empty', [points])
  useEffect(() => {
    if (points.length === 0) {
      map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM)
    } else if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], DEFAULT_ZOOM)
    } else {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 })
    }
    // 异步触发 leaflet 重算容器 size，避免灰色块（容器 layout 未及时确定时 fitBounds 会错位）
    const t = setTimeout(() => map.invalidateSize(), 50)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return null
}

// -------------------- 主组件 --------------------
export function CityMap({ state, onAmbulanceClick }: Props) {
  const hasCall = state.currentCall !== null
  const isPrank = state.currentCall?.isPrank ?? false

  // 当前通话事件点：
  // - 地址未揭示（none）→ 不显示（玩家尚未确认地点，避免假信息）
  // - 揭示后 → 优先用 mission 真实坐标，回退到 baseStation
  const currentEventPos: LatLng | null = (() => {
    if (!state.currentCall) return null
    if (!state.callerState) return null
    const revealed = state.callerState.revealedInfo.address
    if (revealed === 'none') return null
    if (state.rescue.vehicleId) {
      const v = state.fleet.vehicles.find(x => x.id === state.rescue.vehicleId)
      if (v?.mission) return v.mission.eventLatLng
    }
    return lookupCoords(state.currentCall.baseStation)
  })()

  // 静态点（站点 + 事件点）— 传给 FitBounds 用于视口自适应
  // 不含救护车当前位置，否则每秒 TICK 救护车移动会触发 fitBounds 重 fit + 瓦片重载
  // 用 useMemo 保证引用稳定（避免 FitBounds 的 key 每帧重算）
  const staticPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = []
    Object.values(STATION_COORDS).forEach(s => pts.push(s.pos))
    state.fleet.vehicles.forEach(v => {
      if (v.mission) pts.push(v.mission.eventLatLng)
    })
    if (currentEventPos) pts.push(currentEventPos)
    return pts
  }, [state.fleet.vehicles, currentEventPos])

  // 渲染所有 mission 的事件点（用 Set 去重 + 标 dim）
  const renderedEventKeys = new Set<string>()
  const renderEvent = (pos: LatLng, callState: 'current' | 'active' | 'history', key: string) => {
    const flatKey = `${pos.lat.toFixed(4)},${pos.lng.toFixed(4)}`
    if (renderedEventKeys.has(flatKey)) return null
    renderedEventKeys.add(flatKey)
    const icon = callState === 'current' && hasCall && !isPrank
      ? EVENT_ICON
      : callState === 'active'
        ? EVENT_ICON_DIM
        : EVENT_ICON_HISTORY
    const tipText = callState === 'current' && hasCall && !isPrank
      ? '事件现场（当前）'
      : callState === 'active'
        ? '事件现场（车辆出动中）'
        : '历史事件点'
    return (
      <Marker
        key={key}
        position={[pos.lat, pos.lng]}
        icon={icon}
        zIndexOffset={callState === 'current' ? 100 : 50}
      >
        <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
          {tipText}
        </Tooltip>
      </Marker>
    )
  }

  // 当前通话的场景 id（用于判定哪些 mission 属于"历史"/"执行中背景"）
  const currentCallId = state.currentCall?.id ?? null

  return (
    <div style={styles.wrap}>
      <MapContainer
        center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
        zoom={DEFAULT_ZOOM}
        style={styles.map}
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains={['a', 'b', 'c', 'd']}
          maxZoom={19}
        />

        <FitBounds points={staticPoints} />

        <ZoomControl />

        {/* 站点（固定） */}
        {Object.entries(STATION_COORDS).map(([id, info]) => {
          const v: Ambulance | undefined = state.fleet.vehicles.find(x => x.id === id)
          const status: AmbulanceStatus = v?.status ?? 'available'
          return (
            <Marker
              key={id}
              position={[info.pos.lat, info.pos.lng]}
              icon={stationIconFor(status)}
            >
              <Tooltip direction="right" offset={[8, 0]} opacity={0.95} permanent>
                {info.name}
                {v && status !== 'available' ? ` · ${statusLabel(status)}` : ''}
              </Tooltip>
            </Marker>
          )
        })}

        {/* 事件点（mission 中所有 + 当前通话） */}
        {state.fleet.vehicles
          .filter((v): v is Ambulance & { mission: NonNullable<Ambulance['mission']> } => v.mission != null)
          .map(v => {
            const isCurrentMission = v.mission.callId === currentCallId
            return { pos: v.mission.eventLatLng, state: isCurrentMission ? 'current' as const : 'active' as const, key: `ev-mission-${v.id}` }
          })
          .map(({ pos, state: s, key }) => renderEvent(pos, s, key))}
        {currentEventPos && currentCallId && state.fleet.vehicles.every(v => v.mission?.callId !== currentCallId)
          && renderEvent(currentEventPos, 'current', 'ev-current')}
        {currentEventPos && state.fleet.vehicles.some(v => v.mission?.callId === currentCallId)
          ? null  // 已由 mission 渲染，避免重复
          : null}

        {/* 救护车 + 玩家确认的节点路线 */}
        {state.fleet.vehicles
          .filter((v): v is Ambulance & { mission: NonNullable<Ambulance['mission']> } => v.status !== 'available' && v.mission != null)
          .map(v => {
            const station = STATION_COORDS[v.id]?.pos
            if (!station) return null
            const m = v.mission
            const routePoints = m.route?.nodes.map(node => node.pos) ?? [station, m.eventLatLng]
            let cur: LatLng
            if (v.status === 'en_route') {
              const elapsed = m.routeElapsed ?? Math.max(0, m.outboundTotal - v.eta)
              cur = positionAlongRoute(routePoints, elapsed / Math.max(1, elapsed + v.eta))
            } else if (v.status === 'on_scene') {
              cur = m.eventLatLng
            } else {
              const progress = 1 - v.eta / Math.max(1, m.outboundTotal)
              cur = positionAlongRoute([...routePoints].reverse(), progress)
            }
            // 跨通话车辆：mission.callId !== 当前通话 → 历史/背景任务，dim 化
            const isMissionOfCurrentCall = m.callId === currentCallId
            const isCurrentRescue = v.id === state.rescue.vehicleId && isMissionOfCurrentCall
            const dim = !isMissionOfCurrentCall && !isCurrentRescue
            return (
              <Fragment key={`amb-${v.id}`}>
                {v.status === 'returning' || !m.route ? (
                  <Polyline
                    positions={routePoints.map(point => [point.lat, point.lng])}
                    pathOptions={{
                      color: v.status === 'returning' ? '#16a34a' : '#d97706',
                      weight: dim ? 1 : 2,
                      opacity: dim ? 0.3 : 0.65,
                      dashArray: dim ? '2 8' : '6 6',
                    }}
                  />
                ) : m.route.segments.map((segment, segmentIndex) => {
                  const from = m.route!.nodes[segmentIndex].pos
                  const to = m.route!.nodes[segmentIndex + 1].pos
                  return (
                    <Polyline
                      key={segment.id}
                      positions={[[from.lat, from.lng], [to.lat, to.lng]]}
                      pathOptions={{
                        color: roadConditionColor(segment.condition),
                        weight: dim ? 2 : 4,
                        opacity: dim ? 0.28 : 0.82,
                        dashArray: dim ? '2 8' : undefined,
                      }}
                    >
                      <Tooltip direction="top" opacity={0.95} permanent={isMissionOfCurrentCall && !dim}>
                        <strong>{segment.conditionLabel}</strong> · {segment.description}
                      </Tooltip>
                    </Polyline>
                  )
                })}

                {m.route && isMissionOfCurrentCall && m.route.nodes.slice(1, -1).map(node => (
                  <CircleMarker
                    key={node.id}
                    center={[node.pos.lat, node.pos.lng]}
                    radius={4}
                    pathOptions={{ color: '#e2e8f0', weight: 1, fillColor: '#0f172a', fillOpacity: 0.9 }}
                  >
                    <Tooltip direction="top" opacity={0.95}>{node.label}</Tooltip>
                  </CircleMarker>
                ))}
                <Marker
                  position={[cur.lat, cur.lng]}
                  icon={ambulanceIconFor(v.status, dim)}
                  zIndexOffset={isCurrentRescue ? 200 : 100}
                  eventHandlers={{
                    click: () => onAmbulanceClick?.(v.id, m.callId),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.95} permanent={isCurrentRescue}>
                    {v.name}
                    {v.status === 'on_scene' ? ' · 救治中' : v.status === 'returning' ? ' · 返程中' : ' · 出击中'}
                    {dim ? '（历史任务）' : ''}
                    {isCurrentRescue && state.rescue.phase === 'success' ? ' · 救治成功' : ''}
                    {isCurrentRescue && state.rescue.phase === 'failed' ? ' · 救治失败' : ''}
                  </Tooltip>
                </Marker>
              </Fragment>
            )
          })}

        {/* 角落状态徽章 */}
        {hasCall && (
          <CornerBadge text={isPrank ? '核实中' : '事故响应中'} />
        )}
        {!hasCall && <CornerBadge text="待命" />}
      </MapContainer>

      {/* 自定义 marker 样式 */}
      <style>{MARKER_CSS}</style>
    </div>
  )
}

// -------------------- 角落状态徽章（叠加在地图左上） --------------------
function CornerBadge({ text }: { text: string }) {
  return (
    <div style={styles.corner}>
      <span style={styles.cornerLabel}>DISTRICT MAP</span>
      <span style={styles.cornerSub}>{text}</span>
    </div>
  )
}

function statusLabel(s: AmbulanceStatus): string {
  if (s === 'en_route') return '出击中'
  if (s === 'on_scene') return '救治中'
  if (s === 'returning') return '返程中'
  return '待命'
}

// -------------------- 内联样式 --------------------
const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#0a0e14',
    overflow: 'hidden',
    // 显式 z-index + isolation 锁住 leaflet 内部 z-index（marker/tooltip/popup 默认 100-700），
    // 避免泄漏到外部 stacking context 把 CallDrawer/GuidanceOverlay 盖住
    zIndex: 0,
    isolation: 'isolate',
  },
  map: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0e14',
  },
  corner: {
    position: 'absolute',
    top: 12,
    left: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    pointerEvents: 'none',
    zIndex: 400,
    padding: '4px 10px',
    background: 'rgba(10, 14, 20, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
  },
  cornerLabel: {
    fontSize: 'var(--fs-micro)',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: 2,
    fontWeight: 'var(--fw-bold)',
  },
  cornerSub: {
    fontSize: 'var(--fs-caption)',
    color: 'var(--accent-amber)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 'var(--fw-bold)',
  },
}

// -------------------- marker CSS（注入到全局） --------------------
const MARKER_CSS = `
.cmap-marker { background: transparent !important; border: none !important; }
.cmap-station {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--success-green);
  background: rgba(10, 14, 20, 0.7);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--success-green) 15%, transparent);
}
.cmap-station.busy {
  border-color: var(--danger-red);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--danger-red) 15%, transparent);
  animation: cmap-pulse 1.4s ease-in-out infinite;
}
.cmap-station.returning {
  border-color: var(--accent-amber);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent-amber) 15%, transparent);
}
.cmap-station-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--success-green);
}
.cmap-station.busy .cmap-station-dot { background: var(--danger-red); }
.cmap-station.returning .cmap-station-dot { background: var(--accent-amber); }

.cmap-amb {
  font-size: 22px;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8));
  text-align: center;
  line-height: 28px;
}
.cmap-amb-onscene {
  animation: cmap-amb-flash 0.6s ease-in-out infinite alternate;
}

.cmap-event-wrap { z-index: 100; }
.cmap-event {
  position: relative;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
}
.cmap-event-pulse {
  position: absolute; inset: 0;
  border-radius: 50%;
  background: color-mix(in srgb, var(--danger-red) 30%, transparent);
  border: 2px solid var(--danger-red);
  animation: cmap-event-pulse 1.6s ease-in-out infinite;
}
.cmap-event-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--danger-red);
  box-shadow: 0 0 8px color-mix(in srgb, var(--danger-red) 80%, transparent);
  z-index: 1;
}
.cmap-event-dim .cmap-event-dot {
  width: 6px; height: 6px;
  background: var(--text-muted);
  box-shadow: none;
  opacity: 0.6;
}
.cmap-event-history {
  opacity: 0.4;
}
.cmap-event-history .cmap-event-dot {
  width: 5px; height: 5px;
  background: var(--text-dim);
  box-shadow: none;
}
.cmap-amb-dim {
  opacity: 0.45;
  filter: saturate(0.5);
}

@keyframes cmap-pulse {
  0%, 100% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--danger-red) 15%, transparent); }
  50% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--danger-red) 5%, transparent); }
}
@keyframes cmap-amb-flash {
  from { transform: scale(1); }
  to { transform: scale(1.15); }
}
@keyframes cmap-event-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.8); opacity: 0.3; }
}
`
