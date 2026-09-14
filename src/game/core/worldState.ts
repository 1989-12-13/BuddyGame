// ============================================================
// 120调度台 — WorldState 工厂函数
// ============================================================

import type { WorldState, CallerState, TerminalState, TriageLevel, CallerId, PatientStatus, VitalSign } from '../types'
import { stressToLevel } from '../types'
import { SCENARIOS, SCENARIO_IDS } from '../events/templates'
import { createDefaultFleet } from './fleet'
import { rng, rngInt } from './random'
import { VITAL_SIGN_COLORS } from './colors'
import { emptyAttitudeEvidence } from './evaluation'
import {
  VITAL_STABLE_THRESHOLD,
  VITAL_WARNING_THRESHOLD,
  VITAL_CRITICAL_THRESHOLD,
  DISPATCH_GOLD_TIME,
  DISPATCH_SILVER_TIME,
  DISPATCH_BRONZE_TIME,
  DISPATCH_COPPER_TIME,
  DIFFICULTY_INITIAL,
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
    questionAttempts: {},
    questionQuality: {},
    questionStress: {},
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
/**
 * 场景抽取：轮盘赌按档位概率抽卡。
 * progress 0→1 为班次进度（按已完成通数计），yellow/red 概率随进度升高：
 * green 0.45→0.05，yellow 恒 0.35，red 0.18→0.55，black 0.02→0.05（全程权重和为 1）。
 */
export function triageTierWeights(progress: number): Record<TriageLevel, number> {
  const t = Math.max(0, Math.min(1, progress))
  return {
    green: 0.45 - 0.40 * t,
    yellow: 0.35,
    red: 0.18 + 0.37 * t,
    black: 0.02 + 0.03 * t,
  }
}

/** 按档位权重从候选中抽一个（同档位内均匀）；候选缺失的档位权重自动归入其余档位 */
export function pickScenarioWeighted(ids: string[], progress: number): string | null {
  if (ids.length === 0) return null
  const weights = triageTierWeights(progress)
  const byTier = new Map<TriageLevel, string[]>()
  for (const id of ids) {
    const tier = SCENARIOS[id]?.correctTriage
    if (!tier) continue
    const bucket = byTier.get(tier)
    if (bucket) bucket.push(id)
    else byTier.set(tier, [id])
  }
  const entries = [...byTier.entries()]
  const totalWeight = entries.reduce((sum, [tier]) => sum + weights[tier], 0)
  let roll = rng() * totalWeight
  let chosen = entries[entries.length - 1][1]
  for (const [tier, tierIds] of entries) {
    roll -= weights[tier]
    if (roll <= 0) {
      chosen = tierIds
      break
    }
  }
  return chosen[rngInt(chosen.length)]
}



/**
 * 从场景池随机抽 count 个不重复场景（通数由调用方给定，没有默认值）。
 *
 * 并发值班不用它——班次长度由热度模型决定，场景从牌堆逐张抽取、发完自动重洗
 * （见 `core/shift.ts#drawScenario`）。
 * @param count 抽取数量，上限为可用场景数。
 */
export function buildScenarioQueue(count: number): string[] {
  // 从所有场景中随机抽取 count 个
  const prankId = 'prank_call'
  // 分离恶作剧场景和普通场景（恶作剧只按概率插入，不参与基础池）
  const normalScenarios = SCENARIO_IDS.filter(id => id !== prankId)
  // 轮盘赌逐通抽取：进度 = i/count，前期 green 为主，后期向 yellow/red 倾斜
  const length = Math.min(Math.max(0, count), normalScenarios.length)
  const pool = [...normalScenarios]
  const selected: string[] = []
  for (let i = 0; i < length; i++) {
    const picked = pickScenarioWeighted(pool, length > 1 ? i / (length - 1) : 0)
    if (!picked) break
    selected.push(picked)
    pool.splice(pool.indexOf(picked), 1)
  }
  if (selected.length > 0 && rng() < 0.2) {
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
    pauseReasons: [],
    callInstanceId: 0,
    actionEndsAt: 0,
    calmCount: 0,
    triggeredEventIds: [],
    careChecks: {},
    activePlaySeconds: 0,
    streamedLines: 0,
    difficulty: DIFFICULTY_INITIAL,
    attitudeEvidence: emptyAttitudeEvidence(),
    shiftNumber: 0,
    callIndex: 0,
    totalCalls: 0,
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
    backgroundRescues: [],
    rescueNotifications: [],
    rerouteOptions: [],
    pendingReroute: null,
    rerouteUsed: false,
    handoff: { attempts: 0, selectedFactIds: [], firstAttemptCorrect: null, feedback: [], completed: false },
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
    vitalsPulse: null,
    eventSeq: 0,
    callEvaluations: [],
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

/** red 患者每秒 -0.5（基准难度下约 2.5 分钟缓冲），配合场景/难度系数构成实际压力 */
const SEVERITY_CONFIG: Record<TriageLevel, SeverityConfig> = {
  red:    { decayRate: 0.50, initialStability: 65, baseRescue: 0.50 },
  yellow: { decayRate: 0.35, initialStability: 75, baseRescue: 0.75 },
  green:  { decayRate: 0.20, initialStability: 85, baseRescue: 0.95 },
  black:  { decayRate: 1, initialStability: 35, baseRescue: 0.15 },
}

/** 根据 correctTriage 创建 patientStatus；difficulty 为跨通话自适应系数，scenarioMultiplier 为场景级差异系数，均乘入衰减速率 */
export function createPatientStatus(triage: TriageLevel, difficulty = 1, scenarioMultiplier = 1): PatientStatus {
  const cfg = SEVERITY_CONFIG[triage]
  return {
    stability: cfg.initialStability,
    initialStability: cfg.initialStability,
    vitalSign: stabilityToVitalSign(cfg.initialStability),
    decayRate: cfg.decayRate * difficulty * scenarioMultiplier,
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
  dispatchTime: number | null        // 派车耗时（秒）
  triageDiff: number                 // 玩家分诊与正确分诊的档位差（0=对，1/2=错档）
  guidanceWrongCount: number         // 急救指导错答数
  miniGameAvg: number                // 小游戏平均分 0-1
  guidanceCompletionRatio?: number  // 必做指导完成率 0-1；缺省视为完整
}

/** 计算救治成功概率 0-1 */
export function calcRescueSuccessRate(inp: RescueInputs): number {
  let p = inp.base
  p += inp.stability / 200               // 生命条贡献最多 ±50
  p += (inp.miniGameAvg - 0.5) * 0.1     // 小游戏 ±5
  p -= (1 - Math.max(0, Math.min(1, inp.guidanceCompletionRatio ?? 1))) * 0.12
  if (inp.dispatchTime !== null) {
    if (inp.dispatchTime > DISPATCH_COPPER_TIME) p -= 0.25
    else if (inp.dispatchTime > DISPATCH_BRONZE_TIME) p -= 0.15
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
 * 受派车速度、地址完整度影响
 */
export function calcAmbulanceETA(
  dispatchTime: number,
  addressCompleteness: 'vague' | 'partial' | 'full',
): number {
  let eta = 50

  // 派车越快，ETA 越短
  if (dispatchTime <= DISPATCH_GOLD_TIME) eta -= 15
  else if (dispatchTime <= DISPATCH_SILVER_TIME) eta -= 8
  else if (dispatchTime > DISPATCH_BRONZE_TIME) eta += 12

  // 地址越完整，ETA 越短
  if (addressCompleteness === 'full') eta -= 12
  else if (addressCompleteness === 'vague') eta += 10


  return Math.max(20, Math.min(100, eta))
}

/** 现场救治时长（秒）— 按分诊严重度，red 最久 */
export function calcOnSceneDuration(triage: TriageLevel): number {
  const cfg = SEVERITY_CONFIG[triage]
  // 越严重现场救治越久：red ~20s, yellow ~15s, green ~8s, black ~10s
  return Math.round(20 - (cfg.decayRate < 0.3 ? 12 : cfg.decayRate < 0.6 ? 5 : 0))
}
