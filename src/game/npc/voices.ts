// ============================================================
// 120调度台 — 来电者说话特质表
// ============================================================
// 与 personas.ts 分开维护：
//   personas.ts 回答「他是谁」（姓名 / 关系 / 情绪基调 / 风格描述）
//   voices.ts   回答「他怎么说话」（可被机制读取的结构化特质）
//
// 依据 personas.ts 的 speechStyle 与 relationship 标注，
// 只影响措辞，不影响信息质量与评分。
// ============================================================

import type { CallerId, CallerVoice } from '../types'

const CALLER_VOICES: Record<CallerId, CallerVoice> = {
  // ===== 原始场景 =====
  li_jianguo:   { verbosity: 1, rationality: 0, medicalLiteracy: 0 }, // 语速极快、断断续续、带哭腔
  wang_xiao:    { verbosity: 1, rationality: 2, medicalLiteracy: 1 }, // 冷静但略显紧张、叙述有条理
  zhang_xiulan: { verbosity: 2, rationality: 0, medicalLiteracy: 0 }, // 说话慢、容易跑题、记不清细节
  zhao_lei:     { verbosity: 2, rationality: 0, medicalLiteracy: 0 }, // 大喊大叫、反复说"快点来"
  chen_ming:    { verbosity: 1, rationality: 1, medicalLiteracy: 1 }, // 紧张但尽力配合、主动提供信息
  xiao_pang:    { verbosity: 2, rationality: 0, medicalLiteracy: 0 }, // 童声、嘻嘻哈哈

  // ===== 第二批 =====
  liu_fang:     { verbosity: 2, rationality: 0, medicalLiteracy: 0 }, // 哭腔急促、不停重复孩子的名字
  sun_wei:      { verbosity: 1, rationality: 0, medicalLiteracy: 1 }, // 语速快但还算清晰、不断问怎么办
  zhou_ming:    { verbosity: 1, rationality: 2, medicalLiteracy: 1 }, // 语气镇定、叙述有条理、冷静配合
  wu_lili:      { verbosity: 2, rationality: 0, medicalLiteracy: 0 }, // 尖叫哭泣、需要反复安抚
  huang_qiang:  { verbosity: 2, rationality: 0, medicalLiteracy: 0 }, // 声音发颤、不断追问还有多久
  lin_mei:      { verbosity: 1, rationality: 1, medicalLiteracy: 2 }, // 紧张但配合、主动补充观察细节
  ma_tao:       { verbosity: 1, rationality: 1, medicalLiteracy: 1 }, // 焦急但克制、反复确认操作
  ye_xin:       { verbosity: 2, rationality: 0, medicalLiteracy: 1 }, // 语速极快、夹杂哭喊
  lu_jie:       { verbosity: 1, rationality: 0, medicalLiteracy: 0 }, // 惊慌混乱、说不清细节
  fang_yu:      { verbosity: 2, rationality: 0, medicalLiteracy: 0 }, // 不知所措、需要明确指令

  // ===== 第三批 =====
  xu_dawei:     { verbosity: 0, rationality: 1, medicalLiteracy: 1 }, // 说话断断续续、疼得倒吸冷气
  song_na:      { verbosity: 2, rationality: 0, medicalLiteracy: 0 }, // 声音发抖语速极快、不停哭喊
  he_lin:       { verbosity: 1, rationality: 1, medicalLiteracy: 0 }, // 语气犹豫、不太确定现场情况
  tian_feng:    { verbosity: 0, rationality: 1, medicalLiteracy: 1 }, // 强忍疼痛、说话简短
  cheng_xin:    { verbosity: 2, rationality: 0, medicalLiteracy: 0 }, // 尖叫哭喊无法冷静
  luo_wei:      { verbosity: 1, rationality: 0, medicalLiteracy: 0 }, // 声音急促慌乱、不断追问
  gao_yan:      { verbosity: 0, rationality: 1, medicalLiteracy: 0 }, // 声音虚弱含混、话说不完整
  fan_tao:      { verbosity: 1, rationality: 1, medicalLiteracy: 2 }, // 着急但能配合、描述状态变化
  long_jie:     { verbosity: 1, rationality: 0, medicalLiteracy: 0 }, // 语气迷糊、说不清来龙去脉
  deng_yu:      { verbosity: 0, rationality: 2, medicalLiteracy: 1 }, // 语气低沉克制、明显焦虑
  jiang_wen:    { verbosity: 0, rationality: 1, medicalLiteracy: 0 }, // 颤抖着压低声音
  han_lei:      { verbosity: 1, rationality: 2, medicalLiteracy: 1 }, // 语气冷静但很用力、扶住患者
  xu_mei:       { verbosity: 2, rationality: 2, medicalLiteracy: 1 }, // 焦急但条理清楚、主动描述

  // ===== 补充 =====
  lei_gang:     { verbosity: 2, rationality: 0, medicalLiteracy: 0 }, // 声音沙哑慌乱、大喊着描述
  zhong_qi:     { verbosity: 1, rationality: 1, medicalLiteracy: 0 }, // 压低声音、反复问要不要报警
  wei_qiang:    { verbosity: 1, rationality: 1, medicalLiteracy: 0 }, // 焦急但配合、反复催促
  zheng_yu:     { verbosity: 0, rationality: 1, medicalLiteracy: 1 }, // 说话断断续续、需要引导
}

/** 缺省特质：一般、一般、一般 */
export const DEFAULT_VOICE: CallerVoice = { verbosity: 1, rationality: 1, medicalLiteracy: 1 }

export function getVoice(id: CallerId): CallerVoice {
  return CALLER_VOICES[id] ?? DEFAULT_VOICE
}

export const ALL_VOICES = CALLER_VOICES
