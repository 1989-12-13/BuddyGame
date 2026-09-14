// ============================================================
// 120调度台 — 通话结算报告
// ============================================================

import type { WorldState, TriageLevel, JudgmentPrompt, MpdsDeterminant, EmergencyScenario } from '../types'
import { determinantFromCode } from '../types'
import { hasPerk } from './perks'
import { isPrankVerified } from './judgments'

export type OutcomeTier = 'good' | 'normal' | 'bad' | 'special'

export interface DebriefBreakdown {
  speed: number
  info: number
  triage: number
  decision: number
  guidance: number
  penalty: number
}

export interface DebriefEntry {
  scenarioId: string
  scenarioTitle: string
  isPrank: boolean
  dispatchTime: number | null
  withinTimeLimit: boolean
  addressStatus: 'full' | 'partial' | 'vague' | 'none'
  hasContact: boolean
  hasCondition: boolean
  hasPurpose: boolean
  playerTriage: TriageLevel | null
  correctTriage: TriageLevel
  triageCorrect: boolean
  triageDiff: number
  playerDeterminant: MpdsDeterminant | null
  expectedDeterminant: MpdsDeterminant | null
  determinantCorrect: boolean
  guidanceCorrect: number
  guidanceTotal: number
  judgments: {
    question: string
    playerChoice: string | null
    correctAnswer: string
    isCorrect: boolean
    reason: string
  }[]
  score: number
  breakdown: DebriefBreakdown
  outcomeTier: OutcomeTier
  outcomeTitle: string
  patientStatus: string
  consequence: string
  reviewPoints: string[]
  outcomeNarrative: string
  isPrankHandledCorrectly: boolean | null
}

function buildOutcome(
  scenario: EmergencyScenario,
  facts: {
    score: number
    isPrank: boolean
    dispatchTime: number | null
    triageCorrect: boolean
    triageDiff: number
    determinantCorrect: boolean
    guidanceCorrect: number
    guidanceTotal: number
    hasContact: boolean
    hasCondition: boolean
    hasPurpose: boolean
    prankHandledCorrectly: boolean | null
  },
): Pick<DebriefEntry, 'outcomeTier' | 'outcomeTitle' | 'patientStatus' | 'consequence' | 'reviewPoints' | 'outcomeNarrative'> {
  const guidanceRatio = facts.guidanceTotal > 0
    ? facts.guidanceCorrect / facts.guidanceTotal
    : 1
  const reviewPoints: string[] = []

  if (facts.dispatchTime === null && !facts.isPrank) {
    reviewPoints.push('未形成有效派车记录，现场响应中断。')
  } else if (facts.dispatchTime !== null && facts.dispatchTime > 60) {
    reviewPoints.push(`派车耗时 ${facts.dispatchTime} 秒，超过 60 秒目标。`)
  } else if (facts.dispatchTime !== null) {
    reviewPoints.push(`派车耗时 ${facts.dispatchTime} 秒，时间控制合格。`)
  }

  if (!facts.triageCorrect) {
    reviewPoints.push(facts.triageDiff <= 1
      ? '分诊等级接近正确答案，但仍需复核优先级。'
      : '分诊等级差得比较多，车可能会跑错地方。')
  } else {
    reviewPoints.push('分诊等级压得准，和病例风险对得上。')
  }

  if (!facts.determinantCorrect && !facts.isPrank) {
    reviewPoints.push('MPDS 判定码对不上，后面几步指导的依据就站不稳了。')
  }

  if (facts.guidanceTotal > 0) {
    reviewPoints.push(guidanceRatio >= 0.8
      ? '现场急救指导基本走完了。'
      : '现场急救指导漏了几步关键的。')
  }

  if (!facts.hasContact) reviewPoints.push('联系电话没确认，回拨和补定位都悬着。')
  if (!facts.hasPurpose) reviewPoints.push('求助诉求没记下来，复盘时说不清这通电话到底要解决什么。')
  if (!facts.hasCondition) reviewPoints.push('主诉信息不足，分诊的依据偏薄。')

  if (facts.isPrank) {
    if (facts.prankHandledCorrectly) {
      return {
        outcomeTier: 'special',
        outcomeTitle: '特殊结局：这通电话是假的',
        patientStatus: '没有出车',
        consequence: '核实清楚之后挂了电话，车还留给真正等着的人。',
        reviewPoints: ['挂断前把该核实的都核实了。'],
        outcomeNarrative: scenario.outcomeNarrative.prank,
      }
    }

    return {
      outcomeTier: 'bad',
      outcomeTitle: '坏结局：车白跑了',
      patientStatus: facts.dispatchTime === null ? '没核实完' : '车派给了一通假电话',
      consequence: facts.dispatchTime === null
        ? '这通电话的真假没个说法，记录也就到此为止了。'
        : '车去了一趟根本没事的地方，真出事的人得多等一会儿。',
      reviewPoints,
      outcomeNarrative: scenario.outcomeNarrative.bad,
    }
  }

  const severeFailure = facts.dispatchTime === null
    || facts.triageDiff > 1
    || guidanceRatio < 0.5
    || facts.score < 45
  const strongRun = facts.dispatchTime !== null
    && facts.dispatchTime <= 60
    && facts.triageCorrect
    && facts.determinantCorrect
    && guidanceRatio >= 0.8
    && facts.score >= 80

  if (strongRun) {
    return {
      outcomeTier: 'good',
      outcomeTitle: '好结局：患者平稳交接',
      patientStatus: '体征稳住了，现场处置也跟上了',
      consequence: '急救车到场直接按完整记录接手，前面争取到的每一分钟都用上了。',
      reviewPoints,
      outcomeNarrative: scenario.outcomeNarrative.good,
    }
  }

  if (severeFailure) {
    return {
      outcomeTier: 'bad',
      outcomeTitle: '坏结局：病情拖不住了',
      patientStatus: '现场风险一路往上走',
      consequence: '拖时间、判错方向或者指导漏步，把人交给了被动的一方。这通值得好好复盘。',
      reviewPoints,
      outcomeNarrative: scenario.outcomeNarrative.bad,
    }
  }

  return {
    outcomeTier: 'normal',
    outcomeTitle: '普通结局：人送走了，但还能做得更好',
    patientStatus: '人转运走了，处置上还有隐患',
    consequence: '大方向没错，但信息、判定或指导这几处都还有能抠的地方。',
    reviewPoints,
    outcomeNarrative: scenario.outcomeNarrative.good,
  }
}

