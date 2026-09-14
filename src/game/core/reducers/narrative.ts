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

/** 失控时的行为模式：不只是催进度，真实慌乱的人会反复确认、答非所问、愣住、否认现实 */
const PANIC_BEHAVIORS = [
  // 反复确认同一件事
  'TA还有气吗？你快告诉我TA还有气吗！',
  '你确定吗？你确定你们会来？',
  'TA不会死的吧？不会吧？',
  // 否认现实
  '不会的不会的，刚才还好好的……',
  '不可能啊，TA身体一直挺好的……',
  // 关注不相关细节
  'TA手里还攥着遥控器呢……',
  '我刚才还跟TA说话来着……',
  // 愣住
  '我……我说不出话了……',
  '我不知道该干什么……',
  // 哀求
  '求求你了，快点派车来吧……',
  '你别挂电话，我一个人害怕……',
]
function panicBehavior(): string {
  return PANIC_BEHAVIORS[Math.min(PANIC_BEHAVIORS.length - 1, Math.floor(rng() * PANIC_BEHAVIORS.length))] as string
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

/** 紧张档的口语小停顿（多选，随机出现，不每句都加，也不含人称避免重复） */
function fillers(rationality: number, verbosity: number): string {
  if (rationality === 2) return ''
  const pool: string[] = []
  if (verbosity === 2) pool.push('我现在手都在抖……', '我、我冷静一下……', '等等让我想想……')
  else if (verbosity === 0) pool.push('嗯。', '……', '是。')
  else pool.push('那个……', '我、我说……', '……')
  if (pool.length === 0 || rng() > 0.4) return ''
  return pool[Math.floor(rng() * pool.length)] as string + ' '
}

/** 跑题一句现场杂音（话痨+情绪化专属，随机从多句中取，不每次出现） */
function aside(verbosity: number, rationality: number): string {
  if (verbosity !== 2 || rationality !== 0) return ''
  if (rng() > 0.35) return ''
  const pool = [
    '我家里狗也在叫——',
    '旁边人在那儿喊呢——',
    '楼上也在砸门——',
    '灯还在闪呢——',
  ]
  return pool[Math.floor(rng() * pool.length)] as string
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
  if (stress >= 75) return { lines: [panicBehavior(), panicGloss(undefined)], quality: 'vague', distorted: true }
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
    // 失控：不是每次都报信息。真实慌乱的人会反复确认、答非所问、否认现实。
    // 有 40% 的概率只挤出恐慌行为，完全丢失信息。
    if (rng() < 0.4) {
      return {
        lines: [panicGloss(personality), panicBehavior()],
        quality: 'vague', distorted: true,
      }
    }
    // 其余时候挤出半句信息 + 一个恐慌行为（不一定催救援）
    const urgent = firstClause(chiefComplaint)
    const gloss = panicGloss(personality)
    return {
      lines: [`${gloss}${person}${urgent}`, panicBehavior()],
      quality: 'vague', distorted: true,
    }
  }
  if (stress >= 50) {
    // 恐慌：句子断续，结构随机化
    const gloss = panicGloss(personality)
    // 恐慌收束语多选
    const panics = [
      `真不知道怎么说${ctx}，一下子就成这样了……`,
      `我怎么说啊，${ctx}……`,
      `一下子就……我脑子是空的。`,
      `天哪，怎么能……怎么可能呢。`,
    ]
    const panicClose = panics[Math.floor(rng() * panics.length)] as string
    // 是否插入催促：有 interjects 特质 OR 30% 概率
    const useUrge = personality.interjects === true || rng() < 0.3
    const interject = useUrge ? [paceUrge()] : []
    // 是否结尾问"怎么办"
    const useWhatToDo = rng() < 0.6
    return {
      lines: [
        `${gloss}${person}${chiefComplaint}`,
        panicClose,
        ...interject,
        ...(useWhatToDo ? [`我该怎么办啊？`] : []),
      ],
      quality: 'partial', distorted: true,
    }
  }
  if (stress >= 25) {
    // 紧张：能说完，但句式随机化——有时先铺垫、有时先说事、有时中间插一句
    const f = fillers(props.rationality, props.verbosity)
    const asideTxt = aside(props.verbosity, props.rationality)
    const echo = personality.echoes && rng() < 0.5 ? echoBack(chiefComplaint) : ''
    // 结尾随机选一个收束语，不是每次都"大概就是这样"
    const closers = ['大概就是这样。', '反正看着不太对。', '就刚发生的事。', '我也不太确定。']
    const closer = closers[Math.floor(rng() * closers.length)] as string
    // 随机排列：50% 先铺垫再说事，30% 先说事，20% 中间插杂音
    const order = rng()
    if (order < 0.5) {
      return {
        lines: [
          ...(asideTxt ? [asideTxt] : []),
          `${f}${person}${chiefComplaint}。`,
          echo,
          ctx,
          closer,
        ].filter(Boolean),
        quality: 'partial', distorted: false,
      }
    } else if (order < 0.8) {
      return {
        lines: [
          `${f}${person}${chiefComplaint}。`,
          ctx,
          ...(asideTxt ? [asideTxt] : []),
          echo,
          closer,
        ].filter(Boolean),
        quality: 'partial', distorted: false,
      }
    }
    return {
      lines: [
        `${f}${person}${chiefComplaint}，`,
        ctx,
        asideTxt,
        `……${echo}`,
        closer,
      ].filter(Boolean),
      quality: 'partial', distorted: false,
    }
  }
  // 镇定模式：完整准确描述，克制不加戏
  return { lines: splitSentences(chiefComplaint), quality: 'clear', distorted: false }
}

