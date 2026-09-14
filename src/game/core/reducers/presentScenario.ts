// ============================================================
// 120调度台 — 接通时确定本通的来电者
//
// 一张卡的 callerPool / 变体可以有多个来电者，具体是谁在接通那一刻才定，
// 这样同一张卡重玩会换人说话。经典模式与并发值班都经 handleAnswerCall，
// 所以在这里收口即可。
// ============================================================

import type { EmergencyScenario } from '../../types'
import { rngInt } from '../random'

/**
 * 决定这一通电话由谁来打。
 *
 * - 显式传入 forced 时用它（存档恢复、测试等确定性场景）。
 * - 否则若卡片带 callerPool，从中随机取一位。
 * - 都没有则沿用卡片自带的 callerId。
 *
 * 只改 callerId；其余字段与压力初值都由调用方按既有路径派生。
 */
export function resolveScenarioCaller(
  scenario: EmergencyScenario,
  forced?: EmergencyScenario['callerId'],
): EmergencyScenario {
  if (forced) return scenario.callerId === forced ? scenario : { ...scenario, callerId: forced }

  const pool = scenario.callerPool
  if (!pool || pool.length === 0) return scenario
  if (pool.length === 1) return scenario.callerId === pool[0] ? scenario : { ...scenario, callerId: pool[0] }

  const picked = pool[rngInt(pool.length)]
  return scenario.callerId === picked ? scenario : { ...scenario, callerId: picked }
}
