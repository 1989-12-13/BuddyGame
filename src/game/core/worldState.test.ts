// ============================================================
// worldState 纯函数测试
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createCallerState,
  createTerminalState,
  createInitialState,
  buildScenarioQueue,
  createPatientStatus,
  stabilityToVitalSign,
  vitalSignLabel,
  vitalSignColor,
  baseRescueRate,
  calcRescueSuccessRate,
  judgeRescueSuccess,
  triageLevelDiff,
  calcAmbulanceETA,
  calcOnSceneDuration,
  scoreCall,
} from './worldState'
import { __setRng, __resetRng } from './random'

beforeEach(() => __resetRng())

// ============================================================
// createCallerState
// ============================================================
describe('createCallerState', () => {
  it('用默认压力值创建来电者（initialStress=40）', () => {
    const cs = createCallerState('li_jianguo')
    expect(cs.id).toBe('li_jianguo')
    expect(cs.stress).toBe(40)
    expect(cs.cooperation).toBe(80)
    expect(cs.questionCount).toBe(0)
  })

  it('允许自定义初始压力', () => {
    const cs = createCallerState('zhang_xiulan', 70)
    expect(cs.stress).toBe(70)
  })

  it('revealedInfo 全部为初始状态', () => {
    const cs = createCallerState('li_jianguo')
    expect(cs.revealedInfo.address).toBe('none')
    expect(cs.revealedInfo.contact).toBe(false)
    expect(cs.revealedInfo.chiefComplaint).toBe(false)
    expect(cs.revealedInfo.additional).toEqual([])
    expect(cs.revealedInfo.purpose).toBe(false)
  })

  it('askedMPDS 和 infoQuality 为空', () => {
    const cs = createCallerState('li_jianguo')
    expect(cs.askedMPDS).toEqual([])
    expect(cs.infoQuality).toEqual({})
  })
})

// ============================================================
// createTerminalState
// ============================================================
describe('createTerminalState', () => {
  it('所有终端字段为初始空值', () => {
    const ts = createTerminalState()
    expect(ts.address).toBe('')
    expect(ts.contact).toBe('')
    expect(ts.chiefComplaint).toBe('')
    expect(ts.patientAge).toBe('')
    expect(ts.patientGender).toBe('')
    expect(ts.conscious).toBeNull()
    expect(ts.breathing).toBeNull()
    expect(ts.protocolNumber).toBeNull()
    expect(ts.determinant).toBeNull()
    expect(ts.determinantSubcode).toBeNull()
    expect(ts.hotCold).toBeNull()
    expect(ts.triage).toBeNull()
    expect(ts.conditionNote).toBe('')
  })
})

// ============================================================
// createInitialState
// ============================================================
describe('createInitialState', () => {
  it('screen 为 title，班次编号和通话索引为 0', () => {
    const state = createInitialState()
    expect(state.screen).toBe('title')
    expect(state.shiftNumber).toBe(0)
    expect(state.callIndex).toBe(0)
    expect(state.totalCalls).toBe(5)
  })

  it('没有活跃通话，对话和判定均为空', () => {
    const state = createInitialState()
    expect(state.currentCall).toBeNull()
    expect(state.dialogueLog).toEqual([])
    expect(state.pendingJudgments).toEqual([])
    expect(state.callScores).toEqual([])
  })

  it('无 perks 和 debrief', () => {
    const state = createInitialState()
    expect(state.perks).toEqual([])
    expect(state.lastDebrief).toBeNull()
    expect(state.pendingPerkChoices).toEqual([])
  })

  it('fleet 有 3 辆车', () => {
    const state = createInitialState()
    expect(state.fleet.vehicles).toHaveLength(3)
    expect(state.fleet.selectedVehicleId).toBeNull()
  })
})

