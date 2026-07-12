// ============================================================
// 零点接线台 — 结局系统
// ============================================================

import type { EndingDef } from '../types'

export const ENDINGS: EndingDef[] = [
  {
    id: 'life_guardian',
    title: '生命守夜人',
    subtitle: '你是这座城市黑夜中最亮的光',
    badge: '★ 金牌调度员',
    minScore: 350,
    description: '每一通电话都处理得近乎完美。派车速度快、信息收集全、分诊准确、急救指导到位。你就是120调度中心最值得信赖的接线员。今晚，因为你，多条生命得以延续。',
  },
  {
    id: 'efficient_dispatcher',
    title: '高效调度师',
    subtitle: '你的冷静和专业拯救了无数家庭',
    badge: '★ 银牌调度员',
    minScore: 250,
    description: '你展现了专业调度员应有的素质：派车及时、问询恰当、分诊基本正确。虽然有些小瑕疵，但整体表现可圈可点。继续积累经验，你离金牌调度员只有一步之遥。',
  },
  {
    id: 'rookie_night',
    title: '新人之夜',
    subtitle: '这条路还很长，但你已经迈出了第一步',
    badge: '★ 铜牌调度员',
    minScore: 150,
    description: '作为新人，你的表现还算及格。但在派车速度、信息收集和急救指导方面还有很大的提升空间。记住：1分钟内派车是底线，四要素是基本功，MPDS是救命工具。明天继续加油！',
  },
  {
    id: 'zero_mistake',
    title: '一次都不能错',
    subtitle: '今晚的教训将永远铭刻在你心中',
    badge: '⚠ 需要复训',
    minScore: 0,
    description: '很遗憾，今晚的表现不及格。派车延迟、信息遗漏、分诊错误……每一个失误都可能意味着一条生命的逝去。120调度员的工作，一次都不能错。请认真反思，重新培训后再上岗。',
  },
]

export function detectEnding(totalScore: number): EndingDef {
  // 从高到低匹配
  for (const ending of ENDINGS) {
    if (totalScore >= ending.minScore) {
      return ending
    }
  }
  return ENDINGS[ENDINGS.length - 1]
}

export function getEndingById(id: string): EndingDef | undefined {
  return ENDINGS.find(e => e.id === id)
}
