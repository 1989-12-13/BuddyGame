// ============================================================
// 场景选择 → 事故电话 的映射回归
// ============================================================
// 踩过的坑：「场景选择」里点某一关进去后，电话一直不来。
// 根因是接听入口被关在默认收起的抽屉里（UI 问题），但这条链路本身
// 也需要一个自动校验：选关列表里的每个 id 都必须能开出对应的那一通电话。
// 任何一环断掉（卡片 id 改了、场景表漏了、队列没写进去、接听没取到），这里直接红。
// ============================================================

import { describe, expect, it } from 'vitest'
import { LEVEL_CATALOG } from './levelCatalog'
import { getScenario, SCENARIO_IDS } from './templates'
import { createInitialState } from '../core/worldState'
import { worldReducer } from '../core/worldReducer'

describe('场景选择 · 关卡映射', () => {
  it('选关列表不为空，且每个关卡 id 都能在场景表里查到', () => {
    expect(LEVEL_CATALOG.length).toBeGreaterThan(0)
    for (const level of LEVEL_CATALOG) {
      expect(SCENARIO_IDS, `场景表缺少 ${level.id}`).toContain(level.id)
      expect(() => getScenario(level.id)).not.toThrow()
    }
  })

  it('卡片 id 不重复（重复会让两个关卡指向同一通电话）', () => {
    const ids = LEVEL_CATALOG.map(level => level.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('点进任意一关并接听，加载的都是那一关的场景', () => {
    for (const level of LEVEL_CATALOG) {
      const started = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: [level.id] })
      expect(started.scenarioQueue, `${level.id} 未进入排队`).toEqual([level.id])
      expect(started.totalCalls, `${level.id} 的总通数不对`).toBe(1)

      // 进入场景后玩家按下「接听来电」
      const answered = worldReducer(started, { type: 'ANSWER_CALL' })
      expect(answered.currentCall, `${level.id} 接听后没有载入场景`).not.toBeNull()
      expect(answered.currentCall!.id).toBe(level.id)
      expect(answered.callerState, `${level.id} 接听后没有来电者状态`).not.toBeNull()
    }
  })

  it('没有指定关卡时不写死任何场景（走并发班次的抽卡）', () => {
    const started = worldReducer(createInitialState(), { type: 'START_SHIFT' })
    expect(started.scenarioQueue).toEqual([])
    expect(started.totalCalls).toBe(0)
    // 队列为空时接听不会凭空造出一通电话
    expect(worldReducer(started, { type: 'ANSWER_CALL' }).currentCall).toBeNull()
  })
})