// ============================================================
// buildScenarioQueue（需要确定性随机注入）
// ============================================================
describe('buildScenarioQueue', () => {
  beforeEach(() => __resetRng())

  it('总是返回 5 个场景', () => {
    const queue = buildScenarioQueue()
    expect(queue).toHaveLength(5)
  })

  it('序列不含空值', () => {
    const queue = buildScenarioQueue()
    queue.forEach(id => expect(id).toBeTruthy())
  })

  it('当 rng() 始终 >= 0.2 时（即概率判定失败），不插入恶作剧电话', () => {
    __setRng(() => 0.5) // >0.2 不会触发恶作剧插入
    const queue = buildScenarioQueue()
    expect(queue).not.toContain('prank_call')
  })

  it('当 rng() < 0.2 时，插入恶作剧电话', () => {
    __setRng(() => 0.1) // <0.2 触发 + <0.5 决定 swapIdx + 替换位置
    const queue = buildScenarioQueue()
    expect(queue).toContain('prank_call')
  })
})

// ============================================================
// createPatientStatus
// ============================================================
describe('createPatientStatus', () => {
  it('red triage 起始 stability 80，decayRate 0.35', () => {
    const ps = createPatientStatus('red')
    expect(ps.stability).toBe(80)
    expect(ps.initialStability).toBe(80)
    expect(ps.decayRate).toBe(0.35)
    expect(ps.died).toBe(false)
  })

  it('yellow triage 起始 stability 85，decayRate 0.2', () => {
    const ps = createPatientStatus('yellow')
    expect(ps.stability).toBe(85)
    expect(ps.decayRate).toBe(0.2)
  })

  it('green triage 起始 stability 92，decayRate 0.08', () => {
    const ps = createPatientStatus('green')
    expect(ps.stability).toBe(92)
    expect(ps.decayRate).toBe(0.08)
  })

  it('black triage 起始 stability 35，decayRate 1.2', () => {
    const ps = createPatientStatus('black')
    expect(ps.stability).toBe(35)
    expect(ps.decayRate).toBe(1.2)
  })
})

// ============================================================
// stabilityToVitalSign
// ============================================================
describe('stabilityToVitalSign', () => {
  it('>=70 → stable', () => {
    expect(stabilityToVitalSign(70)).toBe('stable')
    expect(stabilityToVitalSign(100)).toBe('stable')
  })

  it('40-69 → warning', () => {
    expect(stabilityToVitalSign(40)).toBe('warning')
    expect(stabilityToVitalSign(69)).toBe('warning')
  })

  it('15-39 → critical', () => {
    expect(stabilityToVitalSign(15)).toBe('critical')
    expect(stabilityToVitalSign(39)).toBe('critical')
  })

  it('<15 → arrest', () => {
    expect(stabilityToVitalSign(14)).toBe('arrest')
    expect(stabilityToVitalSign(0)).toBe('arrest')
    expect(stabilityToVitalSign(-5)).toBe('arrest')
  })
})

// ============================================================
// vitalSignLabel
// ============================================================
describe('vitalSignLabel', () => {
  it('返回中文标签', () => {
    expect(vitalSignLabel('stable')).toBe('稳定')
    expect(vitalSignLabel('warning')).toBe('危重')
    expect(vitalSignLabel('critical')).toBe('危急')
    expect(vitalSignLabel('arrest')).toBe('心搏骤停')
  })
})

// ============================================================
// vitalSignColor
// ============================================================
describe('vitalSignColor', () => {
  it('返回颜色 hex', () => {
    expect(vitalSignColor('stable')).toBe('#16a34a')
    expect(vitalSignColor('warning')).toBe('#f59e0b')
    expect(vitalSignColor('critical')).toBe('#ef4444')
    expect(vitalSignColor('arrest')).toBe('#dc2626')
  })
})

// ============================================================
// baseRescueRate
// ============================================================
describe('baseRescueRate', () => {
  it('red 0.50, yellow 0.75, green 0.95, black 0.15', () => {
    expect(baseRescueRate('red')).toBe(0.50)
    expect(baseRescueRate('yellow')).toBe(0.75)
    expect(baseRescueRate('green')).toBe(0.95)
    expect(baseRescueRate('black')).toBe(0.15)
  })
})

