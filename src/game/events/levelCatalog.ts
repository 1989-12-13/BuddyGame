// ============================================================
// 场景选择（选关列表）的唯一事实源
// ============================================================
// 抽成独立模块，因为它要满足两个约束：
//   1. 「场景选择」画面只负责渲染，不再自己派生列表；
//   2. 每个关卡 id 必须能在场景表里查到 —— 否则点进去会永远等不到电话。
//      这条约束由 levelCatalog.test.ts 逐个 id 验证。
//
// 编号取 MPDS 协议号，标题取卡片标题，呈现信息来自 menu 覆盖或类别默认值。
// 恶作剧与变体卡片不进选关列表。
// ============================================================

import { ALL_CARDS } from './cards'
import { MENU_META } from './categories'

export interface LevelEntry {
  id: string
  num: number
  title: string
  desc: string
  category: string
  /** 小游戏类型标识 */
  tag: string
}

export const LEVEL_CATALOG: LevelEntry[] = ALL_CARDS
  .filter(card => !card.isPrank && !card.variantOf)
  .map(card => {
    const meta = card.menu ?? MENU_META[card.id]
    return {
      id: card.id,
      num: card.mpdsCard.number,
      title: card.title,
      desc: meta?.desc ?? '',
      category: meta?.category ?? '其他',
      tag: meta?.tag ?? '📞',
    }
  })
