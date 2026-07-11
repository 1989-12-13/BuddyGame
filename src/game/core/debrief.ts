// ============================================================
// 零点接线台 — 通话结算报告
// ============================================================

import type { WorldState, TriageLevel, JudgmentPrompt, MpdsDeterminant, EmergencyScenario } from '../types'

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
  }[]
  score: number
  outcomeNarrative: string
  isPrankHandledCorrectly: boolean | null
}

/** 从判定码字符串推导预期 MpdsDeterminant */
export function determinantFromCode(code: string): MpdsDeterminant | null {
  const letter = code.split('-')[1]?.toUpperCase()
  const map: Record<string, MpdsDeterminant> = {
    E: 'ECHO', D: 'DELTA', C: 'CHARLIE', B: 'BRAVO', A: 'ALPHA',
  }
  return letter ? (map[letter] ?? null) : null
}

/** 生成通话结算报告（需传入场景数据，因通话已结束后 state.currentCall 为 null） */
export function buildDebrief(
  state: WorldState,
  scenario: EmergencyScenario,
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
    return {
      question: j.question,
      playerChoice: chosenOpt !== null ? j.options[chosenOpt]?.label ?? '未选择' : '未选择',
      correctAnswer: correctOpt >= 0 ? j.options[correctOpt]?.label ?? '未知' : '未知',
      isCorrect: chosenOpt !== null && j.options[chosenOpt]?.isCorrect === true,
    }
  })

  // 叙事结局
  let outcomeNarrative = ''
  if (isPrank) {
    const prankHandledCorrectly = !dispatchRecord
    outcomeNarrative = prankHandledCorrectly
      ? scenario.outcomeNarrative.prank
      : scenario.outcomeNarrative.bad
  } else {
    const isGoodOutcome = dispatchRecord && (triageCorrect || triageDiff <= 1)
    outcomeNarrative = isGoodOutcome
      ? scenario.outcomeNarrative.good
      : scenario.outcomeNarrative.bad
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
    guidanceCorrect: state.guidanceResults.filter(r => r === 'correct').length,
    guidanceTotal: state.guidanceResults.length,
    judgments,
    score: state.callScores[state.callScores.length - 1] ?? 0,
    outcomeNarrative,
    isPrankHandledCorrectly: isPrank ? !dispatchRecord : null,
  }
}

/** 从 state.dialogueLog 解析最后一条得分汇总行 */
export function parseScoreBreakdown(state: WorldState): {
  speed: number; info: number; triage: number; guidance: number; penalty: number
} {
  const log = state.dialogueLog
  for (let i = log.length - 1; i >= 0; i--) {
    const line = log[i]
    if (line.speaker === 'system' && line.text.includes('通话结束')) {
      const m = line.text.match(/速度:(\d+)\s+信息:(\d+)\s+分诊:(\d+)\s+指导:(\d+)\s+判断扣分:(\d+)/)
      if (m) {
        return {
          speed: Number(m[1]), info: Number(m[2]),
          triage: Number(m[3]), guidance: Number(m[4]),
          penalty: Number(m[5]),
        }
      }
    }
  }
  return { speed: 0, info: 0, triage: 0, guidance: 0, penalty: 0 }
}
