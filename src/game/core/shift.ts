// ============================================================
// 120调度台 — 班次协调器（并发多线值班）
// ============================================================
// 设计基线：docs/并发值班玩法设计方案.md
//
// 架构选择「组合」而非「拆分」：
// 每条电话线路持有一个自包含的 WorldState，由现有 worldReducer 驱动，
// 因此现有 reducer / 单通测试完全不受影响。班次层只负责：
//   1. 共享时钟与暂停
//   2. 来电到达与响铃超时
//   3. 线路聚焦（玩家一次只处理一条线）
//   4. 车辆资源约束（跨线路共享，不再每通一车）
//   5. 线路生命周期（idle → ringing → active → done）
// ============================================================

import type { CallEvaluation, ShiftEvaluation, WorldState } from '../types'
import { stressToLevel } from '../types'
import type { GameAction } from './actions'
import type { PauseReason } from './session'
import { worldReducer } from './worldReducer'
import { createInitialState, pickScenarioWeighted } from './worldState'
import { buildConflictReport, buildVerificationCall, type ConflictReport } from './supplementCall'
import { SCENARIOS, SCENARIO_IDS, getScenario } from '../events/templates'
import { buildCallEvaluation, buildShiftEvaluation, gradeAtLeast, markCallEvaluationTransferred } from './evaluation'

export type LinePhase = 'idle' | 'ringing' | 'active' | 'done'

/** primary = 事故初报；supplement = 同一事故的第二位来电者（核实通话） */
export type LineRole = 'primary' | 'supplement'

/** 交叉核实的当前状态（仅 supplement 线路） */
export interface VerificationState {
  primaryLineId: string
  report: ConflictReport
  probed: boolean
  resolution: 'adopt' | 'reject' | null
}

/**
 * 已完成的通话快照。
 * 必须跨线路累积：线路会被复用，复用时 START_SHIFT 会重置该线路的
 * callEvaluations / activePlaySeconds，直接读线路会丢掉前面的评价。
 */
export interface ShiftCompletedCall {
  lineId: string
  scenarioId: string
  evaluation: CallEvaluation
  activeSeconds: number
}

/** 一次事故：可能对应一条或两条线路 */
export interface ShiftIncident {
  id: string
  scenarioId: string
  primaryLineId: string
  supplementLineId: string | null
  /** 计划派出第二位来电者的时刻（班次时钟） */
  supplementAt: number
  resolved: boolean
  /**
   * 交叉核实的处置结果。
   * 必须记在事故上：承载它的线路会被释放复用，届时 line.verification 会被清空。
   */
  resolution: 'adopt' | 'reject' | null
}

export interface ShiftLine {
  id: string
  phase: LinePhase
  role: LineRole
  incidentId: string | null
  /** 仅 supplement 线路：交叉核实状态 */
  verification: VerificationState | null
  /** 本线分配到的场景 id（ringing / active 时有值） */
  scenarioId: string | null
  /** 响铃已持续秒数（仅 ringing 有意义） */
  ringingFor: number
  /** 占用的车辆槽位；已派车且救援未结算时有值 */
  vehicleId: string | null
  /** 该线路的通话运行时（复用现有世界状态机） */
  world: WorldState
}

export interface ShiftConfig {
  lineCount: number
  vehicleCount: number
  /** 班次总通数：默认 6 通，达到后立即交班并进入总结。 */
  targetCalls: number
  /** 响铃超时秒数：超时未接 → 记入未接来电并释放线路 */
  ringTimeout: number
  /**
   * 初始场景牌堆 —— 仅用于测试与确定性回放，缺省时运行时随机发牌。
   * 注意：牌堆不是「班次长度」。发完会自动重洗，班次由 targetCalls 截止。
   */
  deck?: string[]
}

/** 班次段落：开场 → 爬升 → 峰值 → 结束 */
export type ShiftMoment = 'opening' | 'rising' | 'peak' | 'ended'

/**
 * 收班方式。complete 是现行 6 通值班的正常结束；其余值保留用于旧记录兼容。
 * - perfect：撑过峰值段 → 交班
 * - collapse：患者死亡 / 连续漏接达阈值 → 被换下来
 * - fade：热度长期低迷 → 平静收班
 */
export type ShiftEnding = 'complete' | 'perfect' | 'collapse' | 'fade'

