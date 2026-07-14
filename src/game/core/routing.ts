// ============================================================
// 零点接线台 — 节点式道路网络与动态路线规划
// ============================================================

import type { LatLng } from '../locations'

export type RouteStrategy = 'express' | 'balanced' | 'stable'

export type RoadCondition =
  | 'clear'
  | 'busy'
  | 'congested'
  | 'construction'
  | 'school_zone'
  | 'accident'

export type RouteRisk = 'low' | 'medium' | 'high'

export interface RoadNode {
  id: string
  label: string
  kind: 'station' | 'junction' | 'special' | 'incident'
  pos: LatLng
}

export interface RoadSegment {
  id: string
  fromId: string
  toId: string
  condition: RoadCondition
  conditionLabel: string
  description: string
  etaFactor: number
}

export interface ScheduledTrafficUpdate {
  atSecond: number
  segmentIndex: number
  condition: RoadCondition
  deltaSeconds: number
  message: string
}

export interface RoutePlan {
  id: RouteStrategy
  label: string
  summary: string
  risk: RouteRisk
  nodes: RoadNode[]
  segments: RoadSegment[]
  totalEta: number
  scheduledUpdate: ScheduledTrafficUpdate
}

export interface AppliedTrafficUpdate {
  deltaSeconds: number
  message: string
  condition: RoadCondition
}

export interface BuildRouteOptionsInput {
  start: LatLng
  end: LatLng
  baseEta: number
  seed: string
  priorityChannel?: boolean
}

interface RouteTemplate {
  id: RouteStrategy
  label: string
  summary: string
  risk: RouteRisk
  offset: number
  controlPoints: number
  etaBias: number
  conditionPool: RoadCondition[]
}

const ROUTE_TEMPLATES: RouteTemplate[] = [
  {
    id: 'express',
    label: '主干道抢时线',
    summary: '距离短、节点少，但主干道突发拥堵风险较高',
    risk: 'high',
    offset: -0.18,
    controlPoints: 2,
    etaBias: 0.88,
    conditionPool: ['clear', 'busy', 'congested', 'accident'],
  },
  {
    id: 'balanced',
    label: '城区均衡线',
    summary: '绕开核心拥堵区，时间与稳定性较均衡',
    risk: 'medium',
    offset: 0.16,
    controlPoints: 3,
    etaBias: 1,
    conditionPool: ['clear', 'busy', 'construction', 'school_zone'],
  },
  {
    id: 'stable',
    label: '外环稳妥线',
    summary: '路程稍长，特殊路段明确，突发事件影响较小',
    risk: 'low',
    offset: 0.34,
    controlPoints: 4,
    etaBias: 1.12,
    conditionPool: ['clear', 'clear', 'school_zone', 'construction'],
  },
]

const CONDITION_META: Record<RoadCondition, { label: string; factor: number; description: string; color: string }> = {
  clear: { label: '畅通', factor: 0.88, description: '道路畅通，可保持急救优先速度', color: '#22c55e' },
  busy: { label: '车流较大', factor: 1.08, description: '车流较大，需要鸣笛穿行', color: '#eab308' },
  congested: { label: '拥堵', factor: 1.34, description: '路段拥堵，通行效率明显下降', color: '#f97316' },
  construction: { label: '道路施工', factor: 1.26, description: '施工占道，仅保留部分车道', color: '#fb923c' },
  school_zone: { label: '学校路段', factor: 1.16, description: '学校周边人流密集，需要谨慎通行', color: '#a78bfa' },
  accident: { label: '交通事故', factor: 1.48, description: '前方事故占道，需要现场绕行', color: '#ef4444' },
}

const LIVE_UPDATE_OPTIONS: Array<Pick<ScheduledTrafficUpdate, 'condition' | 'deltaSeconds' | 'message'>> = [
  { condition: 'congested', deltaSeconds: 7, message: '前方车流突然加密，预计延误 7 秒' },
  { condition: 'accident', deltaSeconds: 10, message: '节点前发生交通事故，已切入应急绕行，预计延误 10 秒' },
  { condition: 'construction', deltaSeconds: 5, message: '临时施工占道，预计延误 5 秒' },
  { condition: 'clear', deltaSeconds: -3, message: '交警已清出生命通道，预计提前 3 秒到达' },
]

