import type { WorldState, TriageLevel } from '../types'
import { DEFAULT_CENTER, STATION_COORDS, lookupCoords } from '../locations'
import type { Ambulance } from './fleet'
import { hasPerk } from './perks'
import { buildRouteOptions, type RoutePlan } from './routing'
import { calcAmbulanceETA } from './worldState'

export interface DispatchPlan {
  vehicle: Ambulance
  routes: RoutePlan[]
  requiredCapability: number
}

const REQUIRED_CAPABILITY: Record<TriageLevel, number> = {
  red: 5,
  yellow: 4,
  green: 2,
  black: 2,
}

function addressCompleteness(state: WorldState): 'vague' | 'partial' | 'full' {
  const address = state.callerState?.revealedInfo.address ?? 'none'
  return address === 'none' ? 'vague' : address
}

export function buildVehicleRouteOptions(state: WorldState, vehicle: Ambulance): RoutePlan[] {
  if (!state.currentCall) return []
  const dispatchTime = state.shiftElapsed - state.callStartTime
  const end = lookupCoords(state.currentCall.baseStation) ?? DEFAULT_CENTER
  const start = STATION_COORDS[vehicle.id]?.pos ?? DEFAULT_CENTER
  const baseEta = calcAmbulanceETA(dispatchTime, addressCompleteness(state), vehicle.speed)
  return buildRouteOptions({
    start,
    end,
    baseEta,
    seed: `${state.currentCall.id}:${state.shiftNumber}:${state.callIndex}:${dispatchTime}:${vehicle.id}`,
    priorityChannel: hasPerk(state.perks, 'priority_channel'),
  })
}

/**
 * 系统配车：先保证急救能力达标，再比较路线 ETA，并对能力过剩做轻微惩罚以保留高级车辆。
 * 返回的路线与车辆作为一次不可变的调度方案交给路线选择界面。
 */
export function buildDispatchPlan(state: WorldState): DispatchPlan | null {
  if (!state.currentCall || !state.callerState || !state.terminal.triage) return null

  const available = state.fleet.vehicles.filter(vehicle => vehicle.status === 'available')
  if (available.length === 0) return null

  const requiredCapability = REQUIRED_CAPABILITY[state.terminal.triage]

  const candidates = available.map(vehicle => {
    const routes = buildVehicleRouteOptions(state, vehicle)
    const bestEta = Math.min(...routes.map(route => route.totalEta))
    const capabilityShortfall = Math.max(0, requiredCapability - vehicle.capability)
    const capabilitySurplus = Math.max(0, vehicle.capability - requiredCapability)
    const rank = capabilityShortfall * 1000 + bestEta + capabilitySurplus * 6
    return { vehicle, routes, rank }
  })

  candidates.sort((a, b) => a.rank - b.rank || b.vehicle.speed - a.vehicle.speed || a.vehicle.id.localeCompare(b.vehicle.id))
  const selected = candidates[0]
  return { vehicle: selected.vehicle, routes: selected.routes, requiredCapability }
}