export interface ShiftState {
  clock: number
  config: ShiftConfig
  lines: ShiftLine[]
  /** 本班次发生过的事故（一次事故可能对应两条线路） */
  incidents: ShiftIncident[]
  /** 已完成的通话（跨线路累积，不随线路复用而丢失） */
  completed: ShiftCompletedCall[]
  focusedLineId: string | null
  /** 剩余场景牌堆；发完自动重洗。 */
  deck: string[]
  /** 到达冷却剩余秒数 */
  arrivalCooldown: number
  /** 未接来电（结算用） */
  missed: string[]
  /** 连续漏接次数；成功接听即清零 */
  missedStreak: number
  /** 已确认死亡的患者数 */
  deaths: number
  /** 当前热度 0–100：表现好则升、表现差则降，决定来电密度与并发上限 */
  heat: number
  /** 当前段落 */
  moment: ShiftMoment
  /** 峰值段已撑过的通话数 */
  peakSurvived: number
  /** 已收班的原因；非 null 表示不再产生新来电 */
  ending: ShiftEnding | null
  /** 班次级暂停原因（暂停时所有线路冻结） */
  pauseReasons: PauseReason[]
  /** 最近一次被拒绝的动作原因（用于 UI 反馈） */
  lastRejection: string | null
}

/** 默认班次配置：3 条线路 / 2 辆车 / 6 通电话。 */
export const DEFAULT_SHIFT_CONFIG: ShiftConfig = {
  lineCount: 3,
  vehicleCount: 2,
  ringTimeout: 22,
  targetCalls: 6,
}

// ============================================================
// 热度模型 —— 控制来电密度与并发强度
// ============================================================
// 班次长度由 targetCalls 固定为 6 通；热度决定每通之间的密度与并发上限。

/** 达到该热度即进入峰值段 */
export const HEAT_PEAK = 85
/** 峰值段需要撑过的通话数：撑过即圆满交班 */
export const PEAK_CALLS_TO_SURVIVE = 2
/** 热度地板：跌破它（且已处理过足够通话）→ 平静收班 */
export const HEAT_FLOOR = 12
/** 平静收班前至少处理过的通话数，避免开场就草草收班 */
export const FADE_MIN_CALLS = 3

/** 崩盘阈值：任一达成即被换下来 */
export const COLLAPSE_DEATHS = 1
export const COLLAPSE_MISSED_STREAK = 3

/** 来电间隔（秒）：热度越低越稀疏 —— 「上强度」的第一条腿：更密 */
const ARRIVAL_GAP_COLD = 7
const ARRIVAL_GAP_HOT = 1
/** 同时响铃的线路上限 —— 「上强度」的第二条腿：更多并发 */
const MAX_RINGING_COLD = 1
const MAX_RINGING_HOT = 3

/** 响铃后多少秒内接听算「迅速接听」 */
export const FAST_ANSWER_SECONDS = 8

/** 表现 → 热度 增量 */
export const HEAT_GAIN_FAST_ANSWER = 8
export const HEAT_GAIN_CALL_GOOD = 16
export const HEAT_GAIN_CALL_OK = 6
export const HEAT_LOSS_CALL_POOR = -8
export const HEAT_LOSS_MISSED = -14
export const HEAT_LOSS_DEATH = -30
/** 没有任何在途任务时，热度自然回落（夜渐深） */
const HEAT_IDLE_DECAY = 0.1

function clampHeat(value: number): number {
  return Math.max(0, Math.min(100, value))
}

/** 热度 → 两次来电之间的最小间隔（秒） */
export function arrivalGapFor(heat: number): number {
  const t = clampHeat(heat) / 100
  return Math.round(ARRIVAL_GAP_COLD + (ARRIVAL_GAP_HOT - ARRIVAL_GAP_COLD) * t)
}

/** 热度 → 同时响铃的线路上限（并发强度） */
export function maxRingingFor(heat: number): number {
  const t = clampHeat(heat) / 100
  return Math.max(1, Math.round(MAX_RINGING_COLD + (MAX_RINGING_HOT - MAX_RINGING_COLD) * t))
}

