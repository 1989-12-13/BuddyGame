// ============================================================
// 零点接线台 — WorldState 工厂函数
// ============================================================

import type { WorldState, CallerState, TerminalState, TriageLevel, CallerId, PatientStatus, VitalSign } from '../types'
import { stressToLevel } from '../types'
import { SCENARIO_IDS } from '../events/templates'
import { createDefaultFleet } from './fleet'
import { rng, rngInt, shuffle as shuffleArray } from './random'
import { VITAL_SIGN_COLORS } from './colors'
import {
  VITAL_STABLE_THRESHOLD,
  VITAL_WARNING_THRESHOLD,
  VITAL_CRITICAL_THRESHOLD,
  DISPATCH_GOLD_TIME,
  DISPATCH_SILVER_TIME,
  DISPATCH_BRONZE_TIME,
  DISPATCH_COPPER_TIME,
  SPEED_SCORE_PERFECT,
  SPEED_SCORE_GOOD,
  SPEED_SCORE_BRONZE,
  SPEED_SCORE_COPPER,
  SPEED_SCORE_BAD,
  TRIAGE_PERFECT_SCORE,
  TRIAGE_OFFBY1_SCORE,
  ADDRESS_FULL_SCORE,
  ADDRESS_PARTIAL_SCORE,
  ADDRESS_VAGUE_SCORE,
  CONTACT_SCORE,
  COMPLAINT_SCORE,
  PURPOSE_SCORE,
  GUIDANCE_MAX_SCORE,
} from './constants'

/** 创建空白的来电者追踪状态 */
export function createCallerState(callerId: CallerId, initialStress = 40): CallerState {
  return {
    id: callerId,
    cooperation: 80,
    stress: initialStress,
    stressLevel: stressToLevel(initialStress),
    revealedInfo: {
      address: 'none',
      contact: false,
      chiefComplaint: false,
      age: false,
      gender: false,
      consciousness: false,
      breathing: false,
      additional: [],
      purpose: false,
    },
    infoQuality: {},
    askedMPDS: [],
    questionCount: 0,
  }
}

/** 创建空白的终端状态 */
export function createTerminalState(): TerminalState {
  return {
    address: '',
    contact: '',
    chiefComplaint: '',
    patientAge: '',
    patientGender: '',
    conscious: null,
    breathing: null,
    protocolNumber: null,
    determinant: null,
    determinantSubcode: null,
    hotCold: null,
    triage: null,
    conditionNote: '',
  }
}



/** 获取本班次的场景队列（随机打乱顺序） */
export function buildScenarioQueue(): string[] {
  // 每个班次5通电话，从所有场景中随机选5个
  const prankId = 'prank_call'
  // 分离恶作剧场景和普通场景
  const normalScenarios = SCENARIO_IDS.filter(id => id !== prankId)
  const shuffled = shuffleArray(normalScenarios)
  // 选4个普通场景 + 20%概率加入恶作剧
  const selected = shuffled.slice(0, 5)
  if (selected.length >= 5 && rng() < 0.2) {
    selected[rngInt(selected.length)] = prankId
  }
  // 确保恶作剧不出现为首通或末通
  if (selected[0] === prankId || selected[selected.length - 1] === prankId) {
    const swapIdx = rng() < 0.5 ? 1 : selected.length - 2
    const temp = selected[0]
    selected[0] = selected[swapIdx]
    selected[swapIdx] = temp
  }
  return selected
}

/** 创建初始世界状态 */
export function createInitialState(): WorldState {
  return {
    screen: 'title',
    shiftNumber: 0,
    callIndex: 0,
    totalCalls: 5,
    scenarioQueue: [],
    shiftElapsed: 0,
    questionCost: 0,
    fleet: createDefaultFleet(),
    currentCall: null,
    callPhase: 'ringing',
    callStartTime: 0,
    callerState: null,
    patientStatus: null,
    patientEvents: [],
    rescue: { phase: 'idle', vehicleId: null, vehicleName: null, etaTotal: 0, arrivalShiftTime: null, outcome: null, successScore: null, failureReason: null },
    terminal: createTerminalState(),
    dispatchSent: false,
    dispatchRecord: null,
    ambulanceRemaining: -1,
    guidanceActive: false,
    guidanceStepIndex: 0,
    guidanceResults: [],
    guidanceMinigameScores: [],
    dialogueLog: [],
    pendingJudgments: [],
    eventSeq: 0,
    totalScore: 0,
    callScores: [],
    callHistory: [],
    endingId: null,
    lastDebrief: null,
    pendingPerkChoices: [],
    perks: [],
    shiftCompletePending: false,
  }
}

// ============================================================
// 患者生命体征 — 按分诊严重度配置 decayRate 与起始 stability
// ============================================================