function hashSeed(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createSeededRandom(seed: string): () => number {
  let value = hashSeed(seed) || 1
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
}

function buildNodes(start: LatLng, end: LatLng, template: RouteTemplate, random: () => number): RoadNode[] {
  const latDelta = end.lat - start.lat
  const lngDelta = end.lng - start.lng
  const scale = Math.max(0.012, Math.hypot(latDelta, lngDelta))
  const normalLat = -lngDelta / Math.max(scale, 0.0001)
  const normalLng = latDelta / Math.max(scale, 0.0001)
  const routeToken = template.id.slice(0, 1).toUpperCase()

  const nodes: RoadNode[] = [{ id: 'route-start', label: '急救站', kind: 'station', pos: start }]
  for (let i = 1; i <= template.controlPoints; i += 1) {
    const t = i / (template.controlPoints + 1)
    const base = interpolate(start, end, t)
    const wave = Math.sin(t * Math.PI) * template.offset
    const jitter = (random() - 0.5) * 0.06
    nodes.push({
      id: `${template.id}-node-${i}`,
      label: i === template.controlPoints ? `${routeToken}${i} 现场前节点` : `${routeToken}${i} 调度节点`,
      kind: i === template.controlPoints ? 'special' : 'junction',
      pos: {
        lat: base.lat + normalLat * scale * (wave + jitter),
        lng: base.lng + normalLng * scale * (wave + jitter),
      },
    })
  }
  nodes.push({ id: 'route-scene', label: '事件现场', kind: 'incident', pos: end })
  return nodes
}

function segmentDistance(a: LatLng, b: LatLng): number {
  const avgLat = ((a.lat + b.lat) / 2) * Math.PI / 180
  const latKm = (b.lat - a.lat) * 111
  const lngKm = (b.lng - a.lng) * 111 * Math.cos(avgLat)
  return Math.max(0.01, Math.hypot(latKm, lngKm))
}

function buildSegments(nodes: RoadNode[], template: RouteTemplate, random: () => number): RoadSegment[] {
  return nodes.slice(0, -1).map((node, index) => {
    const next = nodes[index + 1]
    const condition = template.conditionPool[Math.floor(random() * template.conditionPool.length)] ?? 'clear'
    const meta = CONDITION_META[condition]
    return {
      id: `${template.id}-segment-${index + 1}`,
      fromId: node.id,
      toId: next.id,
      condition,
      conditionLabel: meta.label,
      description: meta.description,
      etaFactor: meta.factor,
    }
  })
}

function routeEta(
  baseEta: number,
  nodes: RoadNode[],
  segments: RoadSegment[],
  bias: number,
  priorityChannel: boolean,
): number {
  const distances = segments.map((_, index) => segmentDistance(nodes[index].pos, nodes[index + 1].pos))
  const totalDistance = distances.reduce((sum, value) => sum + value, 0)
  const conditionFactor = segments.reduce(
    (sum, segment, index) => sum + segment.etaFactor * (distances[index] / totalDistance),
    0,
  )
  // 12 km 作为城区基准路程，让不同急救站的位置真正影响 ETA。
  const distanceFactor = Math.max(0.65, Math.min(1.35, totalDistance / 12))
  const normalEta = Math.max(20, Math.min(150, Math.round(baseEta * bias * conditionFactor * distanceFactor)))
  return Math.max(20, normalEta - (priorityChannel ? 5 : 0))
}

/** 为一辆车生成三条节点路线；相同 seed 始终得到相同道路状态。 */
export function buildRouteOptions(input: BuildRouteOptionsInput): RoutePlan[] {
  return ROUTE_TEMPLATES.map(template => {
    const random = createSeededRandom(`${input.seed}:${template.id}`)
    const nodes = buildNodes(input.start, input.end, template, random)
    const segments = buildSegments(nodes, template, random)
    const totalEta = routeEta(input.baseEta, nodes, segments, template.etaBias, input.priorityChannel ?? false)
    const live = LIVE_UPDATE_OPTIONS[Math.floor(random() * LIVE_UPDATE_OPTIONS.length)] ?? LIVE_UPDATE_OPTIONS[0]
    const segmentIndex = Math.min(segments.length - 1, Math.max(0, Math.floor(random() * segments.length)))
    const atSecond = Math.max(4, Math.min(14, Math.round(totalEta * (0.18 + random() * 0.08))))

    return {
      id: template.id,
      label: template.label,
      summary: template.summary,
      risk: template.risk,
      nodes,
      segments,
      totalEta,
      scheduledUpdate: { atSecond, segmentIndex, condition: live.condition, deltaSeconds: live.deltaSeconds, message: live.message },
    }
  })
}

/** 返回仍与已选节点前缀匹配的路线。非法跳点会让结果为空。 */
export function getMatchingRoutes(routes: RoutePlan[], selectedNodeIds: string[]): RoutePlan[] {
  return routes.filter(route => selectedNodeIds.every((nodeId, index) => route.nodes[index]?.id === nodeId))
}

/** 节点法的核心约束：只暴露当前路径的相邻下一节点。 */
export function getAvailableNextNodes(routes: RoutePlan[], selectedNodeIds: string[]): RoadNode[] {
  const nextIndex = selectedNodeIds.length
  const unique = new Map<string, RoadNode>()
  for (const route of getMatchingRoutes(routes, selectedNodeIds)) {
    const next = route.nodes[nextIndex]
    if (next) unique.set(next.id, next)
  }
  return [...unique.values()]
}

/** 完整节点序列精确对应某条路线时，返回该路线。 */
export function findCompletedRoute(routes: RoutePlan[], selectedNodeIds: string[]): RoutePlan | null {
  return routes.find(route =>
    route.nodes.length === selectedNodeIds.length
    && route.nodes.every((node, index) => node.id === selectedNodeIds[index]),
  ) ?? null
}

export function isCompleteRoutePath(routes: RoutePlan[], selectedNodeIds: string[]): boolean {
  return findCompletedRoute(routes, selectedNodeIds) !== null
}

/** 将预定实时路况写入路线分段，返回新的不可变路线对象。 */
export function applyScheduledTrafficUpdate(route: RoutePlan): { route: RoutePlan; update: AppliedTrafficUpdate } {
  const scheduled = route.scheduledUpdate
  const meta = CONDITION_META[scheduled.condition]
  const segments = route.segments.map((segment, index) => index === scheduled.segmentIndex
    ? { ...segment, condition: scheduled.condition, conditionLabel: meta.label, description: meta.description, etaFactor: meta.factor }
    : segment)

  return {
    route: { ...route, segments, totalEta: Math.max(1, route.totalEta + scheduled.deltaSeconds) },
    update: { deltaSeconds: scheduled.deltaSeconds, message: scheduled.message, condition: scheduled.condition },
  }
}

/** 按整条折线路程插值车辆位置，不会因各段长短不同而跳跃。 */
export function positionAlongRoute(points: LatLng[], progress: number): LatLng {
  if (points.length === 0) return { lat: 0, lng: 0 }
  if (points.length === 1) return points[0]

  const clamped = Math.max(0, Math.min(1, progress))
  const distances = points.slice(0, -1).map((point, index) => segmentDistance(point, points[index + 1]))
  const total = distances.reduce((sum, value) => sum + value, 0)
  let target = total * clamped

  for (let index = 0; index < distances.length; index += 1) {
    const distance = distances[index]
    if (target <= distance || index === distances.length - 1) {
      return interpolate(points[index], points[index + 1], distance === 0 ? 0 : target / distance)
    }
    target -= distance
  }
  return points[points.length - 1]
}

export function roadConditionColor(condition: RoadCondition): string {
  return CONDITION_META[condition].color
}

export function routeRiskLabel(risk: RouteRisk): string {
  return risk === 'low' ? '低风险' : risk === 'medium' ? '中风险' : '高波动'
}