/** 收班叙事（崩溃时是「被换下来」，不是冷冰冰的结算） */
export const ENDING_NARRATIVE: Record<ShiftEnding, string> = {
  complete: '六通电话处理完了。下一班调度员已经接上线路。你摘下耳机，屏幕开始整理这段时间留下的记录。',
  perfect: '最忙的那一段你顶住了。组长拍拍你的肩：接下来的交给下一班。',
  collapse: '组长把手按在你的肩膀上：「先下来，喝口水。」',
  fade: '后半夜的线路安静下来。你把登记表收好，等下一次响铃。',
}

/** 接听后多久可能引来第二位来电者（仍需已派车） */
export const SUPPLEMENT_DELAY = 25

function createLine(index: number): ShiftLine {
  return {
    id: `line-${index + 1}`,
    phase: 'idle',
    role: 'primary',
    incidentId: null,
    verification: null,
    scenarioId: null,
    ringingFor: 0,
    vehicleId: null,
    world: createInitialState(),
  }
}

export function createShiftState(config: ShiftConfig): ShiftState {
  return {
    clock: 0,
    config,
    lines: Array.from({ length: config.lineCount }, (_, i) => createLine(i)),
    incidents: [],
    completed: [],
    focusedLineId: null,
    deck: [...(config.deck ?? [])],
    arrivalCooldown: 0,
    missed: [],
    missedStreak: 0,
    deaths: 0,
    heat: 0,
    moment: 'opening',
    peakSurvived: 0,
    ending: null,
    pauseReasons: [],
    lastRejection: null,
  }
}

/**
 * 发一张牌：轮盘赌按档位概率抽卡，进度（已完成通数 / PROGRESS_HORIZON）
 * 越高 yellow/red 概率越大。抽中的牌从牌堆移除以避免连续重复，用尽即全池重洗。
 * 班次能接到多少通，由热度模型和玩家表现决定，而不是由牌堆长度决定。
 */
export function drawScenario(deck: string[], progress = 0): { scenarioId: string; deck: string[] } {
  const source = deck.length > 0 ? deck : [...SCENARIO_IDS]
  const scenarioId = pickScenarioWeighted(source, progress) ?? source[0]
  return { scenarioId, deck: source.filter(id => id !== scenarioId) }
}

// -------------------- 派生查询 --------------------

export function focusedLine(shift: ShiftState): ShiftLine | null {
  return shift.lines.find(line => line.id === shift.focusedLineId) ?? null
}

export function findLine(shift: ShiftState, lineId: string): ShiftLine | null {
  return shift.lines.find(line => line.id === lineId) ?? null
}

export function isShiftPaused(shift: ShiftState): boolean {
  return shift.pauseReasons.length > 0
}

/**
 * 该线路是否有等待玩家决策的在途事件。
 * 并发下这类事件最容易漏掉 —— 玩家正在处理别的线路时，
 * 这一条会在后台悄悄堆积，线路墙需要把它标出来。
 */
export function lineNeedsDecision(line: ShiftLine): boolean {
  // 途中改道已移除；目前唯一需要玩家回头处置的是「第二位来电者的信息冲突」
  return line.phase === 'active' && Boolean(line.verification && !line.verification.resolution)
}

/** 有多少条线路在等你决策 */
export function pendingDecisionCount(shift: ShiftState): number {
  return shift.lines.filter(lineNeedsDecision).length
}

/** 车辆是否外出未归：已派车，且救援（通话中或后台）尚未结算 */
export function isVehicleOut(line: ShiftLine): boolean {
  if (!line.vehicleId) return false
  // 通话结束后救援会迁移到 backgroundRescues，且 rescue 被重置为 idle
  if (line.world.backgroundRescues.some(rescue => !rescue.outcome)) return true
  // 通话仍在进行中：以当前救援闭环为准
  if (line.world.currentCall && !line.world.rescue.outcome) return true
  return false
}

/** 已被占用（在途）的车辆数 — 救援结算后释放 */
export function busyVehicleCount(shift: ShiftState): number {
  return shift.lines.filter(isVehicleOut).length
}

export function availableVehicleCount(shift: ShiftState): number {
  return Math.max(0, shift.config.vehicleCount - busyVehicleCount(shift))
}

/**
 * 班次是否收束。
 * 判据不再是「队列排空」，而是「热度模型已判定收班，且所有线路都安静下来」。
 */
