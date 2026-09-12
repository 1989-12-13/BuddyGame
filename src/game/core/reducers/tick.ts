// ============================================================
// 120调度台 — TICK reducer 处理器
// 时钟滴答（每秒）：推进 fleet、衰减患者生命值、判定救援成败
// ============================================================

import { isWorldPaused } from '../session'
import type { WorldState, DialogueLine, CallPhase } from '../../types'
import { createEventSink, sinkEvent } from './helpers'
import { advanceFleet } from '../fleet'
import { stabilityToVitalSign } from '../worldState'
import { resolveRescue } from '../rescueResolution'

export function handleTick(state: WorldState): WorldState {
  if (state.screen !== 'playing' || isWorldPaused(state)) return state

  const newElapsed = state.shiftElapsed + 1
  const newCallPhase = state.callPhase as CallPhase
  const newDialogue: DialogueLine[] = []
  const sink = createEventSink(state)
  let newPatientStatus = state.patientStatus
  let newRescue = state.rescue
  let newCallHistory = state.callHistory
  let newRescueNotifications = state.rescueNotifications
  let newPendingReroute = state.pendingReroute

  // 救护车到达判定：基于 fleet 状态机 en_route→on_scene 转移
  const beforeFleet = state.fleet
  const afterFleet = advanceFleet(state.fleet)
  const rescueVid = state.rescue.vehicleId
  const beforeRescueVehicle = rescueVid
    ? beforeFleet.vehicles.find(v => v.id === rescueVid) ?? null
    : null
  const afterRescueVehicle = rescueVid
    ? afterFleet.vehicles.find(v => v.id === rescueVid) ?? null
    : null
  const justArrivedAtScene =
    state.rescue.phase === 'enroute' &&
    beforeRescueVehicle?.status === 'en_route' &&
    afterRescueVehicle?.status === 'on_scene'

  // 从 fleet 救援车辆实时读取 ETA，消除冗余状态不同步风险
  const newAmbulanceRemaining = afterRescueVehicle?.status === 'en_route' ? afterRescueVehicle.eta : 0
  if (justArrivedAtScene) {
    newDialogue.push({
      speaker: 'system',
      text: '【▸ 救护车已到达现场】',
      timestamp: newElapsed,
    })
  }

  const justReceivedTrafficUpdate =
    state.rescue.phase === 'enroute' &&
    beforeRescueVehicle?.mission?.trafficUpdateApplied !== true &&
    afterRescueVehicle?.mission?.trafficUpdateApplied === true
  const trafficUpdate = justReceivedTrafficUpdate
    ? afterRescueVehicle?.mission?.lastTrafficUpdate ?? null
    : null

  if (trafficUpdate && afterRescueVehicle) {
    const prefix = trafficUpdate.deltaSeconds > 0 ? '⚠ 路况更新' : '✓ 路况更新'
    const text = `${prefix} · ${afterRescueVehicle.name}：${trafficUpdate.message}`
    newDialogue.push({ speaker: 'system', text: `【${text}】`, timestamp: newElapsed })
    sinkEvent(sink, trafficUpdate.deltaSeconds > 0 ? 'warn' : 'good', text, newElapsed)
    newRescue = {
      ...newRescue,
      etaTotal: Math.max(1, newRescue.etaTotal + trafficUpdate.deltaSeconds),
    }
    // 在途事件对所有已派车事件生效（原先只对脑卒中场景生效）
    if (!state.rerouteUsed && afterRescueVehicle.mission?.route) {
      const currentRoute = afterRescueVehicle.mission.route
      const alternative = [...state.rerouteOptions]
        .filter(route => route.id !== currentRoute.id)
        .sort((a, b) => a.totalEta - b.totalEta)[0]
      if (alternative) {
        newPendingReroute = {
          callInstanceId: state.callInstanceId,
          message: trafficUpdate.message,
          currentRouteId: currentRoute.id,
          options: [currentRoute, alternative],
        }
      }
    }
  }

  // 患者生命体征每秒衰减
  if (state.currentCall && state.patientStatus && !state.patientStatus.died && !state.rescue.outcome) {
    const before = state.patientStatus
    const nextStability = Math.max(0, before.stability - before.decayRate)
    const beforeSign = before.vitalSign
    const afterSign = stabilityToVitalSign(nextStability)

    const worsened =
      (afterSign === 'critical' && beforeSign !== 'critical' && beforeSign !== 'arrest') ||
      (afterSign === 'arrest' && beforeSign !== 'arrest')

    const diedNow = nextStability <= 0 && !before.died

    if (worsened) {
      sinkEvent(sink,
        afterSign === 'arrest' ? 'bad' : 'warn',
        afterSign === 'arrest' ? '患者心搏骤停 · 生命体征消失' : `体征恶化至「${afterSign === 'critical' ? '危急' : '危重'}」`,
        newElapsed,
      )
    }
    if (diedNow) {
      sinkEvent(sink, 'bad', '患者死亡 · 救援失败', newElapsed)
    }

    newPatientStatus = {
      ...before,
      stability: nextStability,
      vitalSign: nextStability <= 0 ? 'arrest' : afterSign,
      died: before.died || diedNow,
    }
  }

  // 救护车到达 → 结算救援成败
  if (
    justArrivedAtScene &&
    state.rescue.phase === 'enroute' &&
    state.dispatchRecord &&
    !state.dispatchRecord.isPrank
  ) {
    const resolution = resolveRescue({
      dispatchRecord: state.dispatchRecord,
      patientStatus: newPatientStatus!,
      guidanceResults: state.guidanceResults,
      guidanceMinigameScores: state.guidanceMinigameScores,
      guidanceRequiredTotal: state.currentCall?.guidance?.steps.length ?? 0,
      perks: state.perks,
    })
    const success = resolution.outcome === 'success'
    const rate = resolution.successScore
    newPatientStatus = resolution.patientStatus

    newRescue = {
      ...state.rescue,
      phase: resolution.outcome,
      arrivalShiftTime: newElapsed,
      outcome: resolution.outcome,
      successScore: rate,
      failureReason: resolution.failureReason,
    }

    newDialogue.push({
      speaker: 'system',
      text: success
        ? '【✓ 救护车已到达 · 现场交接准备完成】'
        : `【✗ 本次模拟救援未成功 · ${newRescue.failureReason}】`,
      timestamp: newElapsed,
    })
    sinkEvent(sink,
      success ? 'good' : 'bad',
      success ? '✓ 救护车已到达 · 请完成现场交接' : `✗ 本次模拟救援未成功 · ${newRescue.failureReason}`,
      newElapsed,
    )
  }

  // 已挂断但已派车的任务仍随统一世界时钟推进并在到达时结算。
  const newBackgroundRescues = state.backgroundRescues.map(mission => {
    if (mission.outcome) return mission
    const beforeVehicle = beforeFleet.vehicles.find(vehicle => vehicle.id === mission.vehicleId)
    const afterVehicle = afterFleet.vehicles.find(vehicle => vehicle.id === mission.vehicleId)
    const nextStability = mission.patientStatus.died
      ? mission.patientStatus.stability
      : Math.max(0, mission.patientStatus.stability - mission.patientStatus.decayRate)
    let patientStatus = {
      ...mission.patientStatus,
      stability: nextStability,
      vitalSign: nextStability <= 0 ? 'arrest' as const : stabilityToVitalSign(nextStability),
      died: mission.patientStatus.died || nextStability <= 0,
    }
    const arrived = beforeVehicle?.status === 'en_route' && afterVehicle?.status === 'on_scene'
    if (!arrived) return { ...mission, patientStatus }

    const resolution = resolveRescue({
      dispatchRecord: mission.dispatchRecord,
      patientStatus,
      guidanceResults: mission.guidanceResults,
      guidanceMinigameScores: mission.guidanceMinigameScores,
      guidanceRequiredTotal: mission.guidanceRequiredTotal,
      perks: mission.perks,
    })
    patientStatus = resolution.patientStatus
    newCallHistory = newCallHistory.map(entry => entry.callInstanceId === mission.callInstanceId
      ? { ...entry, outcome: resolution.outcome }
      : entry)
    const notificationId = `rescue-result-${mission.callInstanceId}`
    if (!newRescueNotifications.some(notification => notification.id === notificationId)) {
      newRescueNotifications = [...newRescueNotifications, {
        id: notificationId,
        callInstanceId: mission.callInstanceId,
        kind: resolution.outcome === 'success' ? 'good' as const : 'bad' as const,
        text: resolution.outcome === 'success'
          ? `${mission.scenarioTitle}：救护车已到达，后台救援完成。`
          : `${mission.scenarioTitle}：救护车已到达，${resolution.failureReason ?? '救援未成功'}。`,
      }]
    }
    return {
      ...mission,
      patientStatus,
      outcome: resolution.outcome,
      successScore: resolution.successScore,
      failureReason: resolution.failureReason,
    }
  })

  return {
    ...state,
    eventSeq: sink.seq,
    shiftElapsed: newElapsed,
    activePlaySeconds: state.activePlaySeconds + (state.currentCall && !state.rescue.outcome && !state.patientStatus?.died ? 1 : 0),
    ambulanceRemaining: newAmbulanceRemaining,
    callPhase: newCallPhase,
    patientStatus: newPatientStatus,
    patientEvents: sink.events,
    rescue: newRescue,
    backgroundRescues: newBackgroundRescues,
    rescueNotifications: newRescueNotifications,
    pendingReroute: newPendingReroute,
    callHistory: newCallHistory,
    fleet: afterFleet,
    dialogueLog: state.dialogueLog.length > 0 || newDialogue.length > 0
      ? [...state.dialogueLog, ...newDialogue]
      : state.dialogueLog,
  }
}
