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
  id: string
  strategy: RouteStrategy
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

interface RoadNodeTemplate {
  id: string
  label: string
  kind: RoadNode['kind']
  /** 起点到终点方向上的位置。 */
  progress: number
  /** 相对主轴的横向偏移，用于形成可读的道路网络。 */
  lane: number
}

interface RouteTemplate {
  id: string
  strategy: RouteStrategy
  label: string
  summary: string
  risk: RouteRisk
  etaBias: number
  path: string[]
}

const ROAD_NODE_TEMPLATES: RoadNodeTemplate[] = [
  { id: 'route-start', label: '急救站', kind: 'station', progress: 0, lane: 0 },
  { id: 'north-gate', label: '北城路口', kind: 'junction', progress: 0.15, lane: -0.34 },
  { id: 'west-gate', label: '西区路口', kind: 'junction', progress: 0.15, lane: 0.34 },
  { id: 'school-crossing', label: '实验学校', kind: 'special', progress: 0.32, lane: -0.5 },
  { id: 'flyover-entry', label: '高架入口', kind: 'junction', progress: 0.32, lane: -0.12 },
  { id: 'market-crossing', label: '农贸市场', kind: 'special', progress: 0.32, lane: 0.5 },
  { id: 'community-clinic', label: '社区医院', kind: 'special', progress: 0.32, lane: 0.12 },
  { id: 'central-junction', label: '中心交汇点', kind: 'junction', progress: 0.52, lane: 0 },
  { id: 'maintenance-zone', label: '市政维修点', kind: 'special', progress: 0.69, lane: -0.32 },
  { id: 'hospital-link', label: '医院联络道', kind: 'special', progress: 0.69, lane: 0.32 },
  { id: 'riverside-junction', label: '河畔路口', kind: 'junction', progress: 0.84, lane: 0 },
  { id: 'route-scene', label: '事件现场', kind: 'incident', progress: 1, lane: 0 },
]

const ROUTE_TEMPLATES: RouteTemplate[] = [
  {
    id: 'express-flyover-maintenance',
    strategy: 'express',
    label: '高架抢时线（经维修点）',
    summary: '先走高架，再穿过维修路段；距离短，但施工变化风险较高',
    risk: 'high',
    etaBias: 0.9,
    path: ['route-start', 'north-gate', 'flyover-entry', 'central-junction', 'maintenance-zone', 'riverside-junction', 'route-scene'],
  },
  {
    id: 'express-flyover-hospital',
    strategy: 'express',
    label: '高架抢时线（经医院）',
    summary: '利用高架避开地面车流，再经医院联络道接近现场',
    risk: 'medium',
    etaBias: 0.94,
    path: ['route-start', 'north-gate', 'flyover-entry', 'central-junction', 'hospital-link', 'riverside-junction', 'route-scene'],
  },
  {
    id: 'balanced-school-maintenance',
    strategy: 'balanced',
    label: '学校均衡线（经维修点）',
    summary: '学校路段需减速观察，之后可从维修点方向绕行',
    risk: 'medium',
    etaBias: 0.99,
    path: ['route-start', 'north-gate', 'school-crossing', 'central-junction', 'maintenance-zone', 'riverside-junction', 'route-scene'],
  },
  {
    id: 'balanced-school-hospital',
    strategy: 'balanced',
    label: '学校均衡线（经医院）',
    summary: '避开核心商圈拥堵，经过学校和医院两个特殊路段',
    risk: 'medium',
    etaBias: 1.01,
    path: ['route-start', 'north-gate', 'school-crossing', 'central-junction', 'hospital-link', 'riverside-junction', 'route-scene'],
  },
  {
    id: 'balanced-market-maintenance',
    strategy: 'balanced',
    label: '商圈穿行线（经维修点）',
    summary: '穿过市场拥堵区后转入维修路段，路线直接但延误概率较高',
    risk: 'high',
    etaBias: 1.03,
    path: ['route-start', 'west-gate', 'market-crossing', 'central-junction', 'maintenance-zone', 'riverside-junction', 'route-scene'],
  },
  {
    id: 'balanced-market-hospital',
    strategy: 'balanced',
    label: '商圈穿行线（经医院）',
    summary: '先通过拥堵商圈，再选择相对稳定的医院联络道',
    risk: 'medium',
    etaBias: 1.05,
    path: ['route-start', 'west-gate', 'market-crossing', 'central-junction', 'hospital-link', 'riverside-junction', 'route-scene'],
  },
  {
    id: 'stable-clinic-maintenance',
    strategy: 'stable',
    label: '社区稳妥线（经维修点）',
    summary: '绕开学校与市场，后段需评估维修占道的影响',
    risk: 'medium',
    etaBias: 1.1,
    path: ['route-start', 'west-gate', 'community-clinic', 'central-junction', 'maintenance-zone', 'riverside-junction', 'route-scene'],
  },
  {
    id: 'stable-clinic-hospital',
    strategy: 'stable',
    label: '社区稳妥线（经医院）',
    summary: '全程避开高风险商圈，路程稍长但通行状态更稳定',
    risk: 'low',
    etaBias: 1.14,
    path: ['route-start', 'west-gate', 'community-clinic', 'central-junction', 'hospital-link', 'riverside-junction', 'route-scene'],
  },
]

