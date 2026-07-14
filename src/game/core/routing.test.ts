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
  it('generates three deterministic branches with a shared station and scene', () => {
    const input = { start: START, end: END, baseEta: 70, seed: 'shift-1:call-a:ambulance-a' }
    const first = buildRouteOptions(input)
    const second = buildRouteOptions(input)

    expect(first).toEqual(second)
    expect(first.map(route => route.id)).toEqual(['express', 'balanced', 'stable'])
    for (const route of first) {
      expect(route.nodes.length).toBeGreaterThanOrEqual(4)
      expect(route.segments).toHaveLength(route.nodes.length - 1)
      expect(route.nodes[0]).toMatchObject({ id: 'route-start', pos: START })
      expect(route.nodes[route.nodes.length - 1]).toMatchObject({ id: 'route-scene', pos: END })
      expect(route.totalEta).toBeGreaterThanOrEqual(20)
      expect(route.segments.every(segment => segment.conditionLabel.length > 0)).toBe(true)
    }
  })

  it('only exposes adjacent nodes and rejects a cross-branch jump', () => {
    const routes = buildRouteOptions({ start: START, end: END, baseEta: 70, seed: 'graph-check' })
    const firstNodes = getAvailableNextNodes(routes, ['route-start'])
    expect(firstNodes.map(node => node.id)).toEqual(['express-node-1', 'balanced-node-1', 'stable-node-1'])

    const expressPath = ['route-start', 'express-node-1']
    expect(getMatchingRoutes(routes, expressPath).map(route => route.id)).toEqual(['express'])
    expect(getAvailableNextNodes(routes, expressPath).map(node => node.id)).toEqual(['express-node-2'])
    expect(getAvailableNextNodes(routes, [...expressPath, 'balanced-node-2'])).toEqual([])
  })

  it('recognizes completion only after every node in the selected branch', () => {
    const routes = buildRouteOptions({ start: START, end: END, baseEta: 70, seed: 'complete-check' })
    const balancedIds = routes[1].nodes.map(node => node.id)
    expect(isCompleteRoutePath(routes, balancedIds.slice(0, -1))).toBe(false)
    expect(findCompletedRoute(routes, balancedIds)?.id).toBe('balanced')
    expect(isCompleteRoutePath(routes, balancedIds)).toBe(true)
  })

  it('uses the roguelite priority channel to reduce every route ETA by five seconds', () => {
    const normal = buildRouteOptions({ start: START, end: END, baseEta: 90, seed: 'same-seed' })
    const priority = buildRouteOptions({ start: START, end: END, baseEta: 90, seed: 'same-seed', priorityChannel: true })
    expect(priority.map((route, index) => normal[index].totalEta - route.totalEta)).toEqual([5, 5, 5])
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
})
