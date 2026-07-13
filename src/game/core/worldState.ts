// ============================================================
// 零点接线台 — WorldState 工厂函数
// ============================================================

import type { WorldState, CallerState, TerminalState, TriageLevel, CallerId, PatientStatus, VitalSign } from '../types'
import { stressToLevel } from '../types'
import { SCENARIO_IDS } from '../events/templates'
import { createDefaultFleet } from './fleet'

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

/** 打乱数组（Fisher-Yates） */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 获取本班次的场景队列（随机打乱顺序） */
export function buildScenarioQueue(): string[] {
  // 每个班次5通电话，从所有场景中随机选5个
  const prankId = 'prank_call'
  // 分离恶作剧场景和普通场景
  const normalScenarios = SCENARIO_IDS.filter(id => id !== prankId)
  const shuffled = shuffle(normalScenarios)
  // 选4个普通场景 + 20%概率加入恶作剧
  const selected = shuffled.slice(0, 5)
  if (selected.length >= 5 && Math.random() < 0.2) {
    selected[Math.floor(Math.random() * selected.length)] = prankId
  }
  // 确保恶作剧不出现为首通或末通
  if (selected[0] === prankId || selected[selected.length - 1] === prankId) {
    const swapIdx = Math.random() < 0.5 ? 1 : selected.length - 2
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
    totalScore: 0,
    callScores: [],
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

/** 偏宽容的难度曲线：red 患者每秒 -0.8（仍有 60+ 秒缓冲），green 几乎不掉血 */
const SEVERITY_CONFIG: Record<TriageLevel, SeverityConfig> = {
  red:    { decayRate: 0.8, initialStability: 60, baseRescue: 0.45 },
  yellow: { decayRate: 0.4, initialStability: 75, baseRescue: 0.70 },
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
  if (s >= 70) return 'stable'
  if (s >= 40) return 'warning'
  if (s >= 15) return 'critical'
  return 'arrest'
}

export function vitalSignLabel(v: VitalSign): string {
  return v === 'stable' ? '稳定' : v === 'warning' ? '危重' : v === 'critical' ? '危急' : '心搏骤停'
}

export function vitalSignColor(v: VitalSign): string {
  return v === 'stable' ? '#16a34a' : v === 'warning' ? '#f59e0b' : v === 'critical' ? '#ef4444' : '#7f1d1d'
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
 * 受派车速度和地址完整度影响
 */
export function calcAmbulanceETA(
  dispatchTime: number,
  addressCompleteness: 'vague' | 'partial' | 'full',
): number {
  // 基础ETA（游戏压缩后的时间）
  let eta = 8

  // 派车越快，ETA越短
  if (dispatchTime <= 27) {
    eta -= 2
  } else if (dispatchTime <= 43) {
    eta -= 1
  } else if (dispatchTime > 60) {
    eta += 2
  }

  // 地址越完整，ETA越短
  if (addressCompleteness === 'vague') {
    eta += 3
  } else if (addressCompleteness === 'partial') {
    eta += 1
  }
  // full: no penalty

  return Math.max(3, eta)
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
    if (netTime <= 27) speed = 35
    else if (netTime <= 43) speed = 30
    else if (netTime <= 60) speed = 20
    else if (netTime <= 90) speed = 10
    else speed = 5
  }

  // 2. 四要素信息分（0-30） + 信息质量加分
  let info = 0
  if (addressCompleteness === 'full') info += 10
  else if (addressCompleteness === 'partial') info += 6
  else if (addressCompleteness === 'vague') info += 3
  if (hasContact) info += 5
  if (hasCondition) info += 10
  if (hasPurpose) info += 5

  // 信息质量加分（最多+5）
  info = Math.min(30, info + infoQualityBonus)

  // 3. 分诊准确度分（0-20）
  let triage = 0
  if (triageDecision === correctTriage) {
    triage = 20
  } else if (triageDecision && correctTriage) {
    const order = ['red', 'yellow', 'green', 'black'] as const
    const diff = Math.abs(order.indexOf(triageDecision) - order.indexOf(correctTriage))
    if (diff === 1) triage = 10
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
    guidance = Math.round(combined * 10)
  }

  const total = speed + info + triage + decision + guidance
  return { speed, info, triage, decision, guidance, total }
}