/** 生成通话结算报告（需传入场景数据，因通话已结束后 state.currentCall 为 null） */
export function buildDebrief(
  state: WorldState,
  scenario: EmergencyScenario,
  explicitBreakdown?: DebriefBreakdown,
): DebriefEntry {
  const cs = state.callerState
  const isPrank = scenario.isPrank
  const dispatchRecord = state.dispatchRecord

  // 分诊准确度
  const playerTriage = dispatchRecord?.triage ?? null
  const correctTriage = scenario.correctTriage
  const triageOrder: TriageLevel[] = ['red', 'yellow', 'green', 'black']
  const triageDiff = playerTriage && correctTriage
    ? Math.abs(triageOrder.indexOf(playerTriage) - triageOrder.indexOf(correctTriage))
    : 99
  const triageCorrect = playerTriage === correctTriage

  // MPDS 判定码
  const playerDeterminant = state.terminal.determinant
  const expectedDeterminant = determinantFromCode(scenario.mpdsCard.determinantCode)
  const determinantCorrect = playerDeterminant === expectedDeterminant

  // 临床判断
  const judgments = (state.pendingJudgments ?? []).map((j: JudgmentPrompt) => {
    const correctOpt = j.options.findIndex(o => o.isCorrect)
    const chosenOpt = j.chosenOptionIndex

    // 推断判断理由
    let reason = ''
    if (!j.options[correctOpt]) {
      reason = '未提供正确答案'
    } else if (chosenOpt === null) {
      reason = '未作答 — 错过此判断'
    } else if (j.options[chosenOpt]?.isCorrect !== true) {
      // 通用兜底：使用选项标签描述差异，不依赖硬编码中文子串
      const chosenLabel = j.options[chosenOpt]?.label ?? '未知选项'
      const correctLabel = j.options[correctOpt]?.label ?? '未知'
      reason = `选择了「${chosenLabel}」，正确答案应为「${correctLabel}」`
    }

    return {
      question: j.question,
      playerChoice: chosenOpt !== null ? j.options[chosenOpt]?.label ?? '未选择' : '未选择',
      correctAnswer: correctOpt >= 0 ? j.options[correctOpt]?.label ?? '未知' : '未知',
      isCorrect: chosenOpt !== null && j.options[chosenOpt]?.isCorrect === true,
      reason,
    }
  })

  // 叙事结局
  const score = state.callScores[state.callScores.length - 1] ?? 0
  const rawGuidanceCorrect = state.guidanceResults.filter(r => r === 'correct').length
  const guidanceTotal = scenario.guidance?.steps.length ?? 0
  const guidanceCorrect = hasPerk(state.perks, 'field_first_aid') && state.guidanceResults.some(r => r === 'incorrect')
    ? Math.min(guidanceTotal, rawGuidanceCorrect + 1)
    : rawGuidanceCorrect
  const prankHandledCorrectly = isPrank
    ? !dispatchRecord && (isPrankVerified(state.pendingJudgments) || score >= 100)
    : null
  const breakdown = explicitBreakdown ?? parseScoreBreakdown(state)
  const outcome = buildOutcome(scenario, {
    score,
    isPrank,
    dispatchTime: dispatchRecord?.dispatchTime ?? null,
    triageCorrect,
    triageDiff,
    determinantCorrect,
    guidanceCorrect,
    guidanceTotal,
    hasContact: cs?.revealedInfo.contact ?? false,
    hasCondition: cs?.revealedInfo.chiefComplaint ?? false,
    hasPurpose: cs?.revealedInfo.purpose ?? false,
    prankHandledCorrectly,
  })
  const completedGuidance = state.guidanceResults.filter(result => result !== null).length
  const reviewPoints = [...outcome.reviewPoints]
  if (!isPrank && guidanceTotal > 0) {
    reviewPoints.push(`电话急救指导完成 ${completedGuidance}/${guidanceTotal} 步。${completedGuidance < (scenario.guidance?.steps.length ?? 0) ? '剩下的步骤没走完，现场少了一段本可以争取的时间。' : ''}`)
  }
  if (!isPrank && dispatchRecord) {
    reviewPoints.push(state.handoff.completed
      ? `现场交接已完成${state.handoff.firstAttemptCorrect === false ? '，并在第二次提交时修正了漏项' : ''}。`
      : '通话结束前未完成现场交接，车辆仍会继续执行救援任务。')
  }

  return {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    isPrank,
    dispatchTime: dispatchRecord?.dispatchTime ?? null,
    withinTimeLimit: dispatchRecord ? dispatchRecord.dispatchTime <= 60 : false,
    addressStatus: dispatchRecord?.addressCompleteness ?? cs?.revealedInfo.address ?? 'none',
    hasContact: cs?.revealedInfo.contact ?? false,
    hasCondition: cs?.revealedInfo.chiefComplaint ?? false,
    hasPurpose: cs?.revealedInfo.purpose ?? false,
    playerTriage,
    correctTriage,
    triageCorrect,
    triageDiff,
    playerDeterminant,
    expectedDeterminant,
    determinantCorrect,
    guidanceCorrect,
    guidanceTotal,
    judgments,
    score,
    breakdown,
    ...outcome,
    ...(!isPrank ? {
      outcomeTier: state.rescue.outcome === 'success' ? 'good' as const : state.rescue.outcome === 'failed' || state.patientStatus?.died ? 'bad' as const : 'normal' as const,
      outcomeTitle: state.rescue.outcome === 'success' ? '现场交接已完成' : state.rescue.outcome === 'failed' || state.patientStatus?.died ? '人没救回来，回头看看是哪一步' : dispatchRecord ? '车派出去了，通话先结束' : '通话结束，车没派出去',
      patientStatus: state.rescue.outcome === 'success' ? '现场处置按计划完成，人交给接车医院。' : state.rescue.outcome === 'failed' || state.patientStatus?.died ? '现场处置没能把人稳住，评分只反映电话这一步。' : '现场最终结果尚未确认。',
      outcomeNarrative: `本次${dispatchRecord ? `在接听后 ${dispatchRecord.dispatchTime} 秒派出救护车，采用所选路线` : '未形成派车记录'}。${guidanceTotal ? `急救指导完成 ${completedGuidance}/${guidanceTotal} 步，其中 ${rawGuidanceCorrect} 步操作到位。` : ''}${state.rescue.failureReason ? `记录中的影响因素：${state.rescue.failureReason}。` : ''}`,
    } : {}),
    reviewPoints,
    isPrankHandledCorrectly: prankHandledCorrectly,
  }
}

/** 从 state.dialogueLog 解析最后一条得分汇总行 */
export function parseScoreBreakdown(state: WorldState): DebriefBreakdown {
  const log = state.dialogueLog
  for (let i = log.length - 1; i >= 0; i--) {
    const line = log[i]
    if (line.speaker === 'system' && line.text.includes('通话结束')) {
      const m = line.text.match(/速度:(\d+)\s+信息:(\d+)\s+分诊:(\d+)(?:\s+判定:(\d+))?\s+指导:(\d+)\s+判断扣分:(\d+)/)
      if (m) {
        return {
          speed: Number(m[1]), info: Number(m[2]),
          triage: Number(m[3]), decision: Number(m[4] ?? 0),
          guidance: Number(m[5]), penalty: Number(m[6]),
        }
      }
    }
  }
  return { speed: 0, info: 0, triage: 0, decision: 0, guidance: 0, penalty: 0 }
}
