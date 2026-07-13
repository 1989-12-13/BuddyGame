import { describe, expect, it } from 'vitest'
import type { JudgmentPrompt, WorldState } from '../types'
import { determinantToHotCold } from '../types'
import { createInitialState } from './worldState'
import { worldReducer } from './worldReducer'

function beginCall(scenarioId = 'cardiac_arrest'): WorldState {
  const started = worldReducer(createInitialState(), { type: 'START_SHIFT' })
  const withScenario = {
    ...started,
    scenarioQueue: [scenarioId, ...started.scenarioQueue.filter(id => id !== scenarioId)],
  }
  return worldReducer(withScenario, { type: 'ANSWER_CALL' })
}

function askLocation(state: WorldState): WorldState {
  return worldReducer(state, { type: 'ASK_QUESTION', questionId: 'step1_location' })
}

function finishRescue(state: WorldState): WorldState {
  return {
    ...state,
    ambulanceRemaining: 0,
    rescue: {
      ...state.rescue,
      phase: 'success',
      outcome: 'success',
      successScore: 1,
      failureReason: null,
    },
  }
}

describe('worldReducer', () => {
  it('advances game time for questions and records the caller purpose', () => {
    const answered = beginCall()
    const afterLocation = worldReducer(answered, {
      type: 'ASK_QUESTION',
      questionId: 'step1_location',
    })
    const afterPurpose = worldReducer(afterLocation, {
      type: 'ASK_QUESTION',
      questionId: 'ask_purpose',
    })

    expect(afterLocation.shiftElapsed).toBe(answered.shiftElapsed + 2)
    expect(afterPurpose.shiftElapsed).toBe(answered.shiftElapsed + 3)
    expect(afterPurpose.callerState?.questionCount).toBe(2)
    expect(afterPurpose.callerState?.revealedInfo.purpose).toBe(true)
  })

  it('keeps MPDS determinant and triage independent and emits after-dispatch events', () => {
    const answered = beginCall()
    const classifiedBeforeLocation = worldReducer(answered, {
      type: 'SET_MPDS_DETERMINANT',
      determinant: 'ECHO',
    })
    const blocked = worldReducer(classifiedBeforeLocation, { type: 'DISPATCH' })
    const located = askLocation(answered)
    const classified = worldReducer(located, {
      type: 'SET_MPDS_DETERMINANT',
      determinant: 'ECHO',
    })
    const dispatched = worldReducer(classified, { type: 'DISPATCH' })
    // SET_TRIAGE 仍可作为手动覆盖使用
    const overridden = worldReducer(classified, { type: 'SET_TRIAGE', level: 'yellow' })

    expect(classified.terminal.triage).toBe('red')
    expect(answered.terminal.hotCold).toBeNull()
    expect(classified.terminal.hotCold).toBe('HOT')
    expect(blocked.dispatchRecord).toBeNull()
    expect(blocked.patientEvents[blocked.patientEvents.length - 1]?.text).toContain('位置')
    expect(dispatched.dispatchRecord?.triage).toBe('red')
    expect(overridden.terminal.triage).toBe('yellow')
    expect(dispatched.dialogueLog).toHaveLength(classified.dialogueLog.length + 2)
  })

  it('derives HOT or COLD response mode from the player determinant', () => {
    const answered = askLocation(beginCall())
    const alpha = worldReducer(answered, {
      type: 'SET_MPDS_DETERMINANT',
      determinant: 'ALPHA',
    })

    expect(determinantToHotCold(alpha.terminal.determinant!)).toBe('COLD')
  })

  it('deducts points for an incorrect MPDS determinant', () => {
    const answered = askLocation(beginCall())

    const correctClassified = worldReducer(answered, {
      type: 'SET_MPDS_DETERMINANT',
      determinant: 'ECHO',
    })
    const correctTriaged = worldReducer(correctClassified, {
      type: 'SET_TRIAGE',
      level: 'red',
    })
    const correctEnded = worldReducer(
      finishRescue(worldReducer(correctTriaged, { type: 'DISPATCH' })),
      { type: 'END_CALL' },
    )

    const wrongDeterminant = worldReducer(answered, {
      type: 'SET_MPDS_DETERMINANT',
      determinant: 'ALPHA',
    })
    const correctedTriage = worldReducer(wrongDeterminant, {
      type: 'SET_TRIAGE',
      level: 'red',
    })
    const wrongEnded = worldReducer(
      finishRescue(worldReducer(correctedTriage, { type: 'DISPATCH' })),
      { type: 'END_CALL' },
    )

    expect(correctEnded.callScores[0] - wrongEnded.callScores[0]).toBe(5)
  })

  it('deducts points for an incorrect clinical judgment', () => {
    const classified = worldReducer(askLocation(beginCall()), {
      type: 'SET_MPDS_DETERMINANT',
      determinant: 'ECHO',
    })
    const triaged = worldReducer(classified, { type: 'SET_TRIAGE', level: 'red' })
    const judgment: JudgmentPrompt = {
      id: 'test-judgment',
      questionId: 'test-question',
      dialogueIndex: 0,
      question: '测试临床判断',
      options: [
        { label: '正确', fills: [], isCorrect: true },
        { label: '错误', fills: [], isCorrect: false },
      ],
      chosenOptionIndex: 0,
    }

    const correctEnded = worldReducer(
      finishRescue(worldReducer({ ...triaged, pendingJudgments: [judgment] }, { type: 'DISPATCH' })),
      { type: 'END_CALL' },
    )
    const wrongEnded = worldReducer(
      finishRescue(worldReducer({
        ...triaged,
        pendingJudgments: [{ ...judgment, chosenOptionIndex: 1 }],
      }, { type: 'DISPATCH' })),
      { type: 'END_CALL' },
    )

    expect(correctEnded.callScores[0] - wrongEnded.callScores[0]).toBe(5)
  })

  it('does not award a perfect prank score before the caller is verified', () => {
    const prankCall = beginCall('prank_call')
    const unverifiedEnd = worldReducer(prankCall, { type: 'END_CALL' })

    const questioned = worldReducer(prankCall, {
      type: 'ASK_QUESTION',
      questionId: 'mpds_prank_patient',
    })
    const judgment = questioned.pendingJudgments[0]
    expect(judgment).toBeDefined()

    const verified = worldReducer(questioned, {
      type: 'MAKE_JUDGMENT',
      judgmentId: judgment.id,
      chosenOptionIndex: 1,
    })
    const verifiedEnd = worldReducer(verified, { type: 'END_CALL' })

    expect(unverifiedEnd.callScores[0]).toBeUndefined()
    expect(unverifiedEnd.patientEvents[unverifiedEnd.patientEvents.length - 1]?.text).toContain('核实')
    expect(verifiedEnd.callScores[0]).toBe(100)
  })

  it('does not accept an unrelated correct judgment as prank verification', () => {
    const prankCall = beginCall('prank_call')
    const unrelated: JudgmentPrompt = {
      id: 'age-judgment',
      questionId: 'step4_age',
      dialogueIndex: 0,
      question: '记录年龄',
      options: [{ label: '正确年龄', fills: [], isCorrect: true }],
      chosenOptionIndex: 0,
    }

    const ended = worldReducer(
      { ...prankCall, pendingJudgments: [unrelated] },
      { type: 'END_CALL' },
    )

    expect(ended.callScores[0]).toBeUndefined()
    expect(ended.patientEvents[ended.patientEvents.length - 1]?.text).toContain('核实')
  })

  it('deducts points when final vital signs are recorded incorrectly', () => {
    const classified = worldReducer(askLocation(beginCall()), {
      type: 'SET_MPDS_DETERMINANT',
      determinant: 'ECHO',
    })
    const triaged = worldReducer(classified, { type: 'SET_TRIAGE', level: 'red' })
    const correctVitals = worldReducer(
      worldReducer(triaged, { type: 'SET_PATIENT_STATUS', field: 'conscious', value: false }),
      { type: 'SET_PATIENT_STATUS', field: 'breathing', value: false },
    )
    const wrongVitals = worldReducer(
      worldReducer(triaged, { type: 'SET_PATIENT_STATUS', field: 'conscious', value: true }),
      { type: 'SET_PATIENT_STATUS', field: 'breathing', value: true },
    )

    const correctEnded = worldReducer(
      finishRescue(worldReducer(correctVitals, { type: 'DISPATCH' })),
      { type: 'END_CALL' },
    )
    const wrongEnded = worldReducer(
      finishRescue(worldReducer(wrongVitals, { type: 'DISPATCH' })),
      { type: 'END_CALL' },
    )

    expect(correctEnded.callScores[0] - wrongEnded.callScores[0]).toBe(6)
  })
})
