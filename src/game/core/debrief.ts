// ============================================================
// 零点接线台 — 通话结算报告
// ============================================================

import type { WorldState, TriageLevel, JudgmentPrompt, MpdsDeterminant, EmergencyScenario } from '../types'
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

/** 从判定码字符串推导预期 MpdsDeterminant */
function determinantFromCode(code: string): MpdsDeterminant | null {
  const letter = code.split('-')[1]?.toUpperCase()
  const map: Record<string, MpdsDeterminant> = {
    E: 'ECHO', D: 'DELTA', C: 'CHARLIE', B: 'BRAVO', A: 'ALPHA',
  }
  return letter ? (map[letter] ?? null) : null
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
      : '分诊等级偏差较大，可能造成资源错配。')
  } else {
    reviewPoints.push('分诊等级与病例风险匹配。')
  }

  if (!facts.determinantCorrect && !facts.isPrank) {
    reviewPoints.push('MPDS 判定码不匹配，后续指导依据存在风险。')
  }

  if (facts.guidanceTotal > 0) {
    reviewPoints.push(guidanceRatio >= 0.8
      ? '现场急救指导执行较完整。'
      : '现场急救指导存在关键缺口。')
  }

  if (!facts.hasContact) reviewPoints.push('联系电话未确认，回拨与补充定位风险较高。')
  if (!facts.hasPurpose) reviewPoints.push('求助诉求未记录，复盘时难以判断来电目标。')
  if (!facts.hasCondition) reviewPoints.push('主诉信息不足，分诊依据偏弱。')

  if (facts.isPrank) {
    if (facts.prankHandledCorrectly) {
      return {
        outcomeTier: 'special',
        outcomeTitle: '特殊结局：无效来电被拦截',
        patientStatus: '未派出急救资源',
        consequence: '接线员完成核实后终止通话，救护资源保留给真实急症。',
        reviewPoints: ['识别恶作剧电话前完成了必要核实。'],
        outcomeNarrative: scenario.outcomeNarrative.prank,
      }
    }

    return {
      outcomeTier: 'bad',
      outcomeTitle: '坏结局：资源被误占用',
      patientStatus: facts.dispatchTime === null ? '未完成核实' : '救护资源误派',
      consequence: facts.dispatchTime === null
        ? '来电真实性没有被确认，处置记录无法闭环。'
        : '救护车被派往无效目标，真实急救需求可能因此排队。',
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
      outcomeTitle: '好结局：患者稳定交接',
      patientStatus: '生命体征与现场处置稳定',
      consequence: '急救车到场后可直接按高质量记录接手，患者获得较好的院前处置窗口。',
      reviewPoints,
      outcomeNarrative: scenario.outcomeNarrative.good,
    }
  }

  if (severeFailure) {
    return {
      outcomeTier: 'bad',
      outcomeTitle: '坏结局：病情风险扩大',
      patientStatus: '患者现场风险升高',
      consequence: '延误、误判或急救指导缺口让院前处置变得被动，需要重点复盘。',
      reviewPoints,
      outcomeNarrative: scenario.outcomeNarrative.bad,
    }
  }

  return {
    outcomeTier: 'normal',
    outcomeTitle: '普通结局：送医但需复盘',
    patientStatus: '患者完成转运，仍有处置风险',
    consequence: '关键方向基本正确，但信息完整度、判定或急救指导仍有可改进点。',
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
  const guidanceTotal = state.guidanceResults.filter(r => r !== null).length
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
