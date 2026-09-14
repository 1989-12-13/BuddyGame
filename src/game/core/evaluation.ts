import type {
  AttitudeEvidence,
  CallEvaluation,
  DimensionEvaluation,
  EmergencyScenario,
  EvaluationDimensionKey,
  EvaluationGrade,
  EvaluationProfile,
  PatientOutcome,
  ShiftEvaluation,
  TriageLevel,
  WorldState,
} from '../types'
import { determinantFromCode } from '../types'
import { isPrankVerified } from './judgments'
import { deriveExpectedVitals } from './reducers/narrative'
import { careChecksFor } from './waitingCare'

export const DIMENSION_KEYS: EvaluationDimensionKey[] = ['attitude', 'guidance', 'knowledge', 'timing', 'outcome']

export const DIMENSION_LABELS: Record<EvaluationDimensionKey, string> = {
  attitude: '接线态度',
  guidance: '指导技术',
  knowledge: '知识储备',
  timing: '时间把控',
  outcome: '救援成效',
}

const GRADE_ORDER: Exclude<EvaluationGrade, 'NA'>[] = ['D', 'C', 'B', 'A', 'S']

export function emptyAttitudeEvidence(): AttitudeEvidence {
  return { supportiveTurns: 0, neutralTurns: 0, pressuringTurns: 0, calmingActions: 0, playerCausedLossControl: false }
}

export function gradeAtLeast(grade: EvaluationGrade, target: Exclude<EvaluationGrade, 'NA'>): boolean {
  return grade !== 'NA' && GRADE_ORDER.indexOf(grade) >= GRADE_ORDER.indexOf(target)
}

function minGrade(a: Exclude<EvaluationGrade, 'NA'>, b: Exclude<EvaluationGrade, 'NA'>): Exclude<EvaluationGrade, 'NA'> {
  return GRADE_ORDER[Math.min(GRADE_ORDER.indexOf(a), GRADE_ORDER.indexOf(b))]
}

function maxGrade(a: Exclude<EvaluationGrade, 'NA'>, b: Exclude<EvaluationGrade, 'NA'>): Exclude<EvaluationGrade, 'NA'> {
  return GRADE_ORDER[Math.max(GRADE_ORDER.indexOf(a), GRADE_ORDER.indexOf(b))]
}

export function clinicalRatioGrade(correct: number, total: number): Exclude<EvaluationGrade, 'NA'> {
  if (total <= 0) return 'D'
  const ratio = correct / total
  if (ratio >= 1) return 'S'
  if (ratio >= 0.85) return 'A'
  if (ratio >= 0.7) return 'B'
  if (ratio >= 0.5) return 'C'
  return 'D'
}

export function attitudeRatioGrade(correct: number, total: number): Exclude<EvaluationGrade, 'NA'> {
  if (total <= 0) return 'D'
  const ratio = correct / total
  if (ratio >= 0.9) return 'S'
  if (ratio >= 0.75) return 'A'
  if (ratio >= 0.6) return 'B'
  if (ratio >= 0.4) return 'C'
  return 'D'
}

export function dispatchTimeGrade(seconds: number | null): Exclude<EvaluationGrade, 'NA'> {
  if (seconds === null || seconds > 120) return 'D'
  if (seconds <= 35) return 'S'
  if (seconds <= 60) return 'A'
  if (seconds <= 90) return 'B'
  return 'C'
}

function dimension(
  key: EvaluationDimensionKey,
  grade: EvaluationGrade,
  evidence: string[],
  improvement: string | null,
  correct?: number,
  total?: number,
): DimensionEvaluation {
  return { key, label: DIMENSION_LABELS[key], grade, evidence, improvement, correct, total }
}

