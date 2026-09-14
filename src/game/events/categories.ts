// ============================================================
// 120调度台 — 选关菜单的分类 / 小游戏标签
//
// category 与 tag 是「给人看的呈现信息」，不属于病例数据，因此不写进卡片本身，
// 而是集中在这一张表里；卡片可选择性用自身的 menu 字段覆盖（变体卡常用）。
// ============================================================

import type { MenuMeta } from '../types'

/** 分类展示顺序 */
export const CATEGORY_ORDER = [
  '心肺复苏',
  '呼吸系统',
  '创伤出血',
  '神经系统',
  '心血管',
  '消化泌尿',
  '内分泌过敏',
  '眼伤灼伤',
  '精神特殊',
  '妇儿老年',
] as const

export type Category = (typeof CATEGORY_ORDER)[number]

/** 小游戏类型标签：emoji → 名称 */
export const TAGS: Record<string, string> = {
  '❤️': 'CPR 30:2',
  '🤲': '胸外按压',
  '✅': '快速选择',
  '🎯': '位置选择',
  '🔢': '步骤排序',
  '📞': '急救指导',
}

export type { MenuMeta } from '../types'

/**
 * 卡片 id → 菜单呈现信息。
 * 协议号、标题一律取自卡片自身（`mpdsCard.number` / `title`），此表不再重复，
 * 以免像过去那样出现菜单编号与协议号漂移。
 */
export const MENU_META: Record<string, MenuMeta> = {
  cardiac_arrest: { category: '心肺复苏', desc: 'CPR 30:2 循环', tag: '❤️' },
  choking: { category: '呼吸系统', desc: '海姆立克腹部冲击疗法', tag: '✅' },
  drowning: { category: '呼吸系统', desc: 'CPR 30:2', tag: '❤️' },
  asthma: { category: '呼吸系统', desc: '辅助呼吸胸外按压', tag: '🤲' },
  carbon_monoxide: { category: '呼吸系统', desc: '复苏体位步骤排序', tag: '🔢' },
  hemorrhage: { category: '创伤出血', desc: '保留异物、照护步骤排序', tag: '🔢' },
  stab_gunshot: { category: '创伤出血', desc: '近心端止血点选择', tag: '🎯' },
  trauma_car: { category: '创伤出血', desc: '近心端止血点选择', tag: '🎯' },
  trauma: { category: '创伤出血', desc: '急救指导', tag: '📞' },
  animal_bite: { category: '创伤出血', desc: '近心端止血点选择', tag: '🎯' },
  assault: { category: '创伤出血', desc: '近心端止血点选择', tag: '🎯' },
  stroke: { category: '神经系统', desc: '症状与时间线整理', tag: '🔢' },
  seizure: { category: '神经系统', desc: '复苏体位步骤排序', tag: '🔢' },
  unconscious_fainting: { category: '神经系统', desc: '复苏体位步骤排序', tag: '🔢' },
  severe_headache: { category: '神经系统', desc: '急救指导', tag: '📞' },
  chest_pain: { category: '心血管', desc: '停止活动、症状观察与交接', tag: '🔢' },
  heart_problems: { category: '心血管', desc: '胸外按压训练', tag: '🤲' },
  electrocution: { category: '心血管', desc: 'CPR 30:2', tag: '❤️' },
  abdominal_pain: { category: '消化泌尿', desc: '急救指导', tag: '📞' },
  back_pain: { category: '消化泌尿', desc: '急救指导', tag: '📞' },
  urinary: { category: '消化泌尿', desc: '急救指导', tag: '📞' },
  diabetic: { category: '内分泌过敏', desc: '复苏体位步骤排序', tag: '🔢' },
  anaphylaxis: { category: '内分泌过敏', desc: '肾上腺素注射定位', tag: '✅' },
  heat_stroke: { category: '内分泌过敏', desc: '冰敷位置定位', tag: '✅' },
  eye_injury: { category: '眼伤灼伤', desc: '眼部冲洗定位', tag: '✅' },
  chemical_burn: { category: '眼伤灼伤', desc: '眼部冲洗定位', tag: '✅' },
  psychiatric: { category: '精神特殊', desc: '复苏体位步骤排序', tag: '🔢' },
  overdose: { category: '精神特殊', desc: '复苏体位步骤排序', tag: '🔢' },
  entrapment: { category: '精神特殊', desc: '急救指导', tag: '📞' },
  obstetric: { category: '妇儿老年', desc: '急救指导', tag: '📞' },
  falls_elderly: { category: '妇儿老年', desc: '避免搬动、照护与接应安排', tag: '🔢' },
  sick_person: { category: '妇儿老年', desc: '急救指导', tag: '📞' },
}
