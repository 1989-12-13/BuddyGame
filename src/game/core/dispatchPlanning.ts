import { dispatchEligibility } from './session'
import type { WorldState } from '../types'
import { DEFAULT_CENTER, STATION_COORDS, lookupCoords } from '../locations'
import { hasPerk } from './perks'
import { buildRouteOptions, type RoutePlan } from './routing'
import { calcAmbulanceETA } from './worldState'
import { paceRoutes } from './pacing'

export interface DispatchPlan {
  routes: RoutePlan[]
  callInstanceId: number
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
  const priorityChannel = hasPerk(state.perks, 'priority_channel')
  const paced = paceRoutes(buildRouteOptions({
    start,
    end,
    baseEta,
    seed: `${state.currentCall.id}:${state.shiftNumber}:${state.callIndex}:${dispatchTime}`,
    priorityChannel: false,
  }), state.currentCall.id)
  return priorityChannel ? paced.map(route => {
    const totalEta = Math.max(20, route.totalEta - 5)
    return {
      ...route,
      totalEta,
      scheduledUpdate: {
        ...route.scheduledUpdate,
        atSecond: Math.max(1, Math.round(route.scheduledUpdate.atSecond * totalEta / route.totalEta)),
      },
    }
  }) : paced
}

/**
 * 是否应该自动把路线选择摆给玩家（不再让他先点一次按钮）。
 *
 * 规则：
 *   · 已经有一份方案在展示（`planActive`）→ 不重复推
 *   · 这一通电话已经自动尝试过（`autoPlannedFor === callInstanceId`）→ 不再反复弹，
 *     玩家取消后由抽屉里的按钮把主动权还给他
 *   · 判定条件复用 `dispatchEligibility`，与真正派车完全一致
 */
export function shouldAutoPlan(state: WorldState, planActive: boolean, autoPlannedFor: number | null): boolean {
  if (!state.currentCall || planActive || state.dispatchSent) return false
  if (autoPlannedFor === state.callInstanceId) return false
  return dispatchEligibility(state).allowed
}

/**
 * 系统配车：使用唯一救护车生成路线方案。
 * 返回的路线作为一次不可变的调度方案交给路线选择界面。
 */
export function buildDispatchPlan(state: WorldState): DispatchPlan | null {
  if (!dispatchEligibility(state).allowed) return null

  const vehicle = state.fleet.vehicles[0]
  if (!vehicle || vehicle.status !== 'available') return null

  const routes = buildRouteOptionsForCall(state)
  if (routes.length === 0) return null

  return { routes, callInstanceId: state.callInstanceId }
}
