// ============================================================
// 零点接线台 — 共享类型合约（桶导出）
// 120急救调度模拟游戏 | MPDS标准化登记系统
// ============================================================

// -------------------- 来电者 --------------------
export type { CallerId, CallerProfile, CallerTone, CallerState, CalleeStressLevel } from './caller'
export { STRESS_INFO, stressToLevel } from './caller'

// -------------------- MPDS 判定等级 / 分诊 / 终端 --------------------
export type { MpdsDeterminant, TerminalState, TriageLevel } from './mpds'
export { MPDS_DETERMINANT_INFO, TRIAGE_LABELS, TRIAGE_COLORS, determinantToTriage, determinantToHotCold, PROTOCOL_REF } from './mpds'

// -------------------- 场景 / 问询 / 指导 / 小游戏 --------------------
export type {
  CallPhase,
  QuestionTier,
  InfoQuality,
  MPDSQuestion,
  JudgmentOption,
  JudgmentPrompt,
  TerminalJudgmentField,
  FragmentTargetField,
  GuidanceStep,
  FirstAidGuidance,
  MiniGameKind,
  BaseMiniGame,
  RhythmPressSpec,
  QuickChoiceSpec,
  StepOrderSpec,
  LocationSelectSpec,
  CprSpec,
  MiniGameSpec,
  MiniGameProps,
  CallEvent,
  MpdsProtocolCard,
  EmergencyScenario,
} from './scenario'
export {
  isRhythmPress,
  isQuickChoice,
  isStepOrder,
  isLocationSelect,
  isCpr,
} from './scenario'

// -------------------- 世界状态 --------------------
export type {
  DispatchRecord,
  VitalSign,
  PatientStatus,
  PatientEvent,
  RescuePhase,
  RescueState,
  GameScreen,
  WorldState,
  CallHistoryEntry,
  DialogueLine,
  EndingDef,
} from './world'