export function patientCountFor(scenario: EmergencyScenario): number {
  if (scenario.isPrank || scenario.isVerification) return 0
  if (scenario.patientCount !== undefined) return Math.max(0, Math.round(scenario.patientCount))
  const raw = scenario.fourElements.condition.patientCount
  const parsed = Number(raw.match(/\d+/)?.[0] ?? 1)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function attitudeDimension(state: WorldState, scenario: EmergencyScenario): DimensionEvaluation {
  if (scenario.isVerification) return dimension('attitude', 'NA', ['交叉核实电话不参与接线态度评级'], null)
  const e = state.attitudeEvidence
  const calmCredit = Math.min(1, e.calmingActions)
  const total = e.supportiveTurns + e.neutralTurns + e.pressuringTurns + calmCredit
  const correct = e.supportiveTurns + calmCredit + e.neutralTurns * 0.5
  let grade: EvaluationGrade = attitudeRatioGrade(correct, total)
  if (e.playerCausedLossControl && gradeAtLeast(grade, 'B')) grade = 'C'
  return dimension('attitude', grade, [
    `温和表达 ${e.supportiveTurns} 次，催促或跳步 ${e.pressuringTurns} 次`,
    e.calmingActions > 0 ? `主动安抚 ${e.calmingActions} 次` : '本通没有主动安抚',
    e.playerCausedLossControl ? '来电者在一次施压后进入失控状态' : '没有因你的措辞新增失控记录',
  ], gradeAtLeast(grade, 'B') ? null : '减少催促和跳步，先用一句稳定、明确的话取得配合。', correct, total)
}

function guidanceDimension(state: WorldState, scenario: EmergencyScenario): { value: DimensionEvaluation; dangerous: boolean } {
  if (scenario.isPrank || scenario.isVerification) {
    return { value: dimension('guidance', 'NA', ['本通无需电话急救指导'], null), dangerous: false }
  }
  const required = scenario.guidance?.steps.length ?? 0
  const completed = state.guidanceResults.filter(result => result !== null).length
  const correctSteps = state.guidanceResults.filter(result => result === 'correct').length
  const allCare = careChecksFor(state)
  const careEntries = Object.entries(state.careChecks)
  const careCorrect = careEntries.filter(([id, selected]) => allCare.find(check => check.id === id)?.correctIndex === selected).length
  const handoffApplicable = state.rescue.outcome !== null || state.patientStatus?.died === true
  const handoffCorrect = handoffApplicable && state.handoff.completed ? 1 : 0
  const total = required + careEntries.length + (handoffApplicable ? 1 : 0)
  const correct = correctSteps + careCorrect + handoffCorrect
  if (total === 0) return { value: dimension('guidance', 'NA', ['该病例没有可执行的指导步骤'], null), dangerous: false }
  const grade = clinicalRatioGrade(correct, total)
  const wrongActions = state.guidanceResults.filter(result => result === 'incorrect').length
    + (careEntries.length - careCorrect)
  return {
    value: dimension('guidance', grade, [
      `急救指导完成 ${completed}/${required} 步，其中正确 ${correctSteps} 步`,
      careEntries.length ? `途中照护答对 ${careCorrect}/${careEntries.length} 项` : '本通未触发额外途中照护题',
      handoffApplicable ? (state.handoff.completed ? '现场交接已完成' : '现场交接未完成') : '救护车尚未抵达，暂不评价交接',
    ], gradeAtLeast(grade, 'B') ? null : '优先完成关键指导，并在交接时只传递已经确认的事实。', correct, total),
    dangerous: wrongActions > 0,
  }
}

function triageDistance(chosen: TriageLevel | null, expected: TriageLevel): number {
  const order: TriageLevel[] = ['red', 'yellow', 'green', 'black']
  if (!chosen) return 99
  return Math.abs(order.indexOf(chosen) - order.indexOf(expected))
}

function knowledgeDimension(state: WorldState, scenario: EmergencyScenario): { value: DimensionEvaluation; severeTriageError: boolean } {
  if (scenario.isVerification) return { value: dimension('knowledge', 'NA', ['交叉核实结果在班次回顾中单独呈现'], null), severeTriageError: false }
  if (scenario.isPrank) {
    const correct = isPrankVerified(state.pendingJudgments) && !state.dispatchRecord ? 1 : 0
    const grade = correct ? 'S' : 'D'
    return {
      value: dimension('knowledge', grade, [correct ? '正确核实为恶作剧，未占用救护车' : '没有完成恶作剧核实，或错误派出了车辆'], correct ? null : '先通过关键事实核实来电真实性，再决定是否占用急救资源。', correct, 1),
      severeTriageError: false,
    }
  }

  const expectedVitals = deriveExpectedVitals(
    scenario.fourElements.condition.consciousness,
    scenario.fourElements.condition.breathing,
  )
  const correctProtocol = Number(scenario.mpdsCard.determinantCode.split('-')[0])
  const judgments = state.pendingJudgments.filter(item => item.chosenOptionIndex !== null)
  const judgmentCorrect = judgments.filter(item => item.options[item.chosenOptionIndex!]?.isCorrect === true).length
  const checks = [
    state.callerState?.revealedInfo.address === 'full',
    state.callerState?.revealedInfo.contact === true,
    state.callerState?.revealedInfo.chiefComplaint === true,
    state.callerState?.revealedInfo.purpose === true,
    state.terminal.protocolNumber === correctProtocol,
    state.terminal.determinant === determinantFromCode(scenario.mpdsCard.determinantCode),
    state.dispatchRecord?.triage === scenario.correctTriage,
    state.terminal.conscious === expectedVitals.conscious,
    state.terminal.breathing === expectedVitals.breathing,
  ]
  const correct = checks.filter(Boolean).length + judgmentCorrect
  const total = checks.length + judgments.length
  const grade = clinicalRatioGrade(correct, total)
  const distance = triageDistance(state.dispatchRecord?.triage ?? null, scenario.correctTriage)
  const severeTriageError = scenario.correctTriage === 'red'
    && (state.dispatchRecord?.triage === 'green' || state.dispatchRecord?.triage === 'black')
  return {
    value: dimension('knowledge', grade, [
      `关键信息与专业判断命中 ${correct}/${total} 项`,
      state.terminal.protocolNumber === correctProtocol ? 'MPDS 协议选择正确' : 'MPDS 协议需要复核',
      distance === 0 ? '分诊等级准确' : distance === 1 ? '分诊相差一级' : '分诊存在明显偏差',
    ], gradeAtLeast(grade, 'B') ? null : '按地点、患者状态、协议与分诊的顺序逐项核对，避免凭印象下结论。', correct, total),
    severeTriageError,
  }
}

function timingDimension(state: WorldState, scenario: EmergencyScenario): DimensionEvaluation {
  if (scenario.isVerification) return dimension('timing', 'NA', ['交叉核实通话不单独计算派车时效'], null)
  if (scenario.isPrank) {
    const verified = isPrankVerified(state.pendingJudgments) && !state.dispatchRecord
    const elapsed = Math.max(0, state.shiftElapsed - state.callStartTime)
    const grade: Exclude<EvaluationGrade, 'NA'> = verified ? dispatchTimeGrade(elapsed) : 'D'
    return dimension('timing', grade, [`用时 ${elapsed} 秒完成真实性核实`, verified ? '没有误派车辆' : '核实未完成或发生误派'], gradeAtLeast(grade, 'B') ? null : '先问能快速验证现场和患者存在的关键问题。')
  }
  const seconds = state.dispatchRecord?.dispatchTime ?? null
  const grade = dispatchTimeGrade(seconds)
  return dimension('timing', grade, [seconds === null ? '本通没有形成有效派车' : `接通后 ${seconds} 秒形成有效派车`], gradeAtLeast(grade, 'B') ? null : '先锁定地点、意识与呼吸，再尽快形成派车决定。')
}

function outcomeFromState(state: WorldState, scenario: EmergencyScenario): PatientOutcome {
  if (scenario.isPrank || scenario.isVerification) return 'prank'
  if (!state.dispatchRecord) return 'not_dispatched'
  if (state.patientStatus?.died) return 'died'
  if (state.rescue.outcome === 'success') return 'rescued'
  if (state.rescue.outcome === 'failed') return 'worsened'
  return 'pending'
}

function outcomeLabel(outcome: PatientOutcome): string {
  return ({
    rescued: '成功救治', worsened: '病情恶化', died: '未能救回', not_dispatched: '未形成派车',
    transferred: '已移交下一班', pending: '等待现场结果', prank: '恶作剧核实',
  } as const)[outcome]
}

function arrivalNarrative(
  scenario: EmergencyScenario,
  outcome: PatientOutcome,
  failureReason?: string | null,
  vehicleDispatched = false,
): string {
  const count = patientCountFor(scenario)
  const patients = count > 1 ? `${count} 名患者` : '患者'
  const complaint = scenario.fourElements.condition.chiefComplaint
  switch (outcome) {
    case 'rescued': return `救护车抵达“${scenario.title}”现场时，${patients}仍有可干预的生命体征。急救人员针对“${complaint}”接续评估和处置，随后安全转运。`
    case 'worsened': return `救护车抵达“${scenario.title}”现场时，${patients}病情已经恶化，但仍在接受救治。急救人员立即处置并转运${failureReason ? `；现场记录的影响因素为：${failureReason}` : ''}。`
    case 'died': return `救护车抵达“${scenario.title}”现场时，${patients}已失去生命体征。急救人员实施现场抢救，最终未能挽回。`
    case 'not_dispatched': return '本通没有形成有效派车，调度台无法确认患者之后的情况。'
    case 'transferred': return '交班发生时任务仍在处理中，后续处置已经移交，结果尚未确认。'
    case 'pending': return '救护车仍在赶往现场，患者最终情况将在现场反馈后更新。'
    case 'prank': return vehicleDispatched
      ? '经核实，本通没有真实患者，但救护车辆已经被错误占用；该过程需要在资源调度复盘中重点检查。'
      : '接线员通过关键事实完成核实，确认本通没有真实患者，未占用救护车辆。'
  }
}

function outcomeDimension(outcome: PatientOutcome, patientCount: number): DimensionEvaluation {
  if (outcome === 'prank') return dimension('outcome', 'NA', ['本通没有真实患者，不计入救援成效'], null)
  const grade: Exclude<EvaluationGrade, 'NA'> = outcome === 'rescued' ? 'S' : outcome === 'worsened' || outcome === 'transferred' || outcome === 'pending' ? 'C' : 'D'
  const evidence = outcome === 'rescued' ? `确认救治 ${patientCount} 人`
    : outcome === 'worsened' ? `${patientCount} 人病情恶化但仍在救治`
      : outcome === 'died' ? `${patientCount} 人未能救回`
        : outcome === 'not_dispatched' ? '未派车，患者结果无法确认'
          : '患者结果尚未确认'
  return dimension('outcome', grade, [evidence], gradeAtLeast(grade, 'B') ? null : '复盘最直接影响患者结局的派车、分诊和指导环节。')
}

export function baseOverall(dimensions: Record<EvaluationDimensionKey, DimensionEvaluation>): Exclude<EvaluationGrade, 'NA'> {
  const grades = DIMENSION_KEYS.map(key => dimensions[key].grade).filter((grade): grade is Exclude<EvaluationGrade, 'NA'> => grade !== 'NA')
  if (grades.length === 0) return 'D'
  const countAtLeast = (grade: Exclude<EvaluationGrade, 'NA'>) => grades.filter(item => gradeAtLeast(item, grade)).length
  const outcome = dimensions.outcome.grade
  if (countAtLeast('A') === grades.length && countAtLeast('S') >= Math.ceil(grades.length * 0.6) && (outcome === 'NA' || outcome === 'S')) return 'S'
  if (countAtLeast('A') >= Math.ceil(grades.length * 0.8) && countAtLeast('B') === grades.length) return 'A'
  if (countAtLeast('B') >= Math.ceil(grades.length * 0.6) && grades.filter(grade => grade === 'D').length <= 1) return 'B'
  if (countAtLeast('C') >= Math.ceil(grades.length * 0.6)) return 'C'
  return 'D'
}

const DEFAULT_PROFILES: Record<Exclude<EvaluationGrade, 'NA'>, EvaluationProfile> = {
  S: { id: 'excellent', title: '可靠的生命守门人', subtitle: '技术、判断与沟通都经受住了压力', badge: 'S · 卓越', description: '你把清晰判断、有效指导和对人的关照放在了同一条线上。' },
  A: { id: 'reliable', title: '稳健的调度者', subtitle: '大多数关键环节都处理得可靠', badge: 'A · 稳健', description: '这是一班值得信赖的处置，少数细节仍有继续打磨的空间。' },
  B: { id: 'qualified', title: '守住了基本盘', subtitle: '方向正确，也暴露出清晰的短板', badge: 'B · 合格', description: '你完成了主要任务，下一步应集中改进等级最低的环节。' },
  C: { id: 'developing', title: '还需要一次扎实复盘', subtitle: '部分处置有效，但关键链条仍不稳定', badge: 'C · 待提升', description: '先把最重要的信息、判断和指导顺序练熟，再追求更快。' },
  D: { id: 'retrain', title: '请从安全底线重新练起', subtitle: '本班次出现了可能影响患者安全的缺口', badge: 'D · 需重练', description: '先复盘红线问题，确认能稳定完成关键步骤后再开始下一班。' },
}

interface ProfileRuleContext {
  dimensions: Record<EvaluationDimensionKey, DimensionEvaluation>
  base: Exclude<EvaluationGrade, 'NA'>
  safetyViolation: boolean
  criticalPatientRescued: boolean
  applicable: EvaluationGrade[]
  sCount: number
}

interface ProfileRule {
  id: string
  matches: (context: ProfileRuleContext) => boolean
  resolve: (context: ProfileRuleContext) => { grade: Exclude<EvaluationGrade, 'NA'>; profile: EvaluationProfile }
}

const PROFILE_RULES: ProfileRule[] = [
  {
    id: 'safety_redline',
    matches: context => context.safetyViolation,
    resolve: () => ({ grade: 'D', profile: { ...DEFAULT_PROFILES.D, id: 'safety_redline' } }),
  },
  {
    id: 'cold_expert',
    matches: ({ dimensions }) => dimensions.knowledge.grade === 'S' && dimensions.guidance.grade === 'S'
      && (dimensions.attitude.grade === 'C' || dimensions.attitude.grade === 'D'),
    resolve: ({ base }) => ({ grade: minGrade(base, 'B'), profile: { id: 'cold_expert', title: '技术准确，但态度冷漠', subtitle: '你救下了流程，却没有完全接住电话那头的人', badge: '画像 · 冷静技术流', description: '专业判断很强；下一次请减少催促，让来电者知道你仍在听。' } }),
  },
  {
    id: 'clutch_rescue',
    matches: ({ dimensions, criticalPatientRescued }) => criticalPatientRescued
      && (dimensions.timing.grade === 'C' || dimensions.timing.grade === 'D')
      && gradeAtLeast(dimensions.knowledge.grade, 'B') && gradeAtLeast(dimensions.guidance.grade, 'B'),
    resolve: ({ base }) => ({ grade: maxGrade(base, 'B'), profile: { id: 'clutch_rescue', title: '手忙脚乱，但守住了关键生命', subtitle: '过程并不漂亮，关键处置最终赶上了', badge: '画像 · 险中守住', description: '专业动作帮助患者等到了救援；下一步要把判断转化成更快、更有序的行动。' } }),
  },
  {
    id: 'warm_unsteady',
    matches: ({ dimensions }) => (dimensions.attitude.grade === 'S' || dimensions.attitude.grade === 'A')
      && (dimensions.knowledge.grade === 'D' || dimensions.guidance.grade === 'D'),
    resolve: ({ base }) => ({ grade: minGrade(base, 'C'), profile: { id: 'warm_unsteady', title: '有温度，专业仍需补强', subtitle: '你安住了来电者，却没能稳定接住全部任务', badge: '画像 · 温和陪伴者', description: '同理心是优势；请优先补齐协议、分诊和关键急救步骤。' } }),
  },
  {
    id: 'fast_unsteady',
    matches: ({ dimensions }) => (dimensions.timing.grade === 'S' || dimensions.timing.grade === 'A')
      && (dimensions.knowledge.grade === 'C' || dimensions.knowledge.grade === 'D'),
    resolve: ({ base }) => ({ grade: minGrade(base, 'C'), profile: { id: 'fast_unsteady', title: '动作很快，但判断不够稳', subtitle: '速度争取了时间，遗漏也带来了风险', badge: '画像 · 快速行动派', description: '下一次在派车前增加一次关键信息与分诊复核。' } }),
  },
  {
    id: 'excellent',
    matches: ({ applicable, sCount }) => applicable.every(grade => gradeAtLeast(grade, 'A')) && sCount >= 3,
    resolve: () => ({ grade: 'S', profile: DEFAULT_PROFILES.S }),
  },
]

export function chooseProfile(
  dimensions: Record<EvaluationDimensionKey, DimensionEvaluation>,
  base: Exclude<EvaluationGrade, 'NA'>,
  flags: { safetyViolation: boolean; criticalPatientRescued: boolean },
): { grade: Exclude<EvaluationGrade, 'NA'>; profile: EvaluationProfile } {
  const applicable = DIMENSION_KEYS.map(key => dimensions[key].grade).filter(grade => grade !== 'NA')
  const sCount = applicable.filter(grade => grade === 'S').length
  const context: ProfileRuleContext = { dimensions, base, ...flags, applicable, sCount }
  const matched = PROFILE_RULES.find(rule => rule.matches(context))
  if (matched) return matched.resolve(context)
  return { grade: base, profile: DEFAULT_PROFILES[base] }
}

function reviewPoints(dimensions: Record<EvaluationDimensionKey, DimensionEvaluation>): string[] {
  return DIMENSION_KEYS
    .map(key => dimensions[key])
    .filter(item => item.improvement)
    .sort((a, b) => {
      if (a.grade === 'NA') return 1
      if (b.grade === 'NA') return -1
      return GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade)
    })
    .slice(0, 2)
    .map(item => item.improvement!)
}

