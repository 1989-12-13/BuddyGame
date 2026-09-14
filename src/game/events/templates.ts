// ============================================================
// 120调度台 — 场景注册总表
//
// 卡片清单的唯一真源是 cards/index.ts 的 ALL_CARDS（含 variants 展开出的变体），
// 这里只把它转成按 id 索引的注册表，不再单独维护一份列表。
// ============================================================

import type { EmergencyScenario } from '../types'
import { ALL_CARDS } from './cards'

/**
 * 所有可用场景的注册表
 * key 为场景 ID，value 为场景数据
 */
export const SCENARIOS: Record<string, EmergencyScenario> = Object.fromEntries(
  ALL_CARDS.map(card => [card.id, card]),
)

/** 所有场景ID列表 */
export const SCENARIO_IDS = Object.keys(SCENARIOS)

/** 按ID获取场景 */
export function getScenario(id: string): EmergencyScenario {
  const s = SCENARIOS[id]
  if (!s) throw new Error(`Unknown scenario: ${id}`)
  return s
}
