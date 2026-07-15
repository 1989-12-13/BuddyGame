// ============================================================
// 打乱工具 — 生成选项索引的随机排列与双向映射
// 用于在渲染层打乱选择题选项顺序，同时保持数据层不受影响
// ============================================================

import { shuffle } from '../game/core/random'

export interface ShuffleMap {
  /** 显示索引 → 原始索引（用户点第 n 项，对应原始数据中的第几个） */
  toOriginal: number[]
  /** 原始索引 → 显示索引（用于已选项的高亮定位） */
  toDisplay: number[]
}

/** 为给定长度的数组生成打乱后的索引映射表 */
export function createShuffleMap(length: number): ShuffleMap {
  const indices = Array.from({ length }, (_, i) => i)
  const toOriginal = shuffle(indices)
  const toDisplay: number[] = []
  toOriginal.forEach((origIdx, displayIdx) => {
    toDisplay[origIdx] = displayIdx
  })
  return { toOriginal, toDisplay }
}
