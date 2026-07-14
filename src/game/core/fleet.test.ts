// ============================================================
// fleet 车队管理纯函数测试
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  createDefaultFleet,
  advanceFleet,
  calcVehicleETA,
  findVehicleById,
  findFastestAvailable,
  findMostCapableAvailable,
  countAvailable,
  tierLabel,
} from './fleet'
import type { FleetState, Ambulance } from './fleet'

// ============================================================
// createDefaultFleet
// ============================================================
describe('createDefaultFleet', () => {
  it('创建 3 辆车的默认车队', () => {
    const fleet = createDefaultFleet()
    expect(fleet.vehicles).toHaveLength(3)
  })

  it('初始无选中车辆', () => {
    const fleet = createDefaultFleet()
    expect(fleet.selectedVehicleId).toBeNull()
  })

  it('所有车辆初始状态为 available', () => {
    const fleet = createDefaultFleet()
    fleet.vehicles.forEach(v => expect(v.status).toBe('available'))
  })

  it('车辆有差异化 speed 和 capability', () => {
    const fleet = createDefaultFleet()
    const speeds = fleet.vehicles.map(v => v.speed)
    const caps = fleet.vehicles.map(v => v.capability)
    expect(new Set(speeds).size).toBeGreaterThanOrEqual(2)
    expect(new Set(caps).size).toBeGreaterThanOrEqual(2)
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
          id: 'v1', name: 'A', status: 'en_route', eta: 3, speed: 2, capability: 3,
          tier: 'ALS', equipment: [], currentCallId: 'c1',
          mission: { callId: 'c1', outboundTotal: 3, onSceneTotal: 2, eventLatLng: { lat: 0, lng: 0 } },
        },
        {
          id: 'v2', name: 'B', status: 'available', eta: 0, speed: 1, capability: 2,
          tier: 'BLS', equipment: [], currentCallId: null, mission: null,
        },
      ],
      selectedVehicleId: null,
    }
  }

  it('available 车辆不受 TICK 影响', () => {
    const fleet = makeBusyFleet()
    const next = advanceFleet(fleet)
    expect(next.vehicles[1].status).toBe('available')
    expect(next.vehicles[1].eta).toBe(0)
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
    fleet = { ...fleet, vehicles: fleet.vehicles.map(v => v.id === 'v1' ? { ...v, eta: 1 } : v) }
    const next = advanceFleet(fleet)
    expect(next.vehicles[0].status).toBe('on_scene')
    expect(next.vehicles[0].eta).toBe(2) // onSceneTotal
  })

  it('eta 归零时 on_scene → returning，eta 重置为 outboundTotal', () => {
    const fleet: FleetState = {
      vehicles: [{
        id: 'v1', name: 'A', status: 'on_scene', eta: 1, speed: 2, capability: 3,
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
        id: 'v1', name: 'A', status: 'returning', eta: 1, speed: 2, capability: 3,
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
        id: 'v1', name: 'A', status: 'en_route', eta: 5, speed: 2, capability: 3,
        tier: 'ALS', equipment: [], currentCallId: 'c1', mission: null,
      }],
      selectedVehicleId: null,
    }
    const next = advanceFleet(fleet)
    expect(next.vehicles[0].eta).toBe(5) // unchanged
    expect(next.vehicles[0].status).toBe('en_route')
  })
})

// ============================================================
// calcVehicleETA
// ============================================================
describe('calcVehicleETA', () => {
  it('地址完整度 full 减 2 秒', () => {
    expect(calcVehicleETA('full', 1)).toBe(8)  // (10-2)/1 = 8
  })

  it('地址模糊 vague 加 3 秒', () => {
    expect(calcVehicleETA('vague', 1)).toBe(13) // (10+3)/1 = 13
  })

  it('速度 2 比速度 1 ETA 减半', () => {
    expect(calcVehicleETA('partial', 2)).toBe(5) // 10/2 = 5
    expect(calcVehicleETA('partial', 1)).toBe(10)
  })

  it('最低不低于 4', () => {
    expect(calcVehicleETA('full', 3)).toBeGreaterThanOrEqual(4)
  })
})

// ============================================================
// findVehicleById
// ============================================================
describe('findVehicleById', () => {
  let fleet: FleetState

  beforeEach(() => {
    fleet = createDefaultFleet()
  })

  it('找到存在的车辆', () => {
    const v = findVehicleById(fleet, 'ambulance_a')
    expect(v).not.toBeNull()
    expect(v!.id).toBe('ambulance_a')
  })

  it('找不到不存在的车辆', () => {
    expect(findVehicleById(fleet, 'nonexistent')).toBeNull()
  })

  it('null id → null', () => {
    expect(findVehicleById(fleet, null)).toBeNull()
  })
})

// ============================================================
// findFastestAvailable
// ============================================================
describe('findFastestAvailable', () => {
  it('返回可用车辆中最快的', () => {
    const fleet = createDefaultFleet()
    const v = findFastestAvailable(fleet)
    expect(v).not.toBeNull()
    expect(v!.speed).toBe(3) // 方庄丙车 speed=3
  })

  it('没有可用车辆时返回 null', () => {
    const fleet: FleetState = {
      vehicles: [{
        id: 'v1', name: 'A', status: 'en_route', eta: 10, speed: 3, capability: 5,
        tier: 'MICU', equipment: [], currentCallId: 'c1',
        mission: { callId: 'c1', outboundTotal: 10, onSceneTotal: 5, eventLatLng: { lat: 0, lng: 0 } },
      }],
      selectedVehicleId: null,
    }
    expect(findFastestAvailable(fleet)).toBeNull()
  })
})

// ============================================================
// findMostCapableAvailable
// ============================================================
describe('findMostCapableAvailable', () => {
  it('返回可用车辆中能力最强的', () => {
    const fleet = createDefaultFleet()
    const v = findMostCapableAvailable(fleet)
    expect(v).not.toBeNull()
    expect(v!.capability).toBe(5) // 方庄丙车 capability=5
  })

  it('没有可用车辆时返回 null', () => {
    const fleet: FleetState = { vehicles: [], selectedVehicleId: null }
    expect(findMostCapableAvailable(fleet)).toBeNull()
  })
})

// ============================================================
// countAvailable
// ============================================================
describe('countAvailable', () => {
  it('初始车队 3 辆均可用', () => {
    expect(countAvailable(createDefaultFleet())).toBe(3)
  })

  it('所有车均占用 → 0', () => {
    const fleet: FleetState = {
      vehicles: [
        { id: 'v1', name: 'A', status: 'en_route', eta: 10, speed: 2, capability: 3, tier: 'ALS', equipment: [], currentCallId: 'c1', mission: { callId: 'c1', outboundTotal: 10, onSceneTotal: 5, eventLatLng: { lat: 0, lng: 0 } } },
        { id: 'v2', name: 'B', status: 'on_scene', eta: 5, speed: 1, capability: 2, tier: 'BLS', equipment: [], currentCallId: 'c2', mission: { callId: 'c2', outboundTotal: 8, onSceneTotal: 5, eventLatLng: { lat: 0, lng: 0 } } },
      ],
      selectedVehicleId: null,
    }
    expect(countAvailable(fleet)).toBe(0)
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
