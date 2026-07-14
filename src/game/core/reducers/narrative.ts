// ============================================================
// 零点接线台 — 叙述式回答生成函数
// 根据来电者压力水平生成不同质量的对话回答
// ============================================================

import type { InfoQuality, JudgmentPrompt } from '../../types'
import { rng } from '../random'

/** 根据情绪选择叙述式回答 */
export function pickNarrativeAnswer(
  stress: number,
  cleanAnswer: string,
  ramblingAnswer: string,
  panickedAnswer: string,
): { text: string; quality: InfoQuality; distorted: boolean } {
  // 失控（75+）：语无伦次，完全无法提供信息
  if (stress >= 75) return { text: panickedAnswer, quality: 'vague', distorted: true }
  // 恐慌（50-74）：有概率完全无法提供信息或只能提供部分信息
  if (stress >= 50) {
    if (rng() < 0.35) return { text: panickedAnswer, quality: 'vague', distorted: true }
    return { text: ramblingAnswer, quality: 'partial', distorted: true }
  }
  // 紧张（25-49）：只能提供部分信息
  if (stress >= 25) return { text: ramblingAnswer, quality: 'partial', distorted: false }
  // 镇定（0-24）：能给出完整信息
  return { text: cleanAnswer, quality: 'clear', distorted: false }
}

/** 生成步骤1（位置确认）的叙述式回答 */
export function generateLocationNarrative(
  partial: string,
  vague: string,
  stress: number,
): { text: string; quality: InfoQuality; distorted: boolean } {
  if (stress >= 75) return { text: vague, quality: 'vague', distorted: true }
  if (stress >= 50) {
    const shortVague = vague.length > 6 ? vague.slice(0, 6) : vague
    return {
      text: `${partial.split('，')[0]}！！你们快来！！就在${shortVague}这边！！`,
      quality: 'partial', distorted: true,
    }
  }
  if (stress >= 25) {
    const areaHint = vague.length > 4 ? vague.slice(0, 4) : vague
    return {
      text: `在...在${areaHint}...不对，是在${partial}...对，就是这个地址。`,
      quality: 'partial', distorted: false,
    }
  }
  return { text: partial, quality: 'clear', distorted: false }
}

/** 生成步骤2（事件简述）的叙述式回答 */
export function generateEventNarrative(
  chiefComplaint: string,
  gender: string,
  stress: number,
  relationship: string,
): { text: string; quality: InfoQuality; distorted: boolean } {
  const pronoun = gender === '女性' ? '她' : gender === '男性' ? '他' : 'TA'
  // 根据来电者与患者的关系推导自然的情景描述
  const context =
    relationship === '路人' ? '就在路边' :
    relationship === '同事' ? '我们正在做事' :
    '刚才还好好的在'

  if (stress >= 75) {
    return {
      text: `不行了不行了！！${pronoun}${chiefComplaint.slice(0, 8)}...你们快来啊！！出大事了！！`,
      quality: 'vague', distorted: true,
    }
  }
  if (stress >= 50) {
    return {
      text: `${pronoun}...我...我不知道怎么形容...${chiefComplaint.slice(0, 10)}...就是突然之间就不对劲了！${context}...一下子就...我该怎么办？！`,
      quality: 'partial', distorted: true,
    }
  }
  if (stress >= 25) {
    return {
      text: `${pronoun}${chiefComplaint.slice(0, 15)}...就是这样的情况，刚刚发生的，感觉挺严重的。嗯...大概就是这样。`,
      quality: 'partial', distorted: false,
    }
  }
  return { text: chiefComplaint, quality: 'clear', distorted: false }
}

/** 生成步骤3（患者年龄）的叙述式回答 */
export function generateAgeNarrative(age: string, stress: number, gender: string): string {
  const pronoun = gender === '女性' ? '她' : gender === '男性' ? '他' : 'TA'
  // 防御性剥离：确保 age 字段不混入性别/称谓
  const cleanAge = age.replace(/男性|女性|男|女|不详/g, '').trim()
  if (stress >= 75) return `${pronoun}${cleanAge}！！具体多少有关系吗？！快派人来啊！！`
  if (stress >= 50) return `${pronoun}${cleanAge}...应该是${cleanAge}吧，我一下子脑子转不过来了...这有关系吗？`
  if (stress >= 25) return `${pronoun}${cleanAge}...应该差不多。`
  return `${pronoun}${cleanAge}。`
}

/** 生成步骤5（意识与呼吸）的叙述式回答 */
export function generateVitalsNarrative(consciousness: string, breathing: string, stress: number): string {
  if (stress >= 75) {
    const c = consciousness.length > 10 ? consciousness.slice(0, 10) + '...' : consciousness
    const b = breathing.length > 10 ? breathing.slice(0, 10) + '...' : breathing
    return `${c}！！！${b}！！！你们快来啊！！！`
  }
  if (stress >= 50) return `${consciousness}...${breathing}...天哪我不知道怎么形容...反正看起来不太好...`
  if (stress >= 25) return `${consciousness}，${breathing}...应该...应该是这样的...`
  return `${consciousness}，${breathing}。`
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
