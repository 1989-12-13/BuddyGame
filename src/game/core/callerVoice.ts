// ============================================================
// 120调度台 — 来电者回答合成（说话特质层）
// ============================================================
// 问题：同一句基础回答，33 位来电者说出来一模一样 → "AI 味"。
// 做法：基础回答仍由情绪档位决定（clear / rambling / panicked），
//       在此之上按「说话特质」重写措辞。
//
// 约束：
//   1. 只改措辞，不改信息本身 —— 信息质量与评分仍由情绪与问法决定。
//   2. 信息分句永不被删除 —— 沉默寡言只丢纯情绪的开场，且保证至少保留一条含信息的分句。
//   3. 一次回答只合成一次（不可重复调用，否则会叠加前缀后缀）。
//   4. 中性特质（1/1/1 且无 personality）的回答必须原样返回 —— 构成可退化基线。
// ============================================================

import type { CalleeStressLevel, CallerPersonality, CallerVoice } from '../types'
import { rng } from './random'

export interface VoiceContext {
  stressLevel: CalleeStressLevel
  /** 与患者的关系（personas.relationship） */
  relation: string
}

/** 判定一个分句是否承载有效信息 */
const INFO_HINT = /[0-9０-９一二三四五六七八九十百千万]|路|号|栋|楼|单元|小区|岁|呼吸|意识|清醒|昏迷|醒|血|疼|痛|分钟|小时|天|吐|烧|烫|紫|凉|抽|喘|摔|倒|撞|咬|卡|疼/

/** 话痨型：回答之后的跑题/重复 */
const RAMBLE_TAILS = [
  '……我也不太懂，反正就是这样。',
  '……你们快点来吧，别的我也想不起来了。',
  '……我是不是说乱了？你还想问啥再问。',
  '……哎我现在脑子一片空白。',
]

/** 情绪化 + 高压：结尾催促 */
const URGES = [
  '你们到底还有多久到啊？！',
  '快点啊啊，我真的撑不住了！',
  '你先别问了，先派人来好不好！',
]

function pick<T>(list: readonly T[]): T {
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))] as T
}

function isHigh(level: CalleeStressLevel): boolean {
  return level === '恐慌' || level === '失控'
}

interface Clause { text: string; end: string }

/** 按句读切分，保留分隔符 */
function toClauses(text: string): Clause[] {
  const parts = text.split(/([。！？；])/)
  const clauses: Clause[] = []
  for (let i = 0; i < parts.length; i += 2) {
    const body = parts[i] ?? ''
    const end = parts[i + 1] ?? ''
    if (body === '' && end === '') continue
    clauses.push({ text: body, end })
  }
  return clauses
}

/**
 * 沉默寡言：丢掉首尾的纯情绪分句，只留信息。
 * 安全保证：只有当另一侧还存在含信息的分句时才丢弃，绝不删掉唯一的信息来源。
 */
export function terseFilter(text: string): string {
  const clauses = toClauses(text)
  if (clauses.length < 2) return text

  let start = 0
  while (
    start < clauses.length - 1
    && !INFO_HINT.test(clauses[start].text)
    && clauses.slice(start + 1).some(clause => INFO_HINT.test(clause.text))
  ) start++

  const kept = clauses.slice(start)
  let end = kept.length
  while (
    end > 1
    && !INFO_HINT.test(kept[end - 1].text)
    && kept.slice(0, end - 1).some(clause => INFO_HINT.test(clause.text))
  ) end--

  return kept.slice(0, end).map(clause => clause.text + clause.end).join('')
}

/** 理性：压掉夸张标点，读起来更平 */
export function calmPunctuation(text: string): string {
  return text
    .replace(/！+/g, '。')
    .replace(/[。]{2,}/g, '。')
    .replace(/\.{2,}/g, '……')
    .replace(/～+/g, '')
}

/** 恐慌/失控时的口头行为：把「口不择言」落实到具体动作，且原信息不变 */
function panicAffect(p: CallerPersonality | undefined): string {
  switch (p?.panicTick) {
    case 'stammer': return '我、我、我'
    case 'sob':     return '（抽泣）'
    case 'scream':  return '啊——'
    case 'shout':   return '（喊）'
    case 'ramble':  return '不行不行'
    default:        return ''
  }
}