interface SeverityConfig { decayRate: number; initialStability: number; baseRescue: number }

/** 宽松难度曲线：red 患者每秒 -0.5（约 2.5 分钟缓冲），提供充足容错空间 */
const SEVERITY_CONFIG: Record<TriageLevel, SeverityConfig> = {
  red:    { decayRate: 0.5, initialStability: 75, baseRescue: 0.45 },
  yellow: { decayRate: 0.3, initialStability: 80, baseRescue: 0.70 },
  green:  { decayRate: 0.1, initialStability: 90, baseRescue: 0.95 },
  black:  { decayRate: 1.5, initialStability: 30, baseRescue: 0.10 },
}

/** 根据 correctTriage 创建 patientStatus */
export function createPatientStatus(triage: TriageLevel): PatientStatus {
  const cfg = SEVERITY_CONFIG[triage]
  return {
    stability: cfg.initialStability,
    initialStability: cfg.initialStability,
    vitalSign: stabilityToVitalSign(cfg.initialStability),
    decayRate: cfg.decayRate,
    died: false,
  }
}

/** stability → vitalSign 阈值映射 */
export function stabilityToVitalSign(s: number): VitalSign {
  if (s >= VITAL_STABLE_THRESHOLD) return 'stable'
  if (s >= VITAL_WARNING_THRESHOLD) return 'warning'
  if (s >= VITAL_CRITICAL_THRESHOLD) return 'critical'
  return 'arrest'
}

export function vitalSignLabel(v: VitalSign): string {
  return v === 'stable' ? '稳定' : v === 'warning' ? '危重' : v === 'critical' ? '危急' : '心搏骤停'
}

export function vitalSignColor(v: VitalSign): string {
  return VITAL_SIGN_COLORS[v]
}

/** 该 triage 的救治基线（暴露给 reducer） */
export function baseRescueRate(triage: TriageLevel): number {
  return SEVERITY_CONFIG[triage].baseRescue
}

// ============================================================
// 救治成功率（确定性，便于测试；P1 再加随机）
// ============================================================

export interface RescueInputs {
  base: number                       // 病种基线（来自 correctTriage）
  stability: number                  // 到达时生命条
  capability: number                 // 车的 capability 1-5
  dispatchTime: number | null        // 派车耗时（秒）
  triageDiff: number                 // 玩家分诊与正确分诊的档位差（0=对，1/2=错档）
  guidanceWrongCount: number         // 急救指导错答数
  miniGameAvg: number                // 小游戏平均分 0-1
}

/** 计算救治成功概率 0-1 */
export function calcRescueSuccessRate(inp: RescueInputs): number {
  let p = inp.base
  p += inp.stability / 200               // 生命条贡献最多 ±50
  p += (inp.capability - 3) * 0.04       // 车辆能力 ±8
  p += (inp.miniGameAvg - 0.5) * 0.1     // 小游戏 ±5
  if (inp.dispatchTime !== null) {
    if (inp.dispatchTime > 90) p -= 0.25
    else if (inp.dispatchTime > 60) p -= 0.15
  }
  if (inp.triageDiff === 1) p -= 0.1
  else if (inp.triageDiff >= 2) p -= 0.2
  p -= inp.guidanceWrongCount * 0.03
  return Math.max(0, Math.min(1, p))
}

/** 阈值法判定（P0 不用随机） */
export function judgeRescueSuccess(rate: number): boolean {
  return rate >= 0.5
}

/** 分诊档位差（用于救治惩罚） */
export function triageLevelDiff(a: TriageLevel | null, b: TriageLevel): number {
  if (a === null) return 2
  const order: TriageLevel[] = ['red', 'yellow', 'green', 'black']
  return Math.abs(order.indexOf(a) - order.indexOf(b))
}

// ============================================================
// 派车计时与ETA计算
// ============================================================

/**
 * 计算救护车预计到达时间（游戏秒数）
 * 目标区间 25-120 秒：让电话指导有施展空间，避免"还没指导完就到了"
 * 受派车速度、地址完整度、车辆 speed 影响
 */
export function calcAmbulanceETA(
  dispatchTime: number,
  addressCompleteness: 'vague' | 'partial' | 'full',
  vehicleSpeed = 1,
): number {
  let eta = 55

  // 派车越快，ETA 越短
  if (dispatchTime <= DISPATCH_GOLD_TIME) eta -= 15
  else if (dispatchTime <= DISPATCH_SILVER_TIME) eta -= 8
  else if (dispatchTime > DISPATCH_BRONZE_TIME) eta += 12

  // 地址越完整，ETA 越短
  if (addressCompleteness === 'full') eta -= 10
  else if (addressCompleteness === 'vague') eta += 15

  // 车辆速度（speed 1-3）：speed 3 快车减 14，speed 1 无加成
  eta -= (vehicleSpeed - 1) * 7

  return Math.max(25, Math.min(120, eta))
}

