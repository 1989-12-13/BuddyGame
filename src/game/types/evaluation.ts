export type EvaluationGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'NA'

export type EvaluationDimensionKey = 'attitude' | 'guidance' | 'knowledge' | 'timing' | 'outcome'

export type PatientOutcome =
  | 'rescued'
  | 'worsened'
  | 'died'
  | 'not_dispatched'
  | 'transferred'
  | 'pending'
  | 'prank'

export interface AttitudeEvidence {
  supportiveTurns: number
  neutralTurns: number
  pressuringTurns: number
  calmingActions: number
  playerCausedLossControl: boolean
}

export interface DimensionEvaluation {
  key: EvaluationDimensionKey
  label: string
  grade: EvaluationGrade
  evidence: string[]
  improvement: string | null
  /** 仅供跨通话聚合，不向玩家显示为分数。 */
  correct?: number
  total?: number
}

export interface EvaluationProfile {
  id: string
  title: string
  subtitle: string
  description: string
  badge: string
}

export interface CallEvaluation {
  callInstanceId: number
  scenarioId: string
  scenarioTitle: string
  isPrank: boolean
  vehicleDispatched: boolean
  patientCount: number
  activeSeconds: number
  outcome: PatientOutcome
  outcomeLabel: string
  arrivalNarrative: string
  dimensions: Record<EvaluationDimensionKey, DimensionEvaluation>
  overallGrade: Exclude<EvaluationGrade, 'NA'>
  profile: EvaluationProfile
  reviewPoints: string[]
  safetyViolation: boolean
  criticalPatientRescued: boolean
}

export interface ShiftEvaluation {
  calls: CallEvaluation[]
  dimensions: Record<EvaluationDimensionKey, DimensionEvaluation>
  overallGrade: Exclude<EvaluationGrade, 'NA'>
  profile: EvaluationProfile
  rescuedCount: number
  worsenedCount: number
  deathCount: number
  transferredCount: number
  unresolvedCount: number
  prankCount: number
  missedCount: number
  missedCalls: { scenarioId: string; title: string }[]
  activeSeconds: number
  endingNarrative: string | null
  narrative: string
  incidents: { scenarioId: string; title: string; resolution: 'adopt' | 'reject' | null }[]
}
