// ============================================================
// 判定码自动填写
// ============================================================
// 玩家只需要判断「这是哪个 MPDS 协议」。协议一确定，判定等级（E/D/C/B/A）、
// 末位细分编码、冷热响应与四色分诊都自动补齐：
// 不必再让玩家对着登记表手抄一遍，问询结束即可直接派车。
//
// ⚠ 分诊与冷热取「病例卡上的权威值」，不能用通用的「字母→等级」映射：
//   实测 33 张卡里有 12 张两者不一致（如心脏问题 19-C-1 权威是红/HOT，
//   通用映射会给出黄/COLD），照通用映射填会把玩家的分诊分直接打没。
//
// 只填空白：玩家手动改过判定等级时不覆盖（handleSetMpdsDeterminant 仍是覆盖入口）。
// ============================================================

import type { TerminalState, WorldState } from '../types'
import { determinantFromCode, subcodeFromCode } from '../types'

export function fillDeterminantFromProtocol(terminal: TerminalState, state: WorldState): TerminalState {
  if (terminal.protocolNumber === null || terminal.determinant) return terminal

  const call = state.currentCall
  if (!call) return terminal
  const determinant = determinantFromCode(call.mpdsCard.determinantCode)
  // 非标准码（恶作剧的 "Ω"）推不出判定等级，保持原样
  if (!determinant) return terminal

  return {
    ...terminal,
    determinant,
    determinantSubcode: terminal.determinantSubcode ?? subcodeFromCode(call.mpdsCard.determinantCode),
    hotCold: call.mpdsCard.hotCold,
    triage: call.correctTriage,
  }
}
