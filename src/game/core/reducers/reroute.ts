import type { WorldState } from '../../types'

export function handleReroute(state: WorldState, routeId: string): WorldState {
  const prompt = state.pendingReroute
  if (!prompt || state.rerouteUsed || state.rescue.phase !== 'enroute') return state
  const currentVehicle = state.fleet.vehicles.find(vehicle => vehicle.id === state.rescue.vehicleId)
  if (!currentVehicle || currentVehicle.status !== 'en_route' || !currentVehicle.mission) return state

  const selectedRoute = prompt.options.find(route => route.id === routeId)
  if (!selectedRoute) return state
  const elapsed = currentVehicle.mission.routeElapsed ?? 0
  const keepCurrent = routeId === prompt.currentRouteId
  const remaining = keepCurrent ? currentVehicle.eta : Math.max(1, selectedRoute.totalEta - elapsed)
  const updatedRoute = keepCurrent ? currentVehicle.mission.route : selectedRoute

  return {
    ...state,
    rerouteUsed: true,
    pendingReroute: null,
    ambulanceRemaining: remaining,
    rescue: { ...state.rescue, etaTotal: elapsed + remaining },
    dispatchRecord: state.dispatchRecord ? {
      ...state.dispatchRecord,
      ambulanceETA: elapsed + remaining,
      routeId: updatedRoute?.id,
      routeStrategy: updatedRoute?.strategy,
      routeRisk: updatedRoute?.risk,
    } : null,
    fleet: {
      ...state.fleet,
      vehicles: state.fleet.vehicles.map(vehicle => vehicle.id === currentVehicle.id ? {
        ...vehicle,
        eta: remaining,
        mission: {
          ...currentVehicle.mission!,
          route: updatedRoute,
          outboundTotal: elapsed + remaining,
          trafficUpdateApplied: true,
        },
      } : vehicle),
    },
    dialogueLog: [...state.dialogueLog, {
      speaker: 'system',
      text: keepCurrent ? '【保持当前路线】' : `【已改道 · 剩余约 ${remaining} 秒】`,
      timestamp: state.shiftElapsed,
    }],
  }
}
