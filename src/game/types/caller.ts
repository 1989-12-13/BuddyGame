// ============================================================
// 120调度台 — 来电者相关类型
// ============================================================

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
  questionAttempts: Record<string, number>
  questionQuality: Record<string, InfoQuality>
  questionStress: Record<string, number>
  questionCount: number      // 已问问题数（用于压力累加）
}

export type CalleeStressLevel = '镇定' | '紧张' | '恐慌' | '失控'

/** 压力 → 文字 + 颜色映射 */
export const STRESS_INFO: Record<CalleeStressLevel, { label: string; color: string; emoji: string; answerQuality: number }> = {
  镇定: { label: '镇定',     color: 'var(--sev-1)', emoji: '○', answerQuality: 1.0 },
  紧张: { label: '紧张',     color: 'var(--sev-3)', emoji: '◐', answerQuality: 0.9 },
  恐慌: { label: '恐慌',     color: 'var(--sev-4)', emoji: '◑', answerQuality: 0.65 },
  失控: { label: '失控',     color: 'var(--sev-5)', emoji: '●', answerQuality: 0.35 },
}

/** 由压力值推导等级 */
export function stressToLevel(stress: number): CalleeStressLevel {
  if (stress < 25) return '镇定'
  if (stress < 50) return '紧张'
  if (stress < 75) return '恐慌'
  return '失控'
}

/**
 * 口语标记 — 让「同一句话」在不同人嘴里有不同"活人"质感。
 * 全部可选：未配置时回落中性行为，便于 AI 批量生成内容时渐进补充。
 * 只影响措辞与语气，不改变信息本身（信息质量仍由情绪与问法决定）。
 */
export interface CallerPersonality {
  /** 怎么称呼接线员 / 调度台（进入句子前会带称呼语） */
  address?: string[]
  /** 口头禅 / 高频语气词，低频混入句子 */
  catchphrases?: string[]
  /** 失控（stress≥75）时的口头行为倾向 */
  panicTick?: 'stammer' | 'sob' | 'scream' | 'ramble' | 'shout'
  /** 恐慌时会抢话 / 打断接线员 */
  interjects?: boolean
  /** 紧张时会不会自言自语式地重复别人的话（复述最后几个词） */
  echoes?: boolean
  /**
   * 话痨型回答之后的跑题 / 重复。
   * 不填则回落到全局兜底池 —— 填了才能拉开「同一句话不同人说出来」的差异。
   */
  rambleTails?: string[]
  /** 情绪化 + 高压时的结尾催促（不填则回落全局兜底池） */
  urges?: string[]
  /** 有医疗背景者的措辞前缀（不填则回落全局兜底句） */
  preciseHead?: string[]
}

/**
 * 说话特质 — 决定「同一句信息」在不同来电者嘴里怎么说。
 * 只影响措辞与语气，不改变信息本身（信息质量仍由情绪与问法决定）。
 */
export interface CallerVoice {
  /** 0 沉默寡言 / 1 一般 / 2 话痨 */
  verbosity: 0 | 1 | 2
  /** 0 情绪化 / 1 一般 / 2 理性 */
  rationality: 0 | 1 | 2
  /** 0 缺医疗常识 / 1 一般 / 2 有医疗背景 */
  medicalLiteracy: 0 | 1 | 2
  /** 口语标记（可选） */
  personality?: CallerPersonality
}

// 前向引用：InfoQuality 定义在 scenario 模块
import type { InfoQuality } from './scenario'
