// ============================================================
// 场景卡片 Barrel Export
// 每个场景由独立协议卡片文件维护
//
// ALL_CARDS 是全项目唯一的卡片清单：templates.ts 的注册表、一致性测试、
// 选关菜单都从它派生。新增场景只需在此文件的导入与数组里各加一行。
// ============================================================

import type { EmergencyScenario } from '../../types'

export { cardiacArrestCard } from './cardiacArrestCard'
export { traumaCarCard } from './traumaCarCard'
export { strokeCard } from './strokeCard'
export { obstetricCard } from './obstetricCard'
export { chemicalBurnCard } from './chemicalBurnCard'
export { prankCallCard } from './prankCallCard'

// 第二批新增
export { drowningCard } from './drowningCard'
export { chestPainCard } from './chestPainCard'
export { seizureCard } from './seizureCard'
export { diabeticCard } from './diabeticCard'
export { anaphylaxisCard } from './anaphylaxisCard'
export { hemorrhageCard } from './hemorrhageCard'
export { overdoseCard } from './overdoseCard'
export { asthmaCard } from './asthmaCard'
export { fallsElderlyCard } from './fallsElderlyCard'
export { electrocutionCard } from './electrocutionCard'

// 第三批新增 全面覆盖
export { abdominalPainCard } from './abdominalPainCard'
export { animalBiteCard } from './animalBiteCard'
export { assaultCard } from './assaultCard'
export { backPainCard } from './backPainCard'
export { carbonMonoxideCard } from './carbonMonoxideCard'
export { chokingCard } from './chokingCard'
export { eyeInjuryCard } from './eyeInjuryCard'
export { severeHeadacheCard } from './severeHeadacheCard'
export { heatStrokeCard } from './heatStrokeCard'
export { heartProblemsCard } from './heartProblemsCard'
export { psychiatricCard } from './psychiatricCard'
export { stabGunshotCard } from './stabGunshotCard'
export { unconsciousFaintingCard } from './unconsciousFaintingCard'
export { sickPersonCard } from './sickPersonCard'
export { traumaCard } from './traumaCard'

// 最后补充 协议22 和 协议33
export { entrapmentCard } from './entrapmentCard'
export { urinaryCard } from './urinaryCard'

import { cardiacArrestCard } from './cardiacArrestCard'
import { traumaCarCard } from './traumaCarCard'
import { strokeCard } from './strokeCard'
import { obstetricCard } from './obstetricCard'
import { chemicalBurnCard } from './chemicalBurnCard'
import { prankCallCard } from './prankCallCard'
import { drowningCard } from './drowningCard'
import { chestPainCard } from './chestPainCard'
import { seizureCard } from './seizureCard'
import { diabeticCard } from './diabeticCard'
import { anaphylaxisCard } from './anaphylaxisCard'
import { hemorrhageCard } from './hemorrhageCard'
import { overdoseCard } from './overdoseCard'
import { asthmaCard } from './asthmaCard'
import { fallsElderlyCard } from './fallsElderlyCard'
import { electrocutionCard } from './electrocutionCard'
import { abdominalPainCard } from './abdominalPainCard'
import { animalBiteCard } from './animalBiteCard'
import { assaultCard } from './assaultCard'
import { backPainCard } from './backPainCard'
import { carbonMonoxideCard } from './carbonMonoxideCard'
import { chokingCard } from './chokingCard'
import { eyeInjuryCard } from './eyeInjuryCard'
import { severeHeadacheCard } from './severeHeadacheCard'
import { heatStrokeCard } from './heatStrokeCard'
import { heartProblemsCard } from './heartProblemsCard'
import { psychiatricCard } from './psychiatricCard'
import { stabGunshotCard } from './stabGunshotCard'
import { unconsciousFaintingCard } from './unconsciousFaintingCard'
import { sickPersonCard } from './sickPersonCard'
import { traumaCard } from './traumaCard'
import { entrapmentCard } from './entrapmentCard'
import { urinaryCard } from './urinaryCard'

import { expandVariants } from './variantBuilder'

/**
 * 母卡清单（人工维护的那一行）。
 * 顺序与历史注册表一致，避免改动 SCENARIO_IDS 的顺序而扰动依赖随机序列的测试。
 */
const BASE_CARDS: EmergencyScenario[] = [
  // 原始 6 场景
  cardiacArrestCard,
  traumaCarCard,
  strokeCard,
  obstetricCard,
  chemicalBurnCard,
  prankCallCard,
  // 第二批 10 场景
  drowningCard,
  chestPainCard,
  seizureCard,
  diabeticCard,
  anaphylaxisCard,
  hemorrhageCard,
  overdoseCard,
  asthmaCard,
  fallsElderlyCard,
  electrocutionCard,
  // 第三批 15 场景 全面覆盖
  abdominalPainCard,
  animalBiteCard,
  assaultCard,
  backPainCard,
  carbonMonoxideCard,
  chokingCard,
  eyeInjuryCard,
  severeHeadacheCard,
  heatStrokeCard,
  heartProblemsCard,
  psychiatricCard,
  stabGunshotCard,
  unconsciousFaintingCard,
  sickPersonCard,
  traumaCard,
  // 最后补充 协议22 和 协议33
  entrapmentCard,
  urinaryCard,
]

function patientCountOf(card: EmergencyScenario): number {
  if (card.isPrank || card.isVerification) return 0
  const text = card.fourElements.condition.patientCount
  const numeric = Number.parseInt(text, 10)
  if (Number.isFinite(numeric)) return numeric
  // 当前“十几人”群体事件采用可重复、可测试的保守值 12 人。
  if (text.includes('十几')) return 12
  return 1
}

/** 全部卡片：母卡 + 由 variants 展开出的变体卡，并固化患者人数。 */
export const ALL_CARDS: EmergencyScenario[] = [...BASE_CARDS, ...expandVariants(BASE_CARDS)]
  .map(card => ({ ...card, patientCount: patientCountOf(card) }))

/** 仅母卡（不含变体）—— 需要一对一映射时用，如菜单默认键 */
export const BASE_CARD_IDS = BASE_CARDS.map(c => c.id)