export function buildCallEvaluation(state: WorldState, scenario: EmergencyScenario): CallEvaluation {
  const patientCount = patientCountFor(scenario)
  const attitude = attitudeDimension(state, scenario)
  const guidance = guidanceDimension(state, scenario)
  const knowledge = knowledgeDimension(state, scenario)
  const timing = timingDimension(state, scenario)
  const outcome = outcomeFromState(state, scenario)
  const dimensions = { attitude, guidance: guidance.value, knowledge: knowledge.value, timing, outcome: outcomeDimension(outcome, patientCount) }
  const safetyViolation = (!scenario.isPrank && !scenario.isVerification && !state.dispatchRecord)
    || knowledge.severeTriageError
    || guidance.dangerous
    || outcome === 'died'
  const criticalPatientRescued = scenario.correctTriage === 'red' && outcome === 'rescued'
  const selected = chooseProfile(dimensions, baseOverall(dimensions), { safetyViolation, criticalPatientRescued })
  return {
    callInstanceId: state.callInstanceId,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    isPrank: scenario.isPrank,
    vehicleDispatched: Boolean(state.dispatchRecord),
    patientCount,
    activeSeconds: Math.max(0, state.shiftElapsed - state.callStartTime),
    outcome,
    outcomeLabel: outcomeLabel(outcome),
    arrivalNarrative: arrivalNarrative(scenario, outcome, state.rescue.failureReason, Boolean(state.dispatchRecord)),
    dimensions,
    overallGrade: selected.grade,
    profile: selected.profile,
    reviewPoints: reviewPoints(dimensions),
    safetyViolation,
    criticalPatientRescued,
  }
}

