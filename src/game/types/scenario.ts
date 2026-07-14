// ============================================================
// 零点接线台 — 场景 / 问询 / 指导 / 小游戏 / 事件 类型
// ============================================================

import type { CallerId } from './caller'
import type { TriageLevel } from './mpds'

// -------------------- 通话阶段 --------------------
export type CallPhase =
  | 'ringing'       // 电话振铃
  | 'connected'     // 已接通，来电者自述
  | 'questioning'   // 接线员问询中
  | 'dispatching'   // 已决定派车
  | 'guidance'      // 派车后急救指导
  | 'closing'       // 通话收尾
  | 'completed'     // 通话结束

// -------------------- 问询策略 --------------------
export type QuestionTier = 'critical'   // ◆ 必问，时间敏感，降压力
                          | 'important'  // ◆ 应该问，解锁更多信息
                          | 'detail'     // ◆ 加分项，但耗时间

export type InfoQuality = 'clear'    // ◆ 完整准确
                         | 'partial' // ◆ 基本可用
                         | 'vague'   // ◆ 模糊不清
                         | 'unknown' // ⬜ 尚未获取

// -------------------- MPDS问询 --------------------
export interface MPDSQuestion {
  id: string
  category: 'consciousness' | 'breathing' | 'bleeding' | 'pain' | 'age_gender' | 'mechanism'
  tier: QuestionTier        // 问题优先级层级
  timeCost: number          // 问这个问题消耗的游戏秒数（1~5）
  label: string             // 按钮显示的简短文字
  questionText: string      // 接线员说出的话
  answer: string            // 来电者的回复（calm状态下的完整版）
  answerVague: string       // 来电者紧张时的模糊版
  /** 叙述式回答 — 像真实来电者一样絮叨、混乱、夹杂无关信息 */
  ramblingAnswer: string
  /** 高压失真回答 — 紧张到语无伦次时的版本 */
  panickedAnswer: string
  reveals: string[]         // 揭示的信息字段名
  prerequisites?: string[]  // 前置问题ID（必须先问这些才能解锁）
  stressEffect: number      // 对来电者压力的影响（负=安抚，正=增加紧张）
  /** 临床判断选择题 — 来电者回答后，玩家需从混乱叙述中做出专业判断 */
  judgment?: {
    question: string          // 临床判断问题，如「根据描述判断出血特征」
    options: JudgmentOption[]
  }
}

/** 临床判断选择题的单个选项 */
export interface JudgmentOption {
  label: string             // 选项文字，如「大面积静脉渗血」
  sublabel?: string         // 简短解释，如「非喷射但量大」
  fills: { field: TerminalJudgmentField; value: string | boolean }[]  // 选中后填入终端的字段
  isCorrect: boolean        // 是否是正确的临床判断
}

// -------------------- 临床判断选择题 — 来电者叙述旁的推理卡 --------------------
/** 来电者每次回答后，玩家需要从混乱叙述中做出专业判断 */
export interface JudgmentPrompt {
  id: string                    // 唯一ID
  questionId: string            // 对应的 MPDS question ID
  dialogueIndex: number         // 附着在哪一行对话旁
  question: string              // 临床判断问题
  options: JudgmentOption[]     // 可选项
  chosenOptionIndex: number | null  // 玩家选择的选项（null = 未选择）
}

/** 判断选项可填入的终端字段 */
export type TerminalJudgmentField =
  | 'address' | 'contact' | 'chiefComplaint'
  | 'patientAge' | 'patientGender'
  | 'conscious' | 'breathing' | 'conditionNote'
  | 'protocolNumber'

// -------------------- 终端字段（UPDATE_TERMINAL 可更新字段的完整并集） --------------------
export type FragmentTargetField =
  | 'address' | 'contact' | 'chiefComplaint'
  | 'patientAge' | 'patientGender'
  | 'consciousness' | 'breathing' | 'conditionNote'

// -------------------- 急救指导 --------------------
export interface GuidanceStep {
  id: string
  instruction: string       // 接线员说出指导语
  prompt: string           // 提示文字（给玩家看）
  options: string[]        // 可选的后续指令
  correctIndex: number     // 正确选项的索引
  feedback: {              // 选择后的反馈
    correct: string          // 技术判定（面板显示用）
    incorrect: string
    callerCorrect: string    // 来电者视角：伤者好转/操作成功后的描述
    callerIncorrect: string  // 来电者视角：操作错误或伤者恶化的描述
  }
  miniGame?: MiniGameSpec   // 可选的互动小游戏（实操环节）
}

export interface FirstAidGuidance {
  title: string
  intro: string            // 开始急救指导时的开场白
  steps: GuidanceStep[]
}

// -------------------- 互动小游戏（急救指导实操环节） --------------------
export type MiniGameKind =
  | 'rhythmPress'   // 胸外按压：目标 BPM
  | 'quickChoice'   // 快速选择题：选择正确的急救操作
  | 'stepOrder'     // 步骤排序：按正确顺序排列步骤
  | 'locationSelect'// 位置选择：选择正确的止血点位置
  | 'cpr'           // 心肺复苏：30:2 循环