export function isShiftComplete(shift: ShiftState): boolean {
  if (!shift.ending) return false
  return shift.lines.every(line => line.phase === 'idle' || line.phase === 'done')
}

export function ringingLines(shift: ShiftState): ShiftLine[] {
  return shift.lines.filter(line => line.phase === 'ringing')
}

export interface ShiftCallSummary {
  scenarioId: string
  title: string
  evaluation: CallEvaluation
}

export interface ShiftIncidentSummary {
  scenarioId: string
  title: string
  /** 第二位来电者的处置结果；null = 没有等到第二通 */
  resolution: 'adopt' | 'reject' | null
}

export type ShiftSummary = ShiftEvaluation

function scenarioTitle(id: string): string {
  return SCENARIOS[id]?.title ?? id
}

/** 班次收束后的汇总，直接喂给既有的 EndingScreen */
export function summarizeShift(shift: ShiftState): ShiftSummary {
  const calls: ShiftCallSummary[] = shift.completed.map(call => ({
    scenarioId: call.scenarioId,
    title: scenarioTitle(call.scenarioId),
    evaluation: call.evaluation,
  }))
  const missed = shift.missed.map(id => ({
    scenarioId: id,
    title: scenarioTitle(id),
  }))
  const incidents: ShiftIncidentSummary[] = shift.incidents.map(incident => ({
    scenarioId: incident.scenarioId,
    title: scenarioTitle(incident.scenarioId),
    resolution: incident.resolution,
  }))

  const reviewed = incidents.filter(incident => incident.resolution !== null)
  const adopted = reviewed.filter(incident => incident.resolution === 'adopt').length
  const rejected = reviewed.filter(incident => incident.resolution === 'reject').length

  const parts: string[] = []
  if (calls.length > 0) parts.push(`接住 ${calls.length} 通`)
  if (missed.length > 0) parts.push(`漏接 ${missed.length} 通`)
  if (reviewed.length > 0) {
    parts.push(`${reviewed.length} 起事故收到第二位来电者，采纳最新观察 ${adopted} 次、维持初报 ${rejected} 次`)
  }

  const narrative = [
      shift.ending ? ENDING_NARRATIVE[shift.ending] : null,
      parts.length > 0 ? `你今晚${parts.join('，')}。` : '这个班次没有留下记录。',
    ].filter(Boolean).join(' ')
  return buildShiftEvaluation(calls.map(call => call.evaluation), {
    missedCalls: missed,
    activeSeconds: shift.completed.reduce((sum, call) => sum + call.activeSeconds, 0),
    endingNarrative: shift.ending ? ENDING_NARRATIVE[shift.ending] : null,
    narrative,
    incidents,
  })
}

// -------------------- 线路操作 --------------------

export function focusLine(shift: ShiftState, lineId: string): ShiftState {
  const line = findLine(shift, lineId)
  if (!line || line.phase === 'idle') return shift
  return { ...shift, focusedLineId: lineId, lastRejection: null }
}

/** 接听某条响铃线路：把该线场景装载进它自己的 WorldState 并接听 */
export function answerLine(shift: ShiftState, lineId: string): ShiftState {
  const line = findLine(shift, lineId)
  if (!line || line.phase !== 'ringing' || !line.scenarioId) return shift

  const scenarioId = line.scenarioId
  let world = worldReducer(line.world, { type: 'START_SHIFT', forceScenarios: [scenarioId] })
  // 让线路内时钟与班次共享时钟对齐
  world = { ...world, shiftElapsed: shift.clock }

  // 第二位来电者：注入派生的核实场景（不拥有患者、不派车）
  const incident = line.incidentId ? shift.incidents.find(i => i.id === line.incidentId) ?? null : null
  const primaryScenario = incident
    ? findLine(shift, incident.primaryLineId)?.world.currentCall ?? null
    : null
  const verificationCall = line.role === 'supplement' && primaryScenario
    ? buildVerificationCall(primaryScenario)
    : null

  world = verificationCall
    ? worldReducer(world, { type: 'ANSWER_CALL', scenario: verificationCall })
    : worldReducer(world, { type: 'ANSWER_CALL' })
  if (!world.currentCall) return shift

  const verification: VerificationState | null = verificationCall && primaryScenario && incident
    ? { primaryLineId: incident.primaryLineId, report: buildConflictReport(primaryScenario), probed: false, resolution: null }
    : null

  // 初报接听即建立事故记录；第二位来电者安排在派车之后
  const startsIncident = line.role === 'primary'
  const newIncidentId = `incident-${line.id}-${shift.clock}`

  // 迅速接听 → 热度上升；接听本身也清掉「连续漏接」
  const fastAnswer = line.ringingFor <= FAST_ANSWER_SECONDS

  return {
    ...shift,
    focusedLineId: lineId,
    lastRejection: null,
    missedStreak: 0,
    heat: clampHeat(shift.heat + (fastAnswer ? HEAT_GAIN_FAST_ANSWER : 0)),
    incidents: startsIncident
      ? [...shift.incidents, {
          id: newIncidentId,
          scenarioId,
          primaryLineId: line.id,
          supplementLineId: null,
          supplementAt: shift.clock + SUPPLEMENT_DELAY,
          resolved: false,
          resolution: null,
        }]
      : shift.incidents,
    lines: shift.lines.map(l => (l.id === lineId
      ? {
          ...l,
          phase: 'active' as const,
          scenarioId,
          ringingFor: 0,
          world,
          verification,
          incidentId: l.incidentId ?? (startsIncident ? newIncidentId : null),
        }
      : l)),
  }
}