export function updateCallEvaluationOutcome(
  evaluation: CallEvaluation,
  scenario: EmergencyScenario,
  outcome: 'success' | 'failed',
  died: boolean,
  failureReason: string | null,
): CallEvaluation {
  const patientOutcome: PatientOutcome = died ? 'died' : outcome === 'success' ? 'rescued' : 'worsened'
  const dimensions = { ...evaluation.dimensions, outcome: outcomeDimension(patientOutcome, evaluation.patientCount) }
  const safetyViolation = evaluation.safetyViolation || died
  const criticalPatientRescued = scenario.correctTriage === 'red' && patientOutcome === 'rescued'
  const selected = chooseProfile(dimensions, baseOverall(dimensions), { safetyViolation, criticalPatientRescued })
  return {
    ...evaluation,
    outcome: patientOutcome,
    outcomeLabel: outcomeLabel(patientOutcome),
    arrivalNarrative: arrivalNarrative(scenario, patientOutcome, failureReason, evaluation.vehicleDispatched),
    dimensions,
    overallGrade: selected.grade,
    profile: selected.profile,
    reviewPoints: reviewPoints(dimensions),
    safetyViolation,
    criticalPatientRescued,
  }
}

export function markCallEvaluationTransferred(evaluation: CallEvaluation, scenario: EmergencyScenario): CallEvaluation {
  const outcome: PatientOutcome = scenario.isPrank || scenario.isVerification ? 'prank' : 'transferred'
  const dimensions = { ...evaluation.dimensions, outcome: outcomeDimension(outcome, evaluation.patientCount) }
  const selected = chooseProfile(dimensions, baseOverall(dimensions), {
    safetyViolation: evaluation.safetyViolation,
    criticalPatientRescued: false,
  })
  return {
    ...evaluation,
    outcome,
    outcomeLabel: outcomeLabel(outcome),
    arrivalNarrative: arrivalNarrative(scenario, outcome, null, evaluation.vehicleDispatched),
    dimensions,
    overallGrade: selected.grade,
    profile: selected.profile,
    reviewPoints: reviewPoints(dimensions),
    criticalPatientRescued: false,
  }
}

