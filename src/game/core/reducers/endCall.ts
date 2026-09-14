// ============================================================
// 120调度台 — END_CALL reducer 处理器
// 结束当前通话，计算得分，归档
// ============================================================

import type { WorldState, DialogueLine } from '../../types'
import { scoreCall, createTerminalState } from '../worldState'
import { nextDifficulty } from '../constants'
import { isPrankVerified } from '../judgments'
import { hasPerk, getPerkChoices } from '../perks'
import { buildDebrief } from '../debrief'
import { countIncorrectJudgments, deriveExpectedVitals } from './narrative'
import type { RoguePerkId } from '../perks'

export function handleEndCall(state: WorldState, perkChoices?: RoguePerkId[]): WorldState {
  if (!state.currentCall || !state.callerState) return state

  const call = state.currentCall
  const cs = state.callerState
  const dispatchRecord = state.dispatchRecord
  const didDispatch = dispatchRecord !== null

  // 计算本通电话得分
  let total: number
  let speed = 0
  let info = 0
  let triageScore = 0
  let decisionScore = 0
  let guidanceScore = 0
  let penaltyScore = 0

  // 救援结局只影响总结文案；操作评价独立保留。
  const rescueFailed = call.isPrank
    ? false
    : (state.rescue.outcome === 'failed' || (state.patientStatus?.died ?? false))

  // 恶作剧电话特殊评分
  if (call.isPrank) {
    if (!didDispatch && isPrankVerified(state.pendingJudgments)) {
      total = 100
      speed = 35
      info = 30
      triageScore = 20
      guidanceScore = 10
    } else if (!didDispatch) {
      total = 40
      speed = 15
      info = 15
      triageScore = 5
      guidanceScore = 5
    } else {
      total = 0
      speed = 0
      info = 0
      triageScore = 0
      guidanceScore = 0
    }
  } else {
    // 统计信息质量加分
    const qualityCount = Object.values(cs.infoQuality)
    const clearCount = qualityCount.filter(q => q === 'clear').length
    const qualityBonus = Math.min(5, clearCount)

    // 解析场景的预期判定码（如 "9-E-1" → 协议9, 字母E, 子码1）
    const detParts = call.mpdsCard.determinantCode.split('-')
    const correctProto = parseInt(detParts[0], 10) || 0


    const guidanceSteps = call.guidance?.steps ?? []
    const choiceStepTotal = guidanceSteps.filter(st => !st.miniGame).length
    const mgScores = state.guidanceMinigameScores.filter(s => s != null) as number[]
    const miniGameAvg = mgScores.length ? mgScores.reduce((a, b) => a + b, 0) / mgScores.length : 0
    // 仅统计非 minigame 步骤的选择题结果（minigame 分数通过 miniGameAvg 单独计入）
    const rawGuidanceCorrect = state.guidanceResults.filter(
      (r, i) => r === 'correct' && !guidanceSteps[i]?.miniGame,
    ).length
    const hasGuidanceMiss = state.guidanceResults.some(
      (r, i) => r === 'incorrect' && !guidanceSteps[i]?.miniGame,
    )
    const guidanceCorrect = hasPerk(state.perks, 'field_first_aid') && hasGuidanceMiss
      ? Math.min(choiceStepTotal, rawGuidanceCorrect + 1)
      : rawGuidanceCorrect

    const result = scoreCall(
      dispatchRecord?.dispatchTime ?? null,
      dispatchRecord?.addressCompleteness ?? 'vague',
      cs.revealedInfo.contact,
      cs.revealedInfo.chiefComplaint,
      cs.revealedInfo.purpose,
      dispatchRecord?.triage ?? null,
      call.correctTriage,
      guidanceCorrect,
      choiceStepTotal,
      miniGameAvg,
      qualityBonus,
      state.terminal.protocolNumber,
      correctProto,
      state.terminal.determinant,
      call.mpdsCard.determinantCode,
      state.terminal.determinantSubcode,
      mgScores.length,
    )
    total = result.total
    speed = result.speed
    info = result.info
    triageScore = result.triage
    decisionScore = result.decision
    guidanceScore = result.guidance

    const expectedVitals = deriveExpectedVitals(
      call.fourElements.condition.consciousness,
      call.fourElements.condition.breathing,
    )
    const vitalsPenalty =
      state.terminal.conscious !== null
      && state.terminal.breathing !== null
      && (
        state.terminal.conscious !== expectedVitals.conscious
        || state.terminal.breathing !== expectedVitals.breathing
      )
        ? 6
        : 0
    penaltyScore = countIncorrectJudgments(state.pendingJudgments) * 5 + vitalsPenalty + (state.handoff.firstAttemptCorrect === false ? 3 : 0)
    total = Math.max(0, total - penaltyScore)
  }

  const nextCallIndex = state.callIndex + 1
  const isShiftOver = nextCallIndex >= state.totalCalls
  const nextCallScores = [...state.callScores, total]

  // 按本通结束时体征条剩余比例调整下一通的自适应难度（恶作剧/核实通话无患者，难度不变）
  const ps = state.patientStatus
  const difficulty = ps && !call.isPrank
    ? nextDifficulty(state.difficulty, ps.stability / ps.initialStability)
    : state.difficulty

  // 通话结束的总结行
  const summaryLine: DialogueLine = {
    speaker: 'system',
    text: rescueFailed
      ? `【通话结束 | 救援未成功 · 操作评价 ${total} 分，详见复盘】`
      : `【通话结束 | 总分:${total}/100 — 速度:${speed} 信息:${info} 分诊:${triageScore} 判定:${decisionScore} 指导:${guidanceScore} 判断扣分:${penaltyScore}】`,
    timestamp: state.shiftElapsed,
  }

  const stateForDebrief: WorldState = {
    ...state,
    difficulty,
    callIndex: nextCallIndex,
    callPhase: 'completed',
    currentCall: null,
    callerState: cs,
    dispatchSent: false,
    dispatchRecord,
    ambulanceRemaining: -1,
    guidanceActive: false,
    totalScore: state.totalScore + total,
    callScores: nextCallScores,
    dialogueLog: [...state.dialogueLog, summaryLine],
    screen: 'playing',
    shiftCompletePending: isShiftOver,
  }
  const lastDebrief = buildDebrief(stateForDebrief, call, {
    speed,
    info,
    triage: triageScore,
    decision: decisionScore,
    guidance: guidanceScore,
    penalty: penaltyScore,
  })

  // 车辆不在此处复位 — 由 advanceFleet 自然推进 on_scene→returning→available
  const newFleet = state.fleet

  const shouldContinueInBackground = !!(
    dispatchRecord
    && state.patientStatus
    && !state.rescue.outcome
    && state.rescue.vehicleId
  )
  const backgroundRescues = shouldContinueInBackground
    ? [...state.backgroundRescues, {
        id: `rescue-${state.callInstanceId}`,
        callInstanceId: state.callInstanceId,
        callId: call.id,
        scenarioTitle: call.title,
        vehicleId: state.rescue.vehicleId!,
        dispatchRecord,
        patientStatus: { ...state.patientStatus! },
        guidanceResults: [...state.guidanceResults],
        guidanceMinigameScores: [...state.guidanceMinigameScores],
        guidanceRequiredTotal: call.guidance?.steps.length ?? 0,
        perks: [...state.perks],
        outcome: null,
        successScore: null,
        failureReason: null,
      }]
    : state.backgroundRescues

  // 通话结束后清空全部「本通」瞬时状态：
  // 通话实录（dialogueLog）与调度登记表（terminal）不再残留到下一通。
  return {
    ...state,
    difficulty,
    callIndex: nextCallIndex,
    callPhase: 'completed',
    currentCall: null,
    callerState: null,
    fleet: newFleet,
    dispatchSent: false,
    dispatchRecord: null,
    ambulanceRemaining: -1,
    terminal: createTerminalState(),
    dialogueLog: [],
    pendingJudgments: [],
    patientStatus: null,
    patientEvents: [],
    rescue: { phase: 'idle', vehicleId: null, vehicleName: null, etaTotal: 0, arrivalShiftTime: null, outcome: null, successScore: null, failureReason: null },
    handoff: { attempts: 0, selectedFactIds: [], firstAttemptCorrect: null, feedback: [], completed: false },
    rerouteOptions: [],
    pendingReroute: null,
    rerouteUsed: false,
    guidanceActive: false,
    guidanceStepIndex: 0,
    guidanceResults: [],
    guidanceMinigameScores: [],
    calmCount: 0,
    careChecks: {},
    questionCost: 0,
    triggeredEventIds: [],
    actionEndsAt: state.shiftElapsed,
    totalScore: state.totalScore + total,
    callScores: nextCallScores,
    screen: 'playing',
    shiftCompletePending: isShiftOver,
    lastDebrief,
    pendingPerkChoices: isShiftOver ? [] : (perkChoices ?? getPerkChoices(state.perks, 3)),
    backgroundRescues,
  }
}
