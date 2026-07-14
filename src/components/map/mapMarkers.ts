// ============================================================
// 零点接线台 — 地图标记图标工厂
// 从 CityMap 提取：自定义 div 图标（避免 leaflet 默认图标 404）、
// 站点/救护车/事件点的预建图标与状态映射。纯 L.DivIcon 工厂，无 JSX、无主题依赖。
// ============================================================

import L from 'leaflet'
import type { AmbulanceStatus } from '../../game/core/fleet'

// -------------------- 自定义 div 图标（避免 leaflet 默认图标 404） --------------------
export function makeDivIcon(html: string, className = ''): L.DivIcon {
  return L.divIcon({
    html,
    className: `cmap-marker ${className}`.trim(),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

const STATION_ICON_AVAILABLE = makeDivIcon(
  `<div class="cmap-station available"><div class="cmap-station-dot"></div></div>`,
)
export function stationIconFor(status: AmbulanceStatus): L.DivIcon {
  if (status === 'available') return STATION_ICON_AVAILABLE
  const cls = status === 'returning' ? 'returning' : 'busy'
  return makeDivIcon(`<div class="cmap-station ${cls}"><div class="cmap-station-dot"></div></div>`)
}

export const AMB_ENROUTE = makeDivIcon(`<div class="cmap-amb cmap-amb-enroute">🚑</div>`)
export const AMB_ONSCENE = makeDivIcon(`<div class="cmap-amb cmap-amb-onscene">🚑</div>`)
export const AMB_RETURNING = makeDivIcon(`<div class="cmap-amb cmap-amb-returning">🚑</div>`)
export const AMB_ENROUTE_DIM = makeDivIcon(`<div class="cmap-amb cmap-amb-dim">🚑</div>`)
export const AMB_ONSCENE_DIM = makeDivIcon(`<div class="cmap-amb cmap-amb-onscene cmap-amb-dim">🚑</div>`)
export const AMB_RETURNING_DIM = makeDivIcon(`<div class="cmap-amb cmap-amb-returning cmap-amb-dim">🚑</div>`)
export function ambulanceIconFor(status: AmbulanceStatus, dim: boolean): L.DivIcon {
  if (dim) {
    if (status === 'on_scene') return AMB_ONSCENE_DIM
    if (status === 'returning') return AMB_RETURNING_DIM
    return AMB_ENROUTE_DIM
  }
  if (status === 'on_scene') return AMB_ONSCENE
  if (status === 'returning') return AMB_RETURNING
  return AMB_ENROUTE
}

export const EVENT_ICON = makeDivIcon(`<div class="cmap-event"><div class="cmap-event-pulse"></div><div class="cmap-event-dot"></div></div>`, 'cmap-event-wrap')
export const EVENT_ICON_DIM = makeDivIcon(`<div class="cmap-event cmap-event-dim"><div class="cmap-event-dot"></div></div>`)
export const EVENT_ICON_HISTORY = makeDivIcon(`<div class="cmap-event cmap-event-history"><div class="cmap-event-dot"></div></div>`)
