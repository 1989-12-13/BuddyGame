// ============================================================
// 零点接线台 — 共享类型合约
// 120急救调度模拟游戏 | MPDS标准化登记系统
// ============================================================

// -------------------- 来电者 --------------------
export type CallerId =
  | 'li_jianguo' | 'wang_xiao' | 'zhang_xiulan' | 'zhao_lei'
  | 'chen_ming' | 'xiao_pang'
  | 'liu_fang' | 'sun_wei' | 'zhou_ming' | 'wu_lili'
  | 'huang_qiang' | 'lin_mei' | 'ma_tao' | 'ye_xin'
  | 'lu_jie' | 'fang_yu'
  | 'xu_dawei' | 'song_na' | 'he_lin' | 'tian_feng'
  | 'cheng_xin' | 'luo_wei' | 'gao_yan' | 'fan_tao'
  | 'long_jie' | 'deng_yu' | 'jiang_wen' | 'han_lei'
  | 'xu_mei' | 'lei_gang' | 'zhong_qi'
  | 'wei_qiang' | 'zheng_yu'

/** 来电者画像 */
export interface CallerProfile {
  id: CallerId
  name: string           // 称呼，如"李建国"
  relationship: string   // 与患者关系，如"丈夫"、"路人"
  tone: CallerTone       // 情绪基调
  speechStyle: string    // 说话风格描述
}

export type CallerTone = '镇定' | '紧张' | '恐慌' | '失控'

// -------------------- MPDS 判定等级 --------------------
// MPDS使用ECHO/DELTA/CHARLIE/BRAVO/ALPHA五级判定，映射到响应资源：
// ECHO = 最高优先级（如心脏骤停）, DELTA = 高危, CHARLIE = 中危, BRAVO = 低中危, ALPHA = 低危
export type MpdsDeterminant = 'ECHO' | 'DELTA' | 'CHARLIE' | 'BRAVO' | 'ALPHA'

export const MPDS_DETERMINANT_INFO: Record<MpdsDeterminant, { label: string; color: string; responseCode: string }> = {
  ECHO:    { label: 'E — 即刻生命威胁',         color: '#c0392b', responseCode: '灯闪警笛' },
  DELTA:   { label: 'D — 高危/潜在致命',         color: '#dc2626', responseCode: '灯闪警笛' },
  CHARLIE: { label: 'C — 中危/需ALS评估',        color: '#f39c12', responseCode: '安静接近' },
  BRAVO:   { label: 'B — 低中危/BLS即可',        color: '#22c55e', responseCode: '安静接近' },
  ALPHA:   { label: 'A — 低危/常规转运',         color: '#3498db', responseCode: '安静接近' },
}

// -------------------- 分诊等级（颜色四色法 — 急救现场分诊） --------------------
export type TriageLevel = 'red' | 'yellow' | 'green' | 'black'
// red = 濒危（即刻派车）, yellow = 危重, green = 轻伤, black = 死亡/无需抢救

