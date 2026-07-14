// ============================================================
// 零点接线台 — CALM_CALLER reducer 处理器
// 安抚来电者情绪（消耗时间但降低压力）
// ============================================================

import type { WorldState, DialogueLine } from '../../types'
import { stressToLevel } from '../../types'
import { rngInt } from '../random'
import { hasPerk } from '../perks'
import { CALM_STRESS_DROP_BASE, CALM_STRESS_DROP_PERK, CALM_TIME_COST_BASE, CALM_TIME_COST_PERK } from '../constants'

export function handleCalmCaller(state: WorldState): WorldState {
  if (!state.currentCall || !state.callerState) return state
  if (state.callPhase !== 'questioning' && state.callPhase !== 'connected') return state

  const cs = state.callerState
  const now = state.shiftElapsed
  const hasCalmScript = hasPerk(state.perks, 'calm_script')
  const stressDrop = (hasCalmScript ? CALM_STRESS_DROP_PERK : CALM_STRESS_DROP_BASE) + rngInt(10)
  const calmCost = hasCalmScript ? CALM_TIME_COST_PERK : CALM_TIME_COST_BASE
  const newStress = Math.max(0, cs.stress - stressDrop)
  const newStressLevel = stressToLevel(newStress)

  const calmPhrases = [
    '请您深呼吸，慢慢说。救护车启动需要您提供准确信息。',
    '我理解您很着急，但请您尽量保持冷静，我需要您的帮助。',
    '别担心，我会一直在这个电话上。请您配合我，我们一步步来。',
    '您做得很好，请继续保持。现在我需要再确认几个信息。',
  ]
  const phrase = calmPhrases[rngInt(calmPhrases.length)]

  const opLine: DialogueLine = { speaker: 'operator', text: phrase, timestamp: now }
  const callerLine: DialogueLine = {
    speaker: 'caller', text: '好...好的，我尽量...你说...',
    timestamp: now,
  }

  return {
    ...state,
    shiftElapsed: state.shiftElapsed + calmCost,
    questionCost: state.questionCost + calmCost,
    callerState: {
      ...cs,
      stress: newStress,
      stressLevel: newStressLevel,
    },
    dialogueLog: [...state.dialogueLog, opLine, callerLine],
  }
}
