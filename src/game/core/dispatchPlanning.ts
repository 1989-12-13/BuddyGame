import type { WorldState } from '../types'
import { DEFAULT_CENTER, STATION_COORDS, lookupCoords } from '../locations'
import { hasPerk } from './perks'
import { buildRouteOptions, type RoutePlan } from './routing'
import { calcAmbulanceETA } from './worldState'

export interface DispatchPlan {
  routes: RoutePlan[]
}

function addressCompleteness(state: WorldState): 'vague' | 'partial' | 'full' {
  const address = state.callerState?.revealedInfo.address ?? 'none'
  return address === 'none' ? 'vague' : address
}

export function buildRouteOptionsForCall(state: WorldState): RoutePlan[] {
  if (!state.currentCall) return []
  const dispatchTime = state.shiftElapsed - state.callStartTime
  const end = lookupCoords(state.currentCall.baseStation) ?? DEFAULT_CENTER
  const start = STATION_COORDS['ambulance']?.pos ?? DEFAULT_CENTER
  const baseEta = calcAmbulanceETA(dispatchTime, addressCompleteness(state))
  return buildRouteOptions({
    start,
    end,
    baseEta,
    seed: `${state.currentCall.id}:${state.shiftNumber}:${state.callIndex}:${dispatchTime}`,
    priorityChannel: hasPerk(state.perks, 'priority_channel'),
  })
}

/**
 * 系统配车：使用唯一救护车生成路线方案。
 * 返回的路线作为一次不可变的调度方案交给路线选择界面。
 */
export function buildDispatchPlan(state: WorldState): DispatchPlan | null {
  if (!state.currentCall || !state.callerState || !state.terminal.triage) return null

  const vehicle = state.fleet.vehicles[0]
  if (!vehicle || vehicle.status !== 'available') return null

  const routes = buildRouteOptionsForCall(state)
  if (routes.length === 0) return null

  return { routes }
}
