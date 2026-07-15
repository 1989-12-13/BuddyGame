// ============================================================
// 120调度台 — DISPATCH reducer 处理器
// 派出救护车
// ============================================================

import type { WorldState, DialogueLine } from '../../types'
import { hasPerk } from '../perks'
import { calcAmbulanceETA, calcOnSceneDuration } from '../worldState'
import { findVehicleById, findFastestAvailable, type Ambulance } from '../fleet'
import { lookupCoords, DEFAULT_CENTER } from '../../locations'
import { createEventSink, sinkEvent } from './helpers'
import { DISPATCH_WARN_TIME, DISPATCH_CRITICAL_TIME } from '../constants'

export function handleDispatch(state: WorldState, vehicleId?: string): WorldState {
  if (!state.currentCall || !state.callerState) return state
  if (state.dispatchSent) return state
  if (!state.terminal.determinant || !state.terminal.triage) return state

  // 选车优先级：vehicleId → fleet.selectedVehicleId → 最快可用
  let vehicle: Ambulance | null =
    findVehicleById(state.fleet, vehicleId ?? state.fleet.selectedVehicleId)
  if (!vehicle || vehicle.status !== 'available') {
    vehicle = findFastestAvailable(state.fleet)
  }
  if (!vehicle) return state   // 无可用车

  const dispatchTime = state.shiftElapsed - state.callStartTime
  const rawAddress = state.callerState.revealedInfo.address
  const addressCompleteness: 'vague' | 'partial' | 'full' =
    rawAddress === 'none' ? 'vague' : rawAddress

  // 从MPDS判定码自动推导分诊等级（现场分诊由急救人员执行，调度员无需手动选择）
  const triage = state.terminal.triage

  // ETA 受车辆速度影响（speed 越大 ETA 越短）+ 肉鸽收益 priority_channel
  const baseEta = calcAmbulanceETA(dispatchTime, addressCompleteness, vehicle.speed)
  const eta = Math.max(
    20,
    baseEta - (hasPerk(state.perks, 'priority_channel') ? 5 : 0),
  )
  const onSceneTotal = calcOnSceneDuration(state.currentCall.correctTriage)
  // 事件点真实坐标（用于地图跨通话显示）
  const eventLatLng = lookupCoords(state.currentCall.baseStation) ?? DEFAULT_CENTER

  const systemLine: DialogueLine = {
    speaker: 'system',
    text: `【▸ ${vehicle.name}（${vehicle.tier}）已派出 — 分诊: ${triage === 'red' ? '红色（濒危）' : triage === 'yellow' ? '黄色（危重）' : triage === 'green' ? '绿色（轻伤）' : '黑色'} | 预计到达: ${eta}秒 | 派车耗时: ${dispatchTime}秒】`,
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
              },
            }
          : v
      ),
    },
    patientEvents: sink.events,
  }
}
