// ============================================================
// 120调度台 — 对话回合（问询选择化）
// ============================================================
// 设计基线：docs/并发值班玩法设计方案.md §6
//
// 分工原则：**系统管顺序，玩家管措辞与时机。**
//   - 顺序：5 步标准协议自动推进，玩家不需要记该问什么
//   - 措辞：同一话题给出「放慢 / 加快」两种说法，各自有代价
//   - 时机：可插队抢问关键信息，也可先安抚情绪
//
// 硬约束（§6.5）：每回合必须保留至少一个真实取舍，
// 否则退化成「点下一步」，比原来的问询清单更无聊。
// ============================================================

import type { CalleeStressLevel, InfoQuality, WorldState } from '../types'
import type { GameAction } from './actions'

export type TurnKind = 'advance' | 'calm' | 'confirm' | 'shortcut' | 'followup'

export interface TurnOption {
  id: string
  kind: TurnKind
  /** 调度员实际说出口的那句话（按钮正文） */
  line: string
  /** 小字说明：这一句的代价 */
  hint?: string
  /** 点击后分发的动作 */
  action: GameAction
}

/** 协议推进顺序（骨架，由系统维护） */
export const PROTOCOL_ORDER = [
  'step1_location',
  'step2_event',
  'step3_age',
  'step4_vitals',
  'ask_landmark',
  'ask_contact',
  'ask_purpose',
] as const

type ProtocolId = (typeof PROTOCOL_ORDER)[number]

/** 语气档位：温和 = 承接 + 共情 + 明确指令；催促 = 短促祈使，急诊节奏 */
type PhrasingPair = { gentle: string; press: string }

/** 一句话的后半段主体（不含承接前缀），按话题组织 */
const TOPIC_MAIN: Record<ProtocolId, PhrasingPair> = {
  step1_location: {
    gentle: '咱先把位置说清楚，我好派车——具体在哪个小区、哪条路？',
    press: '先说位置——在哪儿？',
  },
  step2_event: {
    gentle: '你慢慢说，具体是怎么发生的？',
    press: '直接说，怎么回事？',
  },
  step3_age: {
    gentle: '患者大概多大年纪？',
    press: '多大年纪？快。',
  },
  step4_vitals: {
    gentle: '他有反应吗？还在喘气吗？你听我口令，慢慢确认。',
    press: '还清醒吗？有没有呼吸？快！',
  },
  ask_landmark: {
    gentle: '旁边有什么显眼的店或者牌子吗？找见那个我就能定位。',
    press: '有没有明显地标？快。',
  },
  ask_contact: {
    gentle: '留一个随时能打通的电话给我，号码我记一下。',
    press: '你电话多少？快。',
  },
  ask_purpose: {
    gentle: '你现在最急的是什么？说给我听，咱们一件一件办。',
    press: '你最要紧的是哪件事？说。',
  },
}

/** 重问时（没听清/被噪音盖过）的收尾引导：温和道歉式，催促带轻微不耐 */
const RETRY_MAIN: Record<ProtocolId, PhrasingPair> = {
  step1_location: {
    gentle: '刚才那半句我没听全，咱俩把地址再对一遍——你具体在哪儿？',
    press: '地址再报一遍，我这边等着派车，快。',
  },
  step2_event: {
    gentle: '刚才有点吵，我没听清，你再说一遍当时的情况？',
    press: '再说一遍，到底怎么回事？',
  },
  step3_age: {
    gentle: '岁数我刚才没记上，再说一次？',
    press: '岁数，再说一遍。',
  },
  step4_vitals: {
    gentle: '我刚才没听清，他有反应吗？有呼吸吗？慢慢说。',
    press: '再说一次，还有没有呼吸？',
  },
  ask_landmark: {
    gentle: '刚才那句我没太听清，旁边有什么标志物，再说一遍？',
    press: '标志物，再说一遍，快点。',
  },
  ask_contact: {
    gentle: '号码我刚才没记全，麻烦再报一遍？',
    press: '号码再报一遍，快。',
  },
  ask_purpose: {
    gentle: '你刚才说的我没完全听懂，重新说一遍，你最需要什么？',
    press: '再说一遍，你们要什么？',
  },
}

