// ============================================================
// 零点接线台 — 救护车队管理
// ============================================================

import { applyScheduledTrafficUpdate, type AppliedTrafficUpdate, type RoutePlan } from './routing'

export type AmbulanceStatus = 'available' | 'en_route' | 'on_scene' | 'returning'

export type AmbulanceTier = 'BLS' | 'ALS' | 'MICU'

/** 车辆当前任务周期信息（跨 en_route → on_scene → returning 保持） */
export interface AmbulanceMission {
  callId: string
  /** 去程总时长（秒），返程对称使用 */
  outboundTotal: number
  /** 现场救治总时长（秒） */
  onSceneTotal: number
  /** 事件点真实经纬度（用于地图渲染 + 跨通话显示） */
  eventLatLng: { lat: number; lng: number }
  /** 玩家确认的节点路线；缺省时地图兼容旧任务并显示直线。 */
  route?: RoutePlan
  /** 去程已经行驶的游戏秒数。 */
  routeElapsed?: number
  trafficUpdateApplied?: boolean
  lastTrafficUpdate?: AppliedTrafficUpdate | null
}

export interface Ambulance {
  id: string
  name: string
  status: AmbulanceStatus
  /** 当前阶段剩余秒数（0 = 空闲） */
  eta: number
  /** 速度等级 1-3，影响 ETA */
  speed: number
  /** 急救能力等级 1-5，影响救治成功率（ALS/MICU 高于 BLS） */
  capability: number
  /** 装备标识 */
  tier: AmbulanceTier
  /** 装备能力（保留兼容） */
  equipment: string[]
  /** 当前任务的目的地场景 ID（用于追踪） */
  currentCallId: string | null
  /** 当前任务周期信息，null = 空闲 */
  mission: AmbulanceMission | null
}

export interface FleetState {
  vehicles: Ambulance[]
  /** 当前派车选中的车辆 ID */
  selectedVehicleId: string | null
}

/** 创建默认车队（3 辆，差异化速度+能力，让选车有取舍） */
export function createDefaultFleet(): FleetState {
  return {
    vehicles: [
      { id: 'ambulance_a', name: '救护车', status: 'available', eta: 0, speed: 2, capability: 4, tier: 'ALS', equipment: ['ALS', 'BLS'], currentCallId: null, mission: null },
      { id: 'ambulance_b', name: '救护车', status: 'available', eta: 0, speed: 1, capability: 2, tier: 'BLS', equipment: ['BLS'], currentCallId: null, mission: null },
      { id: 'ambulance_c', name: '救护车', status: 'available', eta: 0, speed: 3, capability: 5, tier: 'MICU', equipment: ['MICU', 'ALS', 'BLS'], currentCallId: null, mission: null },
    ],
    selectedVehicleId: null,
  }
}

/** TICK 每秒推进所有占用车辆的状态机（en_route→on_scene→returning→available） */
export function advanceFleet(fleet: FleetState): FleetState {
  return {
    ...fleet,
    vehicles: fleet.vehicles.map(v => {
      if (v.status === 'available' || !v.mission) return v
      let mission = v.mission
      let newEta = v.eta - 1

      const activeRoute = mission.route
      if (v.status === 'en_route' && activeRoute) {
        const routeElapsed = (mission.routeElapsed ?? 0) + 1
        mission = { ...mission, routeElapsed }
        if (!mission.trafficUpdateApplied && routeElapsed >= activeRoute.scheduledUpdate.atSecond) {
          const applied = applyScheduledTrafficUpdate(activeRoute)
          newEta = Math.max(1, newEta + applied.update.deltaSeconds)
          mission = {
            ...mission,
            route: applied.route,
            outboundTotal: Math.max(routeElapsed + newEta, mission.outboundTotal + applied.update.deltaSeconds),
            trafficUpdateApplied: true,
            lastTrafficUpdate: applied.update,
          }
        }
      }

      if (newEta > 0) return { ...v, eta: newEta, mission }
      // 阶段切换
      switch (v.status) {
        case 'en_route':
          return { ...v, status: 'on_scene', eta: mission.onSceneTotal, mission }
        case 'on_scene':
          return { ...v, status: 'returning', eta: mission.outboundTotal, mission }
        case 'returning':
          return { ...v, status: 'available', eta: 0, mission: null, currentCallId: null }
      }
      return v
    }),
  }
}

/** 根据地址完整度和车辆速度计算 ETA（游戏秒数） */
export function calcVehicleETA(addressCompleteness: 'vague' | 'partial' | 'full', vehicleSpeed: number): number {
  let eta = 10
  if (addressCompleteness === 'full') eta -= 2
  else if (addressCompleteness === 'vague') eta += 3
  eta = Math.round(eta / vehicleSpeed)
  return Math.max(4, eta)
}

/** 按 id 查车 */
export function findVehicleById(fleet: FleetState, id: string | null): Ambulance | null {
  if (!id) return null
  return fleet.vehicles.find(v => v.id === id) ?? null
}

/** 查找最快可用的车辆 */
export function findFastestAvailable(fleet: FleetState): Ambulance | null {
  const available = fleet.vehicles.filter(v => v.status === 'available')
  if (available.length === 0) return null
  return available.reduce((a, b) => a.speed >= b.speed ? a : b)
}

/** 查找能力最强的可用车辆 */
export function findMostCapableAvailable(fleet: FleetState): Ambulance | null {
  const available = fleet.vehicles.filter(v => v.status === 'available')
  if (available.length === 0) return null
  return available.reduce((a, b) => a.capability >= b.capability ? a : b)
}

/** 可用车辆数 */
export function countAvailable(fleet: FleetState): number {
  return fleet.vehicles.filter(v => v.status === 'available').length
}

/** tier → 中文描述 */
export function tierLabel(tier: AmbulanceTier): string {
  return tier === 'MICU' ? '移动 ICU' : tier === 'ALS' ? '高级生命支持' : '基础生命支持'
}