// ============================================================
// calcRescueSuccessRate
// ============================================================
describe('calcRescueSuccessRate', () => {
  const defaultInput = {
    base: 0.2,
    stability: 75,
    capability: 3,
    dispatchTime: 50 as number | null,
    triageDiff: 0,
    guidanceWrongCount: 0,
    miniGameAvg: 0.5,
  }

  it('完美条件应接近 1', () => {
    const rate = calcRescueSuccessRate({
      base: 0.95,
      stability: 90,
      capability: 5,
      dispatchTime: 25,
      triageDiff: 0,
      guidanceWrongCount: 0,
      miniGameAvg: 1.0,
    })
    expect(rate).toBeGreaterThanOrEqual(0.9)
  })

  it('最差条件应接近 0', () => {
    const rate = calcRescueSuccessRate({
      base: 0.1,
      stability: 5,
      capability: 1,
      dispatchTime: 120,
      triageDiff: 3,
      guidanceWrongCount: 10,
      miniGameAvg: 0,
    })
    expect(rate).toBeLessThanOrEqual(0.1)
  })

  it('分诊差一档扣除 10%', () => {
    const a = calcRescueSuccessRate({ ...defaultInput, triageDiff: 0 })
    const b = calcRescueSuccessRate({ ...defaultInput, triageDiff: 1 })
    expect(a - b).toBeCloseTo(0.1)
  })

  it('分诊差两档及以上扣除 20%', () => {
    const a = calcRescueSuccessRate({ ...defaultInput, triageDiff: 0 })
    const b = calcRescueSuccessRate({ ...defaultInput, triageDiff: 2 })
    expect(a - b).toBeCloseTo(0.2)
  })

  it('派车超过 110 秒额外扣除 25%', () => {
    const fast = calcRescueSuccessRate({ ...defaultInput, dispatchTime: 30 })
    const slow = calcRescueSuccessRate({ ...defaultInput, dispatchTime: 120 })
    expect(fast - slow).toBeCloseTo(0.25)
  })

  it('派车 76-110 秒扣除 15%', () => {
    const fast = calcRescueSuccessRate({ ...defaultInput, dispatchTime: 30 })
    const mid = calcRescueSuccessRate({ ...defaultInput, dispatchTime: 80 })
    expect(fast - mid).toBeCloseTo(0.15)
  })

  it('指导错答每题扣 3%', () => {
    const a = calcRescueSuccessRate({ ...defaultInput, guidanceWrongCount: 0 })
    const b = calcRescueSuccessRate({ ...defaultInput, guidanceWrongCount: 5 })
    expect(a - b).toBeCloseTo(0.15)
  })

  it('结果裁剪到 [0, 1]', () => {
    const high = calcRescueSuccessRate({ ...defaultInput, base: 1.0, stability: 100, capability: 5, miniGameAvg: 1 })
    expect(high).toBeLessThanOrEqual(1)
    const low = calcRescueSuccessRate({ ...defaultInput, base: -1, stability: 0, dispatchTime: 200, guidanceWrongCount: 50 })
    expect(low).toBeGreaterThanOrEqual(0)
  })

  it('车辆能力每高/低于 3 一级 ±4%', () => {
    const a = calcRescueSuccessRate({ ...defaultInput, capability: 3 })
    const b = calcRescueSuccessRate({ ...defaultInput, capability: 5 })
    expect(b - a).toBeCloseTo(0.08) // (5-3)*0.04
  })

  it('小游戏每高/低于 0.5 一步 ±5%', () => {
    const a = calcRescueSuccessRate({ ...defaultInput, miniGameAvg: 0.5 })
    const b = calcRescueSuccessRate({ ...defaultInput, miniGameAvg: 1.0 })
    expect(b - a).toBeCloseTo(0.05)
  })
})

