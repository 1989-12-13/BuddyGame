// ============================================================
// 零点接线台 — DISPATCH reducer 处理器
// 派出救护车
// ============================================================

import type { WorldState, DialogueLine } from '../../types'
import { calcOnSceneDuration } from '../worldState'
import { findVehicleById, type Ambulance } from '../fleet'
import { lookupCoords, DEFAULT_CENTER } from '../../locations'
import { createEventSink, sinkEvent } from './helpers'
import { DISPATCH_WARN_TIME, DISPATCH_CRITICAL_TIME } from '../constants'
import { buildDispatchPlan, buildVehicleRouteOptions } from '../dispatchPlanning'
import type { RoutePlan } from '../routing'

function isValidRouteSelection(route: RoutePlan): boolean {
  return route.nodes[0]?.id === 'route-start'
    && route.nodes[route.nodes.length - 1]?.id === 'route-scene'
    && route.segments.length === route.nodes.length - 1
    && route.segments.every((segment, index) =>
      segment.fromId === route.nodes[index]?.id && segment.toId === route.nodes[index + 1]?.id)
}

export function handleDispatch(state: WorldState, vehicleId?: string, selectedRoute?: RoutePlan): WorldState {
  if (!state.currentCall || !state.callerState) return state
  if (state.dispatchSent) return state
  if (!state.terminal.determinant || !state.terminal.triage) return state

  // 正常流程由系统配车；保留 vehicleId 仅用于锁定路线规划界面已经展示的车辆。
  const automaticPlan = buildDispatchPlan(state)
  let vehicle: Ambulance | null =
    findVehicleById(state.fleet, vehicleId ?? state.fleet.selectedVehicleId)
  if (!vehicle || vehicle.status !== 'available') {
    vehicle = automaticPlan?.vehicle ?? null
  }
  if (!vehicle) return state   // 无可用车

  const dispatchTime = state.shiftElapsed - state.callStartTime
  const rawAddress = state.callerState.revealedInfo.address
  const addressCompleteness: 'vague' | 'partial' | 'full' =
    rawAddress === 'none' ? 'vague' : rawAddress

  // 从MPDS判定码自动推导分诊等级（现场分诊由急救人员执行，调度员无需手动选择）
  const triage = state.terminal.triage

  const onSceneTotal = calcOnSceneDuration(state.currentCall.correctTriage)
  // 事件点真实坐标（用于地图跨通话显示）
  const eventLatLng = lookupCoords(state.currentCall.baseStation) ?? DEFAULT_CENTER
  const routes = automaticPlan?.vehicle.id === vehicle.id
    ? automaticPlan.routes
    : buildVehicleRouteOptions(state, vehicle)
  const route = selectedRoute && isValidRouteSelection(selectedRoute)
    ? selectedRoute
    : routes.reduce((best, candidate) => candidate.totalEta < best.totalEta ? candidate : best)
  const eta = route.totalEta

  const systemLine: DialogueLine = {
    speaker: 'system',
    text: `【▸ ${vehicle.name}（${vehicle.tier}）已派出 — 路线: ${route.label} | 分诊: ${triage === 'red' ? '红色(濒危)' : triage === 'yellow' ? '黄色(危重)' : triage === 'green' ? '绿色(轻伤)' : '黑色'} | 预计到达: ${eta}秒 | 派车耗时: ${dispatchTime}秒】`,
    timestamp: state.shiftElapsed,
  }

  const record = {
    callId: state.currentCall.id,
    dispatchTime,
    triage,
    correctTriage: state.currentCall.correctTriage,
    isPrank: state.currentCall.isPrank,
    addressCompleteness,
    ambulanceETA: eta,
    dispatchedAt: state.shiftElapsed,
    routeId: route.id,
    routeLabel: route.label,
    routeRisk: route.risk,
  }
  const afterDispatchLines: DialogueLine[] = state.currentCall.specialEvents
    .filter(evt => evt.trigger === 'after_dispatch')
    .map(evt => ({
      speaker: 'caller' as const,
      text: evt.dialogue,
      timestamp: state.shiftElapsed,
    }))

  // 派车超时即时反馈
  const sink = createEventSink(state)
  if (state.patientStatus && dispatchTime > DISPATCH_CRITICAL_TIME) {
    sinkEvent(sink, 'bad', '⛔ 黄金抢救窗已过 · 患者生存率骤降', state.shiftElapsed)
  } else if (state.patientStatus && dispatchTime > DISPATCH_WARN_TIME) {
    sinkEvent(sink, 'warn', `⚠ 进入派车预警区间（>${DISPATCH_WARN_TIME}s）`, state.shiftElapsed)
  }

  // 救援闭环初始化
  const rescue = {
    phase: 'enroute' as const,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    etaTotal: eta,
    arrivalShiftTime: null as number | null,
    outcome: null as 'success' | 'failed' | null,
    successScore: null as number | null,
    failureReason: null as string | null,
  }

  // 检查是否需要进入急救指导阶段
  const hasGuidance = state.currentCall.guidance !== null

  return {
    ...state,
    eventSeq: sink.seq,
    dispatchSent: true,
    dispatchRecord: record,
    ambulanceRemaining: eta,
    callPhase: hasGuidance ? 'guidance' : 'closing',
    guidanceActive: hasGuidance,
    guidanceStepIndex: 0,
    guidanceResults: hasGuidance
      ? new Array(state.currentCall.guidance!.steps.length).fill(null)
      : [],
    guidanceMinigameScores: hasGuidance
      ? new Array(state.currentCall.guidance!.steps.length).fill(null)
      : [],
    dialogueLog: [...state.dialogueLog, systemLine, ...afterDispatchLines],
    rescue,
    fleet: {
      ...state.fleet,
      selectedVehicleId: vehicle.id,
      vehicles: state.fleet.vehicles.map(v =>
        v.id === vehicle.id
          ? {
              ...v,
              status: 'en_route' as const,
              eta,
              currentCallId: state.currentCall!.id,
              mission: {
                callId: state.currentCall!.id,
                outboundTotal: eta,
                onSceneTotal,
                eventLatLng,
                route,
                routeElapsed: 0,
                trafficUpdateApplied: false,
                lastTrafficUpdate: null,
              },
            }
          : v
      ),
    },
    patientEvents: sink.events,
  }
}
