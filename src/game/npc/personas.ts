// ============================================================
// 零点接线台 — 来电者人物数据
// ============================================================

import type { CallerId, CallerProfile } from '../types'

const CALLERS: Record<CallerId, CallerProfile> = {
  li_jianguo: {
    id: 'li_jianguo',
    name: '李建国',
    relationship: '丈夫',
    tone: '失控',
    speechStyle: '语速极快、断断续续、带着哭腔',
  },
  wang_xiao: {
    id: 'wang_xiao',
    name: '王晓',
    relationship: '路人',
    tone: '紧张',
    speechStyle: '冷静但略显紧张、叙述有条理',
  },
  zhang_xiulan: {
    id: 'zhang_xiulan',
    name: '张秀兰',
    relationship: '邻居',
    tone: '恐慌',
    speechStyle: '说话慢、容易跑题、记不清细节',
  },
  zhao_lei: {
    id: 'zhao_lei',
    name: '赵磊',
    relationship: '丈夫',
    tone: '失控',
    speechStyle: '大喊大叫、语无伦次、反复说"快点来"',
  },
  chen_ming: {
    id: 'chen_ming',
    name: '陈明',
    relationship: '同事',
    tone: '紧张',
    speechStyle: '紧张但尽力配合、会主动提供信息',
  },
  xiao_pang: {
    id: 'xiao_pang',
    name: '小朋友',
    relationship: '小孩',
    tone: '镇定',
    speechStyle: '童声、嘻嘻哈哈、明显在恶作剧',
  },

  // ===== 新场景来电者 =====

  liu_fang: {
    id: 'liu_fang',
    name: '刘芳',
    relationship: '母亲',
    tone: '失控',
    speechStyle: '哭腔急促、声音颤抖、不停重复孩子的名字',
  },
  sun_wei: {
    id: 'sun_wei',
    name: '孙伟',
    relationship: '朋友',
    tone: '恐慌',
    speechStyle: '语速快但还算清晰、不断询问该怎么办',
  },
  zhou_ming: {
    id: 'zhou_ming',
    name: '周明',
    relationship: '路人',
    tone: '恐慌',
    speechStyle: '语气镇定、叙述有条理、能冷静配合',
  },
  wu_lili: {
    id: 'wu_lili',
    name: '吴丽丽',
    relationship: '妻子',
    tone: '失控',
    speechStyle: '尖叫哭泣、语无伦次、需要反复安抚才能回答问题',
  },
  huang_qiang: {
    id: 'huang_qiang',
    name: '黄强',
    relationship: '父亲',
    tone: '紧张',
    speechStyle: '声音发颤但努力配合、不断追问救护车还有多久',
  },
  lin_mei: {
    id: 'lin_mei',
    name: '林美',
    relationship: '同事',
    tone: '紧张',
    speechStyle: '紧张但尽量配合、会主动补充观察到的细节',
  },
  ma_tao: {
    id: 'ma_tao',
    name: '马涛',
    relationship: '儿子',
    tone: '紧张',
    speechStyle: '焦急但克制、反复确认自己的操作是否正确',
  },
  ye_xin: {
    id: 'ye_xin',
    name: '叶欣',
    relationship: '朋友',
    tone: '恐慌',
    speechStyle: '语速极快、夹杂哭喊、手上还在做止血操作',
  },
  lu_jie: {
    id: 'lu_jie',
    name: '卢杰',
    relationship: '室友',
    tone: '恐慌',
    speechStyle: '声音惊慌混乱、说不清细节、急需引导',
  },
  fang_yu: {
    id: 'fang_yu',
    name: '方宇',
    relationship: '工友',
    tone: '恐慌',
    speechStyle: '不知所措、反复确认是否安全、需要明确指令',
  },

  // ===== 第三批来电者 =====

  xu_dawei: {
    id: 'xu_dawei',
    name: '徐大伟',
    relationship: '本人',
    tone: '紧张',
    speechStyle: '说话断断续续疼得倒吸冷气、非常紧张',
  },
  song_na: {
    id: 'song_na',
    name: '宋娜',
    relationship: '母亲',
    tone: '恐慌',
    speechStyle: '声音发抖语速极快、不停哭喊被狗咬出血了',
  },
  he_lin: {
    id: 'he_lin',
    name: '何林',
    relationship: '路人',
    tone: '紧张',
    speechStyle: '语气犹豫、有点不知所措、不太确定现场情况',
  },
  tian_feng: {
    id: 'tian_feng',
    name: '田峰',
    relationship: '本人',
    tone: '紧张',
    speechStyle: '强忍疼痛、说话简短、需要引导才能提供更多细节',
  },
  cheng_xin: {
    id: 'cheng_xin',
    name: '程欣',
    relationship: '母亲',
    tone: '失控',
    speechStyle: '尖叫哭喊无法冷静、反复说孩子吃东西卡住了快不行了',
  },
  luo_wei: {
    id: 'luo_wei',
    name: '罗伟',
    relationship: '工友',
    tone: '恐慌',
    speechStyle: '声音急促慌乱、不断追问会不会瞎',
  },
  gao_yan: {
    id: 'gao_yan',
    name: '高燕',
    relationship: '本人',
    tone: '恐慌',
    speechStyle: '声音虚弱含混、话说不完整、有时答非所问',
  },
  fan_tao: {
    id: 'fan_tao',
    name: '范涛',
    relationship: '同事',
    tone: '恐慌',
    speechStyle: '着急但能配合、不断描述患者状态变化',
  },
  long_jie: {
    id: 'long_jie',
    name: '龙杰',
    relationship: '室友',
    tone: '恐慌',
    speechStyle: '语气迷糊、说不清来龙去脉、需要耐心引导',
  },
  deng_yu: {
    id: 'deng_yu',
    name: '邓雨',
    relationship: '朋友',
    tone: '紧张',
    speechStyle: '语气低沉克制但明显焦虑、说话时周围很安静',
  },
  jiang_wen: {
    id: 'jiang_wen',
    name: '蒋文',
    relationship: '路人',
    tone: '恐慌',
    speechStyle: '颤抖着压低声音说话好像在躲避危险、说有人在打架被捅了',
  },
  han_lei: {
    id: 'han_lei',
    name: '韩磊',
    relationship: '路人',
    tone: '紧张',
    speechStyle: '语气冷静但说话很用力、正在试图扶住站不稳的患者',
  },
  xu_mei: {
    id: 'xu_mei',
    name: '徐梅',
    relationship: '母亲',
    tone: '紧张',
    speechStyle: '声音焦急但条理清楚、主动描述孩子从哪天开始不舒服',
  },
  lei_gang: {
    id: 'lei_gang',
    name: '雷刚',
    relationship: '工友',
    tone: '恐慌',
    speechStyle: '声音沙哑慌乱、周围有嘈杂的工地声音、大喊着描述情况',
  },
  zhong_qi: {
    id: 'zhong_qi',
    name: '钟奇',
    relationship: '邻居',
    tone: '紧张',
    speechStyle: '压低声音说话、语气紧张、反复问要不要报警',
  },

  // ===== 最后补充 =====

  wei_qiang: {
    id: 'wei_qiang',
    name: '魏强',
    relationship: '家属',
    tone: '紧张',
    speechStyle: '语气焦急但积极配合、反复催促快点来',
  },
  zheng_yu: {
    id: 'zheng_yu',
    name: '郑宇',
    relationship: '本人',
    tone: '紧张',
    speechStyle: '说话断断续续、疼得坐立不安、需要引导才能说清症状',
  },
}

export function getCaller(id: CallerId): CallerProfile {
  const c = CALLERS[id]
  if (!c) throw new Error(`Unknown caller: ${id}`)
  return c
}

export const ALL_CALLER_IDS = Object.keys(CALLERS)
