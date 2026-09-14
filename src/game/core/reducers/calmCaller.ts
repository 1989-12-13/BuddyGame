// ============================================================
// 120调度台 — CALM_CALLER reducer 处理器
// 安抚来电者情绪（消耗时间但降低压力）
// ============================================================

import type { WorldState, DialogueLine } from '../../types'
import { stressToLevel } from '../../types'
import { rngInt } from '../random'
import { hasPerk } from '../perks'
import { getVoice } from '../../npc/voices'
import {
  CALM_STRESS_DROP_BASE,
  CALM_STRESS_DROP_PERK,
  CALM_STRESS_DROP_DECAY,
  CALM_STRESS_DROP_FLOOR,
  CALM_TIME_COST_BASE,
  CALM_TIME_COST_PERK,
} from '../constants'

export function handleCalmCaller(state: WorldState): WorldState {
  if (!state.currentCall || !state.callerState) return state
  if (state.callPhase !== 'questioning' && state.callPhase !== 'connected') return state

  const cs = state.callerState
  const now = state.shiftElapsed
  const voice = getVoice(state.currentCall.callerId)
  const hasCalmScript = hasPerk(state.perks, 'calm_script')
  const baseDrop = hasCalmScript ? CALM_STRESS_DROP_PERK : CALM_STRESS_DROP_BASE
  // 线性递减 + 下限：20 / 16 / 12 / 8 / 8 …
  const stressDrop = Math.max(CALM_STRESS_DROP_FLOOR, baseDrop - state.calmCount * CALM_STRESS_DROP_DECAY)
  const calmCost = hasCalmScript ? CALM_TIME_COST_PERK : CALM_TIME_COST_BASE
  const newStress = Math.max(0, cs.stress - stressDrop)
  const newStressLevel = stressToLevel(newStress)

  const calmPhrases = [
    '请您深呼吸，慢慢说。救护车启动需要您提供准确信息。',
    '我理解您很着急，但请您尽量保持冷静，我需要您的帮助。',
    '别担心，我会一直在这个电话上。请您配合我，我们一步步来。',
    '您做得很好，请继续保持。现在我需要再确认几个信息。',
  ]
  // 按来电者说话特质选安抚话术：少言的人给短指令，理性的人给步骤，其余给常规安抚
  const opText = voice.verbosity === 0
    ? '先别说话，深呼吸。听到我了吗？慢慢答，我一句一句记。'
    : voice.rationality === 2
      ? '我明白。先深呼吸，然后我们按顺序补信息，我在这头等你。'
      : calmPhrases[rngInt(calmPhrases.length)]

  const opLine: DialogueLine = { speaker: 'operator', text: opText, timestamp: now }

  // 来电者回应：按安抚后的压力档位 + 口头特质差异化
  let callerResponse: string
  const p = voice.personality
  if (newStressLevel === '镇定') {
    callerResponse = p?.panicTick === 'sob' ? '好……我不哭了，你说……' : '好，你说，我听着。'
  } else if (cs.stressLevel === '镇定' || cs.stressLevel === '紧张') {
    callerResponse = '行，我冷静了，你问。'
  } else {
    switch (p?.panicTick) {
      case 'sob':    callerResponse = '（抽泣声缓下来）好……好……你问……'
        break
      case 'scream': callerResponse = '你们不能挂电话……（喘）好，我听你的……'
        break
      case 'stammer': callerResponse = '好、好、我尽量……你说……'
        break
      default:       callerResponse = '好…好的，我尽量…你说…'
    }
  }
  const callerLine: DialogueLine = {
    speaker: 'caller', text: callerResponse,
    timestamp: now,
  }

  return {
    ...state,
    actionEndsAt: state.shiftElapsed + calmCost,
    calmCount: state.calmCount + 1,
    attitudeEvidence: {
      ...state.attitudeEvidence,
      calmingActions: state.attitudeEvidence.calmingActions + 1,
    },
    questionCost: state.questionCost + calmCost,
    callerState: {
      ...cs,
      cooperation: Math.min(100, cs.cooperation + 8),
      stress: newStress,
      stressLevel: newStressLevel,
    },
    dialogueLog: [...state.dialogueLog, opLine, callerLine],
  }
}
