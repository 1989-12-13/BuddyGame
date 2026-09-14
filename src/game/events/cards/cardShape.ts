// ============================================================
// 120调度台 — 病例卡脚手架的开发期自检
//
// 卡片内容由作者手写，这里只把「写法上必然容易漏掉、又必须成立」的几条
// 断言在开发期喊出来，省得等一致性测试跑起来才发现。
// ============================================================

import type { EmergencyScenario } from '../../types'
import { getProtocolByNumber } from '../../content'

/**
 * 校验一张卡片的结构约束。开发期调用（`if (import.meta.env.DEV)`），生产构建会被摇掉。
 * 一致性测试里也有同样的检查，这里的作用是让作者在卡片文件里就拿到反馈。
 */
export function assertCardShape(card: EmergencyScenario): void {
  const where = `病例卡 ${card.id || '(缺少 id)'}`
  if (!card.id) throw new Error(`${where}: id 不能为空`)
  if (!card.title) throw new Error(`${where}: title 不能为空`)
  if (!card.openingLine) throw new Error(`${where}: openingLine 不能为空`)

  const proto = getProtocolByNumber(card.mpdsCard.number)
  if (!proto) throw new Error(`${where}: 协议 ${card.mpdsCard.number} 不在 PROTOCOLS 中`)
  if (card.mpdsCard.title !== proto.title) {
    throw new Error(`${where}: 标题「${card.mpdsCard.title}」与协议 ${proto.number}「${proto.title}」不符`)
  }
  if (card.correctTriage !== proto.correctTriage) {
    throw new Error(`${where}: 分诊 ${card.correctTriage} 与协议 ${proto.number} 的期望值 ${proto.correctTriage} 不符`)
  }
  if (card.mpdsCard.hotCold !== proto.hotCold) {
    throw new Error(`${where}: 冷热 ${card.mpdsCard.hotCold} 与协议 ${proto.number} 的期望值 ${proto.hotCold} 不符`)
  }
  if (card.mpdsCard.keyQuestions.length < 1) throw new Error(`${where}: 至少需要一个 keyQuestion`)

  const questionIds = card.mpdsQuestions.map(q => q.id)
  if (new Set(questionIds).size !== questionIds.length) throw new Error(`${where}: mpdsQuestions 存在重复 id`)
  for (const q of card.mpdsQuestions) {
    if (!q.answer.trim()) throw new Error(`${where}: 问题 ${q.id} 缺少 answer`)
    if (!q.ramblingAnswer.trim()) throw new Error(`${where}: 问题 ${q.id} 缺少 ramblingAnswer`)
    if (!q.panickedAnswer.trim()) throw new Error(`${where}: 问题 ${q.id} 缺少 panickedAnswer`)
  }

  if (card.guidance) {
    const stepIds = card.guidance.steps.map(s => s.id)
    if (new Set(stepIds).size !== stepIds.length) throw new Error(`${where}: guidance steps 存在重复 id`)
  }

  const eventIds = card.specialEvents.map(e => e.id)
  if (new Set(eventIds).size !== eventIds.length) throw new Error(`${where}: specialEvents 存在重复 id`)
}
