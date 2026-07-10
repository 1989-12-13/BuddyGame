// ============================================================
// 零点接线台 — 共享类型合约
// 120急救调度模拟游戏 | MPDS标准化登记系统
// ============================================================

// -------------------- 来电者 --------------------
export type CallerId = string

/** 来电者画像 */
export interface CallerProfile {
  id: CallerId
  name: string           // 称呼，如"李建国"
  relationship: string   // 与患者关系，如"丈夫"、"路人"
  tone: CallerTone       // 情绪基调
  speechStyle: string    // 说话风格描述
}

export type CallerTone = 'panic' | 'anxious' | 'calm' | 'confused' | 'hysterical' | 'angry'

// -------------------- MPDS 判定等级 --------------------
// MPDS使用ECHO/DELTA/CHARLIE/BRAVO/ALPHA五级判定，映射到响应资源：
// ECHO = 最高优先级（如心脏骤停）, DELTA = 高危, CHARLIE = 中危, BRAVO = 低中危, ALPHA = 低危
export type MpdsDeterminant = 'ECHO' | 'DELTA' | 'CHARLIE' | 'BRAVO' | 'ALPHA'

export const MPDS_DETERMINANT_INFO: Record<MpdsDeterminant, { label: string; color: string; responseCode: string }> = {
  ECHO:    { label: 'E — 即刻生命威胁',         color: '#c0392b', responseCode: 'HOT (灯闪警笛)' },
  DELTA:   { label: 'D — 高危/潜在致命',         color: '#e74c3c', responseCode: 'HOT (灯闪警笛)' },
  CHARLIE: { label: 'C — 中危/需ALS评估',        color: '#f39c12', responseCode: 'COLD (安静接近)' },
  BRAVO:   { label: 'B — 低中危/BLS即可',        color: '#2ecc71', responseCode: 'COLD (安静接近)' },
  ALPHA:   { label: 'A — 低危/常规转运',         color: '#3498db', responseCode: 'COLD (安静接近)' },
}

// -------------------- 分诊等级（颜色四色法 — 急救现场分诊） --------------------
export type TriageLevel = 'red' | 'yellow' | 'green' | 'black'
// red = 濒危（即刻派车）, yellow = 危重, green = 轻伤, black = 死亡/无需抢救

export const TRIAGE_LABELS: Record<TriageLevel, string> = {
  red:    '红色 — 濒危（即刻派车）',
  yellow: '黄色 — 危重（优先派车）',
  green:  '绿色 — 轻伤（常规派车）',
  black:  '黑色 — 死亡/无需抢救',
}

/** MPDS判定等级 ↔ 四色分诊的推荐映射 */
export function determinantToTriage(d: MpdsDeterminant): TriageLevel {
  const map: Record<MpdsDeterminant, TriageLevel> = {
    ECHO:    'red',
    DELTA:   'red',
    CHARLIE: 'yellow',
    BRAVO:   'green',
    ALPHA:   'green',
  }
  return map[d]
}

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
export type QuestionTier = 'critical'   // 🔴 必问，时间敏感，降压力
                          | 'important'  // 🟡 应该问，解锁更多信息
                          | 'detail'     // 🟢 加分项，但耗时间

export type InfoQuality = 'clear'    // 🟢 完整准确
                         | 'partial' // 🟡 基本可用
                         | 'vague'   // 🔴 模糊不清
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

// -------------------- 信息碎片（已弃用，保留类型兼容） --------------------
/** @deprecated 已改为 JudgmentPrompt 系统 */
export interface InfoFragment {
  id: string
  targetField: FragmentTargetField
  value: string
  snippet: string
  quality: InfoQuality
  isDistorted: boolean
}

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
}