const CONDITION_META: Record<RoadCondition, { label: string; factor: number; description: string; color: string }> = {
  clear: { label: '畅通', factor: 0.88, description: '道路畅通，可保持急救优先速度', color: '#22c55e' },
  busy: { label: '车流较大', factor: 1.08, description: '车流较大，需要鸣笛谨慎穿行', color: '#eab308' },
  congested: { label: '拥堵', factor: 1.34, description: '车辆排队，通行效率明显下降', color: '#f97316' },
  construction: { label: '维修施工', factor: 1.26, description: '市政维修占道，仅保留部分车道', color: '#fb923c' },
  school_zone: { label: '学校特殊路段', factor: 1.16, description: '学生与行人密集，即使急救车辆也需观察通行', color: '#a78bfa' },
  accident: { label: '事故占道', factor: 1.48, description: '前方事故占道，需要现场绕行', color: '#ef4444' },
}

/** 同一条共享道路在所有候选路线中保持相同路况。 */
const EDGE_CONDITION_POOLS: Record<string, RoadCondition[]> = {
  'route-start>north-gate': ['busy', 'congested'],
  'route-start>west-gate': ['clear', 'busy'],
  'north-gate>school-crossing': ['school_zone'],
  'north-gate>flyover-entry': ['clear', 'busy', 'accident'],
  'west-gate>market-crossing': ['congested'],
  'west-gate>community-clinic': ['clear', 'busy'],
  'school-crossing>central-junction': ['school_zone'],
  'flyover-entry>central-junction': ['clear', 'busy', 'accident'],
  'market-crossing>central-junction': ['congested', 'busy'],
  'community-clinic>central-junction': ['clear', 'busy'],
  'central-junction>maintenance-zone': ['construction'],
  'central-junction>hospital-link': ['clear', 'busy'],
  'maintenance-zone>riverside-junction': ['construction'],
  'hospital-link>riverside-junction': ['clear', 'busy'],
  'riverside-junction>route-scene': ['clear', 'busy', 'congested', 'accident'],
}

const LIVE_UPDATE_OPTIONS: Array<Pick<ScheduledTrafficUpdate, 'condition' | 'deltaSeconds' | 'message'>> = [
  { condition: 'congested', deltaSeconds: 7, message: '前方车流突然加密，预计延误 7 秒' },
  { condition: 'accident', deltaSeconds: 10, message: '节点前发生交通事故，已切入应急绕行，预计延误 10 秒' },
  { condition: 'construction', deltaSeconds: 5, message: '临时维修占道，预计延误 5 秒' },
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

function buildRoadNodes(start: LatLng, end: LatLng, seed: string): Map<string, RoadNode> {
  const latDelta = end.lat - start.lat
  const lngDelta = end.lng - start.lng
  const scale = Math.max(0.012, Math.hypot(latDelta, lngDelta))
  const normalLat = -lngDelta / Math.max(scale, 0.0001)
  const normalLng = latDelta / Math.max(scale, 0.0001)
  const random = createSeededRandom(`${seed}:nodes`)

  return new Map(ROAD_NODE_TEMPLATES.map(template => {
    if (template.id === 'route-start') {
      return [template.id, { id: template.id, label: template.label, kind: template.kind, pos: start }]
    }
    if (template.id === 'route-scene') {
      return [template.id, { id: template.id, label: template.label, kind: template.kind, pos: end }]
    }

    const base = interpolate(start, end, template.progress)
    const jitter = (random() - 0.5) * 0.018
    const lane = template.lane + jitter
    return [template.id, {
      id: template.id,
      label: template.label,
      kind: template.kind,
      pos: {
        lat: base.lat + normalLat * scale * lane,
        lng: base.lng + normalLng * scale * lane,
      },
    }]
  }))
}

function segmentDistance(a: LatLng, b: LatLng): number {
  const avgLat = ((a.lat + b.lat) / 2) * Math.PI / 180
  const latKm = (b.lat - a.lat) * 111
  const lngKm = (b.lng - a.lng) * 111 * Math.cos(avgLat)
  return Math.max(0.01, Math.hypot(latKm, lngKm))
}

function buildSegments(nodes: RoadNode[], routeId: string, seed: string): RoadSegment[] {
  return nodes.slice(0, -1).map((node, index) => {
    const next = nodes[index + 1]
    const edgeKey = `${node.id}>${next.id}`
    const conditionPool = EDGE_CONDITION_POOLS[edgeKey] ?? ['clear', 'busy']
    const random = createSeededRandom(`${seed}:edge:${edgeKey}`)
    const condition = conditionPool[Math.floor(random() * conditionPool.length)] ?? 'clear'
    const meta = CONDITION_META[condition]
    return {
      id: `${routeId}-segment-${index + 1}`,
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

/** 为一辆车生成八条候选路径；共享节点组成三层可决策的道路网络。 */
export function buildRouteOptions(input: BuildRouteOptionsInput): RoutePlan[] {
  const roadNodes = buildRoadNodes(input.start, input.end, input.seed)
  return ROUTE_TEMPLATES.map(template => {
    const random = createSeededRandom(`${input.seed}:route:${template.id}`)
    const nodes = template.path.map(nodeId => {
      const node = roadNodes.get(nodeId)
      if (!node) throw new Error(`Unknown road node: ${nodeId}`)
      return node
    })
    const segments = buildSegments(nodes, template.id, input.seed)
    const totalEta = routeEta(input.baseEta, nodes, segments, template.etaBias, input.priorityChannel ?? false)
    const live = LIVE_UPDATE_OPTIONS[Math.floor(random() * LIVE_UPDATE_OPTIONS.length)] ?? LIVE_UPDATE_OPTIONS[0]
    const segmentIndex = Math.min(segments.length - 1, Math.max(0, Math.floor(random() * segments.length)))
    const atSecond = Math.max(4, Math.min(14, Math.round(totalEta * (0.18 + random() * 0.08))))

    return {
      id: template.id,
      strategy: template.strategy,
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
