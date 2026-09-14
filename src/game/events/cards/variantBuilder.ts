// ============================================================
// 120调度台 — 变体卡展开
//
// 变体与母卡共用协议号、标题、判定码与分诊等级，只替换情境（来电者 /
// 开场白 / 病情描述 / 回答文本 / 特殊事件）。因此变体按构造就满足一致性测试。
//
// 复用母卡的一切：问询结构、急救指导、四要素地址、结果叙述。
// ============================================================

import type { EmergencyScenario, ScenarioVariant } from '../../types'

export const VARIANT_SEPARATOR = '__'

/** 母卡 id + 变体短名 → 变体卡 id */
export function variantId(baseId: string, variantName: string): string {
  return `${baseId}${VARIANT_SEPARATOR}${variantName}`
}

/**
 * 把一条 ScenarioVariant 展开成可玩、可抽取的独立卡片。
 *
 * 合并策略：
 * - `condition` 浅合并到母卡的病情描述，未提供的字段沿用母卡。
 * - `answers` 按 question id 覆盖回答文本，未涉及的问询原样保留。
 * - `specialEvents` 提供时整体替换（变体的机制差异通常在这里）。
 * - `callerId` 取 callers[0]，真正的随机选择发生在接通时（presentScenario.ts）。
 */
export function buildVariant(base: EmergencyScenario, variant: ScenarioVariant): EmergencyScenario {
  const id = variantId(base.id, variant.id)
  const callerId = variant.callers[0]
  if (!callerId) throw new Error(`变体 ${id}: callers 不能为空`)

  const questions = base.mpdsQuestions.map(q => {
    const override = variant.answers?.[q.id]
    return override ? { ...q, ...override } : q
  })

  return {
    ...base,
    id,
    title: base.title,
    variantOf: base.id,
    callerId,
    callerPool: variant.callers,
    openingLine: variant.openingLine,
    menu: variant.menu ?? base.menu,
    variants: undefined,
    fourElements: {
      ...base.fourElements,
      condition: { ...base.fourElements.condition, ...variant.condition },
      purpose: variant.purpose ?? base.fourElements.purpose,
    },
    mpdsQuestions: questions,
    specialEvents: variant.specialEvents ?? base.specialEvents,
    outcomeNarrative: variant.outcomeNarrative
      ? { ...base.outcomeNarrative, ...variant.outcomeNarrative }
      : base.outcomeNarrative,
    // 母卡的这些字段按定义已完整，变体不再单独维护
    phoneNumber: base.phoneNumber,
    baseStation: base.baseStation,
    correctTriage: base.correctTriage,
    mpdsCard: base.mpdsCard,
  }
}

/** 展开一批母卡的全部变体 */
export function expandVariants(cards: EmergencyScenario[]): EmergencyScenario[] {
  return cards.flatMap(card =>
    (card.variants ?? []).map(variant => buildVariant(card, variant)),
  )
}