function replaceLine(shift: ShiftState, lineId: string, next: ShiftLine): ShiftState {
  return { ...shift, lines: shift.lines.map(l => (l.id === lineId ? next : l)) }
}

/** 交叉核实的三种处置 */
export type VerificationChoice = 'adopt' | 'reject' | 'probe'

/**
 * 处置第二位来电者带来的冲突信息。
 * - adopt：采纳最新观察，登记表以此为准
 * - reject：维持初报，标记为需现场复核
 * - probe：再追问一次（每通只允许一次），仍然无法确定就回到二选一
 */
export function resolveVerification(shift: ShiftState, lineId: string, choice: VerificationChoice): ShiftState {
  const line = findLine(shift, lineId)
  if (!line || !line.verification || line.verification.resolution) return shift

  const now = shift.clock
  const report = line.verification.report

  if (choice === 'probe' && !line.verification.probed) {
    const world: WorldState = {
      ...line.world,
      dialogueLog: [...line.world.dialogueLog,
        { speaker: 'operator', text: '你确定吗？请再仔细看一眼他胸口有没有起伏。', timestamp: now },
        { speaker: 'caller', text: '我又看了一遍……我确定，和前面说的不一样。你们快过来自己看吧！', timestamp: now },
      ],
    }
    return replaceLine(shift, lineId, {
      ...line,
      world,
      verification: { ...line.verification, probed: true },
    })
  }

  const resolution = choice === 'reject' ? 'reject' : 'adopt'
  const world: WorldState = {
    ...line.world,
    dialogueLog: [...line.world.dialogueLog,
      { speaker: 'operator', text: resolution === 'adopt' ? '好，我按你现在说的记下来。' : '我先按前面的记录处理，请在现场再确认一次。', timestamp: now },
      { speaker: 'system', text: resolution === 'adopt' ? '【已采纳第二位来电者的观察 · 登记表以最新观察为准】' : '【已维持初报 · 该冲突标记为需现场复核】', timestamp: now },
    ],
    terminal: {
      ...line.world.terminal,
      conditionNote: resolution === 'adopt'
        ? `交叉核实：呼吸描述采用「${report.supplement}」`
        : `交叉核实：维持初报「${report.primary}」，需现场复核`,
    },
  }

  return {
    ...replaceLine(shift, lineId, {
      ...line,
      phase: 'done',
      world,
      verification: { ...line.verification, resolution },
    }),
    incidents: shift.incidents.map(i => (i.id === line.incidentId
      ? { ...i, resolved: true, resolution }
      : i)),
  }
}

/**
 * 班次层动作路由：
 * - PAUSE / RESUME / FOCUS_LINE / ANSWER_LINE / HOLD_LINE 由班次层处理
 * - 其余动作路由到「聚焦线路」自己的 worldReducer
 */
export type ShiftAction =
  | GameAction
  | { type: 'FOCUS_LINE'; lineId: string }
  | { type: 'ANSWER_LINE'; lineId: string }
  | { type: 'HOLD_LINE' }
  | { type: 'RESOLVE_VERIFICATION'; lineId: string; choice: VerificationChoice }