/** 把场景里的年龄文本（如"45岁左右""约60岁"）解析为数字 */
function parseAgeNum(age: string): number | null {
  const m = age.match(/(\d+)/)
  if (!m) return null
  const n = parseInt(m[1] as string, 10)
  return Number.isFinite(n) ? n : null
}

/** 把年龄转为模糊的年龄段目测说法（"看着像五十来岁"） */
function vagueAgeBand(age: string, stress: number): string {
  const n = parseAgeNum(age)
  if (n == null) return '说不太准'
  // 目测只能是粗略的十年段
  const band = Math.floor(n / 10) * 10
  const tail = stress >= 50 ? '……或者是' + (band + 10) + '多？' : ''
  const map: Record<number, string> = {
    0: '几岁吧，很小', 10: '十来岁', 20: '二十来岁', 30: '三十来岁',
    40: '四十来岁', 50: '五十来岁', 60: '六十来岁', 70: '七十来岁',
    80: '八十来岁', 90: '九十来岁',
  }
  return `${map[band] ?? band + '来岁'}${tail}`
}

/** 来电者对患者的了解程度，决定年龄回答的可靠度 */
function ageFamiliarity(relationship: string): 'self' | 'family' | 'acquaintance' | 'stranger' {
  if (relationship === '本人') return 'self'
  if (['家人','家属','母亲','父亲','儿子','女儿','伴侣','夫妻','妻子','丈夫'].includes(relationship)) return 'family'
  if (['朋友','同事','工友','室友','邻居'].includes(relationship)) return 'acquaintance'
  return 'stranger'  // 路人、目击者
}

/** 生成步骤3（患者年龄）的叙述式回答（句子流） */
export function generateAgeNarrative(age: string, stress: number, relationship: string = '路人'): string[] {
  const cleanAge = age.replace(/男性|女性|男|女|不详/g, '').trim()
  const isNumericAge = /^\d+/.test(cleanAge)
  const fam = ageFamiliarity(relationship)

  // 非数字年龄（如恶作剧"小猫"），来电者说不清年龄
  if (!isNumericAge) {
    if (stress >= 75) return [`我不知道！！`, `反正就这样！！`, `你们快来啊！！`]
    if (stress >= 50) return [`好像是……`, `我也搞不清……`, `这很重要吗？`]
    if (stress >= 25) return [`我说不上来……`, `应该就这样……`]
    return [`说不太清楚……`]
  }

  // 本人：直接报年龄
  if (fam === 'self') {
    if (stress >= 75) return [`${cleanAge}！！`, `就是！！`, `你们快来啊！！`]
    if (stress >= 50) return [`${cleanAge}……`, `对，就是${cleanAge}。`]
    return [`${cleanAge}。`]
  }

  // 家属：大致清楚，但紧张时可能记不准
  if (fam === 'family') {
    if (stress >= 75) return [`${cleanAge}！！`, `对对对，就是！！`]
    if (stress >= 50) return [`好像是${cleanAge}……`, `我也记不太清了，应该是吧。`]
    if (stress >= 25) return [`${cleanAge}……`, `应该差不多。`]
    return [`${cleanAge}。`]
  }

  // 熟人（朋友/同事/邻居）：知道个大概
  if (fam === 'acquaintance') {
    if (stress >= 75) return [`我不知道！！`, `看样子挺大了！`, `你们快来啊！！`]
    if (stress >= 50) return [`大概${cleanAge}吧……`, `我记不太准了。`]
    if (stress >= 25) return [`差不多${cleanAge}吧……`, `我们也没仔细问过。`]
    return [`大概${cleanAge}吧，`, `我不是特别确定。`]
  }

  // 路人/目击者：只能目测年龄段，说不出精确数字
  const band = vagueAgeBand(age, stress)
  if (stress >= 75) return [`我不知道啊！！`, `看着岁数挺大了！`, `你们快来啊！！`]
  if (stress >= 50) return [`${band}……`, `我真说不上来。`]
  if (stress >= 25) return [`看样子${band}，`, `我不认识TA，猜的。`]
  return [`看样子${band}，`, `我不认识TA，不好说。`]
}

/** 生成步骤4（意识与呼吸）的叙述式回答（句子流） */
export function generateVitalsNarrative(consciousness: string, breathing: string, stress: number): string[] {
  if (stress >= 75) {
    // 失控：不一定还能报出体征信息
    if (rng() < 0.5) return [panicBehavior(), `你们快来啊！！`]
    const c = firstClause(consciousness)
    const b = firstClause(breathing)
    return [`${c}！！`, `${b}！！`, panicBehavior()]
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
