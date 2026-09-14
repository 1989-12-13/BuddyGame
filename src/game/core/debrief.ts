// 通话复盘现在直接使用五维评价记录，保留此模块作为稳定导入入口。
import type { CallEvaluation, EmergencyScenario, WorldState } from '../types'
import { buildCallEvaluation } from './evaluation'

export type DebriefEntry = CallEvaluation

export function buildDebrief(state: WorldState, scenario: EmergencyScenario): DebriefEntry {
  return buildCallEvaluation(state, scenario)
}