// ============================================================
// judgeRescueSuccess
// ============================================================
describe('judgeRescueSuccess', () => {
  it('rate >= 0.5 → 成功', () => {
    expect(judgeRescueSuccess(0.5)).toBe(true)
    expect(judgeRescueSuccess(0.75)).toBe(true)
    expect(judgeRescueSuccess(1.0)).toBe(true)
  })

  it('rate < 0.5 → 失败', () => {
    expect(judgeRescueSuccess(0.49)).toBe(false)
    expect(judgeRescueSuccess(0)).toBe(false)
  })
})

// ============================================================
// triageLevelDiff
// ============================================================
describe('triageLevelDiff', () => {
  it('相同分诊差值为 0', () => {
    expect(triageLevelDiff('red', 'red')).toBe(0)
    expect(triageLevelDiff('green', 'green')).toBe(0)
  })

  it('相邻分诊差值为 1', () => {
    expect(triageLevelDiff('red', 'yellow')).toBe(1)
    expect(triageLevelDiff('yellow', 'green')).toBe(1)
  })

  it('隔档分诊差值为 2', () => {
    expect(triageLevelDiff('red', 'green')).toBe(2)
    expect(triageLevelDiff('yellow', 'black')).toBe(2)
  })

  it('null triage → 差值 2', () => {
    expect(triageLevelDiff(null, 'red')).toBe(2)
    expect(triageLevelDiff(null, 'green')).toBe(2)
  })

  it('最远分诊 red↔black 差值 3', () => {
    expect(triageLevelDiff('red', 'black')).toBe(3)
  })
})

// ============================================================
// calcAmbulanceETA
// ============================================================
describe('calcAmbulanceETA', () => {
  it('ETA 裁剪在 20-100 区间', () => {
    const eta = calcAmbulanceETA(30, 'partial', 2)
    expect(eta).toBeGreaterThanOrEqual(20)
    expect(eta).toBeLessThanOrEqual(100)
  })

  it('最快派车（<=35s）减 15 秒', () => {
    const fast = calcAmbulanceETA(25, 'partial', 1)
    const normal = calcAmbulanceETA(60, 'partial', 1)
    expect(fast).toBeLessThan(normal)
  })

  it('地址完整度 full 减 12 秒', () => {
    const partial = calcAmbulanceETA(40, 'partial', 2)
    const full = calcAmbulanceETA(40, 'full', 2)
    expect(partial - full).toBe(12)
  })

  it('地址模糊 vague 加 10 秒', () => {
    const partial = calcAmbulanceETA(40, 'partial', 1)
    const vague = calcAmbulanceETA(40, 'vague', 1)
    expect(vague - partial).toBe(10)
  })

  it('车速 3 比车速 1 快 12 秒', () => {
    const slow = calcAmbulanceETA(55, 'partial', 1)
    const fast = calcAmbulanceETA(55, 'partial', 3)
    expect(slow - fast).toBe(12)
  })

  it('极端慢条件不低过 20', () => {
    const eta = calcAmbulanceETA(25, 'full', 3)
    expect(eta).toBeGreaterThanOrEqual(20)
  })

  it('极端快条件不高过 100', () => {
    const eta = calcAmbulanceETA(90, 'vague', 1)
    expect(eta).toBeLessThanOrEqual(100)
  })
})

// ============================================================
// calcOnSceneDuration
// ============================================================
describe('calcOnSceneDuration', () => {
  it('red ~15s', () => {
    expect(calcOnSceneDuration('red')).toBe(15) // decayRate 0.35 < 0.6 → -5
  })

  it('yellow ~8s', () => {
    expect(calcOnSceneDuration('yellow')).toBe(8) // decayRate 0.2 < 0.3 → -12
  })

  it('green ~8s', () => {
    expect(calcOnSceneDuration('green')).toBe(8) // decayRate 0.08 < 0.3 → -12
  })

  it('black ~20s', () => {
    expect(calcOnSceneDuration('black')).toBe(20) // decayRate 1.2 >= 0.6 → 0 offset
  })
})