function aggregateRatioDimension(key: 'attitude' | 'guidance' | 'knowledge', calls: CallEvaluation[]): DimensionEvaluation {
  const applicable = calls.map(call => call.dimensions[key]).filter(item => item.grade !== 'NA' && (item.total ?? 0) > 0)
  if (!applicable.length) return dimension(key, 'NA', ['本班次没有适用记录'], null)
  const correct = applicable.reduce((sum, item) => sum + (item.correct ?? 0), 0)
  const total = applicable.reduce((sum, item) => sum + (item.total ?? 0), 0)
  const grade = key === 'attitude' ? attitudeRatioGrade(correct, total) : clinicalRatioGrade(correct, total)
  return dimension(key, grade, [`汇总 ${applicable.length} 通适用记录`, `关键行为完成 ${Math.round(correct)}/${total} 项`], gradeAtLeast(grade, 'B') ? null : applicable.find(item => item.improvement)?.improvement ?? null, correct, total)
}

function aggregateTiming(calls: CallEvaluation[], missedCount: number): DimensionEvaluation {
  const grades = calls.map(call => call.dimensions.timing.grade).filter(grade => grade !== 'NA')
  const total = grades.length + missedCount
  if (!total) return dimension('timing', 'NA', ['本班次没有来电记录'], null)
  const atLeast = (target: Exclude<EvaluationGrade, 'NA'>) => grades.filter(grade => gradeAtLeast(grade, target)).length
  let grade: Exclude<EvaluationGrade, 'NA'>
  if (missedCount === 0 && atLeast('S') === grades.length) grade = 'S'
  else if (missedCount === 0 && atLeast('A') >= Math.ceil(total * 0.8)) grade = 'A'
  else if (missedCount / total <= 0.1 && atLeast('B') >= Math.ceil(total * 0.7)) grade = 'B'
  else if (grades.length / total >= 0.5) grade = 'C'
  else grade = 'D'
  return dimension('timing', grade, [`处理 ${grades.length} 通，漏接 ${missedCount} 通`, `达到 B 级以上时效 ${atLeast('B')} 通`], gradeAtLeast(grade, 'B') ? null : '先控制未接来电，再缩短每通从接听到派车的时间。')
}