export const TRIAGE_LABELS: Record<TriageLevel, string> = {
  red:    '红色 — 濒危',
  yellow: '黄色 — 危重',
  green:  '绿色 — 轻伤',
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

export function determinantToHotCold(d: MpdsDeterminant): 'HOT' | 'COLD' {
  return d === 'ECHO' || d === 'DELTA' ? 'HOT' : 'COLD'
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
  | 'protocolNumber'

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
  | 'blowInflate'   // 吹气充胀
  | 'aimForce'      // 瞄准施力
  | 'holdPressure'  // 按压止血
  | 'positionDrag'  // 摆位拖拽（已弃用）
  | 'timedShock'    // 时机识别除颤
  | 'stepOrder'     // 步骤排序：按正确顺序排列步骤
  | 'locationSelect'// 位置选择：选择正确的止血点位置

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

/** 吹气充胀：长按充胀，过量惩罚、不足无效 */
export interface BlowInflateSpec extends BaseMiniGame {
  kind: 'blowInflate'
  targetInflations: number  // 目标吹气次数
  idealHoldSec: number      // 每次理想吹气时长（秒）
  overInflationSec: number  // 超过即判定胃胀气
  durationSec: number       // 总时长（秒）
}

/** 瞄准施力：拖拽标记到解剖位，再冲击/按压，位置+力度计分 */
export interface AimForceSpec extends BaseMiniGame {
  kind: 'aimForce'
  targetX: number           // 目标中心 X（0-100 归一坐标）
  targetY: number           // 目标中心 Y（0-100 归一坐标）
  aimTolerance: number      // 命中容差（归一半径）
  thrusts?: number           // 需要施力/按压次数（与 holdSec 二选一）
  thrustWindowMs?: number    // 每次施力的目标节奏窗口（毫秒）
  holdSec?: number           // 持续按压时长（秒）（与 thrusts 二选一）
  showSideView?: boolean    // 显示侧面视图（海姆立克用）
  hideTargetGuide?: boolean // 隐藏目标提示圈（不显示瞄准辅助线）
  bodyDiagram?: 'full' | 'arm' | 'leg' | 'head' | 'chest'  // 身体示意图类型（止血用：显示具体部位）
}

/** 按压止血：长按保持压力 N 秒，松手血量回升 */
export interface HoldPressureSpec extends BaseMiniGame {
  kind: 'holdPressure'
  holdSec: number           // 需维持的秒数
  bleedRatePerSec: number   // 松手时血量条回升速度（每秒）
  regainPerSec: number      // 按压时血量条下降速度（每秒）
}

/** 摆位拖拽：拖拽/旋转身体到目标角度 */
export interface PositionDragSpec extends BaseMiniGame {
  kind: 'positionDrag'
  targetAngle: number       // 目标角度（度）
  angleTolerance: number    // 角度容差（度）
  bodyLabel: string         // 姿态描述，如"复苏体位"
  useDetailedFigure?: boolean // 使用详细人体图
}

/** 时机识别：可电击窗口内点除颤，误点/错过扣分 */
export interface TimedShockSpec extends BaseMiniGame {
  kind: 'timedShock'
  windows: number           // 可电击窗口数量
  windowMs: number          // 每个可电击窗口持续（毫秒）
  shockCooldownMs: number   // 两次窗口间隔（毫秒）
  falsePenalty: number      // 误击扣分（0-1 每次）
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

export type MiniGameSpec =
  | RhythmPressSpec
  | BlowInflateSpec
  | AimForceSpec
  | HoldPressureSpec
  | PositionDragSpec
  | TimedShockSpec
  | StepOrderSpec
  | LocationSelectSpec

/** 小游戏组件统一契约 */
export interface MiniGameProps {
  spec: MiniGameSpec
  onComplete: (score: number, passed: boolean) => void
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

export type CalleeStressLevel = '镇定' | '紧张' | '恐慌' | '失控'

/** 压力 → 文字 + 颜色映射 */
export const STRESS_INFO: Record<CalleeStressLevel, { label: string; color: string; emoji: string; answerQuality: number }> = {
  镇定: { label: '镇定',     color: '#4ade80', emoji: '😌', answerQuality: 1.0 },
  紧张: { label: '紧张',     color: '#facc15', emoji: '😰', answerQuality: 0.9 },
  恐慌: { label: '恐慌',     color: '#f97316', emoji: '😱', answerQuality: 0.65 },
  失控: { label: '失控',     color: '#ef4444', emoji: '🤯', answerQuality: 0.35 },
}

/** 由压力值推导等级 */
export function stressToLevel(stress: number): CalleeStressLevel {
  if (stress < 25) return '镇定'
  if (stress < 50) return '紧张'
  if (stress < 75) return '恐慌'
  return '失控'
}

/** MPDS 协议编号与名称对照表（33个标准协议） */
export const PROTOCOL_REF: [number, string][] = [
  [1, '腹痛/背痛'],        [2, '过敏/输液反应'],
  [3, '动物咬伤'],         [4, '攻击/性侵'],
  [5, '腰背痛/非创伤'],    [6, '呼吸问题'],
  [7, '烧伤/烫伤/爆炸'],   [8, '一氧化碳/吸入'],
  [9, '心脏/呼吸骤停'],   [10, '胸痛'],
  [11, '抽搐'],            [12, '糖尿病'],
  [13, '溺死/潜水'],      [14, '触电'],
  [15, '眼部问题'],        [16, '坠落伤'],
  [17, '头痛'],            [18, '心脏病'],
  [19, '高温/低温'],       [20, '妊娠/分娩'],
  [21, '出血不止'],        [22, '中毒/误食'],
  [23, '精神状态异常'],    [24, '产科/流产'],
  [25, '中风/CVA'],        [26, '外伤/车辆事故'],
  [27, '昏迷/晕厥'],       [28, '卒中/脑血管'],
  [29, '交通/运输事故'],   [30, '创伤'],
  [31, '无意识/晕厥'],     [32, '其他/特殊'],
  [33, '感染/发热'],
]

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
  determinantSubcode: number | null  // 判定码最后一位细分编码 (1-4)
  // — 响应 —
  triage: TriageLevel | null
  // 自由备注
  conditionNote: string
}

// -------------------- 游戏全局状态 --------------------
export type GameScreen = 'title' | 'briefing' | 'playing' | 'ending'

import type { FleetState } from './core/fleet'

export interface WorldState {
  screen: GameScreen

  // 班次
  shiftNumber: number
  callIndex: number           // 当前是第几通（0-based）
  totalCalls: number          // 本班次总电话数
  scenarioQueue: string[]     // 本班次的场景id队列

  // 全局计时（秒）
  shiftElapsed: number

  // 车队
  fleet: FleetState

  // 当前通话
  currentCall: EmergencyScenario | null
  callPhase: CallPhase
  callStartTime: number       // 接通时的shiftElapsed
  callerState: CallerState | null



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
  guidanceMinigameScores: (number | null)[]  // 小游戏步骤得分（与 guidanceResults 平行）

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