/** 现场救治时长（秒）— 按分诊严重度，red 最久 */
export function calcOnSceneDuration(triage: TriageLevel): number {
  const cfg = SEVERITY_CONFIG[triage]
  // 越严重现场救治越久：red ~20s, yellow ~15s, green ~8s, black ~10s
  return Math.round(20 - (cfg.decayRate < 0.3 ? 12 : cfg.decayRate < 0.6 ? 5 : 0))
}

// ============================================================
// 单通电话评分
// ============================================================

export interface CallScore {
  speed: number       // 派车速度分（0-35）
  info: number        // 四要素完整度分（0-30）
  triage: number      // 分诊准确度分（0-20）
  decision: number    // 协议/判定码正确度分（0-5）
  guidance: number    // 急救指导分（0-10）
  total: number
}

export function scoreCall(
  dispatchTime: number | null,
  addressCompleteness: 'vague' | 'partial' | 'full',
  hasContact: boolean,
  hasCondition: boolean,
  hasPurpose: boolean,
  triageDecision: TriageLevel | null,
  correctTriage: TriageLevel,
  guidanceCorrect: number,
  guidanceTotal: number,
  miniGameAvg = 0,
  infoQualityBonus = 0,
  // 协议/判定码参数
  chosenProtocol: number | null = null,
  correctProtocol = 0,
  chosenDeterminant: string | null = null,
  correctDeterminant = '',
  chosenSubcode: number | null = null,
): CallScore {
  // 1. 派车速度分（0-35）— 自然时间流逝，不扣除问询耗时
  const netTime = dispatchTime
  let speed = 0
  if (netTime !== null) {
    if (netTime <= DISPATCH_GOLD_TIME) speed = SPEED_SCORE_PERFECT
    else if (netTime <= DISPATCH_SILVER_TIME) speed = SPEED_SCORE_GOOD
    else if (netTime <= DISPATCH_BRONZE_TIME) speed = SPEED_SCORE_BRONZE
    else if (netTime <= DISPATCH_COPPER_TIME) speed = SPEED_SCORE_COPPER
    else speed = SPEED_SCORE_BAD
  }

  // 2. 四要素信息分（0-30） + 信息质量加分
  let info = 0
  if (addressCompleteness === 'full') info += ADDRESS_FULL_SCORE
  else if (addressCompleteness === 'partial') info += ADDRESS_PARTIAL_SCORE
  else if (addressCompleteness === 'vague') info += ADDRESS_VAGUE_SCORE
  if (hasContact) info += CONTACT_SCORE
  if (hasCondition) info += COMPLAINT_SCORE
  if (hasPurpose) info += PURPOSE_SCORE

  // 信息质量加分（最多+5）
  info = Math.min(30, info + infoQualityBonus)

  // 3. 分诊准确度分（0-20）
  let triage = 0
  if (triageDecision === correctTriage) {
    triage = TRIAGE_PERFECT_SCORE
  } else if (triageDecision && correctTriage) {
    const order = ['red', 'yellow', 'green', 'black'] as const
    const diff = Math.abs(order.indexOf(triageDecision) - order.indexOf(correctTriage))
    if (diff === 1) triage = TRIAGE_OFFBY1_SCORE
    else triage = 0
  }

  // 4. 协议/判定码正确度分（0-5）
  let decision = 0
  if (chosenProtocol && chosenProtocol === correctProtocol) decision += 2
  if (chosenDeterminant && correctDeterminant) {
    const parts = correctDeterminant.split('-')
    const correctLetter = parts[1] ?? ''
    const correctSub = parts[2] ? parseInt(parts[2], 10) : 0
    if (chosenDeterminant[0] === correctLetter) decision += 2
    if (chosenSubcode && correctSub && chosenSubcode === correctSub) decision += 1
    if (!chosenProtocol && !chosenSubcode && chosenDeterminant[0] === correctLetter) decision = 5
  }
  decision = Math.min(5, decision)

  // 5. 急救指导分（0-10）— 选择题与互动小游戏各占一半
  let guidance = 0
  if (guidanceTotal > 0 || miniGameAvg > 0) {
    const choiceFrac = guidanceTotal > 0 ? guidanceCorrect / guidanceTotal : 0
    let combined: number
    if (guidanceTotal > 0 && miniGameAvg > 0) combined = choiceFrac * 0.5 + miniGameAvg * 0.5
    else if (miniGameAvg > 0) combined = miniGameAvg
    else combined = choiceFrac
    guidance = Math.round(combined * GUIDANCE_MAX_SCORE)
  }

  const total = speed + info + triage + decision + guidance
  return { speed, info, triage, decision, guidance, total }
}