export function shiftReducer(shift: ShiftState, action: ShiftAction): ShiftState {
  // 班次级暂停：冻结所有线路
  if (action.type === 'PAUSE') {
    return shift.pauseReasons.includes(action.reason)
      ? shift
      : { ...shift, pauseReasons: [...shift.pauseReasons, action.reason] }
  }
  if (action.type === 'RESUME') {
    return {
      ...shift,
      pauseReasons: action.reason
        ? shift.pauseReasons.filter(r => r !== action.reason)
        : shift.pauseReasons.filter(r => !['manual', 'background'].includes(r)),
    }
  }

  // 班次时钟：一次 TICK 推进所有线路，而不是只推聚焦线路
  if (action.type === 'TICK') return tickShift(shift)

  switch (action.type) {
    case 'FOCUS_LINE':
      return focusLine(shift, action.lineId)
    case 'ANSWER_LINE':
      return answerLine(shift, action.lineId)
    case 'HOLD_LINE':
      return { ...shift, focusedLineId: null }
    case 'RESOLVE_VERIFICATION':
      return resolveVerification(shift, action.lineId, action.choice)
    default:
      break
  }

  if (isShiftPaused(shift)) return shift

  const line = focusedLine(shift)
  if (!line || line.phase !== 'active') return shift

  // 派车需要占用一辆共享车辆；无可用车辆则拒绝
  if (action.type === 'DISPATCH') {
    if (line.vehicleId) return shift
    if (availableVehicleCount(shift) <= 0) {
      return { ...shift, lastRejection: '没有可用救护车 · 请先等待在途车辆完成' }
    }
  }

  const nextWorld = worldReducer(line.world, action as GameAction)
  if (nextWorld === line.world) return shift

  const dispatchedNow = action.type === 'DISPATCH' && !line.vehicleId
  const nextLine: ShiftLine = {
    ...line,
    world: nextWorld,
    vehicleId: dispatchedNow ? action.vehicleId : line.vehicleId,
  }
  return replaceLine(shift, line.id, nextLine)
}

// -------------------- 时钟推进 --------------------

/** 冷落焦虑：非聚焦线路的来电者压力缓慢上升（设计方案 §6.6 思考成本） */
export function raiseCallerStress(world: WorldState, delta: number): WorldState {
  if (!world.callerState) return world
  const stress = Math.max(0, Math.min(100, world.callerState.stress + delta))
  return {
    ...world,
    callerState: { ...world.callerState, stress, stressLevel: stressToLevel(stress) },
  }
}

/** 该线路是否出现过患者死亡（当前通话或后台任务中的任一患者） */
function lineHasDeath(line: ShiftLine): boolean {
  if (line.world.patientStatus?.died) return true
  return line.world.backgroundRescues.some(rescue => rescue.patientStatus.died)
}

function advanceLine(line: ShiftLine, focused: boolean): ShiftLine {
  if (line.phase === 'ringing') {
    return { ...line, ringingFor: line.ringingFor + 1 }
  }
  if (line.phase === 'idle') return line

  // active 与 done 都要继续走世界时钟：在途车辆与后台救援必须走完
  const world = worldReducer(line.world, { type: 'TICK' })

  if (line.phase === 'active') {
    // 通话收束：结算完成，且复盘浮层已关闭（否则玩家看不到复盘）
    const callFinished = world.totalCalls > 0 && world.callIndex >= world.totalCalls && !world.currentCall
    const finished = world.screen === 'ending'
      || (callFinished && !world.lastDebrief && world.pendingPerkChoices.length === 0)
    if (finished) return { ...line, phase: 'done', world }
    return { ...line, world: focused ? world : raiseCallerStress(world, 0.15) }
  }

  // done：等在途车辆回收（后台救援结算）后释放线路，供下一通来电复用
  const rescuePending = world.backgroundRescues.some(rescue => !rescue.outcome)
  if (rescuePending) return { ...line, world }
  return {
    ...line,
    phase: 'idle',
    role: 'primary',
    incidentId: null,
    verification: null,
    scenarioId: null,
    vehicleId: null,
    ringingFor: 0,
  }
}

