// ============================================================
// 零点接线台 — 救护车队管理
// ============================================================

export type AmbulanceStatus = 'available' | 'en_route' | 'on_scene' | 'returning'

export interface Ambulance {
  id: string
  name: string
  status: AmbulanceStatus
  /** 当前任务剩余秒数（0 = 空闲） */
  eta: number
  /** 速度等级 1-3，影响 ETA */
  speed: number
  /** 装备能力 */
  equipment: string[]
  /** 当前任务的目的地场景 ID（用于追踪） */
  currentCallId: string | null
}

export interface FleetState {
  vehicles: Ambulance[]
  /** 当前派车选中的车辆 ID */
  selectedVehicleId: string | null
}

/** 创建默认车队（3 辆） */
export function createDefaultFleet(): FleetState {
  return {
    vehicles: [
      { id: 'ambulance_a', name: '望京站-甲车', status: 'available', eta: 0, speed: 2, equipment: ['ALS', 'BLS'], currentCallId: null },
      { id: 'ambulance_b', name: '中关村站-乙车', status: 'available', eta: 0, speed: 1, equipment: ['BLS'], currentCallId: null },
      { id: 'ambulance_c', name: '方庄站-丙车', status: 'available', eta: 0, speed: 3, equipment: ['ALS', 'BLS', '4WD'], currentCallId: null },
    ],
    selectedVehicleId: null,
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

/** 查找最快可用的车辆 */
export function findFastestAvailable(fleet: FleetState): Ambulance | null {
  const available = fleet.vehicles.filter(v => v.status === 'available')
  if (available.length === 0) return null
  return available.reduce((a, b) => a.speed >= b.speed ? a : b)
}

/** 可用车辆数 */
export function countAvailable(fleet: FleetState): number {
  return fleet.vehicles.filter(v => v.status === 'available').length
}
