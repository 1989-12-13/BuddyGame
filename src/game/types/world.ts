// ============================================================
// 零点接线台 — 世界状态 / 调度 / 救援 / 对话 / 结算 类型
// ============================================================

import type { FleetState } from '../core/fleet'
import type { TriageLevel } from './mpds'
import type { EmergencyScenario, CallPhase, JudgmentPrompt, InfoQuality } from './scenario'
import type { CallerState } from './caller'

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
}

// -------------------- 患者生命体征（实时反馈层） --------------------
export type VitalSign = 'stable' | 'warning' | 'critical' | 'arrest'

export interface PatientStatus {
  stability: number           // 0-100，生命条；到 0 = 患者死亡
  vitalSign: VitalSign        // 由 stability 派生
  decayRate: number           // 每秒衰减量（按病种严重度）
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

// -------------------- 游戏全局状态 --------------------
export type GameScreen = 'title' | 'briefing' | 'playing' | 'ending'

export interface WorldState {
  screen: GameScreen

  // 班次
  shiftNumber: number
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

  // 历史通话快照（点击地图救护车查看历史通话）
  callHistory: CallHistoryEntry[]

  // 结算
  endingId: string | null
  lastDebrief: import('../core/debrief').DebriefEntry | null
  pendingPerkChoices: import('../core/perks').RoguePerkId[]
  perks: import('../core/perks').RoguePerkId[]
  shiftCompletePending: boolean
}

/** 归档的通话 — 玩家点击地图救护车时查看该任务的完整对话 + 救援结果 */
export interface CallHistoryEntry {
  callId: string
  scenarioTitle: string
  /** 调度摘要（首句主诉 / 地点 / 分诊）— 用于地图标识 */
  shortSummary: string
  phoneNumber: string
  baseStation: string
  /** 揭示的最终地址（玩家提取） */
  addressResolved: string
  startShiftTime: number
  endShiftTime: number
  dispatchTime: number | null
  triage: TriageLevel | null
  vehicleName: string | null
  isPrank: boolean
  /** 救援结局 — 'pending' 表示救护车仍在 background 跑 */
  outcome: 'success' | 'failed' | 'pending' | 'no_dispatch'
  /** 单通电话得分（rescue 仍 pending 时为 null） */
  score: number | null
  /** 该通话完整对话流（END_CALL 时快照） */
  dialogueLog: DialogueLine[]
}

export interface DialogueLine {
  speaker: 'caller' | 'operator' | 'system'
  text: string
  timestamp: number           // shiftElapsed 时间戳
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
