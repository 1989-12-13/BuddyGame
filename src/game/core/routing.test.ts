import { describe, expect, it } from 'vitest'
import {
  applyScheduledTrafficUpdate,
  buildRouteOptions,
  findCompletedRoute,
  getAvailableNextNodes,
  getMatchingRoutes,
  isCompleteRoutePath,
  positionAlongRoute,
  roadConditionColor,
} from './routing'

const START = { lat: 39.9967, lng: 116.4708 }
const END = { lat: 39.9151, lng: 116.3594 }

describe('node route planning', () => {
  it('generates eight deterministic paths through a shared multi-branch road network', () => {
    const input = { start: START, end: END, baseEta: 70, seed: 'shift-1:call-a:ambulance-a' }
    const first = buildRouteOptions(input)
    const second = buildRouteOptions(input)

    expect(first).toEqual(second)
    expect(first).toHaveLength(8)
    expect(new Set(first.map(route => route.id))).toHaveLength(8)
    for (const route of first) {
      expect(route.nodes).toHaveLength(7)
      expect(route.segments).toHaveLength(route.nodes.length - 1)
      expect(route.nodes[0]).toMatchObject({ id: 'route-start', pos: START })
      expect(route.nodes[route.nodes.length - 1]).toMatchObject({ id: 'route-scene', pos: END })
      expect(route.totalEta).toBeGreaterThanOrEqual(20)
      expect(route.segments.every(segment => segment.conditionLabel.length > 0)).toBe(true)
    }

    const edgeConditions = new Map<string, Set<string>>()
    for (const segment of first.flatMap(route => route.segments)) {
      const edge = `${segment.fromId}>${segment.toId}`
      const conditions = edgeConditions.get(edge) ?? new Set<string>()
      conditions.add(segment.condition)
      edgeConditions.set(edge, conditions)
    }
    expect(edgeConditions.size).toBeGreaterThanOrEqual(15)
    expect([...edgeConditions.values()].every(conditions => conditions.size === 1)).toBe(true)

    const conditionLabels = new Set(first.flatMap(route => route.segments.map(segment => segment.conditionLabel)))
    expect(conditionLabels.has('拥堵')).toBe(true)
    expect(conditionLabels.has('维修施工')).toBe(true)
    expect(conditionLabels.has('学校特殊路段')).toBe(true)
  })

  it('offers repeated adjacent-node decisions and rejects a cross-branch jump', () => {
    const routes = buildRouteOptions({ start: START, end: END, baseEta: 70, seed: 'graph-check' })
    const firstNodes = getAvailableNextNodes(routes, ['route-start'])
    expect(firstNodes.map(node => node.id)).toEqual(['north-gate', 'west-gate'])

    const northPath = ['route-start', 'north-gate']
    expect(getMatchingRoutes(routes, northPath)).toHaveLength(4)
    expect(getAvailableNextNodes(routes, northPath).map(node => node.id)).toEqual(['flyover-entry', 'school-crossing'])

    const schoolPath = [...northPath, 'school-crossing', 'central-junction']
    expect(getMatchingRoutes(routes, schoolPath)).toHaveLength(2)
    expect(getAvailableNextNodes(routes, schoolPath).map(node => node.id)).toEqual(['maintenance-zone', 'hospital-link'])
    expect(getAvailableNextNodes(routes, [...northPath, 'market-crossing'])).toEqual([])
  })

  it('recognizes completion only after every node in the selected branch', () => {
    const routes = buildRouteOptions({ start: START, end: END, baseEta: 70, seed: 'complete-check' })
    const chosen = routes.find(route => route.id === 'balanced-school-hospital')!
    const chosenIds = chosen.nodes.map(node => node.id)
    expect(isCompleteRoutePath(routes, chosenIds.slice(0, -1))).toBe(false)
    expect(findCompletedRoute(routes, chosenIds)?.id).toBe('balanced-school-hospital')
    expect(isCompleteRoutePath(routes, chosenIds)).toBe(true)
  })

  it('uses the roguelite priority channel to reduce every route ETA by five seconds', () => {
    const normal = buildRouteOptions({ start: START, end: END, baseEta: 90, seed: 'same-seed' })
    const priority = buildRouteOptions({ start: START, end: END, baseEta: 90, seed: 'same-seed', priorityChannel: true })
    expect(priority.map((route, index) => normal[index].totalEta - route.totalEta)).toEqual(new Array(8).fill(5))
  })

  it('applies a scheduled traffic update to one segment and ETA', () => {
    const route = buildRouteOptions({ start: START, end: END, baseEta: 75, seed: 'traffic-update' })[0]
    const applied = applyScheduledTrafficUpdate(route)
    const changed = applied.route.segments[route.scheduledUpdate.segmentIndex]
    expect(changed.condition).toBe(route.scheduledUpdate.condition)
    expect(applied.route.totalEta).toBe(Math.max(1, route.totalEta + route.scheduledUpdate.deltaSeconds))
    expect(applied.update.message).toBe(route.scheduledUpdate.message)
    expect(roadConditionColor(changed.condition)).toMatch(/^#/)
  })

  it('interpolates ambulance position along the complete polyline', () => {
    const points = [{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 1, lng: 1 }]
    expect(positionAlongRoute(points, 0)).toEqual(points[0])
    expect(positionAlongRoute(points, 1)).toEqual(points[2])
    const halfway = positionAlongRoute(points, 0.5)
    expect(halfway.lng).toBeCloseTo(1, 1)
    expect(halfway.lat).toBeCloseTo(0, 1)
  })

  it('moves faster on low-factor segments when segmentFactors are provided', () => {
    // 两段等长（0→1, 1→1），第一段 factor=0.5（快），第二段 factor=1.5（慢）
    // 加权后第一段占 0.5/(0.5+1.5)=25% 的时间，第二段占 75%
    const points = [{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 1, lng: 1 }]

    // progress=0.25 → 走完加权距离的 25% → 刚好在第一段末尾
    const p25 = positionAlongRoute(points, 0.25, [0.5, 1.5])
    expect(p25.lat).toBeCloseTo(0, 1)
    expect(p25.lng).toBeCloseTo(1, 1)

    // progress=0.5 → 走完加权距离的 50% → 已进入第二段（因子慢）
    const p50 = positionAlongRoute(points, 0.5, [0.5, 1.5])
    expect(p50.lat).toBeGreaterThan(0)
    expect(p50.lng).toBeCloseTo(1, 1)

    // 不加 factor 时，相同 progress=0.3 还在第一段中间（lng≈0.6）
    // 加 factor=0.5 后，已快速通过第一段进入第二段（lat>0）
    const p30factor = positionAlongRoute(points, 0.3, [0.5, 1.5])
    const p30normal = positionAlongRoute(points, 0.3)
    expect(p30normal.lat).toBeCloseTo(0, 1)       // 仍在第一段
    expect(p30normal.lng).toBeLessThan(1)          // 没到连接点
    expect(p30factor.lat).toBeGreaterThan(0)       // 已进入第二段
    expect(p30factor.lng).toBeCloseTo(1, 1)
  })
})
