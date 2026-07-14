// ============================================================
// MPDS 知识库 — 急救指导详细说明
// 每个急救步骤附带临床解释和各选项分析
// 数据按场景分类拆分到 ./guidance/ 子目录，本文件合并导出
// ============================================================

/**
 * 急救步骤知识库详情
 * 仅包含卡片数据（FirstAidGuidance.steps）所没有的临床解释和分析字段。
 * prompt/options/correctIndex 以卡片数据为单一数据源。
 */
export interface GuidanceStepDetail {
  explanation: string           // 该步骤的临床意义和操作要点
  optionAnalysis: string[]      // 每个选项的详细解释（为何对/错）
}

/**
 * GuidanceDetail 仍保留 title/intro/steps 结构以保持类型兼容，
 * 但 steps 中的 prompt/options/correctIndex 已移除。
 * 这些字段以卡片数据（FirstAidGuidance.steps）为单一数据源。
 */
export interface GuidanceDetail {
  steps: GuidanceStepDetail[]
}

import { CARDIAC_GUIDANCE } from './guidance/cardiac'
import { GENERAL_GUIDANCE } from './guidance/general'
import { NEURO_GUIDANCE } from './guidance/neuro'
import { OBSTETRIC_GUIDANCE } from './guidance/obstetric'
import { RESPIRATORY_GUIDANCE } from './guidance/respiratory'
import { TRAUMA_GUIDANCE } from './guidance/trauma'

export const GUIDANCE_DETAILS: Record<string, GuidanceDetail> = {
  ...CARDIAC_GUIDANCE,
  ...GENERAL_GUIDANCE,
  ...NEURO_GUIDANCE,
  ...OBSTETRIC_GUIDANCE,
  ...RESPIRATORY_GUIDANCE,
  ...TRAUMA_GUIDANCE,
}
