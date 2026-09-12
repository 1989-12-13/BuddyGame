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

/** 每个话题的两种说法：放慢（耗时间、降情绪） vs 加快（省时间、升情绪） */
const PHRASING: Record<ProtocolId, { label: string; gentle: string; press: string }> = {
  step1_location: { label: '事发地址', gentle: '别急，先告诉我准确地址，我马上派车。', press: '地址，快说地址。' },
  step2_event:    { label: '发生了什么', gentle: '慢慢说，具体发生了什么？', press: '直接说，到底怎么回事？' },
  step3_age:      { label: '患者年龄', gentle: '他大概多大年纪？', press: '多大年纪？快说。' },
  step4_vitals:   { label: '意识与呼吸', gentle: '他现在有反应吗？还有呼吸吗？', press: '他还有意识吗？有没有呼吸？快！' },
  ask_landmark:   { label: '明显地标', gentle: '旁边有什么明显的店铺或标志物吗？', press: '有没有明显地标？快点说。' },
  ask_contact:    { label: '回拨电话', gentle: '方便留一个能打通的电话吗？', press: '你的电话是多少？快。' },
  ask_purpose:    { label: '求助诉求', gentle: '您现在最需要我们做什么？', press: '你们到底要我做什么？' },
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

  // 1) 推进型 —— 同一话题的两种说法，构成「效率 vs 情绪」的取舍
  if (next) {
    const phrasing = PHRASING[next]
    options.push({
      id: `advance-gentle-${next}`,
      kind: 'advance',
      line: phrasing.gentle,
      hint: '放慢节奏 · 情绪下降 · 多花 1 秒',
      action: { type: 'ASK_QUESTION', questionId: next, spokenLine: phrasing.gentle, stressDelta: -5, extraTime: 1 },
    })
    options.push({
      id: `advance-press-${next}`,
      kind: 'advance',
      line: phrasing.press,
      hint: '加快节奏 · 情绪上升 · 少花 1 秒',
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
    && cs.stress < (cs.questionStress[id] ?? cs.stress))
  if (shaky) {
    options.push({
      id: `confirm-${shaky}`,
      kind: 'confirm',
      line: `刚才那句我没听清，我们再说一遍：${PHRASING[shaky].label}。`,
      hint: '情绪已回落 · 现在复核能问到更准的信息',
      action: {
        type: 'ASK_QUESTION',
        questionId: shaky,
        spokenLine: `刚才那句我没听清，我们再说一遍：${PHRASING[shaky].label}。`,
        stressDelta: -2,
        extraTime: 1,
      },
    })
  }

  // 4) 捷径型 —— 跳过当前步骤，直奔最关键的意识与呼吸
  if (next && next !== 'step4_vitals' && !wasAsked('step4_vitals')) {
    options.push({
      id: 'shortcut-vitals',
      kind: 'shortcut',
      line: PHRASING.step4_vitals.press,
      hint: '跳过当前步骤 · 情绪越高越容易问不清',
      action: {
        type: 'ASK_QUESTION',
        questionId: 'step4_vitals',
        spokenLine: PHRASING.step4_vitals.press,
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
