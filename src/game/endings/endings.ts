// ============================================================
// 120调度台 — 结局系统
// ============================================================

import type { EndingDef } from '../types'

export const ENDINGS: EndingDef[] = [
  {
    id: 'life_guardian',
    title: '生命守夜人',
    subtitle: '你在压力中保持了清楚、稳定的判断',
    badge: '★ 表现出色',
    minScore: 350,
    description: '你准确确认了关键信息，及时完成调度，并把电话指导说得清楚。复盘每通电话的记录，继续保持这种有条理的工作方式。',
  },
  {
    id: 'efficient_dispatcher',
    title: '高效调度师',
    subtitle: '清楚的问询让救援一步步接近',
    badge: '★ 表现稳健',
    minScore: 250,
    description: '多数来电都得到了有条理的处理。查看复盘中标出的遗漏，在下一次值班中更快确认地点、意识和呼吸等关键信息。',
  },
  {
    id: 'rookie_night',
    title: '新人之夜',
    subtitle: '这条路还很长，但你已经迈出了第一步',
    badge: '★ 完成值班',
    minScore: 150,
    description: '你完成了第一次独立值班，也发现了容易遗漏的环节。先听清地点和患者状态，再核对响应优先级；一次只处理一个明确步骤。',
  },
  {
    id: 'zero_mistake',
    title: '从复盘再出发',
    subtitle: '每一次练习，都在训练更清楚的判断',
    badge: '◇ 建议再练一次',
    minScore: 0,
    description: '这次值班暴露了几个关键遗漏。打开每通电话的复盘，先练习准确报告地点、描述意识与呼吸，并在现实紧急情况中听从专业调度指导。',
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
