// ============================================================
// 120调度台 — 场景注册总表
//
// 每个场景由独立的协议卡片维护，统一在此注册。
// 新增场景时：1. 在 cards/ 下创建卡片文件
//              2. 在 cards/index.ts 中导出
//              3. 在此注册到 SCENARIOS 对象
// ============================================================

import type { EmergencyScenario } from '../types'
import {
  cardiacArrestCard,
  traumaCarCard,
  strokeCard,
  obstetricCard,
  chemicalBurnCard,
  prankCallCard,
  // 第二批
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
  // 第三批
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
  entrapmentCard,
  urinaryCard,
} from './cards'

/**
 * 所有可用场景的注册表
 * key 为场景 ID，value 为场景数据
 */
export const SCENARIOS: Record<string, EmergencyScenario> = {
  // 原始6场景
  cardiac_arrest: cardiacArrestCard,
  trauma_car: traumaCarCard,
  stroke: strokeCard,
  obstetric: obstetricCard,
  chemical_burn: chemicalBurnCard,
  prank_call: prankCallCard,
  // 第二批10场景
  drowning: drowningCard,
  chest_pain: chestPainCard,
  seizure: seizureCard,
  diabetic: diabeticCard,
  anaphylaxis: anaphylaxisCard,
  hemorrhage: hemorrhageCard,
  overdose: overdoseCard,
  asthma: asthmaCard,
  falls_elderly: fallsElderlyCard,
  electrocution: electrocutionCard,
  // 第三批15场景 全面覆盖
  abdominal_pain: abdominalPainCard,
  animal_bite: animalBiteCard,
  assault: assaultCard,
  back_pain: backPainCard,
  carbon_monoxide: carbonMonoxideCard,
  choking: chokingCard,
  eye_injury: eyeInjuryCard,
  severe_headache: severeHeadacheCard,
  heat_stroke: heatStrokeCard,
  heart_problems: heartProblemsCard,
  psychiatric: psychiatricCard,
  stab_gunshot: stabGunshotCard,
  unconscious_fainting: unconsciousFaintingCard,
  sick_person: sickPersonCard,
  trauma: traumaCard,
  // 最后补充 协议22 和 协议33
  entrapment: entrapmentCard,
  urinary: urinaryCard,
}

/** 所有场景ID列表 */
export const SCENARIO_IDS = Object.keys(SCENARIOS)

/** 按ID获取场景 */
export function getScenario(id: string): EmergencyScenario {
  const s = SCENARIOS[id]
  if (!s) throw new Error(`Unknown scenario: ${id}`)
  return s
}
