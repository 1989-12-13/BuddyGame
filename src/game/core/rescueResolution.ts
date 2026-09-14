import type { PatientStatus, DispatchRecord } from '../types'
import type { RoguePerkId } from './perks'
import { hasPerk } from './perks'
import {
  baseRescueRate,
  calcRescueSuccessRate,
  judgeRescueSuccess,
  triageLevelDiff,
} from './worldState'

export interface RescueAssessment {
  dispatchRecord: DispatchRecord
  patientStatus: PatientStatus
  guidanceResults: ('correct' | 'incorrect' | null)[]
  guidanceMinigameScores: (number | null)[]
  guidanceRequiredTotal: number
  perks: RoguePerkId[]
}

export interface RescueResolution {
  outcome: 'success' | 'failed'
  successScore: number
  failureReason: string | null
  patientStatus: PatientStatus
}

export function resolveRescue(input: RescueAssessment): RescueResolution {
  const triageDiff = triageLevelDiff(input.dispatchRecord.triage, input.dispatchRecord.correctTriage)
  const rawWrong = input.guidanceResults.filter(result => result === 'incorrect').length
  const guidanceWrongCount = Math.max(0, rawWrong - (hasPerk(input.perks, 'field_first_aid') ? 1 : 0))
  const completedGuidance = input.guidanceResults.filter(result => result !== null).length
  const guidanceCompletionRatio = input.guidanceRequiredTotal > 0
    ? Math.min(1, completedGuidance / input.guidanceRequiredTotal)
    : 1
  const miniGameScores = input.guidanceMinigameScores.filter((score): score is number => score !== null)
  const miniGameAvg = miniGameScores.length
    ? miniGameScores.reduce((sum, score) => sum + score, 0) / miniGameScores.length
    : 0.5
  const rate = calcRescueSuccessRate({
    base: baseRescueRate(input.dispatchRecord.correctTriage),
    stability: input.patientStatus.stability,
    dispatchTime: input.dispatchRecord.dispatchTime,
    triageDiff,
    guidanceWrongCount,
    miniGameAvg,
    guidanceCompletionRatio,
  })
  const success = judgeRescueSuccess(rate) && !input.patientStatus.died
  const failureReason = success ? null
    : triageDiff >= 2 ? '分诊级别压得太低，车到得晚了'
    : triageDiff === 1 ? '分诊偏轻，到场资源不够用'
    : input.dispatchRecord.dispatchTime > 60 ? '派车拖过了黄金时间'
    : input.patientStatus.stability < 30 ? '电话这头没能把人稳住，体征一路往下掉'
    : guidanceCompletionRatio < 1 ? '电话指导没走完，现场少了一段能争取的时间'
    : '现场处置没能把人救回来'
  return {
    outcome: success ? 'success' : 'failed',
    successScore: rate,
    failureReason,
    // 模拟救援未成功只描述本轮处置结果；除非体征已实际耗尽，
    // 不能把漏做指导或评分不足直接改写成患者死亡。
    patientStatus: input.patientStatus,
  }
}