/**
 * 承接型问话：同一话题给出「放慢 / 加快」两种说法。
 * 台词就是模板本身，不再复述来电者上一句原话。
 */
export function phraseFor(id: ProtocolId, retry: boolean): PhrasingPair {
  const pair = (retry ? RETRY_MAIN : TOPIC_MAIN)[id]
  if (!retry) return pair

  return {
    gentle: `明白，${pair.gentle}`,
    press: pair.press,
  }
}

/** 当前协议该问哪一步（第一个还没问过的） */
export function nextProtocolId(state: WorldState): ProtocolId | null {
  const attempts = state.callerState?.questionAttempts ?? {}
  return PROTOCOL_ORDER.find(id => (attempts[id] ?? 0) === 0) ?? null
}

export function buildTurnOptions(state: WorldState): TurnOption[] {
  const call = state.currentCall
  const cs = state.callerState
  // 核实通话不走协议问询，由班次层的核实面板接管
  if (!call || !cs || call.isVerification) return []

  const attempts = (id: string) => cs.questionAttempts[id] ?? 0
  const wasAsked = (id: string) => attempts(id) > 0
  const options: TurnOption[] = []
  const next = nextProtocolId(state)

  // 1) 推进型 —— 同一话题的两种说法，构成「效率 vs 情绪 vs 配合度」的取舍
  if (next) {
    const retry = attempts(next) > 0
    const phrasing = phraseFor(next, retry)

    const impatient = retry && cs.cooperation < 50
    options.push({
      id: `advance-gentle-${next}`,
      kind: 'advance',
      line: phrasing.gentle,
      hint: retry
        ? '放慢安抚 · 再问一次 · 对方耐心下降'
        : '放慢节奏 · 情绪下降 · 更容易配合 · 多花 1 秒',
      action: { type: 'ASK_QUESTION', questionId: next, spokenLine: phrasing.gentle, stressDelta: -5, extraTime: 1 },
    })
    options.push({
      id: `advance-press-${next}`,
      kind: 'advance',
      line: phrasing.press,
      hint: impatient
        ? '催促 · 对方已不耐烦，小心答得更敷衍'
        : '加快节奏 · 情绪上升 · 配合度下降 · 少花 1 秒',
      action: { type: 'ASK_QUESTION', questionId: next, spokenLine: phrasing.press, stressDelta: 6, extraTime: -1 },
    })
  }

  // 2) 安抚型 —— 情绪偏高时才出现
  if (cs.stress >= 40) {
    options.push({
      id: 'calm',
      kind: 'calm',
      line: '先别急，我在电话这头，我们一步一步来。',
      hint: '安抚情绪 · 不推进进度',
      action: { type: 'CALM_CALLER' },
    })
  }

  // 3) 确认型 —— 已问但没听清，且现在情绪比当时低（安抚后才值得复核）
  const shaky = PROTOCOL_ORDER.find(id =>
    wasAsked(id)
    && cs.questionQuality[id] !== 'clear'
    && attempts(id) < 2
    && cs.stress < (cs.questionStress[id] ?? cs.stress)
    && cs.cooperation >= 35)
  if (shaky) {
    const retryPhrasing = phraseFor(shaky, true)
    const confirmLine = retryPhrasing.gentle
    options.push({
      id: `confirm-${shaky}`,
      kind: 'confirm',
      line: confirmLine,
      hint: '情绪已回落 · 现在复核能问到更准的信息',
      action: {
        type: 'ASK_QUESTION',
        questionId: shaky,
        spokenLine: confirmLine,
        stressDelta: -2,
        extraTime: 1,
      },
    })
  }

  // 4) 捷径型 —— 跳过当前步骤，直奔最关键的意识与呼吸
  if (next && next !== 'step4_vitals' && !wasAsked('step4_vitals')) {
    const pressLine = phraseFor('step4_vitals', false).press
    options.push({
      id: 'shortcut-vitals',
      kind: 'shortcut',
      line: pressLine,
      hint: '跳过当前步骤 · 越急切，对方答得越乱',
      action: {
        type: 'ASK_QUESTION',
        questionId: 'step4_vitals',
        spokenLine: pressLine,
        stressDelta: 8,
        extraTime: 0,
      },
    })
  }

  // 5) 专业追问 —— MPDS 标准问询，前置条件满足时补充一个
  const followup = call.mpdsQuestions.find(q =>
    attempts(q.id) === 0
    && !(q.prerequisites ?? []).some(id => attempts(id) === 0))
  if (followup && options.length < 4) {
    options.push({
      id: `followup-${followup.id}`,
      kind: 'followup',
      line: followup.questionText,
      hint: '专业追问',
      action: { type: 'ASK_QUESTION', questionId: followup.id, spokenLine: followup.questionText },
    })
  }

  return options.slice(0, 4)
}

