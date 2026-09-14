// ============================================================
// 120调度台 — CALM_CALLER reducer 处理器
// 安抚来电者情绪（消耗时间但降低压力）
// ============================================================

import type { WorldState, DialogueLine, StressTier } from '../../types'
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

/** 中文 CalleeStressLevel → 英文 StressTier 映射 */
function toTier(level: string): StressTier {
  switch (level) {
    case '镇定': return 'calm'
    case '紧张': return 'tense'
    case '恐慌': return 'panic'
    case '失控': return 'lost'
    default: return 'calm'
  }
}

export function handleCalmCaller(state: WorldState): WorldState {
  if (!state.currentCall || !state.callerState) return state
  if (state.callPhase !== 'questioning' && state.callPhase !== 'connected') return state

  const cs = state.callerState
  const now = state.shiftElapsed
  const hasCalmScript = hasPerk(state.perks, 'calm_script')
  const baseDrop = hasCalmScript ? CALM_STRESS_DROP_PERK : CALM_STRESS_DROP_BASE
  // 线性递减 + 下限：20 / 16 / 12 / 8 / 8 …
  const stressDrop = Math.max(CALM_STRESS_DROP_FLOOR, baseDrop - state.calmCount * CALM_STRESS_DROP_DECAY)
  const calmCost = hasCalmScript ? CALM_TIME_COST_PERK : CALM_TIME_COST_BASE
  const newStress = Math.max(0, cs.stress - stressDrop)
  const newStressLevel = stressToLevel(newStress)

  // ==========================================
  // 手写脚本优先：场景定义了 calmReply 时使用手写台词
  // ==========================================
  const scripted = state.currentCall.script
  // 找到最后一个有 calmReply 的已问问题
  let calmReply: { operatorCalm?: string } & Partial<Record<StressTier, string>> | undefined
  if (scripted) {
    const asked = [...cs.askedMPDS].reverse()
    for (const qid of asked) {
      const ex = scripted[qid]
      if (ex?.calmReply) { calmReply = ex.calmReply; break }
    }
  }

  let opText: string
  let callerResponse: string

  if (calmReply) {
    // 手写脚本版
    const tier: StressTier = toTier(newStressLevel)
    opText = calmReply.operatorCalm ?? '先别急，深呼吸。我在这儿，咱一句一句说。'
    callerResponse = calmReply[tier] ?? calmReply.calm ?? '好，你说，我听着。'
  } else {
    // 老逻辑兜底
    const voice = getVoice(state.currentCall.callerId)
    const calmPhrases = [
      '先别急，深呼吸。我在这儿，咱一句一句说。',
      '我明白你着急。你现在帮了我，就是帮TA。',
      '别怕，我一直在电话这头。你慢慢说，我记着呢。',
      '你做得对。咱接着来，下一个问题。',
    ]
    opText = voice.verbosity === 0
      ? '先别说话，深呼吸。听到我了吗？慢慢答，我一句一句记。'
      : voice.rationality === 2
        ? '我明白。先深呼吸，然后我们按顺序补信息，我在这头等你。'
        : calmPhrases[rngInt(calmPhrases.length)]

    const p = voice.personality
    if (newStressLevel === '镇定') {
      callerResponse = p?.panicTick === 'sob' ? '好……我不哭了，你说……' : '好，你说，我听着。'
    } else if (cs.stressLevel === '镇定' || cs.stressLevel === '紧张') {
      callerResponse = '行，我冷静了，你问。'
    } else {
      switch (p?.panicTick) {
        case 'sob':    callerResponse = '（抽泣声缓下来）好……好……你问……'; break
        case 'scream': callerResponse = '你们不能挂电话……（喘）好，我听你的……'; break
        case 'stammer': callerResponse = '好、好、我尽量……你说……'; break
        default:       callerResponse = '好…好的，我尽量…你说…'
      }
    }
  }

  const opLine: DialogueLine = { speaker: 'operator', text: opText, timestamp: now }
  const callerLine: DialogueLine = { speaker: 'caller', text: callerResponse, timestamp: now }

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