export interface FirstAidGuidance {
  title: string
  intro: string            // 开始急救指导时的开场白
  steps: GuidanceStep[]
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

// -------------------- 调度记录 --------------------
export interface DispatchRecord {
  callId: string
  dispatchTime: number       // 接通后多少秒派车
  triage: TriageLevel
  addressCompleteness: 'vague' | 'partial' | 'full'
  ambulanceETA: number       // 预计到达时间（游戏内秒数）
}

// -------------------- 来电者状态（通话中追踪） --------------------
export interface CallerState {
  id: CallerId
  cooperation: number        // 0-100，配合度
  stress: number             // 0-100，压力值（越高越紧张 → 答案质量下降）
  stressLevel: CalleeStressLevel  // 派生自 stress
  revealedInfo: {
    address: 'none' | 'vague' | 'partial' | 'full'
    contact: boolean
    chiefComplaint: boolean
    age: boolean
    gender: boolean
    consciousness: boolean
    breathing: boolean
    additional: string[]
    purpose: boolean
  }
  infoQuality: Record<string, InfoQuality>  // 每个字段的信息质量
  askedMPDS: string[]        // 已问过的MPDS问题id列表
  questionCount: number      // 已问问题数（用于压力累加）
}

export type CalleeStressLevel = 'calm' | 'anxious' | 'panicked' | 'hysterical'

/** 压力 → 文字 + 颜色映射 */
export const STRESS_INFO: Record<CalleeStressLevel, { label: string; color: string; emoji: string; answerQuality: number }> = {
  calm:       { label: '平静',     color: '#4ade80', emoji: '😌', answerQuality: 1.0 },
  anxious:    { label: '紧张',     color: '#facc15', emoji: '😰', answerQuality: 0.9 },
  panicked:   { label: '恐慌',     color: '#f97316', emoji: '😱', answerQuality: 0.65 },
  hysterical: { label: '失控',     color: '#ef4444', emoji: '🤯', answerQuality: 0.35 },
}

/** 由压力值推导等级 */
export function stressToLevel(stress: number): CalleeStressLevel {
  if (stress < 25) return 'calm'
  if (stress < 50) return 'anxious'
  if (stress < 75) return 'panicked'
  return 'hysterical'
}

// -------------------- 终端登记状态（MPDS调度卡） --------------------
export interface TerminalState {
  // — Case Entry（病例录入） —
  address: string
  contact: string
  chiefComplaint: string         // 标准化主诉
  // 结构化患者信息
  patientAge: string
  patientGender: string
  conscious: boolean | null      // null=未确认
  breathing: boolean | null
  // — 协议判定 —
  protocolNumber: number | null  // 选定的MPDS协议号
  determinant: MpdsDeterminant | null
  // — 响应 —
  triage: TriageLevel | null
  hotCold: 'HOT' | 'COLD' | null
  // 自由备注
  conditionNote: string
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

  // 当前通话
  currentCall: EmergencyScenario | null
  callPhase: CallPhase
  callStartTime: number       // 接通时的shiftElapsed
  callerState: CallerState | null

  // 问询策略
  questionCost: number        // 问询累计消耗的游戏时间（影响派车速度评分）

  // 终端（计算机登记）
  terminal: TerminalState

  // 派车
  dispatchSent: boolean
  dispatchRecord: DispatchRecord | null
  ambulanceRemaining: number  // 救护车还需多少秒到达（-1表示未派车/已到）

  // 急救指导
  guidanceActive: boolean
  guidanceStepIndex: number
  guidanceResults: ('correct' | 'incorrect' | null)[]

  // 对话历史
  dialogueLog: DialogueLine[]

  // 临床判断
  pendingJudgments: JudgmentPrompt[]   // 等待玩家做出判断的选择题

  // 累计得分
  totalScore: number
  callScores: number[]        // 每通电话的得分

  // 结算
  endingId: string | null
}

export interface DialogueLine {
  speaker: 'caller' | 'operator' | 'system'
  text: string
  timestamp: number           // shiftElapsed 时间戳
}

// -------------------- 通话结果（用于日志/结算） --------------------
export interface CallResult {
  scenarioId: string
  scenarioTitle: string
  isPrank: boolean
  dispatchTime: number | null
  triageDecision: TriageLevel | null
  correctTriage: TriageLevel
  addressCompleteness: 'vague' | 'partial' | 'full'
  guidanceStepsCorrect: number
  guidanceStepsTotal: number
  score: number
  dispatchedInTime: boolean   // 是否1分钟内派车
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
