// ============================================================
// 120调度台 — 来电者说话特质表
// ============================================================
// 与 personas.ts 分开维护：
//   personas.ts 回答「他是谁」（姓名 / 关系 / 情绪基调 / 风格描述）
//   voices.ts   回答「他怎么说话」（可被机制读取的结构化特质）
//
// 依据 personas.ts 的 speechStyle 与 relationship 标注，
// 只影响措辞，不影响信息质量与评分。
// personality 口语素材全部可选 —— 未配置时回落中性行为。
// ============================================================

import type { CallerId, CallerVoice } from '../types'

const CALLER_VOICES: Record<CallerId, CallerVoice> = {
  // ===== 原始场景 =====
  li_jianguo: { // 语速极快、断断续续、带哭腔
    verbosity: 1, rationality: 0, medicalLiteracy: 0,
    personality: {
      address: ['同志'],
      panicTick: 'sob',
      interjects: true,
      echoes: true,
    },
  },
  wang_xiao: { // 冷静但略显紧张、叙述有条理
    verbosity: 1, rationality: 2, medicalLiteracy: 1,
    personality: { catchphrases: ['那个'] },
  },
  zhang_xiulan: { // 说话慢、容易跑题、记不清细节
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: {
      catchphrases: ['哎哟喂', '你说啥来着'],
      panicTick: 'stammer',
      echoes: true,
    },
  },
  zhao_lei: { // 大喊大叫、反复说"快点来"
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: {
      catchphrases: ['快点儿', '哎呀'],
      panicTick: 'shout',
      interjects: true,
    },
  },
  chen_ming: { // 紧张但尽力配合、主动提供信息
    verbosity: 1, rationality: 1, medicalLiteracy: 1,
    personality: { catchphrases: ['那个'] },
  },
  xiao_pang: { // 童声、嘻嘻哈哈
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: {
      address: ['喂'],
      catchphrases: ['嘿', '嘿嘿'],
      panicTick: 'scream',
    },
  },

  // ===== 第二批 =====
  liu_fang: { // 哭腔急促、不停重复孩子的名字
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: { panicTick: 'sob', interjects: true, echoes: true },
  },
  sun_wei: { // 语速快但还算清晰、不断问怎么办
    verbosity: 1, rationality: 0, medicalLiteracy: 1,
    personality: { interjects: true, catchphrases: ['怎么办，怎么办'] },
  },
  zhou_ming: { // 语气镇定、叙述有条理、冷静配合
    verbosity: 1, rationality: 2, medicalLiteracy: 1,
    personality: {},
  },
  wu_lili: { // 尖叫哭泣、需要反复安抚
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: { panicTick: 'sob', interjects: true },
  },
  huang_qiang: { // 声音发颤、不断追问还有多久
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: { address: ['师傅'], interjects: true },
  },
  lin_mei: { // 紧张但配合、主动补充观察细节
    verbosity: 1, rationality: 1, medicalLiteracy: 2,
    personality: { catchphrases: ['那个'] },
  },
  ma_tao: { // 焦急但克制、反复确认操作
    verbosity: 1, rationality: 1, medicalLiteracy: 1,
    personality: { echoes: true },
  },
  ye_xin: { // 语速极快、夹杂哭喊
    verbosity: 2, rationality: 0, medicalLiteracy: 1,
    personality: { panicTick: 'sob', interjects: true },
  },
  lu_jie: { // 惊慌混乱、说不清细节
    verbosity: 1, rationality: 0, medicalLiteracy: 0,
    personality: { panicTick: 'stammer', echoes: true },
  },
  fang_yu: { // 不知所措、需要明确指令
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: { panicTick: 'stammer', interjects: true },
  },

  // ===== 第三批 =====
  xu_dawei: { // 说话断断续续、疼得倒吸冷气
    verbosity: 0, rationality: 1, medicalLiteracy: 1,
    personality: { panicTick: 'stammer', catchphrases: ['哎哟'] },
  },
  song_na: { // 声音发抖语速极快、不停哭喊
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: { panicTick: 'sob', interjects: true },
  },
  he_lin: { // 语气犹豫、不太确定现场情况
    verbosity: 1, rationality: 1, medicalLiteracy: 0,
    personality: { catchphrases: ['呃', '那个'], echoes: true },
  },
  tian_feng: { // 强忍疼痛、说话简短
    verbosity: 0, rationality: 1, medicalLiteracy: 1,
    personality: { panicTick: 'stammer' },
  },
  cheng_xin: { // 尖叫哭喊无法冷静
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: { panicTick: 'scream', interjects: true },
  },
  luo_wei: { // 声音急促慌乱、不断追问
    verbosity: 1, rationality: 0, medicalLiteracy: 0,
    personality: { interjects: true },
  },
  gao_yan: { // 声音虚弱含混、话说不完整
    verbosity: 0, rationality: 1, medicalLiteracy: 0,
    personality: { panicTick: 'stammer', echoes: true },
  },
  fan_tao: { // 着急但能配合、描述状态变化
    verbosity: 1, rationality: 1, medicalLiteracy: 2,
    personality: { catchphrases: ['那个'] },
  },
  long_jie: { // 语气迷糊、说不清来龙去脉
    verbosity: 1, rationality: 0, medicalLiteracy: 0,
    personality: { panicTick: 'stammer', echoes: true },
  },
  deng_yu: { // 语气低沉克制、明显焦虑
    verbosity: 0, rationality: 2, medicalLiteracy: 1,
    personality: { panicTick: 'stammer' },
  },
  jiang_wen: { // 颤抖着压低声音
    verbosity: 0, rationality: 1, medicalLiteracy: 0,
    personality: { panicTick: 'stammer' },
  },
  han_lei: { // 语气冷静但很用力、扶住患者
    verbosity: 1, rationality: 2, medicalLiteracy: 1,
    personality: {},
  },
  xu_mei: { // 焦急但条理清楚、主动描述
    verbosity: 2, rationality: 2, medicalLiteracy: 1,
    personality: { catchphrases: ['这孩子'] },
  },

  // ===== 补充 =====
  lei_gang: { // 声音沙哑慌乱、大喊着描述
    verbosity: 2, rationality: 0, medicalLiteracy: 0,
    personality: { panicTick: 'shout', interjects: true },
  },
  zhong_qi: { // 压低声音、反复问要不要报警
    verbosity: 1, rationality: 1, medicalLiteracy: 0,
    personality: { catchphrases: ['要不要报警'], interjects: true },
  },
  wei_qiang: { // 焦急但配合、反复催促
    verbosity: 1, rationality: 1, medicalLiteracy: 0,
    personality: { interjects: true },
  },
  zheng_yu: { // 说话断断续续、需要引导
    verbosity: 0, rationality: 1, medicalLiteracy: 1,
    personality: { panicTick: 'stammer' },
  },
}

/** 缺省特质：一般、一般、一般 */
export const DEFAULT_VOICE: CallerVoice = { verbosity: 1, rationality: 1, medicalLiteracy: 1 }

export function getVoice(id: CallerId): CallerVoice {
  return CALLER_VOICES[id] ?? DEFAULT_VOICE
}

export const ALL_VOICES = CALLER_VOICES