// ============================================================
// scoreCall
// ============================================================
describe('scoreCall', () => {
  it('完美一通电话应接近 100', () => {
    // correctDeterminant 格式: '协议号-判定字母-子码'
    const s = scoreCall(25, 'full', true, true, true, 'red', 'red', 5, 5, 1.0, 5, 6, 6, 'ECHO', '6-E-1', 1)
    expect(s.total).toBeGreaterThanOrEqual(90)
  })

  it('最差一通电话总分极低', () => {
    const s = scoreCall(120, 'vague', false, false, false, null, 'red', 0, 5, 0, 0, null, 6, null, 'A-1', null)
    expect(s.total).toBeLessThanOrEqual(20)
  })

  it('速度分：<=35→35, <=50→30, <=75→20, <=110→10, >110→5', () => {
    expect(scoreCall(25, 'partial', false, false, false, null, 'red', 0, 0).speed).toBe(35)
    expect(scoreCall(45, 'partial', false, false, false, null, 'red', 0, 0).speed).toBe(30)
    expect(scoreCall(65, 'partial', false, false, false, null, 'red', 0, 0).speed).toBe(20)
    expect(scoreCall(100, 'partial', false, false, false, null, 'red', 0, 0).speed).toBe(10)
    expect(scoreCall(130, 'partial', false, false, false, null, 'red', 0, 0).speed).toBe(5)
  })

  it('null dispatchTime → speed = 0', () => {
    const s = scoreCall(null, 'partial', false, false, false, null, 'red', 0, 0)
    expect(s.speed).toBe(0)
  })

  it('信息分：full地址+电话+病情+目的 = 30', () => {
    const s = scoreCall(30, 'full', true, true, true, 'red', 'red', 0, 0)
    expect(s.info).toBe(30)
  })

  it('信息分：vague+无要素 = 3', () => {
    const s = scoreCall(30, 'vague', false, false, false, null, 'red', 0, 0)
    expect(s.info).toBe(3)
  })

  it('信息分上限 30（含 bonus）', () => {
    const s = scoreCall(30, 'full', true, true, true, 'red', 'red', 0, 0, 0, 10)
    expect(s.info).toBe(30)
  })

  it('分诊正确 → 20 分', () => {
    const s = scoreCall(30, 'full', true, true, true, 'red', 'red', 0, 0)
    expect(s.triage).toBe(20)
  })

  it('分诊差一档 → 10 分', () => {
    const s = scoreCall(30, 'full', true, true, true, 'yellow', 'red', 0, 0)
    expect(s.triage).toBe(10)
  })

  it('分诊差两档以上 → 0 分', () => {
    const s = scoreCall(30, 'full', true, true, true, 'green', 'red', 0, 0)
    expect(s.triage).toBe(0)
  })

  it('未分诊 → 0 分', () => {
    const s = scoreCall(30, 'full', true, true, true, null, 'red', 0, 0)
    expect(s.triage).toBe(0)
  })

  it('指导全对 → 10 分', () => {
    const s = scoreCall(30, 'full', true, true, true, 'red', 'red', 3, 3)
    expect(s.guidance).toBe(10)
  })

  it('指导全错 → 0 分', () => {
    const s = scoreCall(30, 'full', true, true, true, 'red', 'red', 0, 3)
    expect(s.guidance).toBe(0)
  })

  it('协议正确 +2，判定字母正确 +2，子码正确 +1 = 5', () => {
    // correctDeterminant 格式: '协议号-判定字母-子码'，如 '6-E-1'
    const s = scoreCall(30, 'full', true, true, true, 'red', 'red', 0, 0, 0, 0, 6, 6, 'ECHO', '6-E-1', 1)
    expect(s.decision).toBe(5)
  })

  it('total = speed + info + triage + decision + guidance', () => {
    const s = scoreCall(25, 'full', true, true, true, 'red', 'red', 3, 3)
    expect(s.total).toBe(s.speed + s.info + s.triage + s.decision + s.guidance)
  })
})
