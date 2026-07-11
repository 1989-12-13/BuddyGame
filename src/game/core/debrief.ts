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
    reason: string
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

    // 推断判断理由
    let reason = ''
    if (!j.options[correctOpt]) {
      reason = '未提供正确答案'
    } else if (chosenOpt === null) {
      reason = '未作答 — 错过此判断'
    } else if (j.options[chosenOpt]?.isCorrect !== true) {
      // 根据问题内容推断原因
      const q = j.question
      if (q.includes('年龄')) reason = '来电者使用了不确定描述词（如"左右""约"），应选择"估计记录"而非"精确记录"'
      else if (q.includes('出血')) reason = '根据"非喷射、持续渗"的描述，应判断为静脉渗血而非动脉出血'
      else if (q.includes('意识') || q.includes('呼吸')) reason = '来电者描述显示患者有意识且呼吸正常'
      else if (q.includes('恶作剧') || q.includes('非人体')) reason = '来电者声称患者是动物且伴有笑声，应识别为恶作剧'
      else if (q.includes('协议') || q.includes('MPDS')) reason = '根据主诉描述应选择对应的 MPDS 协议编号'
      else reason = '选择与病情描述不符'
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
