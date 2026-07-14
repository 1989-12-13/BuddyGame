// ============================================================
// MPDS 知识库 — 急救指导详细说明
// 每个急救步骤附带临床解释和各选项分析
// 数据按场景分类拆分到 ./guidance/ 子目录，本文件合并导出
// ============================================================

export interface GuidanceStepDetail {
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string           // 该步骤的临床意义和操作要点
  optionAnalysis: string[]      // 每个选项的详细解释（为何对/错）
}

export interface GuidanceDetail {
  title: string
  intro: string
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
