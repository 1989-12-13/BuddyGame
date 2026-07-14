// ============================================================
// 零点接线台 — 叙述式回答生成函数
// 根据来电者压力水平生成不同质量的对话回答
// ============================================================

import type { InfoQuality, JudgmentPrompt } from '../../types'
import { rng } from '../random'
import { getPronoun } from '../../content/pronouns'

// ==================== 主函数 ====================

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

/** 提取中文叙述的第一个完整分句（到句号/逗号/叹号为止），用于恐慌模式 */
function firstClause(text: string): string {
  return text.split(/[。！？；，、]/)[0].trim() || text
}

/** 生成步骤1（位置确认）的叙述式回答 */
export function generateLocationNarrative(
  partial: string,
  vague: string,
  stress: number,
): { text: string; quality: InfoQuality; distorted: boolean } {
  if (stress >= 75) return { text: vague, quality: 'vague', distorted: true }
  if (stress >= 50) {
    const hint = vague.split(/[，,、\s]/)[0]
    return {
      text: `${partial.split('，')[0]}！！你们快来！！就在${hint}这边！！`,
      quality: 'partial', distorted: true,
    }
  }
  if (stress >= 25) {
    const hint = vague.split(/[，,、\s]/)[0]
    return {
      text: `好像是${hint}那边...不对，应该是${partial}...对对对，就是这个地址。`,
      quality: 'partial', distorted: false,
    }
  }
  return { text: partial, quality: 'clear', distorted: false }
}

/** 根据来电者与患者的关系生成自然的开场情景描述 */
function relationshipContext(relationship: string): string {
  switch (relationship) {
    case '路人':    return '我在路边看到的'
    case '同事':    return '我们正在上班'
    case '家人':
    case '家属':   return '刚才在家里还好好的'
    case '朋友':    return '我们刚才还在聊天'
    case '邻居':    return '我听到声音过来看的'
    case '伴侣':
    case '夫妻':   return '我们俩刚才还好好的'
    default:        return '刚才还好好的'
  }
}

/** 生成步骤2（事件简述）的叙述式回答 */
export function generateEventNarrative(
  chiefComplaint: string,
  gender: string,
  stress: number,
  relationship: string,
): { text: string; quality: InfoQuality; distorted: boolean } {
  const pronoun = getPronoun(gender)
  const ctx = relationshipContext(relationship)

  if (stress >= 75) {
    // 恐慌模式：只喊出最关键的第一句，去掉代词前缀避免与 complaint 主语冲突
    const urgent = firstClause(chiefComplaint)
    return {
      text: `不行了不行了！！${urgent}！！${pronoun}快不行了！！你们快来啊！！`,
      quality: 'vague', distorted: true,
    }
  }
  if (stress >= 50) {
    // 惊恐模式：复述完整事件+关系场景，但语气凌乱
    return {
      text: `${pronoun}...我...我不知道怎么说...${chiefComplaint}...就是突然之间的事！${ctx}，一下子就变成这样了...我该怎么办呐？！`,
      quality: 'partial', distorted: true,
    }
  }
  if (stress >= 25) {
    // 紧张模式：完整复述，但略带迟疑
    return {
      text: `${pronoun}${chiefComplaint}...就是这样的情况，刚刚发生的，感觉挺严重的。嗯...大概就是这样。`,
      quality: 'partial', distorted: false,
    }
  }
  // 镇定模式：完整准确描述
  return { text: chiefComplaint, quality: 'clear', distorted: false }
}

/** 生成步骤3（患者年龄）的叙述式回答 */
export function generateAgeNarrative(age: string, stress: number): string {
  const cleanAge = age.replace(/男性|女性|男|女|不详/g, '').trim()
  if (stress >= 75) return `${cleanAge}！！反正就是这么大年纪！！你们快来啊！！`
  if (stress >= 50) return `好像是${cleanAge}...我也记不清了...应该是${cleanAge}吧，这很重要吗？`
  if (stress >= 25) return `${cleanAge}...应该差不多是这个岁数。`
  return `${cleanAge}。`
}

/** 生成步骤4（意识与呼吸）的叙述式回答 */
export function generateVitalsNarrative(consciousness: string, breathing: string, stress: number): string {
  if (stress >= 75) {
    const c = firstClause(consciousness)
    const b = firstClause(breathing)
    return `${c}！！${b}！！你们快来啊！！`
  }
  if (stress >= 50) return `${consciousness}...${breathing}...天哪我说不太清楚，反正看着不太对劲...`
  if (stress >= 25) return `${consciousness}，${breathing}...应该是这样的...`
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
