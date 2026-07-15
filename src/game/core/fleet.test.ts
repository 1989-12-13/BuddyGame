// ============================================================
// fleet 车队管理纯函数测试（单辆救护车）
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  createDefaultFleet,
  advanceFleet,
  findVehicleById,
  tierLabel,
} from './fleet'
import type { FleetState } from './fleet'
import { buildRouteOptions } from './routing'

// ============================================================
// createDefaultFleet
// ============================================================
describe('createDefaultFleet', () => {
  it('创建 1 辆标准救护车', () => {
    const fleet = createDefaultFleet()
    expect(fleet.vehicles).toHaveLength(1)
    expect(fleet.vehicles[0].id).toBe('ambulance')
    expect(fleet.vehicles[0].name).toBe('急救车')
  })

  it('初始无选中车辆', () => {
    const fleet = createDefaultFleet()
    expect(fleet.selectedVehicleId).toBeNull()
  })

  it('所有车辆初始状态为 available', () => {
    const fleet = createDefaultFleet()
    fleet.vehicles.forEach(v => expect(v.status).toBe('available'))
  })
})

// ============================================================
// advanceFleet
// ============================================================
describe('advanceFleet', () => {
  function makeBusyFleet(): FleetState {
    return {
      vehicles: [
        {
          id: 'ambulance', name: 'A', status: 'en_route', eta: 3, speed: 2, capability: 3,
          tier: 'ALS', equipment: [], currentCallId: 'c1',
          mission: { callId: 'c1', outboundTotal: 3, onSceneTotal: 2, eventLatLng: { lat: 0, lng: 0 } },
        },
      ],
      selectedVehicleId: null,
    }
  }

  it('available 车辆不受 TICK 影响', () => {
    const fleet = createDefaultFleet()
    const next = advanceFleet(fleet)
    expect(next.vehicles[0].status).toBe('available')
    expect(next.vehicles[0].eta).toBe(0)
  })

  it('en_route 车辆 eta 每 tick 减 1', () => {
    const fleet = makeBusyFleet()
    expect(fleet.vehicles[0].eta).toBe(3)
    const next = advanceFleet(fleet)
    expect(next.vehicles[0].eta).toBe(2)
    expect(next.vehicles[0].status).toBe('en_route')
  })

  it('eta 归零时 en_route → on_scene，eta 重置为 onSceneTotal', () => {
    let fleet = makeBusyFleet()
    fleet = { ...fleet, vehicles: fleet.vehicles.map(v => ({ ...v, eta: 1 })) }
    const next = advanceFleet(fleet)
    expect(next.vehicles[0].status).toBe('on_scene')
    expect(next.vehicles[0].eta).toBe(2) // onSceneTotal
  })

  it('eta 归零时 on_scene → returning，eta 重置为 outboundTotal', () => {
    const fleet: FleetState = {
      vehicles: [{
        id: 'ambulance', name: 'A', status: 'on_scene', eta: 1, speed: 2, capability: 3,
        tier: 'ALS', equipment: [], currentCallId: 'c1',
        mission: { callId: 'c1', outboundTotal: 4, onSceneTotal: 2, eventLatLng: { lat: 0, lng: 0 } },
      }],
      selectedVehicleId: null,
    }
    const next = advanceFleet(fleet)
    expect(next.vehicles[0].status).toBe('returning')
    expect(next.vehicles[0].eta).toBe(4) // outboundTotal
  })

  it('eta 归零时 returning → available，清除 mission', () => {
    const fleet: FleetState = {
      vehicles: [{
        id: 'ambulance', name: 'A', status: 'returning', eta: 1, speed: 2, capability: 3,
        tier: 'ALS', equipment: [], currentCallId: 'c1',
        mission: { callId: 'c1', outboundTotal: 4, onSceneTotal: 2, eventLatLng: { lat: 0, lng: 0 } },
      }],
      selectedVehicleId: null,
    }
    const next = advanceFleet(fleet)
    expect(next.vehicles[0].status).toBe('available')
    expect(next.vehicles[0].eta).toBe(0)
    expect(next.vehicles[0].mission).toBeNull()
    expect(next.vehicles[0].currentCallId).toBeNull()
  })

  it('没有 mission 的占用车辆直接返回原样', () => {
    const fleet: FleetState = {
      vehicles: [{
        id: 'ambulance', name: 'A', status: 'en_route', eta: 5, speed: 2, capability: 3,
        tier: 'ALS', equipment: [], currentCallId: 'c1', mission: null,
      }],
      selectedVehicleId: null,
    }
    const next = advanceFleet(fleet)
    expect(next.vehicles[0].eta).toBe(5) // unchanged
    expect(next.vehicles[0].status).toBe('en_route')
  })

  it('按路线节点推进，并且实时路况只应用一次', () => {
    const route = buildRouteOptions({
      start: { lat: 39.9, lng: 116.3 },
      end: { lat: 40.0, lng: 116.5 },
      baseEta: 70,
      seed: 'fleet-live-traffic',
    })[0]
    let fleet: FleetState = {
      vehicles: [{
        id: 'ambulance', name: 'A', status: 'en_route', eta: route.totalEta, speed: 2, capability: 3,
        tier: 'ALS', equipment: [], currentCallId: 'c1',
        mission: {
          callId: 'c1', outboundTotal: route.totalEta, onSceneTotal: 2,
          eventLatLng: route.nodes[route.nodes.length - 1].pos,
          route, routeElapsed: 0, trafficUpdateApplied: false, lastTrafficUpdate: null,
        },
      }],
      selectedVehicleId: 'ambulance',
    }

    for (let i = 0; i < route.scheduledUpdate.atSecond; i += 1) fleet = advanceFleet(fleet)
    const afterUpdate = fleet.vehicles[0]
    expect(afterUpdate.mission?.trafficUpdateApplied).toBe(true)
    expect(afterUpdate.mission?.routeElapsed).toBe(route.scheduledUpdate.atSecond)
    expect(afterUpdate.mission?.route?.totalEta).toBe(route.totalEta + route.scheduledUpdate.deltaSeconds)

    const next = advanceFleet(fleet).vehicles[0]
    expect(next.mission?.route?.totalEta).toBe(afterUpdate.mission?.route?.totalEta)
    expect(next.eta).toBe(afterUpdate.eta - 1)
  })
})

// ============================================================
// findVehicleById
// ============================================================
describe('findVehicleById', () => {
  it('找到存在的车辆（id=ambulance）', () => {
    const fleet = createDefaultFleet()
    const v = findVehicleById(fleet, 'ambulance')
    expect(v).not.toBeNull()
    expect(v!.id).toBe('ambulance')
  })

  it('找不到不存在的车辆', () => {
    expect(findVehicleById(createDefaultFleet(), 'nonexistent')).toBeNull()
  })

  it('null id → null', () => {
    expect(findVehicleById(createDefaultFleet(), null)).toBeNull()
  })
})

// ============================================================
// tierLabel
// ============================================================
describe('tierLabel', () => {
  it('返回中文描述', () => {
    expect(tierLabel('MICU')).toBe('移动 ICU')
    expect(tierLabel('ALS')).toBe('高级生命支持')
    expect(tierLabel('BLS')).toBe('基础生命支持')
  })
})
