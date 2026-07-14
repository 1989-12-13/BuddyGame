// ============================================================
// 零点接线台 — World Reducer
// 120急救调度模拟游戏核心逻辑
// ============================================================

import type { WorldState, DialogueLine, CallPhase, InfoQuality, JudgmentPrompt, PatientEvent, CallHistoryEntry } from '../types'
import { stressToLevel, determinantToHotCold, determinantToTriage } from '../types'
import type { GameAction } from './actions'
import { rngInt } from './random'
import {
  createInitialState,
  createCallerState,
  createTerminalState,
  buildScenarioQueue,
  createPatientStatus,
  stabilityToVitalSign,
  baseRescueRate,
  calcRescueSuccessRate,
  judgeRescueSuccess,
  triageLevelDiff,
} from './worldState'
import { getScenario } from '../events/templates'
import { getCaller } from '../npc/personas'
import { hasPerk } from './perks'
import { advanceFleet } from './fleet'
import { ev, pushEvent, judgmentCorrectAnswer, toneToInitialStress } from './reducers/helpers'
import { handleAskQuestion } from './reducers/askQuestion'
import { handleDispatch } from './reducers/dispatch'
import { handleEndCall } from './reducers/endCall'

export function worldReducer(state: WorldState, action: GameAction): WorldState {
  switch (action.type) {

    // ==========================================
    // START_SHIFT — 开始新班次
    // ==========================================
    case 'START_SHIFT': {
      const newShift = state.shiftNumber + 1
      const useQueue = action.forceScenarios ?? buildScenarioQueue()
      return {
        ...createInitialState(),
        screen: 'playing',
        shiftNumber: newShift,
        totalCalls: useQueue.length,
        scenarioQueue: useQueue,
      }
    }

    // ==========================================
    // ANSWER_CALL — 接听电话
    // ==========================================
    case 'ANSWER_CALL': {
      if (state.callIndex >= state.totalCalls) return state

      const scenarioId = state.scenarioQueue[state.callIndex]
      if (!scenarioId) return state

      const scenario = getScenario(scenarioId)
      const callerProfile = getCaller(scenario.callerId)
      const initialStress = toneToInitialStress(callerProfile.tone)
      const callerState = createCallerState(scenario.callerId, initialStress)

      const openingLine: DialogueLine = {
        speaker: 'caller',
        text: scenario.openingLine,
        timestamp: state.shiftElapsed,
      }

      const systemLine: DialogueLine = {
        speaker: 'system',
        text: `【来电号码: ${scenario.phoneNumber} | 基站定位: ${scenario.baseStation} | 来电者情绪: ${callerState.stressLevel}】`,
        timestamp: state.shiftElapsed,
      }

      const terminal = createTerminalState()
      const patientStatus = scenario.isPrank ? null : createPatientStatus(scenario.correctTriage)

      return {
        ...state,
        currentCall: scenario,
        callPhase: 'questioning',
        callStartTime: state.shiftElapsed,
        callerState,
        patientStatus,
        patientEvents: [],
        rescue: { phase: 'idle', vehicleId: null, vehicleName: null, etaTotal: 0, arrivalShiftTime: null, outcome: null, successScore: null, failureReason: null },
        terminal,
        dispatchSent: false,
        dispatchRecord: null,
        ambulanceRemaining: -1,
        questionCost: 0,
        guidanceActive: false,
        guidanceStepIndex: 0,
        guidanceResults: [],
        guidanceMinigameScores: [],
        pendingJudgments: [],
        lastDebrief: null,
        pendingPerkChoices: [],
        dialogueLog: [systemLine, openingLine],
      }
    }

    // ==========================================
    // ASK_QUESTION — 叙述式问询（→ reducers/askQuestion.ts）
    // ==========================================
    case 'ASK_QUESTION':
      return handleAskQuestion(state, action.questionId)

    // ==========================================
    // CALM_CALLER — 安抚来电者情绪（消耗时间但提高答案质量）
    // ==========================================
    case 'CALM_CALLER': {
      if (!state.currentCall || !state.callerState) return state
      if (state.callPhase !== 'questioning' && state.callPhase !== 'connected') return state

      const cs = state.callerState
      const now = state.shiftElapsed
      const hasCalmScript = hasPerk(state.perks, 'calm_script')
      const stressDrop = (hasCalmScript ? 30 : 20) + rngInt(10)
      const calmCost = hasCalmScript ? 1 : 2
      const newStress = Math.max(0, cs.stress - stressDrop)
      const newStressLevel = stressToLevel(newStress)

      const calmPhrases = [
        '请您深呼吸，慢慢说。救护车启动需要您提供准确信息。',
        '我理解您很着急，但请您尽量保持冷静，我需要您的帮助。',
        '别担心，我会一直在这个电话上。请您配合我，我们一步步来。',
        '您做得很好，请继续保持。现在我需要再确认几个信息。',
      ]
      const phrase = calmPhrases[rngInt(calmPhrases.length)]

      const opLine: DialogueLine = { speaker: 'operator', text: phrase, timestamp: now }
      const callerLine: DialogueLine = {
        speaker: 'caller', text: '好...好的，我尽量...你说...',
        timestamp: now,
      }

      return {
        ...state,
        shiftElapsed: state.shiftElapsed + calmCost,
        questionCost: state.questionCost + calmCost,
        callerState: {
          ...cs,
          stress: newStress,
          stressLevel: newStressLevel,
        },
        dialogueLog: [...state.dialogueLog, opLine, callerLine],
      }
    }

    // ==========================================
    // UPDATE_TERMINAL — 更新终端登记
    // ==========================================
    case 'UPDATE_TERMINAL': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          [action.field]: action.value,
        },
      }
    }

    // ==========================================
    // SET_PATIENT_STATUS — 设置患者生命体征
    // ==========================================
    case 'SET_PATIENT_STATUS': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          [action.field]: action.value,
        },
      }
    }

    // ==========================================
    // SET_MPDS_DETERMINANT — 设置MPDS判定码
    // ==========================================
    case 'SET_MPDS_DETERMINANT': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          determinant: action.determinant,
          hotCold: determinantToHotCold(action.determinant),
          triage: determinantToTriage(action.determinant),
        },
      }
    }

    // ==========================================
    // SET_DETERMINANT_SUBCODE — 设置判定码最后一位子编码
    // ==========================================
    case 'SET_DETERMINANT_SUBCODE': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          determinantSubcode: action.subcode,
        },
      }
    }

    // ==========================================
    // SET_PROTOCOL — 设置MPDS协议编号
    // ==========================================
    case 'SET_PROTOCOL': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          protocolNumber: action.protocolNumber,
        },
      }
    }

    // ==========================================
    // SET_TRIAGE — 设置分诊等级
    // ==========================================
    case 'SET_TRIAGE': {
      return {
        ...state,
        terminal: {
          ...state.terminal,
          triage: action.level,
        },
      }
    }

    // ==========================================
    // MAKE_JUDGMENT — 玩家从临床判断选择题中选择答案
    // ==========================================
    case 'MAKE_JUDGMENT': {
      const { judgmentId, chosenOptionIndex } = action
      const idx = state.pendingJudgments.findIndex(j => j.id === judgmentId)
      if (idx < 0) return state

      const judgment = state.pendingJudgments[idx]
      const updatedJudgment = { ...judgment, chosenOptionIndex }
      const newJudgments = [...state.pendingJudgments]
      newJudgments[idx] = updatedJudgment

      const selectedOption = updatedJudgment.options[chosenOptionIndex]
      let newTerminal = { ...state.terminal }
      if (selectedOption) {
        for (const fill of selectedOption.fills) {
          if (fill.field === 'conscious') {
            newTerminal = { ...newTerminal, conscious: fill.value as boolean }
          } else if (fill.field === 'breathing') {
            newTerminal = { ...newTerminal, breathing: fill.value as boolean }
          } else if (fill.field === 'protocolNumber') {
            newTerminal = { ...newTerminal, protocolNumber: parseInt(fill.value as string, 10) || null }
          } else {
            newTerminal = { ...newTerminal, [fill.field]: fill.value }
          }
        }
      }

      let newPatientStatus = state.patientStatus
      let newEvents = state.patientEvents
      if (state.patientStatus && !state.patientStatus.died) {
        const isCorrect = !!selectedOption?.isCorrect
        if (isCorrect) {
          newPatientStatus = { ...state.patientStatus, stability: Math.min(100, state.patientStatus.stability + 4) }
          newEvents = pushEvent(newEvents, ev('good', `✓ 判断准确：${judgment.question.slice(0, 18)}…`, state.shiftElapsed))
        } else {
          newPatientStatus = { ...state.patientStatus, stability: Math.max(0, state.patientStatus.stability - 8) }
          const correctLabel = judgmentCorrectAnswer(judgment)
          newEvents = pushEvent(newEvents, ev('bad', `✗ 误判 · 实际应为：${correctLabel}`, state.shiftElapsed))
        }
      }

      return {
        ...state,
        pendingJudgments: newJudgments,
        terminal: newTerminal,
        patientStatus: newPatientStatus,
        patientEvents: newEvents,
      }
    }

    // ==========================================
    // SELECT_VEHICLE — 玩家在派车 UI 中选定车辆（不触发派车）
    // ==========================================
    case 'SELECT_VEHICLE': {
      const v = state.fleet.vehicles.find(x => x.id === action.vehicleId && x.status === 'available')
      if (!v) return state
      return {
        ...state,
        fleet: { ...state.fleet, selectedVehicleId: v.id },
      }
    }

    // ==========================================
    // DISPATCH — 派出救护车（→ reducers/dispatch.ts）
    // ==========================================
    case 'DISPATCH':
      return handleDispatch(state, action.vehicleId)

    // ==========================================
    // ANSWER_GUIDANCE — 回答急救指导（记录结果，直接推进下一步）
    // ==========================================
    case 'ANSWER_GUIDANCE': {
      if (!state.currentCall?.guidance) return state
      if (!state.guidanceActive) return state
      if (state.callPhase !== 'guidance') return state

      const guidanceDef = state.currentCall.guidance
      const step = guidanceDef.steps[action.stepIndex]
      if (!step) return state

      const isCorrect = action.selectedIndex === step.correctIndex
      const now = state.shiftElapsed

      const callerText = isCorrect ? step.feedback.callerCorrect : step.feedback.callerIncorrect

      const operatorLine: DialogueLine = {
        speaker: 'operator',
        text: step.instruction,
        timestamp: now,
      }
      const feedbackLine: DialogueLine = {
        speaker: 'caller',
        text: callerText,
        timestamp: now,
      }

      const newResults = [...state.guidanceResults]
      newResults[action.stepIndex] = isCorrect ? 'correct' : 'incorrect'

      let newPatientStatus = state.patientStatus
      let newEvents = state.patientEvents
      if (state.patientStatus && !state.patientStatus.died) {
        if (isCorrect) {
          newPatientStatus = { ...state.patientStatus, stability: Math.min(100, state.patientStatus.stability + 3) }
          newEvents = pushEvent(newEvents, ev('good', `✓ ${step.prompt}：操作正确`, state.shiftElapsed))
        } else {
          newPatientStatus = { ...state.patientStatus, stability: Math.max(0, state.patientStatus.stability - 6) }
          newEvents = pushEvent(newEvents, ev('bad', `✗ ${step.prompt}：操作错误，患者情况恶化`, state.shiftElapsed))
        }
      }

      const nextIndex = action.stepIndex + 1
      const isLastStep = nextIndex >= guidanceDef.steps.length

      return {
        ...state,
        guidanceStepIndex: nextIndex,
        guidanceResults: newResults,
        callPhase: isLastStep ? 'closing' : 'guidance',
        patientStatus: newPatientStatus,
        patientEvents: newEvents,
        dialogueLog: [...state.dialogueLog, operatorLine, feedbackLine],
      }
    }

    // ==========================================
    // COMPLETE_MINIGAME — 互动小游戏完成（记录分数，推进步骤）
    // ==========================================
    case 'COMPLETE_MINIGAME': {
      if (!state.currentCall?.guidance) return state
      if (!state.guidanceActive) return state
      if (state.callPhase !== 'guidance') return state

      const guidanceDef = state.currentCall.guidance
      const step = guidanceDef.steps[action.stepIndex]
      if (!step?.miniGame) return state

      const now = state.shiftElapsed
      const spec = step.miniGame
      const callerText = action.passed ? spec.feedback.good : spec.feedback.bad
      const operatorLine: DialogueLine = {
        speaker: 'operator',
        text: `【实操指导：${spec.title}】${action.passed ? '操作到位' : '操作需改进'}（评分 ${(action.score * 100).toFixed(0)}）`,
        timestamp: now,
      }
      const feedbackLine: DialogueLine = {
        speaker: 'caller',
        text: callerText,
        timestamp: now,
      }

      const newScores = [...state.guidanceMinigameScores]
      newScores[action.stepIndex] = action.score

      let newPatientStatus = state.patientStatus
      let newEvents = state.patientEvents
      if (state.patientStatus && !state.patientStatus.died) {
        const delta = Math.round((action.score - 0.5) * 20)
        newPatientStatus = {
          ...state.patientStatus,
          stability: Math.max(0, Math.min(100, state.patientStatus.stability + delta)),
        }
        newEvents = pushEvent(newEvents, ev(
          action.score >= 0.7 ? 'good' : action.score >= 0.4 ? 'warn' : 'bad',
          `${action.score >= 0.7 ? '✓' : action.score >= 0.4 ? '◐' : '✗'} ${spec.title}：评分 ${(action.score * 100).toFixed(0)}`,
          state.shiftElapsed,
        ))
      }

      const nextIndex = action.stepIndex + 1
      const isLastStep = nextIndex >= guidanceDef.steps.length

      return {
        ...state,
        guidanceStepIndex: nextIndex,
        guidanceMinigameScores: newScores,
        callPhase: isLastStep ? 'closing' : 'guidance',
        patientStatus: newPatientStatus,
        patientEvents: newEvents,
        dialogueLog: [...state.dialogueLog, operatorLine, feedbackLine],
      }
    }

    // ==========================================
    // DISMISS_PATIENT_EVENT — 关闭一个顶部 toast
    // ==========================================
    case 'DISMISS_PATIENT_EVENT': {
      return {
        ...state,
        patientEvents: state.patientEvents.filter(e => e.id !== action.eventId),
      }
    }

    // ==========================================
    // END_CALL — 结束当前通话（→ reducers/endCall.ts）
    // ==========================================
    case 'END_CALL':
      return handleEndCall(state, action.perkChoices)

    // ==========================================
    // DISMISS_DEBRIEF — 关闭单通患者结果总结卡
    // ==========================================
    case 'DISMISS_DEBRIEF': {
      return {
        ...state,
        lastDebrief: null,
        screen: state.shiftCompletePending && state.pendingPerkChoices.length === 0
          ? 'ending'
          : state.screen,
      }
    }

    // ==========================================
    // CHOOSE_PERK — 每通电话后选择一项班次收益
    // ==========================================
    case 'CHOOSE_PERK': {
      if (!state.pendingPerkChoices.includes(action.perkId)) return state
      if (state.perks.includes(action.perkId)) {
        return { ...state, pendingPerkChoices: [] }
      }

      return {
        ...state,
        perks: [...state.perks, action.perkId],
        pendingPerkChoices: [],
        screen: state.shiftCompletePending ? 'ending' : state.screen,
      }
    }

    // ==========================================
    // TICK — 时钟滴答（每秒）
    // ==========================================
    case 'TICK': {
      if (state.screen !== 'playing') return state

      const newElapsed = state.shiftElapsed + 1
      const newCallPhase = state.callPhase as CallPhase
      const newDialogue: DialogueLine[] = []
      let newPatientStatus = state.patientStatus
      let newEvents = state.patientEvents
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

      let newAmbulanceRemaining = state.ambulanceRemaining
      if (state.dispatchSent && state.ambulanceRemaining > 0) {
        newAmbulanceRemaining -= 1
        if (newAmbulanceRemaining === 0 && justArrivedAtScene) {
          newDialogue.push({
            speaker: 'system',
            text: '【▸ 救护车已到达现场】',
            timestamp: newElapsed,
          })
        }
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
          newEvents = pushEvent(newEvents, ev(
            afterSign === 'arrest' ? 'bad' : 'warn',
            afterSign === 'arrest' ? '患者心搏骤停 · 生命体征消失' : `体征恶化至「${afterSign === 'critical' ? '危急' : '危重'}」`,
            newElapsed,
          ))
        }
        if (diedNow) {
          newEvents = pushEvent(newEvents, ev('bad', '患者死亡 · 救援失败', newElapsed))
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
        newEvents = pushEvent(newEvents, ev(
          success ? 'good' : 'bad',
          success ? `✓ 救治成功 · 患者获救` : `✗ 患者死亡 · ${newRescue.failureReason}`,
          newElapsed,
        ))
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
        shiftElapsed: newElapsed,
        ambulanceRemaining: newAmbulanceRemaining,
        callPhase: newCallPhase,
        patientStatus: newPatientStatus,
        patientEvents: newEvents,
        rescue: newRescue,
        callHistory: newCallHistory,
        fleet: afterFleet,
        dialogueLog: state.dialogueLog.length > 0 || newDialogue.length > 0
          ? [...state.dialogueLog, ...newDialogue]
          : state.dialogueLog,
      }
    }

    // ==========================================
    // SHOW_ENDING — 显示结局
    // ==========================================
    case 'SHOW_ENDING': {
      return { ...state, screen: 'ending' }
    }

    // ==========================================
    // BACK_TO_TITLE — 返回标题
    // ==========================================
    case 'BACK_TO_TITLE': {
      return createInitialState()
    }

    default:
      return state
  }
}

export type { GameAction }
