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
}

export function getCaller(id: CallerId): CallerProfile {
  const c = CALLERS[id]
  if (!c) throw new Error(`Unknown caller: ${id}`)
  return c
}

export const ALL_CALLER_IDS = Object.keys(CALLERS)