function outcomeCounts(calls: CallEvaluation[]) {
  const count = (outcome: PatientOutcome) => calls.filter(call => call.outcome === outcome).reduce((sum, call) => sum + call.patientCount, 0)
  return {
    rescuedCount: count('rescued'), worsenedCount: count('worsened'), deathCount: count('died'),
    transferredCount: count('transferred'), unresolvedCount: count('pending') + count('not_dispatched'),
    prankCount: calls.filter(call => call.outcome === 'prank').length,
  }
}

function aggregateOutcome(calls: CallEvaluation[]): DimensionEvaluation {
  const counts = outcomeCounts(calls)
  const total = counts.rescuedCount + counts.worsenedCount + counts.deathCount + counts.transferredCount + counts.unresolvedCount
  if (!total) return dimension('outcome', 'NA', ['本班次没有真实患者结果'], null)
  const rescuedRate = counts.rescuedCount / total
  const deathRate = counts.deathCount / total
  let grade: Exclude<EvaluationGrade, 'NA'>
  if (counts.rescuedCount === total && counts.deathCount === 0) grade = 'S'
  else if (rescuedRate >= 0.85 && counts.deathCount === 0) grade = 'A'
  else if (rescuedRate >= 0.7 && deathRate < 0.1) grade = 'B'
  else if (counts.rescuedCount > 0 || counts.deathCount === 0) grade = 'C'
  else grade = 'D'
  return dimension('outcome', grade, [
    `确认救治 ${counts.rescuedCount} 人，病情恶化 ${counts.worsenedCount} 人`,
    `死亡 ${counts.deathCount} 人，结果未明或移交 ${counts.unresolvedCount + counts.transferredCount} 人`,
  ], gradeAtLeast(grade, 'B') ? null : '优先复盘直接影响患者结局的病例。')
}

