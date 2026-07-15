// ============================================================
// 120调度台 — TICK reducer 处理器
// 时钟滴答（每秒）：推进 fleet、衰减患者生命值、判定救援成败
// ============================================================

import type { WorldState, DialogueLine, CallPhase } from '../../types'
import { createEventSink, sinkEvent } from './helpers'
import { advanceFleet } from '../fleet'
import { stabilityToVitalSign, baseRescueRate, calcRescueSuccessRate, judgeRescueSuccess, triageLevelDiff } from '../worldState'

export function handleTick(state: WorldState): WorldState {
  if (state.screen !== 'playing') return state

  const newElapsed = state.shiftElapsed + 1
  const newCallPhase = state.callPhase as CallPhase
  const newDialogue: DialogueLine[] = []
  const sink = createEventSink(state)
  let newPatientStatus = state.patientStatus
  let newRescue = state.rescue
  let newCallHistory = state.callHistory

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
  const rescueVehicle = rescueVid ? afterFleet.vehicles.find(v => v.id === rescueVid) : null
  const newAmbulanceRemaining = rescueVehicle?.status === 'en_route' ? rescueVehicle.eta : 0
  if (justArrivedAtScene) {
    newDialogue.push({
      speaker: 'system',
      text: '【▸ 救护车已到达现场】',
      timestamp: newElapsed,
    })
  }

  // 患者生命体征每秒衰减
  if (state.patientStatus && !state.patientStatus.died) {
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
    const vehicle = afterRescueVehicle
    const stability = newPatientStatus?.stability ?? 0
    const guidanceWrong = state.guidanceResults.filter(r => r === 'incorrect').length
    const mgScores = state.guidanceMinigameScores.filter((s): s is number => s != null)
    const miniGameAvg = mgScores.length ? mgScores.reduce((a, b) => a + b, 0) / mgScores.length : 0
    const triageDiff = triageLevelDiff(
      state.dispatchRecord.triage,
      state.dispatchRecord.correctTriage,
    )

    const rate = calcRescueSuccessRate({
      base: baseRescueRate(state.dispatchRecord.correctTriage),
      stability,
      capability: vehicle?.capability ?? 3,
      dispatchTime: state.dispatchRecord.dispatchTime,
      triageDiff,
      guidanceWrongCount: guidanceWrong,
      miniGameAvg,
    })
    const success = judgeRescueSuccess(rate) && !(newPatientStatus?.died ?? false)

    newRescue = {
      ...state.rescue,
      phase: success ? 'success' : 'failed',
      arrivalShiftTime: newElapsed,
      outcome: success ? 'success' : 'failed',
      successScore: rate,
      failureReason: success ? null : (triageDiff >= 2 ? '分诊严重不足，院前响应延误'
        : triageDiff === 1 ? '分诊偏低，院前响应降级'
        : state.dispatchRecord.dispatchTime > 60 ? '派车超时，错过黄金窗'
        : stability < 30 ? '患者生命体征耗尽'
        : '现场救治未成功'),
    }

    newDialogue.push({
      speaker: 'system',
      text: success
        ? `【✓ 救治成功 · 救护车抵达后患者获救（成功率 ${(rate * 100).toFixed(0)}%）】`
        : `【✗ 救治失败 · ${newRescue.failureReason}（成功率 ${(rate * 100).toFixed(0)}%）】`,
      timestamp: newElapsed,
    })
    sinkEvent(sink,
      success ? 'good' : 'bad',
      success ? `✓ 救治成功 · 患者获救` : `✗ 患者死亡 · ${newRescue.failureReason}`,
      newElapsed,
    )
    if (!success && newPatientStatus && !newPatientStatus.died) {
      newPatientStatus = { ...newPatientStatus, died: true, vitalSign: 'arrest', stability: 0 }
    }

    const completedCallId = state.dispatchRecord?.callId
    if (completedCallId) {
      const idx = newCallHistory.findIndex(h => h.callId === completedCallId)
      if (idx >= 0 && newCallHistory[idx].outcome === 'pending') {
        newCallHistory = [...newCallHistory]
        newCallHistory[idx] = { ...newCallHistory[idx], outcome: success ? 'success' : 'failed' }
      }
    }
  }

  // 检查时间触发的事件
  if (state.currentCall && state.callerState) {
    for (const evt of state.currentCall.specialEvents) {
      if (evt.trigger === 'time_elapsed' && evt.triggerValue) {
        const triggerSec = parseInt(evt.triggerValue, 10)
        const callTime = newElapsed - state.callStartTime
        if (callTime === triggerSec) {
          const alreadyInserted = state.dialogueLog.some(
            l => l.text === evt.dialogue
          )
          if (!alreadyInserted) {
            newDialogue.push({
              speaker: 'caller',
              text: evt.dialogue,
              timestamp: newElapsed,
            })
          }
        }
      }
    }
  }

  return {
    ...state,
    eventSeq: sink.seq,
    shiftElapsed: newElapsed,
    ambulanceRemaining: newAmbulanceRemaining,
    callPhase: newCallPhase,
    patientStatus: newPatientStatus,
    patientEvents: sink.events,
    rescue: newRescue,
    callHistory: newCallHistory,
    fleet: afterFleet,
    dialogueLog: state.dialogueLog.length > 0 || newDialogue.length > 0
      ? [...state.dialogueLog, ...newDialogue]
      : state.dialogueLog,
  }
}
