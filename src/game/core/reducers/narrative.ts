// ============================================================
// 120调度台 — 叙述式回答生成函数
// 根据来电者压力水平生成不同质量的对话回答
// ============================================================

import type { CallerPersonality, CallerVoice, InfoQuality, JudgmentPrompt } from '../../types'
import { rng } from '../random'
import { getPronoun } from '../../content/pronouns'

/** 缺省特质（来自 voices.ts 的 DEFAULT_VOICE，这里避免循环依赖直接复写一份） */
const DEFAULT_MANNER: CallerPersonality = {}

/**
 * 把一整段话拆成逐条短句（按中英文句末标点断句）。
 * 回答以「句子流」形态进入对话记录：每句独立成行、逐句浮现，像真人一句一句挤出话。
 */
export function splitSentences(text: string): string[] {
  const out: string[] = []
  let cur = ''
  for (const ch of text) {
    cur += ch
    if ('。！？…!?.'.includes(ch)) {
      const t = cur.trim()
      if (t) out.push(t)
      cur = ''
    }
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

/** 恐慌/失控时的口头动作——让"说不出来"有具体的身体感，而不是统一的省略号 */
function panicGloss(p: CallerPersonality | undefined): string {
  const tick = p?.panicTick ?? 'ramble'
  switch (tick) {
    case 'stammer': return '就、就、就是'
    case 'sob':     return '（抽泣）'
    case 'scream':  return '啊——！'
    case 'ramble':  return '不知道……不知道……'
    default:        return '（喊）'
  }
}

/** 慌乱中追问救援进度——高危时人的第一反应是"你们什么时候到" */
const PACE_URGES = [
  '你们到哪儿了？！',
  '还要多久啊？！',
  '你们什么时候才能到？！',
  '别挂电话，你们到底来不来？！',
]
function paceUrge(): string {
  return PACE_URGES[Math.min(PACE_URGES.length - 1, Math.floor(rng() * PACE_URGES.length))] as string
}

/** 紧张档的口语小停顿（有则克制地用，不每句都加，也不含人称避免重复） */
function fillers(rationality: number, verbosity: number): string {
  if (rationality === 2) return ''
  if (verbosity === 2) return '我现在手都在抖……'
  return ''
}

/** 跑题一句现场杂音（话痨+情绪化专属，仍围绕"现场"，不抛全新话题） */
function aside(verbosity: number, rationality: number): string {
  if (verbosity !== 2 || rationality !== 0) return ''
  return '我家里狗也在叫，真的一点都顾不上了——'
}

/** 回声：紧张时无意识地念出对方话语的最后几个词 */
function echoBack(chiefComplaint: string): string {
  const tail = chiefComplaint.replace(/[。！？]/g, '').split(/[，,、\s]/).filter(Boolean).pop() ?? ''
  return tail ? `……${tail}……` : ''
}

// ==================== 主函数 ====================

/** 根据情绪选择叙述式回答（以句子流返回） */
export function pickNarrativeAnswer(
  stress: number,
  cleanAnswer: string,
  ramblingAnswer: string,
  panickedAnswer: string,
): { lines: string[]; quality: InfoQuality; distorted: boolean } {
  // 失控（75+）：语无伦次，完全无法提供信息
  if (stress >= 75) return { lines: splitSentences(panickedAnswer), quality: 'vague', distorted: true }
  // 恐慌（50-74）：有概率完全无法提供信息或只能提供部分信息
  if (stress >= 50) {
    if (rng() < 0.35) return { lines: splitSentences(panickedAnswer), quality: 'vague', distorted: true }
    return { lines: splitSentences(ramblingAnswer), quality: 'partial', distorted: true }
  }
  // 紧张（25-49）：只能提供部分信息
  if (stress >= 25) return { lines: splitSentences(ramblingAnswer), quality: 'partial', distorted: false }
  // 镇定（0-24）：能给出完整信息
  return { lines: splitSentences(cleanAnswer), quality: 'clear', distorted: false }
}

/** 提取中文叙述的第一个完整分句（到句号/逗号/叹号为止），用于恐慌模式 */
function firstClause(text: string): string {
  return text.split(/[。！？；，、]/)[0].trim() || text
}

/** 生成步骤1（位置确认）的叙述式回答（句子流） */
export function generateLocationNarrative(
  partial: string,
  vague: string,
  stress: number,
): { lines: string[]; quality: InfoQuality; distorted: boolean } {
  if (stress >= 75) return { lines: splitSentences(vague), quality: 'vague', distorted: true }
  if (stress >= 50) {
    const hint = vague.split(/[，,、\s]/)[0]
    return {
      lines: [`${partial.split('，')[0]}！！`, `你们快来！！就在${hint}这边！！`],
      quality: 'partial', distorted: true,
    }
  }
  if (stress >= 25) {
    const hint = vague.split(/[，,、\s]/)[0]
    return {
      lines: [`好像是${hint}那边……`, `不对，应该是${partial}……`, `对对对，就是这个地址。`],
      quality: 'partial', distorted: false,
    }
  }
  return { lines: splitSentences(partial), quality: 'clear', distorted: false }
}

/** 根据来电者与患者的关系生成自然的开场情景描述 */
function relationshipContext(relationship: string): string {
  switch (relationship) {
    case '路人':    return '我就是路过瞅见的'
    case '同事':
    case '工友':   return '我们一块儿上班的'
    case '家人':
    case '家属':
    case '母亲':
    case '父亲':
    case '儿子':   return '家里人嘛，就我们几个在一块儿'
    case '朋友':    return '我们俩刚才还说着话呢'
    case '邻居':    return '我在隔壁听着声儿不对才过来的'
    case '伴侣':
    case '夫妻':
    case '妻子':
    case '丈夫':   return '我们俩过了大半辈子了'
    case '本人':    return '我自己一个人'
    case '小孩':    return '我在边上呢'
    case '室友':    return '我们合租的，住一块儿'
    default:        return '就在我眼前出的事'
  }
}

/** 生成步骤2（事件简述）的叙述式回答（句子流：一句一句挤出来） */
export function generateEventNarrative(
  chiefComplaint: string,
  gender: string,
  stress: number,
  relationship: string,
  voice: CallerVoice = { verbosity: 1, rationality: 1, medicalLiteracy: 1 },
): { lines: string[]; quality: InfoQuality; distorted: boolean } {
  const pronoun = getPronoun(gender)
  const ctx = relationshipContext(relationship)
  const isSelf = relationship === '本人'
  const person = isSelf ? '我' : pronoun
  const personality = voice.personality ?? DEFAULT_MANNER
  const props = { verbosity: voice.verbosity, rationality: voice.rationality }

  if (stress >= 75) {
    // 失控：只能挤出半句话 + 口头动作 + 对救援进度的追问
    const urgent = firstClause(chiefComplaint)
    const gloss = panicGloss(personality)
    return {
      lines: [`${gloss}${person}${urgent}`, `真的要不行了……`, paceUrge(), `你们快来啊！`],
      quality: 'vague', distorted: true,
    }
  }
  if (stress >= 50) {
    // 恐慌：每句都带着慌乱，句子之间是断的
    const gloss = panicGloss(personality)
    const interject = personality.interjects ? [paceUrge()] : []
    return {
      lines: [
        `${gloss}${person}${chiefComplaint}`,
        `真的不知道怎么说${ctx}，一下子就成这样了……`,
        ...interject,
        `我该怎么办啊？`,
      ],
      quality: 'partial', distorted: true,
    }
  }
  if (stress >= 25) {
    // 紧张：能说完，但一句一句地确认，偶尔冒出活人细节
    const f = fillers(props.rationality, props.verbosity)
    const asideTxt = aside(props.verbosity, props.rationality)
    const echo = personality.echoes ? `（自己念叨）${echoBack(chiefComplaint)}` : ''
    return {
      lines: [
        ...(asideTxt ? [asideTxt] : []),
        `${f}${person}${chiefComplaint}。`,
        `就是刚刚发生的事……`,
        `${ctx}，反正看着不太对。`,
        echo,
        `大概就是这样。`,
      ].filter(Boolean),
      quality: 'partial', distorted: false,
    }
  }
  // 镇定模式：完整准确描述，克制不加戏
  return { lines: splitSentences(chiefComplaint), quality: 'clear', distorted: false }
}

/** 生成步骤3（患者年龄）的叙述式回答（句子流） */
export function generateAgeNarrative(age: string, stress: number): string[] {
  const cleanAge = age.replace(/男性|女性|男|女|不详/g, '').trim()
  const isNumericAge = /^\d+/.test(cleanAge)

  // 非数字年龄（如恶作剧"小猫"），来电者说不清年龄
  if (!isNumericAge) {
    if (stress >= 75) return [`我不知道！！`, `反正就这样！！`, `你们快来啊！！`]
    if (stress >= 50) return [`好像是……`, `我也搞不清……`, `这很重要吗？`]
    if (stress >= 25) return [`我说不上来……`, `应该就这样……`]
    return [`说不太清楚……`]
  }

  if (stress >= 75) return [`${cleanAge}！！`, `就是！！`, `你们快来啊！！`]
  if (stress >= 50) return [`好像是${cleanAge}……`, `我也记不清了……`, `应该是${cleanAge}吧，这很重要吗？`]
  if (stress >= 25) return [`${cleanAge}……`, `应该差不多是这个岁数。`]
  return [`${cleanAge}。`]
}

/** 生成步骤4（意识与呼吸）的叙述式回答（句子流） */
export function generateVitalsNarrative(consciousness: string, breathing: string, stress: number): string[] {
  if (stress >= 75) {
    const c = firstClause(consciousness)
    const b = firstClause(breathing)
    return [`${c}！！`, `${b}！！`, `你们快来啊！！`]
  }
  if (stress >= 50) return [`${consciousness}……`, `${breathing}……`, `天哪我说不太清楚，反正看着不太对劲……`]
  if (stress >= 25) return [`${consciousness}，`, `${breathing}……`, `应该是这样的……`]
  return [`${consciousness}，`, `${breathing}。`]
}

/** 获取问题时间成本 */
export function getQuestionTimeCost(questionId: string, call: { mpdsQuestions: { id: string; timeCost: number }[] }): number {
  const fixedCosts: Record<string, number> = {
    step1_location: 2,
    ask_landmark: 2,
    step2_event: 2,
    step3_age: 1,
    step4_vitals: 2,
    ask_contact: 1,
    ask_purpose: 1,
  }
  return fixedCosts[questionId] ?? call.mpdsQuestions.find(q => q.id === questionId)?.timeCost ?? 2
}

/** 统计错误判断数量 */
export function countIncorrectJudgments(judgments: JudgmentPrompt[]): number {
  return judgments.filter(j => (
    j.chosenOptionIndex !== null
    && j.options[j.chosenOptionIndex]?.isCorrect !== true
  )).length
}

/** 从文本推导预期生命体征 */
export function deriveExpectedVitals(consciousness: string, breathing: string): { conscious: boolean; breathing: boolean } {
  const isUnconscious = consciousness.includes('无意识') || consciousness.includes('不醒') || consciousness.includes('呼之不应') || consciousness.includes('昏迷')
  const isNotBreathing = breathing.includes('没有呼吸') || breathing.includes('无呼吸') || breathing.includes('窒息') || breathing.includes('胸口不动')
  const isBreathingAbnormal = breathing.includes('急促') || breathing.includes('喘') || breathing.includes('异常')
  return {
    conscious: !isUnconscious,
    breathing: !isNotBreathing && !isBreathingAbnormal,
  }
}