export function buildShiftEvaluation(
  calls: CallEvaluation[],
  options: {
    missedCalls?: { scenarioId: string; title: string }[]
    activeSeconds?: number
    endingNarrative?: string | null
    narrative?: string
    incidents?: ShiftEvaluation['incidents']
  } = {},
): ShiftEvaluation {
  const missedCalls = options.missedCalls ?? []
  const dimensions = {
    attitude: aggregateRatioDimension('attitude', calls),
    guidance: aggregateRatioDimension('guidance', calls),
    knowledge: aggregateRatioDimension('knowledge', calls),
    timing: aggregateTiming(calls, missedCalls.length),
    outcome: aggregateOutcome(calls),
  }
  const flags = {
    safetyViolation: calls.some(call => call.safetyViolation),
    criticalPatientRescued: calls.some(call => call.criticalPatientRescued),
  }
  const selected = chooseProfile(dimensions, baseOverall(dimensions), flags)
  const counts = outcomeCounts(calls)
  return {
    calls,
    dimensions,
    overallGrade: selected.grade,
    profile: selected.profile,
    ...counts,
    missedCount: missedCalls.length,
    missedCalls,
    activeSeconds: options.activeSeconds ?? calls.reduce((sum, call) => sum + call.activeSeconds, 0),
    endingNarrative: options.endingNarrative ?? null,
    narrative: options.narrative ?? '',
    incidents: options.incidents ?? [],
  }
}