export function tickShift(shift: ShiftState): ShiftState {
  if (isShiftPaused(shift)) return shift

  const clock = shift.clock + 1
  let working: ShiftState = {
    ...shift,
    clock,
    arrivalCooldown: Math.max(0, shift.arrivalCooldown - 1),
    lastRejection: null,
  }

  // 1) 来电到达：由热度决定「多密」与「多并发」——这是上强度的两条腿
  if (!working.ending && working.completed.length < working.config.targetCalls && working.arrivalCooldown === 0) {
    const ringing = working.lines.filter(line => line.phase === 'ringing').length
    const free = working.lines.find(line => line.phase === 'idle')
    if (free && ringing < maxRingingFor(working.heat)) {
      // 班次进度：按已完成通数推进（6 通走完全程），驱动轮盘赌档位概率
      const progress = Math.min(1, working.completed.length / working.config.targetCalls)
      const { scenarioId, deck } = drawScenario(working.deck, progress)
      working = {
        ...working,
        deck,
        arrivalCooldown: arrivalGapFor(working.heat),
        lines: working.lines.map(line => (line.id === free.id
          ? { ...line, phase: 'ringing' as const, scenarioId, ringingFor: 0 }
          : line)),
      }
    }
  }

  // 1.5) 交叉核实：已派车的事故会引来第二位来电者，占用另一条空闲线路
  const freeLine = working.ending || working.completed.length >= working.config.targetCalls
    ? null
    : working.lines.find(line => line.phase === 'idle')
  if (freeLine) {
    const incident = working.incidents.find(i =>
      !i.supplementLineId && !i.resolved && working.clock >= i.supplementAt)
    const primary = incident ? findLine(working, incident.primaryLineId) : null
    const dispatched = primary ? (primary.world.dispatchSent || isVehicleOut(primary)) : false
    const primaryLive = primary ? (primary.phase === 'active' || primary.phase === 'done') : false

    if (incident && primary && dispatched && primaryLive) {
      working = {
        ...working,
        incidents: working.incidents.map(i => (i.id === incident.id ? { ...i, supplementLineId: freeLine.id } : i)),
        lines: working.lines.map(line => (line.id === freeLine.id
          ? {
              ...line,
              phase: 'ringing' as const,
              role: 'supplement' as const,
              incidentId: incident.id,
              scenarioId: incident.scenarioId,
              ringingFor: 0,
            }
          : line)),
      }
    }
  }

  // 2) 逐线推进（聚焦线不涨情绪，其余线路被冷落）
  working = {
    ...working,
    lines: working.lines.map(line => advanceLine(line, line.id === working.focusedLineId)),
  }

  // 线路救援已经结算并准备复用 → 快照评价 + 结算热度。
  // 等到 done→idle 才归档，保证后台救援结果已经回写到评价记录。
  const justFinished = working.lines.filter((line, index) =>
    line.phase === 'idle' && shift.lines[index].phase === 'done')
  if (justFinished.length > 0) {
    let heat = working.heat
    let deaths = working.deaths
    const snapshots = justFinished.flatMap(line => {
      const evaluation = line.world.callEvaluations[line.world.callEvaluations.length - 1]
      // 交叉核实线路没有独立患者评价，只写入 incident 回顾。
      if (!evaluation) return []
      if (lineHasDeath(line)) {
        heat += HEAT_LOSS_DEATH
        deaths += 1
      }
      heat += gradeAtLeast(evaluation.overallGrade, 'A') ? HEAT_GAIN_CALL_GOOD
        : gradeAtLeast(evaluation.overallGrade, 'C') ? HEAT_GAIN_CALL_OK
          : HEAT_LOSS_CALL_POOR
      return [{
        lineId: line.id,
        scenarioId: evaluation.scenarioId,
        evaluation,
        activeSeconds: line.world.activePlaySeconds,
      }]
    })
    working = {
      ...working,
      completed: [...working.completed, ...snapshots],
      heat: clampHeat(heat),
      deaths,
      // 峰值段撑过的通话数：撑够 PEAK_CALLS_TO_SURVIVE 就圆满交班
      peakSurvived: working.peakSurvived + (working.moment === 'peak' ? justFinished.length : 0),
    }
  }

  // 聚焦线路被释放后清空焦点，避免停在一个已经结束的线路上
  if (working.focusedLineId) {
    const focused = working.lines.find(line => line.id === working.focusedLineId)
    if (focused && focused.phase === 'idle') working = { ...working, focusedLineId: null }
  }

  // 3) 响铃超时 → 未接来电：释放线路，让后续来电可以进来
  const timedOut = working.lines.filter(l => l.phase === 'ringing' && l.ringingFor >= working.config.ringTimeout)
  if (timedOut.length > 0) {
    const timeoutIds = new Set(timedOut.map(l => l.id))
    const missedIds = timedOut
      .map(l => l.scenarioId)
      .filter((id): id is string => Boolean(id))
    working = {
      ...working,
      missed: [...working.missed, ...missedIds],
      missedStreak: working.missedStreak + timedOut.length,
      heat: clampHeat(working.heat + HEAT_LOSS_MISSED * timedOut.length),
      arrivalCooldown: 0,
      focusedLineId: timeoutIds.has(working.focusedLineId ?? '') ? null : working.focusedLineId,
      lines: working.lines.map(l => (timeoutIds.has(l.id)
        ? { ...l, phase: 'idle' as const, scenarioId: null, ringingFor: 0 }
        : l)),
    }
  }

  // 4) 空闲衰减：手上没有任何在途任务时，热度自然回落（夜渐深）
  if (!working.ending && !working.lines.some(l => l.phase === 'ringing' || l.phase === 'active')) {
    working = { ...working, heat: clampHeat(working.heat - HEAT_IDLE_DECAY) }
  }

  // 5) 段落推进：开场 → 爬升 → 峰值
  if (!working.ending) {
    if (working.heat >= HEAT_PEAK) working = { ...working, moment: 'peak' }
    else if (working.moment === 'opening' && working.completed.length > 0) working = { ...working, moment: 'rising' }
  }

  // 6) 收班判定 —— 6 通完成即交班；其他原因收班保留兼容。
  if (!working.ending) {
    if (working.completed.length >= working.config.targetCalls) {
      working = { ...working, ending: 'complete', moment: 'ended' }
    } else if (working.deaths >= COLLAPSE_DEATHS || working.missedStreak >= COLLAPSE_MISSED_STREAK) {
      working = { ...working, ending: 'collapse', moment: 'ended' }
    } else if (working.peakSurvived >= PEAK_CALLS_TO_SURVIVE) {
      working = { ...working, ending: 'perfect', moment: 'ended' }
    } else if (working.heat <= HEAT_FLOOR && working.completed.length >= FADE_MIN_CALLS) {
      working = { ...working, ending: 'fade', moment: 'ended' }
    }
  }

  // 7) 班次收班后把仍在处理的病例交给下一班；已得到现场结果的 done 线路保留真实结果。
  if (working.ending === 'complete' || working.ending === 'collapse') {
    const transferred = working.lines.flatMap(line => {
      if (line.role !== 'primary' || (line.phase !== 'active' && line.phase !== 'done')) return []
      const scenarioId = line.world.currentCall?.id ?? line.scenarioId
      if (!scenarioId) return []
      const scenario = getScenario(scenarioId)
      const existing = line.world.callEvaluations[line.world.callEvaluations.length - 1]
      if (!existing && (!line.world.currentCall || !line.world.callerState)) return []
      const baseEvaluation = existing ?? buildCallEvaluation(line.world, scenario)
      const evaluation = line.phase === 'done' && baseEvaluation.outcome !== 'pending'
        ? baseEvaluation
        : markCallEvaluationTransferred(baseEvaluation, scenario)
      return [{ lineId: line.id, scenarioId: scenario.id, evaluation, activeSeconds: line.world.activePlaySeconds }]
    })
    const abandonedRings = working.lines
      .filter(line => line.phase === 'ringing' && line.role === 'primary' && line.scenarioId)
      .map(line => line.scenarioId!)
    working = {
      ...working,
      focusedLineId: null,
      completed: [...working.completed, ...transferred],
      missed: [...working.missed, ...abandonedRings],
      lines: working.lines.map(line => (line.phase === 'active' || line.phase === 'ringing' || line.phase === 'done'
        ? { ...line, phase: 'idle' as const, scenarioId: null, ringingFor: 0 }
        : line)),
    }
  }

  return working
}