/** 小游戏公共字段 */
export interface BaseMiniGame {
  kind: MiniGameKind
  title: string              // 小游戏标题
  instruction: string       // 操作说明
  passThreshold: number     // 0-1，达到即通过
  feedback: { good: string; bad: string }  // 操作结束后来电者视角描述
}

/** 胸外按压：目标 BPM，空格/点击，检测频率与稳定度 */
export interface RhythmPressSpec extends BaseMiniGame {
  kind: 'rhythmPress'
  targetBpm: number         // 目标按压频率
  bpmTolerance: number      // 容差（BPM）
  durationSec: number       // 持续时长（秒）
  depthSeconds?: number     // 若要求按压深度，设定每次按压需保持的最小时长
}

/** 快速选择题：纯文字版急救知识选择题 */
export interface QuickChoiceSpec extends BaseMiniGame {
  kind: 'quickChoice'
  question: string           // 题目
  options: string[]          // 选项列表
  correctIndex: number       // 正确选项索引
}

/** 步骤排序：将打乱的步骤按正确顺序逐一选中 */
export interface StepOrderSpec extends BaseMiniGame {
  kind: 'stepOrder'
  steps: string[]           // 正确顺序的步骤列表
}

/** 位置选择：从多个选项中选择正确的止血点位置 */
export interface LocationSelectSpec extends BaseMiniGame {
  kind: 'locationSelect'
  bodyPart: 'arm' | 'leg' | 'head' | 'chest'  // 身体部位图
  woundDesc: string         // 伤口描述（显示在图上）
  options: string[]         // 选项列表
  correctIndex: number      // 正确选项索引
}

/** 心肺复苏：30次胸外按压 + 2次人工呼吸 循环 */
export interface CprSpec extends BaseMiniGame {
  kind: 'cpr'
  cycles: number             // 循环次数（默认2）
}

export type MiniGameSpec =
  | RhythmPressSpec
  | QuickChoiceSpec
  | StepOrderSpec
  | LocationSelectSpec
  | CprSpec

// -------- 小游戏类型守卫（消除各引擎中的 as XSpec 断言） --------
export function isRhythmPress(spec: MiniGameSpec): spec is RhythmPressSpec { return spec.kind === 'rhythmPress' }
export function isQuickChoice(spec: MiniGameSpec): spec is QuickChoiceSpec { return spec.kind === 'quickChoice' }
export function isStepOrder(spec: MiniGameSpec): spec is StepOrderSpec { return spec.kind === 'stepOrder' }
export function isLocationSelect(spec: MiniGameSpec): spec is LocationSelectSpec { return spec.kind === 'locationSelect' }
export function isCpr(spec: MiniGameSpec): spec is CprSpec { return spec.kind === 'cpr' }

/** 小游戏组件统一契约 */
export interface MiniGameProps {
  spec: MiniGameSpec
  onComplete: (score: number, passed: boolean) => void
  /** true 时冻结计时/输入；用于浮层折叠时暂停 */
  paused?: boolean
}

// -------------------- 通话事件 --------------------
export interface CallEvent {
  id: string
  trigger: 'after_dispatch' | 'after_question' | 'time_elapsed'
  triggerValue?: string    // question id 或 秒数
  type: 'caller_speaks' | 'line_cut' | 'caller_panic' | 'new_symptom'
  dialogue: string
}

// -------------------- 急救场景（一通电话） --------------------

/** MPDS协议卡片定义 — 每类主诉对应一张协议卡 */
export interface MpdsProtocolCard {
  number: number            // 协议编号 (1-35)
  title: string             // 主诉标题
  chiefComplaint: string    // 标准化主诉描述（病例录入摘要）
  determinantCode: string   // 预期判定码，如 "9-E-1"
  hotCold: 'HOT' | 'COLD'   // 响应模式
  keyQuestions: string[]    // 必问关键问题（MPDS标准）
}

export interface EmergencyScenario {
  id: string
  title: string                // 场景标题（内部用）
  callerId: CallerId
  phoneNumber: string
  baseStation: string          // 模糊的基站定位
  isPrank: boolean
  correctTriage: TriageLevel

  /** MPDS协议卡片 */
  mpdsCard: MpdsProtocolCard

  /** 来电者接通后的第一句话 */
  openingLine: string

  /** 四要素 */
  fourElements: {
    address: {
      vague: string            // 基站给出的模糊范围
      partial: string          // 问"你在哪里"后得到
      full: string             // 问"标志建筑"后得到
    }
    contact: string            // 联系电话（可能与来电号码不同）
    condition: {
      chiefComplaint: string
      age: string
      gender: string
      consciousness: string
      breathing: string
      additional: string[]     // 额外细节
      patientCount: string     // 患者人数（如"1人"、"2人"）
    }
    purpose: string            // 诉求目的
  }

  /** 可用的MPDS标准问询 */
  mpdsQuestions: MPDSQuestion[]

  /** 派车后的急救指导（null表示无需指导） */
  guidance: FirstAidGuidance | null

  /** 通话中特殊事件 */
  specialEvents: CallEvent[]

  /** 场景结束时的结果描述 */
  outcomeNarrative: {
    good: string    // 处理得当
    bad: string     // 处理不当
    prank: string   // 如果是恶作剧
  }
}