/**
 * 口语点缀：甩口头禅 / 向接线员喊称呼。
 * 全部低频、可选 —— 有 personality 才有。
 */
function personalityCharm(voice: CallerVoice, stressLevel: CalleeStressLevel): string {
  const p = voice.personality
  if (!p || voice.verbosity === 0) return ''
  const bits: string[] = []
  if (p.catchphrases?.length && rng() < 0.35) bits.push(pick(p.catchphrases))
  // 高压时才冒出称呼：慌乱的人会下意识向接线员喊话
  if (p.address?.length && isHigh(stressLevel) && rng() < 0.45) bits.push(`${pick(p.address)}！`)
  return bits.join('')
}

/**
 * 按说话特质重写一句来电者回答。
 * 注意：只调用一次。
 */
export function voiceAnswer(base: string, voice: CallerVoice, ctx: VoiceContext): string {
  let text = (base ?? '').trim()
  if (!text) return base

  // 沉默寡言：只留信息，丢掉情绪开场
  if (voice.verbosity === 0) text = terseFilter(text)

  // 理性：压掉夸张标点
  if (voice.rationality === 2) text = calmPunctuation(text)

  // 医疗常识：影响措辞的精确度（不新增医学断言，避免与病例冲突）
  let head = ''
  if (voice.verbosity !== 0 && voice.medicalLiteracy === 2) head = '我尽量说准一点，'
  else if (voice.medicalLiteracy === 0 && voice.verbosity === 2) head = '我也不太懂这些，反正'

  // 结尾：话痨跑题 或 情绪化催促（互斥，避免句子过长）
  let tail = ''
  if (voice.verbosity === 2) tail = pick(RAMBLE_TAILS)
  else if (voice.rationality === 0 && isHigh(ctx.stressLevel)) tail = pick(URGES)

  // 口语动作：只影响语气，不改变信息
  const affect = voice.verbosity === 0 ? '' : panicAffect(voice.personality)
  const charm = personalityCharm(voice, ctx.stressLevel)

  return `${charm}${affect}${head}${text}${tail}`
}

/**
 * 句子流版：来电者的一句完整回答 = 若干短句。
 * 与 voiceAnswer 的差异：头尾点缀只出现在首/末句，不逐句叠加；
 * 沉默寡言按句丢弃纯情绪句，但保证留下至少一条含信息的分句。
 */
export function voiceAnswerLines(lines: string[], voice: CallerVoice, ctx: VoiceContext): string[] {
  const src = (lines ?? []).map(s => s.trim()).filter(Boolean)
  if (src.length === 0) return lines

  // 沉默寡言：只留含信息的分句；若全无信息则保最后一句（它通常带关键的半句）
  let kept = src
  if (voice.verbosity === 0) {
    const informative = src.filter(s => INFO_HINT.test(s))
    kept = informative.length > 0 ? informative : [src[src.length - 1] as string]
  }

  // 理性：压掉夸张标点（逐句）
  if (voice.rationality === 2) kept = kept.map(calmPunctuation).filter(Boolean)

  // 头：医疗常识措辞 + 口语动作 + 口头禅 —— 只加到第一句
  const headBits: string[] = []
  if (voice.verbosity !== 0 && voice.medicalLiteracy === 2) headBits.push('我尽量说准一点，')
  else if (voice.medicalLiteracy === 0 && voice.verbosity === 2) headBits.push('我也不太懂这些，反正')
  const affect = voice.verbosity === 0 ? '' : panicAffect(voice.personality)
  const charm = personalityCharm(voice, ctx.stressLevel)
  const firstLine = kept[0] as string
  kept[0] = `${charm}${affect}${headBits.join('')}${firstLine}`

  // 尾：话痨跑题 或 情绪化催促 —— 只加到末句
  let tail = ''
  if (voice.verbosity === 2) tail = pick(RAMBLE_TAILS)
  else if (voice.rationality === 0 && isHigh(ctx.stressLevel)) tail = pick(URGES)
  if (tail) {
    const lastIndex = kept.length - 1
    kept[lastIndex] = `${kept[lastIndex] as string}${tail}`
  }

  return kept.filter(s => s.trim().length > 0).map(s => s.trim())
}