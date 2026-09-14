import { describe, expect, it } from 'vitest'
import type { JudgmentPrompt, WorldState } from '../types'
import { createInitialState } from './worldState'
import { worldReducer } from './worldReducer'
import { buildDispatchPlan } from './dispatchPlanning'

function beginCall(scenarioId = 'cardiac_arrest'): WorldState {
  const started = worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: [scenarioId] })
  const answered = worldReducer(started, { type: 'ANSWER_CALL' })
  return { ...answered, terminal: { ...answered.terminal, address: '测试现场', conscious: false, breathing: false } }
}

function dispatchWithPlannedRoute(state: WorldState): WorldState {
  const plan = buildDispatchPlan(state)
  if (!plan) throw new Error('Expected an automatic dispatch plan')
  return worldReducer(state, {
    type: 'DISPATCH',
    vehicleId: 'ambulance',
    route: plan.routes[0],
  })
}

describe('worldReducer', () => {
  it('advances game time for questions and records the caller purpose', () => {
    const answered = beginCall()
    const afterLocation = worldReducer(answered, {
      type: 'ASK_QUESTION',
      questionId: 'step1_location',
    })
    const ready = worldReducer(worldReducer(afterLocation, { type: 'TICK' }), { type: 'TICK' })
    const afterPurpose = worldReducer(ready, {
      type: 'ASK_QUESTION',
      questionId: 'ask_purpose',
    })

    expect(afterLocation.shiftElapsed).toBe(answered.shiftElapsed)
    expect(afterLocation.actionEndsAt).toBe(answered.shiftElapsed + 2)
    expect(afterPurpose.shiftElapsed).toBe(answered.shiftElapsed + 2)
    expect(afterPurpose.actionEndsAt).toBe(answered.shiftElapsed + 3)
    expect(afterPurpose.callerState?.questionCount).toBe(2)
    expect(afterPurpose.callerState?.revealedInfo.purpose).toBe(true)
  })

  it('keeps MPDS determinant and triage independent and emits after-dispatch events', () => {
    const answered = beginCall()
    const classified = worldReducer(answered, {
      type: 'SET_MPDS_DETERMINANT',
      determinant: 'ECHO',
    })
    // triage 从判定码自动推导，无需手动 SET_TRIAGE 即可派车
    const dispatched = dispatchWithPlannedRoute(classified)
    // SET_TRIAGE 仍可作为手动覆盖使用
    const overridden = worldReducer(classified, { type: 'SET_TRIAGE', level: 'yellow' })

    expect(classified.terminal.triage).toBe('red')
    expect(answered.terminal.hotCold).toBeNull()
    expect(classified.terminal.hotCold).toBe('HOT')
    expect(dispatched.dispatchRecord?.triage).toBe('red')
    expect(overridden.terminal.triage).toBe('yellow')
    expect(dispatched.dialogueLog).toHaveLength(classified.dialogueLog.length + 2)
  })

  it('persists the completed node route in the mission', () => {
    const classified = worldReducer(beginCall(), {
      type: 'SET_MPDS_DETERMINANT',
      determinant: 'ECHO',
    })
    const plan = buildDispatchPlan(classified)
    expect(plan).not.toBeNull()
    const selectedRoute = plan!.routes[1]
    const dispatched = worldReducer(classified, {
      type: 'DISPATCH',
      vehicleId: 'ambulance',
      route: selectedRoute,
    })
    const vehicle = dispatched.fleet.vehicles.find(item => item.id === 'ambulance')

    expect(dispatched.rescue.vehicleId).toBe('ambulance')
    expect(dispatched.dispatchRecord?.routeId).toBe(selectedRoute.id)
    expect(dispatched.dispatchRecord?.routeStrategy).toBe(selectedRoute.strategy)
    expect(vehicle?.mission?.route).toEqual(selectedRoute)
    expect(vehicle?.mission?.route?.nodes[0].id).toBe('route-start')
    expect(vehicle?.mission?.route?.nodes[vehicle.mission.route.nodes.length - 1].id).toBe('route-scene')
  })

  it('rejects dispatch when the selected node path has not reached the incident scene', () => {
    const classified = worldReducer(beginCall(), {
      type: 'SET_MPDS_DETERMINANT',
      determinant: 'ECHO',
    })
    const plan = buildDispatchPlan(classified)!
    const completeRoute = plan.routes[0]
    const incompleteRoute = {
      ...completeRoute,
      nodes: completeRoute.nodes.slice(0, -1),
      segments: completeRoute.segments.slice(0, -1),
    }

    const rejected = worldReducer(classified, {
      type: 'DISPATCH',
      vehicleId: 'ambulance',
      route: incompleteRoute,
    })

    expect(rejected).toBe(classified)
    expect(rejected.dispatchSent).toBe(false)
    expect(rejected.dispatchRecord).toBeNull()
  })

  it('冷热/分诊始终取病例卡权威值，不随手选判定码漂移', () => {
    const answered = beginCall() // 心脏骤停卡 9-E-1 → 权威 HOT / red
    const alpha = worldReducer(answered, {
      type: 'SET_MPDS_DETERMINANT',
      determinant: 'ALPHA',
    })

    expect(alpha.terminal.determinant).toBe('ALPHA')
    expect(alpha.terminal.hotCold).toBe('HOT')
    expect(alpha.terminal.triage).toBe('red')
  })

  it('协议选错 → 判定分只剩自动补齐的保底 2 分', () => {
    const answered = beginCall() // 心脏骤停卡 9-E-1，正确协议 9

    // 选对协议：判定字母/子码自动补齐，协议主分 +3
    const correct = worldReducer(answered, { type: 'SET_PROTOCOL', protocolNumber: 9 })
    const correctEnded = worldReducer(dispatchWithPlannedRoute(correct), { type: 'END_CALL' })

    // 选错协议：字母/子码仍被自动补对（+1+1），拿不到协议主分（+3）
    const wrong = worldReducer(answered, { type: 'SET_PROTOCOL', protocolNumber: 27 })
    const wrongEnded = worldReducer(dispatchWithPlannedRoute(wrong), { type: 'END_CALL' })

    expect(correctEnded.callEvaluations[0].dimensions.knowledge.correct)
      .toBeGreaterThan(wrongEnded.callEvaluations[0].dimensions.knowledge.correct!)
  })

  it('deducts points for an incorrect clinical judgment', () => {
    const classified = worldReducer(beginCall(), {
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
      dispatchWithPlannedRoute({ ...triaged, pendingJudgments: [judgment] }),
      { type: 'END_CALL' },
    )
    const wrongEnded = worldReducer(
      dispatchWithPlannedRoute({
        ...triaged,
        pendingJudgments: [{ ...judgment, chosenOptionIndex: 1 }],
      }),
      { type: 'END_CALL' },
    )

    expect(correctEnded.callEvaluations[0].dimensions.knowledge.correct)
      .toBeGreaterThan(wrongEnded.callEvaluations[0].dimensions.knowledge.correct!)
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

    expect(unverifiedEnd.callEvaluations[0].dimensions.knowledge.grade).toBe('D')
    expect(verifiedEnd.callEvaluations[0].dimensions.knowledge.grade).toBe('S')
    expect(verifiedEnd.callEvaluations[0].dimensions.outcome.grade).toBe('NA')
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

    expect(ended.callEvaluations[0].dimensions.knowledge.grade).toBe('D')
  })

  it('deducts points when final vital signs are recorded incorrectly', () => {
    const classified = worldReducer(beginCall(), {
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
      dispatchWithPlannedRoute(correctVitals),
      { type: 'END_CALL' },
    )
    const wrongEnded = worldReducer(
      dispatchWithPlannedRoute(wrongVitals),
      { type: 'END_CALL' },
    )

    expect(correctEnded.callEvaluations[0].dimensions.knowledge.correct)
      .toBeGreaterThan(wrongEnded.callEvaluations[0].dimensions.knowledge.correct!)
  })

  it('clears the transcript, dispatch record and task card when a call ends', () => {
    const answered = beginCall()
    const asked = worldReducer(answered, { type: 'ASK_QUESTION', questionId: 'step1_location' })
    const ended = worldReducer(asked, { type: 'END_CALL' })

    // 本通即时状态被清空，不会残留到下一通
    expect(ended.currentCall).toBeNull()
    expect(ended.dialogueLog).toEqual([])
    expect(ended.pendingJudgments).toEqual([])
    expect(ended.dispatchSent).toBe(false)
    expect(ended.handoff.completed).toBe(false)
    // 调度登记表被重置
    expect(ended.terminal.address).toBe('')
    expect(ended.terminal.conscious).toBeNull()
    expect(ended.terminal.breathing).toBeNull()
  })
})
