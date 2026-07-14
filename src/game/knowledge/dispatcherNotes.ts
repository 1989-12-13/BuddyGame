// ============================================================
// MPDS 知识库 — 病情描述数据
// 每个场景包含：病情概述、常见原因、调度员注意事项
// 数据按场景分类拆分到 ./notes/ 子目录，本文件合并导出
// ============================================================

export interface DispatcherNote {
  description: string
  commonCauses: string[]
  dispatcherTips: string[]
}

import { CARDIAC_NOTES } from './notes/cardiac'
import { GENERAL_NOTES } from './notes/general'
import { NEURO_NOTES } from './notes/neuro'
import { OBSTETRIC_NOTES } from './notes/obstetric'
import { RESPIRATORY_NOTES } from './notes/respiratory'
import { TRAUMA_NOTES } from './notes/trauma'

export const DISPATCHER_NOTES: Record<string, DispatcherNote> = {
  ...CARDIAC_NOTES,
  ...GENERAL_NOTES,
  ...NEURO_NOTES,
  ...OBSTETRIC_NOTES,
  ...RESPIRATORY_NOTES,
  ...TRAUMA_NOTES,
}