export const TURN_KIND_LABEL: Record<TurnKind, string> = {
  advance: '推进',
  calm: '安抚',
  confirm: '确认',
  shortcut: '抢问',
  followup: '追问',
}

// ============================================================
// 可感知层
// ============================================================
// 机制本来就在：压力越高，来电者给出的信息越失真；
// 安抚是唯一能把压力压下来、从而把信息问准的手段。
// 但玩家看不见这条链路 —— 以下把「情绪 → 信息质量」显式暴露出来。

export interface FactQuality {
  id: string
  label: string
  quality: InfoQuality | 'unknown'
}

export const QUALITY_LABEL: Record<InfoQuality | 'unknown', string> = {
  clear: '清晰',
  partial: '基本可用',
  vague: '模糊',
  unknown: '未获取',
}

/** 压力从哪一档开始会明显干扰回答 */
export const DEGRADED_STRESS = 50

/** 关键事实的当前信息质量 */
export function describeFacts(state: WorldState): FactQuality[] {
  const cs = state.callerState
  if (!cs) return []

  const revealed = cs.revealedInfo
  const qualityOf = (key: string, isRevealed: boolean): InfoQuality | 'unknown' =>
    isRevealed ? (cs.infoQuality[key] ?? 'partial') : 'unknown'

  return [
    {
      id: 'address',
      label: '地址',
      quality: revealed.address === 'none' ? 'unknown' : (cs.infoQuality.address ?? 'vague'),
    },
    { id: 'chiefComplaint', label: '情况', quality: qualityOf('chiefComplaint', revealed.chiefComplaint) },
    { id: 'consciousness', label: '意识', quality: qualityOf('consciousness', revealed.consciousness) },
    { id: 'breathing', label: '呼吸', quality: qualityOf('breathing', revealed.breathing) },
    { id: 'age', label: '年龄', quality: qualityOf('age', revealed.age) },
  ]
}

export interface TurnState {
  options: TurnOption[]
  /** 情绪与信息质量的因果提示 */
  notice: string | null
  stressLevel: CalleeStressLevel
  /** 情绪是否已经高到会干扰回答 */
  degraded: boolean
  facts: FactQuality[]
}

export function buildTurn(state: WorldState): TurnState {
  const cs = state.callerState
  const options = buildTurnOptions(state)
  const stressLevel = cs?.stressLevel ?? '镇定'
  const facts = describeFacts(state)
  const degraded = (cs?.stress ?? 0) >= DEGRADED_STRESS
  const canReview = options.some(option => option.kind === 'confirm')
  const inaccurate = facts.some(fact => fact.quality === 'vague')

  let notice: string | null = null
  if (degraded) {
    notice = `来电者现在「${stressLevel}」—— 越紧张，说出的话越不可靠，地址和体征都可能问不准。先安抚，等情绪回落再复核。`
  } else if (canReview) {
    notice = '情绪已经回落，现在复核刚才没听清的内容，有机会问到准确信息。'
  } else if (inaccurate) {
    notice = '仍有模糊信息。想确认的话，可以先安抚来电者再复核。'
  }

  return { options, notice, stressLevel, degraded, facts }
}
