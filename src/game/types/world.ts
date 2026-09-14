// ============================================================
// 120调度台 — 世界状态 / 调度 / 救援 / 对话 / 结算 类型
// ============================================================

import type { FleetState } from '../core/fleet'
import type { TriageLevel } from './mpds'
import type { EmergencyScenario, CallPhase, JudgmentPrompt } from './scenario'
import type { CallerState } from './caller'
import type { RouteStrategy, RoutePlan } from '../core/routing'

// -------------------- 调度记录 --------------------
export interface DispatchRecord {
  callId: string
  dispatchTime: number       // 接通后多少秒派车
  triage: TriageLevel
  /** 场景期望的正确分诊（用于救援 outcome 跨通话判定） */
  correctTriage: TriageLevel
  addressCompleteness: 'vague' | 'partial' | 'full'
  ambulanceETA: number       // 预计到达时间（游戏内秒数）
  /** 派车时刻的 shiftElapsed（用于背景车 ETA 渲染） */
  dispatchedAt: number
  /** 是否恶作剧（用于救援 outcome 跳过判定） */
  isPrank: boolean
  /** 具体路径 ID；同一种策略可包含多条不同节点组合。 */
  routeId?: string
  routeStrategy?: RouteStrategy
  routeRisk?: 'low' | 'medium' | 'high'
}

// -------------------- 患者生命体征（实时反馈层） --------------------
export type VitalSign = 'stable' | 'warning' | 'critical' | 'arrest'

export interface PatientStatus {
  stability: number           // 0-100，生命条；到 0 = 患者死亡
  vitalSign: VitalSign        // 由 stability 派生
  decayRate: number           // 每秒衰减量（按病种严重度 × 自适应难度 × 场景差异）
  initialStability: number    // 起始值（结算时参考）
  died: boolean               // 是否已经死亡（到达时结算或 stability 触底）
}

/** 即时反馈事件 — 顶部 toast */
export interface PatientEvent {
  id: string
  kind: 'warn' | 'bad' | 'good' | 'info'
  text: string
  createdAt: number           // shiftElapsed 时间戳
}

// -------------------- 救援闭环（派车后→到达→救治） --------------------
export type RescuePhase = 'idle' | 'enroute' | 'arrived' | 'success' | 'failed'

export interface RescueState {
  phase: RescuePhase
  vehicleId: string | null           // 派出的车
  vehicleName: string | null
  etaTotal: number                   // 派车时的总 ETA（游戏秒）
  arrivalShiftTime: number | null    // 到达时刻的 shiftElapsed
  outcome: 'success' | 'failed' | null
  successScore: number | null        // 0-1 救治成功概率（确定性计算结果）
  failureReason: string | null
}

/** 已结束通话仍在执行的院前任务。车辆与患者在世界时钟上继续推进。 */
export interface BackgroundRescue {
  id: string
  callInstanceId: number
  callId: string
  scenarioTitle: string
  vehicleId: string
  dispatchRecord: DispatchRecord
  patientStatus: PatientStatus
  guidanceResults: ('correct' | 'incorrect' | null)[]
  guidanceMinigameScores: (number | null)[]
  guidanceRequiredTotal: number
  perks: import('../core/perks').RoguePerkId[]
  outcome: 'success' | 'failed' | null
  successScore: number | null
  failureReason: string | null
}

export interface RescueNotification {
  id: string
  callInstanceId: number
  kind: 'good' | 'bad'
  text: string
}

export interface ReroutePrompt {
  callInstanceId: number
  message: string
  currentRouteId: string
  options: RoutePlan[]
}

export interface HandoffState {
  attempts: number
  selectedFactIds: string[]
  firstAttemptCorrect: boolean | null
  feedback: string[]
  completed: boolean
}

// -------------------- 游戏全局状态 --------------------
export type GameScreen = 'title' | 'briefing' | 'playing' | 'ending'

export interface WorldState {
  screen: GameScreen
  pauseReasons: import('../core/session').PauseReason[]
  callInstanceId: number
  actionEndsAt: number
  calmCount: number
  triggeredEventIds: string[]
  careChecks: Record<string, number>
  activePlaySeconds: number
  /**
   * 字幕已完整流式播出的行数（最后播完那行的索引 + 1）。
   * 并发值班切线路会让工作台整块重挂载，进度存在通话自己的状态里才能续上，
   * 切回来时历史对话直接完整呈现、只补播离开期间的新行。
   */
  streamedLines: number

  // 班次
  shiftNumber: number
  /**
   * 自适应难度系数（≥1 个班次内跨通话累计）：
   * 乘入体征衰减速率，首局 <1 较慢；通关结束按体征条剩余比例调整。
   */
  difficulty: number
  callIndex: number           // 当前是第几通（0-based）
  totalCalls: number          // 本班次总电话数
  scenarioQueue: string[]     // 本班次的场景id队列

  // 全局计时（秒）
  shiftElapsed: number
  questionCost: number

  // 车队
  fleet: FleetState

  // 当前通话
  currentCall: EmergencyScenario | null
  callPhase: CallPhase
  callStartTime: number       // 接通时的shiftElapsed
  callerState: CallerState | null

  // 患者生命体征（实时反馈）
  patientStatus: PatientStatus | null
  patientEvents: PatientEvent[]   // 顶部 toast 事件队列
  rescue: RescueState             // 救护车救援闭环
  backgroundRescues: BackgroundRescue[]
  rescueNotifications: RescueNotification[]
  rerouteOptions: RoutePlan[]
  pendingReroute: ReroutePrompt | null
  rerouteUsed: boolean
  handoff: HandoffState

  // 终端（计算机登记）
  terminal: import('./mpds').TerminalState

  // 派车
  dispatchSent: boolean
  dispatchRecord: DispatchRecord | null
  ambulanceRemaining: number  // 救护车还需多少秒到达（-1表示未派车/已到）

  // 急救指导
  guidanceActive: boolean
  guidanceStepIndex: number
  guidanceResults: ('correct' | 'incorrect' | null)[]
  guidanceMinigameScores: (number | null)[]  // 小游戏步骤得分（与 guidanceResults 平行）

  // 对话历史
  dialogueLog: DialogueLine[]

  // 确定性事件序列号（用于生成可复现的事件 ID）
  eventSeq: number

  // 临床判断
  pendingJudgments: JudgmentPrompt[]   // 等待玩家做出判断的选择题

  // 累计得分
  totalScore: number
  callScores: number[]        // 每通电话的得分

  // 结算
  endingId: string | null
  lastDebrief: import('../core/debrief').DebriefEntry | null
  pendingPerkChoices: import('../core/perks').RoguePerkId[]
  perks: import('../core/perks').RoguePerkId[]
  shiftCompletePending: boolean
}

export interface DialogueLine {
  speaker: 'caller' | 'operator' | 'system'
  text: string
  timestamp: number           // shiftElapsed 时间戳
  /** 情绪标签——赋能 galgame 式回合节拍与情绪可视化（可选） */
  emotion?: 'calm' | 'anxious' | 'panicked' | 'broken'
}

// -------------------- 结局 --------------------
export interface EndingDef {
  id: string
  title: string
  subtitle: string
  description: string
  minScore: number
  badge: string              // 奖章名称
}
