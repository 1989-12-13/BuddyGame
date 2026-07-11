// ============================================================
// 零点接线台 — 来电者人物数据
// ============================================================

import type { CallerId, CallerProfile } from '../types'

const CALLERS: Record<CallerId, CallerProfile> = {
  li_jianguo: {
    id: 'li_jianguo',
    name: '李建国',
    relationship: '丈夫',
    tone: 'panic',
    speechStyle: '语速极快、断断续续、带着哭腔',
  },
  wang_xiao: {
    id: 'wang_xiao',
    name: '王晓',
    relationship: '路人',
    tone: 'calm',
    speechStyle: '冷静但略显紧张、叙述有条理',
  },
  zhang_xiulan: {
    id: 'zhang_xiulan',
    name: '张秀兰',
    relationship: '邻居',
    tone: 'confused',
    speechStyle: '说话慢、容易跑题、记不清细节',
  },
  zhao_lei: {
    id: 'zhao_lei',
    name: '赵磊',
    relationship: '丈夫',
    tone: 'hysterical',
    speechStyle: '大喊大叫、语无伦次、反复说"快点来"',
  },
  chen_ming: {
    id: 'chen_ming',
    name: '陈明',
    relationship: '同事',
    tone: 'anxious',
    speechStyle: '紧张但尽力配合、会主动提供信息',
  },
  xiao_pang: {
    id: 'xiao_pang',
    name: '小朋友',
    relationship: '小孩',
    tone: 'calm',
    speechStyle: '童声、嘻嘻哈哈、明显在恶作剧',
  },
  // === 卡片场景人物 ===
  liu_fang: {
    id: 'liu_fang', name: '刘芳', relationship: '母亲',
    tone: 'anxious', speechStyle: '声音颤抖、反复确认、语气焦急',
  },
  sun_wei: {
    id: 'sun_wei', name: '孙伟', relationship: '同事',
    tone: 'panic', speechStyle: '说话急促、呼吸沉重、描述零碎',
  },
  zhou_ming: {
    id: 'zhou_ming', name: '周明', relationship: '路人',
    tone: 'anxious', speechStyle: '语速中等、描述细致但紧张',
  },
  wu_lili: {
    id: 'wu_lili', name: '吴丽丽', relationship: '母亲',
    tone: 'hysterical', speechStyle: '哭声大喊声交错、语无伦次',
  },
  huang_qiang: {
    id: 'huang_qiang', name: '黄强', relationship: '丈夫',
    tone: 'panic', speechStyle: '说话急促、反复确认',
  },
  lin_mei: {
    id: 'lin_mei', name: '林美', relationship: '妻子',
    tone: 'confused', speechStyle: '说话慢、需要引导才能说出关键信息',
  },
  ma_tao: {
    id: 'ma_tao', name: '马涛', relationship: '邻居',
    tone: 'calm', speechStyle: '冷静有条理、主动提供地址和情况',
  },
  ye_xin: {
    id: 'ye_xin', name: '叶欣', relationship: '路人',
    tone: 'anxious', speechStyle: '语速快但能说清事情经过',
  },
  lu_jie: {
    id: 'lu_jie', name: '卢洁', relationship: '朋友',
    tone: 'panic', speechStyle: '语气惊慌、反复催促',
  },
  fang_yu: {
    id: 'fang_yu', name: '方宇', relationship: '同事',
    tone: 'anxious', speechStyle: '紧张但尽力配合、描述清晰',
  },
  xu_dawei: {
    id: 'xu_dawei', name: '徐大伟', relationship: '丈夫',
    tone: 'panic', speechStyle: '语速极快、声音发抖、不断重复',
  },
  song_na: {
    id: 'song_na', name: '宋娜', relationship: '路人',
    tone: 'anxious', speechStyle: '语气紧张但逻辑清晰',
  },
  he_lin: {
    id: 'he_lin', name: '何琳', relationship: '本人',
    tone: 'calm', speechStyle: '轻声细语、说完需要休息',
  },
  tian_feng: {
    id: 'tian_feng', name: '田峰', relationship: '同事',
    tone: 'calm', speechStyle: '沉稳、报告伤情客观精准',
  },
  cheng_xin: {
    id: 'cheng_xin', name: '程欣', relationship: '母亲',
    tone: 'hysterical', speechStyle: '崩溃大哭、声音尖锐、断断续续',
  },
  luo_wei: {
    id: 'luo_wei', name: '罗伟', relationship: '同事',
    tone: 'anxious', speechStyle: '紧张但叙述完整',
  },
  gao_yan: {
    id: 'gao_yan', name: '高燕', relationship: '妻子',
    tone: 'panic', speechStyle: '语气惊慌、语句短促',
  },
  fan_tao: {
    id: 'fan_tao', name: '范涛', relationship: '工友',
    tone: 'anxious', speechStyle: '语速快、夹杂方言、重复描述',
  },
  long_jie: {
    id: 'long_jie', name: '龙洁', relationship: '室友',
    tone: 'panic', speechStyle: '语速极快、情绪激动、不断询问',
  },
  wei_qiang: {
    id: 'wei_qiang', name: '魏强', relationship: '司机',
    tone: 'panic', speechStyle: '语速极快、声音发抖、多次重复',
  },
  zhong_qi: {
    id: 'zhong_qi', name: '钟启', relationship: '父亲',
    tone: 'anxious', speechStyle: '声音低沉、沉着但语气透露出紧张',
  },
}

export function getCaller(id: CallerId): CallerProfile {
  const c = CALLERS[id]
  if (!c) throw new Error(`Unknown caller: ${id}`)
  return c
}

export const ALL_CALLER_IDS = Object.keys(CALLERS)
