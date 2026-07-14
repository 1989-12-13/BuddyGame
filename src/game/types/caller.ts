// ============================================================
// 零点接线台 — 来电者相关类型
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
  questionCount: number      // 已问问题数（用于压力累加）
}

export type CalleeStressLevel = '镇定' | '紧张' | '恐慌' | '失控'

/** 压力 → 文字 + 颜色映射 */
export const STRESS_INFO: Record<CalleeStressLevel, { label: string; color: string; emoji: string; answerQuality: number }> = {
  镇定: { label: '镇定',     color: '#16a34a', emoji: '○', answerQuality: 1.0 },
  紧张: { label: '紧张',     color: '#d97706', emoji: '◐', answerQuality: 0.9 },
  恐慌: { label: '恐慌',     color: '#ff8c00', emoji: '◑', answerQuality: 0.65 },
  失控: { label: '失控',     color: '#ef4444', emoji: '●', answerQuality: 0.35 },
}

/** 由压力值推导等级 */
export function stressToLevel(stress: number): CalleeStressLevel {
  if (stress < 25) return '镇定'
  if (stress < 50) return '紧张'
  if (stress < 75) return '恐慌'
  return '失控'
}

// 前向引用：InfoQuality 定义在 scenario 模块
import type { InfoQuality } from './scenario'
