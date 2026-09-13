// ============================================================
// 「还差什么」的四项关键登记：地点 / 意识 / 呼吸 / 判定码
// ============================================================
// 抽成独立模块，因为它在两处出现，而组件文件只应导出组件：
//  - 通话台的「来电实录」栏 —— 常驻的完成度读数
//  - 工作区的「下一步」操作区 —— 派车入口
// ============================================================

import type { WorldState } from '../../game/types'

export interface NextStepCheck {
  key: string
  label: string
  done: boolean
}

export function nextStepChecks(state: WorldState): NextStepCheck[] {
  return [
    { key: 'address', label: '地点', done: Boolean(state.terminal.address.trim()) },
    { key: 'conscious', label: '意识', done: state.terminal.conscious !== null },
    { key: 'breathing', label: '呼吸', done: state.terminal.breathing !== null },
    { key: 'determinant', label: '判定码', done: Boolean(state.terminal.determinant && state.terminal.triage) },
  ]
}

/** 这通电话是否还在「信息收集」阶段（未派车、未结算、患者未死亡） */
export function isCollecting(state: WorldState): boolean {
  return Boolean(state.currentCall) && !state.dispatchSent && !state.rescue.outcome && !state.patientStatus?.died
}
