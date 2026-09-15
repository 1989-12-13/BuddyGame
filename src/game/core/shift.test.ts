import { describe, expect, it } from 'vitest'
import {
  COLLAPSE_MISSED_STREAK,
  DEFAULT_SHIFT_CONFIG,
  HEAT_GAIN_FAST_ANSWER,
  HEAT_PEAK,
  PEAK_CALLS_TO_SURVIVE,
  answerLine,
  arrivalGapFor,
  availableVehicleCount,
  busyVehicleCount,
  createShiftState,
  focusLine,
  isShiftComplete,
  isVehicleOut,
  lineNeedsDecision,
  maxRingingFor,
  pendingDecisionCount,
  raiseCallerStress,
  shiftReducer,
  summarizeShift,
  tickShift,
  type ShiftConfig,
  type ShiftLine,
  type ShiftState,
} from './shift'
import { createCallerState, createInitialState } from './worldState'
import { SCENARIO_IDS, getScenario } from '../events/templates'
import type { CallEvaluation, EvaluationDimensionKey, EvaluationGrade, PatientOutcome } from '../types'

const DIMENSION_KEYS: EvaluationDimensionKey[] = ['attitude', 'guidance', 'knowledge', 'timing', 'outcome']

function evaluation(
  scenarioId = 'falls_elderly',
  grade: Exclude<EvaluationGrade, 'NA'> = 'A',
  outcome: PatientOutcome = 'rescued',
): CallEvaluation {
  const scenario = getScenario(scenarioId)
  const dimensions = Object.fromEntries(DIMENSION_KEYS.map(key => [key, {
    key,
    label: key,
    grade: key === 'outcome' && scenario.isPrank ? 'NA' : grade,
    evidence: ['测试证据'],
    improvement: null,
  }])) as CallEvaluation['dimensions']
  return {
    callInstanceId: 1,
    scenarioId,
    scenarioTitle: scenario.title,
    isPrank: Boolean(scenario.isPrank),
    vehicleDispatched: !scenario.isPrank,
    patientCount: scenario.isPrank ? 0 : (scenario.patientCount ?? (Number.parseInt(scenario.fourElements.condition.patientCount, 10) || 1)),
    activeSeconds: 30,
    outcome,
    outcomeLabel: outcome,
    arrivalNarrative: '测试现场记录',
    dimensions,
    overallGrade: grade,
    profile: { id: 'test', title: '测试画像', subtitle: '', description: '', badge: grade },
    reviewPoints: [],
    safetyViolation: grade === 'D',
    criticalPatientRescued: scenario.correctTriage === 'red' && outcome === 'rescued',
  }
}

function config(overrides: Partial<ShiftConfig> = {}): ShiftConfig {
  return {
    ...DEFAULT_SHIFT_CONFIG,
    deck: ['falls_elderly', 'chest_pain', 'hemorrhage'],
    ...overrides,
  }
}

/** 让多条线路能够同时响铃（并发是随热度解锁的） */
function withConcurrency(shift: ShiftState, heat = 100): ShiftState {
  return { ...shift, heat, arrivalCooldown: 0 }
}

/** 连续推进 N 秒 */
function tick(shift: ShiftState, seconds: number): ShiftState {
  let next = shift
  for (let i = 0; i < seconds; i++) next = tickShift(next)
  return next
}

describe('班次协调器 · 初始化', () => {
  it('创建默认 3 条空闲线路，无聚焦', () => {
    const shift = createShiftState(config())
    expect(shift.lines).toHaveLength(3)
    expect(shift.lines.every(line => line.phase === 'idle')).toBe(true)
    expect(shift.focusedLineId).toBeNull()
    expect(shift.clock).toBe(0)
  })

  it('初始状态尚未收班：收班由热度模型判定，与队列长度无关', () => {
    const shift = createShiftState(config())
    expect(shift.ending).toBeNull()
    expect(shift.moment).toBe('opening')
    expect(isShiftComplete(shift)).toBe(false)
  })
})

describe('班次协调器 · 来电到达与响铃', () => {
  it('第一次 tick 即让第一条空闲线路响铃', () => {
    // 单卡牌堆保证轮盘赌抽取确定
    const shift = tick(createShiftState(config({ deck: ['falls_elderly'] })), 1)
    const ringing = shift.lines.filter(line => line.phase === 'ringing')
    expect(ringing).toHaveLength(1)
    expect(ringing[0].scenarioId).toBe('falls_elderly')
    expect(shift.arrivalCooldown).toBeGreaterThan(0)
  })

  it('热度处于地板时只允许一条线路同时响铃（并发随热度解锁）', () => {
    const shift = tick(createShiftState(config()), 30)
    expect(shift.heat).toBe(0)
    expect(shift.lines.filter(line => line.phase === 'ringing').length).toBeLessThanOrEqual(1)
  })

  it('热度升高后允许多条线路同时响铃', () => {
    let shift = tick(createShiftState(config()), 1)
    shift = withConcurrency(shift)
    shift = tick(shift, 1)
    expect(shift.lines.filter(line => line.phase === 'ringing')).toHaveLength(2)
  })

  it('响铃超时记为未接来电并释放线路', () => {
    const shift = tick(createShiftState(config({ deck: ['falls_elderly'], ringTimeout: 5 })), 5)
    expect(shift.lines[0].phase).toBe('idle')
    expect(shift.lines[0].scenarioId).toBeNull()
    expect(shift.missed).toEqual(['falls_elderly'])
  })

  it('牌堆用尽后自动重洗：班次不会因为「发完牌」而结束', () => {
    const shift = tick(createShiftState(config({ deck: [] })), 1)
    expect(shift.lines.filter(line => line.phase === 'ringing')).toHaveLength(1)
    expect(shift.deck.length).toBe(SCENARIO_IDS.length - 1)
  })
})

describe('班次协调器 · 接听与聚焦', () => {
  it('接听后线路转为通话中，并装载对应场景', () => {
    // 单卡牌堆保证轮盘赌抽取确定
    let shift = tick(createShiftState(config({ deck: ['falls_elderly'] })), 1)
    shift = answerLine(shift, 'line-1')
    const line = shift.lines[0]
    expect(line.phase).toBe('active')
    expect(line.world.currentCall?.id).toBe('falls_elderly')
    expect(shift.focusedLineId).toBe('line-1')
  })

  it('接听不存在的线路或非响铃线路时状态不变', () => {
    const shift = createShiftState(config())
    expect(answerLine(shift, 'line-2')).toBe(shift)
    expect(answerLine(shift, 'nope')).toBe(shift)
  })

  it('可在线路之间切换聚焦，HOLD 清除聚焦', () => {
    let shift = tick(createShiftState(config()), 1)
    shift = withConcurrency(shift)
    shift = tick(shift, 1)
    shift = focusLine(shift, 'line-2')
    expect(shift.focusedLineId).toBe('line-2')
    shift = shiftReducer(shift, { type: 'HOLD_LINE' })
    expect(shift.focusedLineId).toBeNull()
  })

  it('空闲线路不能被聚焦', () => {
    const shift = createShiftState(config())
    expect(focusLine(shift, 'line-1').focusedLineId).toBeNull()
  })
})

describe('班次协调器 · 时钟与冷落焦虑', () => {
  it('tick 推进线路内世界时钟', () => {
    let shift = tick(createShiftState(config()), 1)
    shift = answerLine(shift, 'line-1')
    const before = shift.lines[0].world.shiftElapsed
    shift = tickShift(shift)
    expect(shift.lines[0].world.shiftElapsed).toBe(before + 1)
  })

  it('非聚焦线路的来电者压力上升，聚焦线路不涨', () => {
    let shift = tick(createShiftState(config()), 1)
    shift = withConcurrency(shift)
    shift = tick(shift, 1)
    shift = answerLine(shift, 'line-1')
    shift = answerLine(shift, 'line-2') // 第二次接听会把焦点切到 line-2
    expect(shift.focusedLineId).toBe('line-2')

    const line1Before = shift.lines[0].world.callerState!.stress
    const line2Before = shift.lines[1].world.callerState!.stress
    shift = tick(shift, 4)

    expect(shift.lines[0].world.callerState!.stress).toBeGreaterThan(line1Before)
    expect(shift.lines[1].world.callerState!.stress).toBe(line2Before)
  })

  it('raiseCallerStress 保持等级派生字段一致并夹取 0-100', () => {
    const world = { ...createInitialState(), callerState: createCallerState('li_jianguo', 24) }
    expect(raiseCallerStress(world, 5).callerState!.stressLevel).toBe('紧张')
    expect(raiseCallerStress(world, 999).callerState!.stress).toBe(100)
    expect(raiseCallerStress({ ...world, callerState: null }, 5).callerState).toBeNull()
  })
})

describe('班次协调器 · 车辆资源约束', () => {
  /** 把满足条件的线路标记为「车辆外出未归」（挂一条未结算的后台救援） */
  function markVehicleOut(shift: ShiftState, predicate: (index: number) => boolean): ShiftState {
    const mission = { id: 'r', vehicleId: 'ambulance', outcome: null }
    return {
      ...shift,
      lines: shift.lines.map((line, i) => (predicate(i)
        ? ({
            ...line,
            vehicleId: 'ambulance',
            world: { ...createInitialState(), backgroundRescues: [mission] },
          } as unknown as ShiftLine)
        : line)),
    }
  }

  it('车辆被占用后可用数下降', () => {
    const shift = createShiftState(config())
    expect(availableVehicleCount(shift)).toBe(2)
    const busy = markVehicleOut(shift, i => i < 2)
    expect(busyVehicleCount(busy)).toBe(2)
    expect(availableVehicleCount(busy)).toBe(0)
  })

  it('无可用车辆时派车被拒绝并给出反馈', () => {
    let shift = tick(createShiftState(config()), 1)
    shift = answerLine(shift, 'line-1')
    expect(shift.lines[0].phase).toBe('active')
    // 耗尽车辆池：另外两条线各占一辆
    shift = markVehicleOut(shift, i => i > 0)
    expect(availableVehicleCount(shift)).toBe(0)

    const next = shiftReducer(shift, {
      type: 'DISPATCH',
      vehicleId: 'ambulance',
      route: { id: 'r1', label: '默认', totalEta: 60, risk: 'low', nodeIds: [] } as never,
    })
    expect(next.lastRejection).toContain('没有可用救护车')
    expect(next.lines[0].vehicleId).toBeNull()
  })
})

describe('班次协调器 · 线路释放与车辆回收', () => {
  it('在途车辆计入占用，后台救援结算后释放', () => {
    const base = createShiftState(config({ deck: [] }))
    const mission = { id: 'r1', vehicleId: 'ambulance', outcome: null }
    const busyLine = {
      ...base.lines[0],
      vehicleId: 'ambulance',
      world: { ...createInitialState(), backgroundRescues: [mission] },
    } as unknown as ShiftLine
    const settledLine = {
      ...base.lines[0],
      vehicleId: 'ambulance',
      world: { ...createInitialState(), backgroundRescues: [{ ...mission, outcome: 'success' }] },
    } as unknown as ShiftLine

    expect(isVehicleOut(busyLine)).toBe(true)
    expect(isVehicleOut(settledLine)).toBe(false)
    expect(isVehicleOut({ ...base.lines[0], vehicleId: null })).toBe(false)
  })

  it('已结束且无在途救援的线路会释放为空闲，供下一通来电复用', () => {
    const base = createShiftState(config({ deck: [] }))
    const line: ShiftLine = {
      ...base.lines[0],
      phase: 'done',
      vehicleId: 'ambulance',
      world: { ...createInitialState(), screen: 'playing' },
    }
    const shift: ShiftState = { ...base, lines: [line, base.lines[1], base.lines[2]] }

    const next = tickShift(shift)
    expect(next.lines[0].phase).toBe('idle')
    expect(next.lines[0].vehicleId).toBeNull()
    expect(next.lines[0].scenarioId).toBeNull()
  })
})

describe('班次协调器 · 待决策可见性', () => {
  it('第二位来电者的信息冲突未处置时，该线路会被标记出来', () => {
    const base = createShiftState(config({ deck: [] }))
    const line = {
      ...base.lines[0],
      phase: 'active',
      verification: { primaryLineId: base.lines[1].id, report: { conflicts: [], summary: '' }, probed: false, resolution: null },
    } as unknown as ShiftLine
    const shift: ShiftState = { ...base, lines: [line, base.lines[1], base.lines[2]] }

    expect(lineNeedsDecision(line)).toBe(true)
    expect(pendingDecisionCount(shift)).toBe(1)
  })

  it('空闲线路不会被标记为待决策', () => {
    const base = createShiftState(config({ deck: [] }))
    expect(pendingDecisionCount(base)).toBe(0)
    expect(lineNeedsDecision({ ...base.lines[0], phase: 'done' })).toBe(false)
  })
})

describe('班次协调器 · 收束结算', () => {
  it('汇总带场景名、未接来电与交叉核实结论', () => {
    const base = createShiftState(config({ deck: [] }))
    const shift: ShiftState = {
      ...base,
      missed: ['chest_pain'],
      completed: [{ lineId: 'line-1', scenarioId: 'falls_elderly', evaluation: evaluation('falls_elderly'), activeSeconds: 40 }],
      incidents: [
        { id: 'inc-1', scenarioId: 'falls_elderly', primaryLineId: 'line-1', supplementLineId: 'line-2', supplementAt: 0, resolved: true, resolution: 'adopt' },
        { id: 'inc-2', scenarioId: 'stroke', primaryLineId: 'line-3', supplementLineId: null, supplementAt: 0, resolved: false, resolution: null },
      ],
    }

    const summary = summarizeShift(shift)

    expect(summary.calls[0].scenarioTitle).toBe(getScenario('falls_elderly').title)
    expect(summary.missedCalls[0].scenarioId).toBe('chest_pain')
    expect(summary.incidents.filter(item => item.resolution)).toHaveLength(1)
    expect(summary.narrative).toContain('接住 1 通')
    expect(summary.narrative).toContain('漏接 1 通')
    expect(summary.narrative).toContain('采纳最新观察 1 次')
  })

  it('跨线路汇总评价与未接来电', () => {
    const base = createShiftState(config({ deck: [] }))
    const shift: ShiftState = {
      ...base,
      missed: ['chest_pain'],
      completed: [
        { lineId: 'line-1', scenarioId: 'falls_elderly', evaluation: evaluation('falls_elderly', 'A'), activeSeconds: 40 },
        { lineId: 'line-2', scenarioId: 'hemorrhage', evaluation: evaluation('hemorrhage', 'B'), activeSeconds: 30 },
      ],
    }

    const summary = summarizeShift(shift)
    expect(summary.calls).toHaveLength(2)
    expect(summary.overallGrade).toBeDefined()
    expect(summary.activeSeconds).toBe(70)
    expect(summary.missedCount).toBe(1)
  })

  it('线路结束时自动快照成绩，线路复用不会把分丢掉', () => {
    const base = createShiftState(config({ deck: [] }))
    const ending: ShiftLine = {
      ...base.lines[0],
      phase: 'done',
      scenarioId: 'falls_elderly',
      world: {
        ...createInitialState(),
        screen: 'playing',
        totalCalls: 1,
        callIndex: 1,
        currentCall: null,
        callEvaluations: [evaluation('falls_elderly', 'A')],
        activePlaySeconds: 42,
      },
    }
    const shift: ShiftState = { ...base, lines: [ending, base.lines[1], base.lines[2]] }

    const next = tickShift(shift)
    expect(next.lines[0].phase).toBe('idle')
    expect(next.completed).toHaveLength(1)
    expect(next.completed[0]).toMatchObject({ lineId: 'line-1', scenarioId: 'falls_elderly', activeSeconds: 42 })
    expect(next.completed[0].evaluation.overallGrade).toBe('A')
  })
})

describe('班次协调器 · TICK 路由', () => {
  it('shiftReducer 的 TICK 推进全部线路，而非仅聚焦线路', () => {
    let shift = tick(createShiftState(config()), 1)
    shift = withConcurrency(shift)
    shift = tick(shift, 1)
    shift = answerLine(shift, 'line-1')
    shift = answerLine(shift, 'line-2')
    const focusedClock = shift.lines[1].world.shiftElapsed
    const backgroundClock = shift.lines[0].world.shiftElapsed
    const clockBefore = shift.clock

    shift = shiftReducer(shift, { type: 'TICK' })
    expect(shift.lines[1].world.shiftElapsed).toBe(focusedClock + 1)
    expect(shift.lines[0].world.shiftElapsed).toBe(backgroundClock + 1)
    expect(shift.clock).toBe(clockBefore + 1)
  })
})

describe('班次协调器 · 暂停', () => {
  it('班次暂停时时钟与线路全部冻结', () => {
    let shift = tick(createShiftState(config()), 1)
    shift = shiftReducer(shift, { type: 'PAUSE', reason: 'manual' })
    const frozen = tick(shift, 5)
    expect(frozen.clock).toBe(shift.clock)
    expect(frozen.lines[0].ringingFor).toBe(shift.lines[0].ringingFor)
  })

  it('恢复后继续推进', () => {
    let shift = tick(createShiftState(config()), 1)
    shift = shiftReducer(shift, { type: 'PAUSE', reason: 'manual' })
    shift = shiftReducer(shift, { type: 'RESUME', reason: 'manual' })
    expect(tick(shift, 1).clock).toBe(shift.clock + 1)
  })
})

// ============================================================
// 热度模型 —— 替代「固定通数」
// ============================================================

/** 造一条「这通已经打完」的线路，用于驱动收班判定 */
function finishingLine(base: ShiftState, overrides: {
  grade?: Exclude<EvaluationGrade, 'NA'>
  died?: boolean
  scenarioId?: string
} = {}): ShiftLine {
  const { grade = 'A', died = false, scenarioId = 'falls_elderly' } = overrides
  return {
    ...base.lines[0],
    phase: 'done',
    scenarioId,
    world: {
      ...createInitialState(),
      screen: 'playing',
      totalCalls: 1,
      callIndex: 1,
      currentCall: null,
      callEvaluations: [evaluation(scenarioId, died ? 'D' : grade, died ? 'died' : 'rescued')],
      activePlaySeconds: 30,
      patientStatus: {
        stability: died ? 0 : 80,
        vitalSign: died ? 'arrest' : 'stable',
        decayRate: 0,
        initialStability: 80,
        died,
      },
    },
  }
}

describe('班次协调器 · 热度派生强度', () => {
  it('热度越高，来电间隔越短', () => {
    expect(arrivalGapFor(0)).toBeGreaterThan(arrivalGapFor(100))
  })

  it('热度越高，同时响铃上限越高', () => {
    expect(maxRingingFor(0)).toBe(1)
    expect(maxRingingFor(100)).toBe(3)
    expect(maxRingingFor(0)).toBeLessThan(maxRingingFor(100))
  })
})

describe('班次协调器 · 表现 → 热度', () => {
  it('迅速接听推高热度，并清掉连续漏接', () => {
    let shift = tick(createShiftState(config()), 2)
    const before = shift.heat
    shift = answerLine(shift, 'line-1')
    expect(shift.heat).toBe(before + HEAT_GAIN_FAST_ANSWER)
    expect(shift.missedStreak).toBe(0)
  })

  it('拖很久才接听没有提速奖励', () => {
    let shift = tick(createShiftState(config({ ringTimeout: 60 })), 30)
    shift = answerLine(shift, 'line-1')
    expect(shift.heat).toBe(0)
  })

  it('漏接压低热度并累积连续漏接', () => {
    const shift = tick(createShiftState(config({ deck: ['falls_elderly'], ringTimeout: 3 })), 3)
    expect(shift.missedStreak).toBe(1)
    expect(shift.heat).toBe(0) // 已在地板，不再往下
  })

  it('A 级通话推高热度', () => {
    const base = createShiftState(config())
    const shift: ShiftState = { ...base, heat: 40, lines: [finishingLine(base), base.lines[1], base.lines[2]] }
    expect(tickShift(shift).heat).toBeGreaterThan(40)
  })

  it('D 级通话降低热度，评价等级而非数字分数驱动结算', () => {
    const base = createShiftState(config())
    const shift: ShiftState = { ...base, heat: 40, lines: [finishingLine(base, { grade: 'D' }), base.lines[1], base.lines[2]] }
    expect(tickShift(shift).heat).toBeLessThan(40)
  })
})

describe('班次协调器 · 三种收班', () => {
  it('连续漏接达阈值 → 崩盘收班，且线路立即移交', () => {
    const shift = tick(createShiftState(config({ ringTimeout: 2 })), 30)
    expect(shift.missedStreak).toBeGreaterThanOrEqual(COLLAPSE_MISSED_STREAK)
    expect(shift.ending).toBe('collapse')
    expect(shift.moment).toBe('ended')
    expect(shift.lines.every(line => line.phase === 'idle' || line.phase === 'done')).toBe(true)
    expect(isShiftComplete(shift)).toBe(true)
  })

  it('崩盘时将在办真实病例写成已移交记录，不让病例从总结消失', () => {
    let shift = tick(createShiftState(config()), 1)
    shift = answerLine(shift, 'line-1')
    shift = { ...shift, missedStreak: COLLAPSE_MISSED_STREAK }
    const ended = tickShift(shift)
    expect(ended.ending).toBe('collapse')
    expect(ended.completed).toHaveLength(1)
    expect(ended.completed[0].evaluation.outcome).toBe('transferred')
    expect(ended.lines[0].phase).toBe('idle')
  })

  it('患者死亡 → 崩盘收班', () => {
    const base = createShiftState(config())
    const shift: ShiftState = {
      ...base,
      heat: 60,
      lines: [finishingLine(base, { died: true, scenarioId: 'cardiac_arrest' }), base.lines[1], base.lines[2]],
    }
    const next = tickShift(shift)
    expect(next.deaths).toBe(1)
    expect(next.ending).toBe('collapse')
  })

  it('撑过峰值段 → 圆满收班', () => {
    const base = createShiftState(config())
    const shift: ShiftState = {
      ...base,
      heat: HEAT_PEAK,
      moment: 'peak',
      peakSurvived: PEAK_CALLS_TO_SURVIVE - 1,
      lines: [finishingLine(base), base.lines[1], base.lines[2]],
    }
    expect(tickShift(shift).ending).toBe('perfect')
  })

  it('峰值段没撑够就不会收班', () => {
    const base = createShiftState(config())
    const shift: ShiftState = {
      ...base,
      heat: HEAT_PEAK,
      moment: 'peak',
      peakSurvived: 0,
      lines: [finishingLine(base), base.lines[1], base.lines[2]],
    }
    expect(tickShift(shift).ending).toBeNull()
  })

  it('热度长期低迷且已处理过足够通话 → 平稳收班', () => {
    const base = createShiftState(config())
    const shift: ShiftState = {
      ...base,
      heat: 0,
      moment: 'rising',
      completed: [
        { lineId: 'line-1', scenarioId: 'falls_elderly', evaluation: evaluation('falls_elderly', 'D'), activeSeconds: 10 },
        { lineId: 'line-2', scenarioId: 'chest_pain', evaluation: evaluation('chest_pain', 'D'), activeSeconds: 10 },
        { lineId: 'line-3', scenarioId: 'hemorrhage', evaluation: evaluation('hemorrhage', 'D'), activeSeconds: 10 },
      ],
    }
    const next = tickShift(shift)
    expect(next.ending).toBe('fade')
    expect(next.moment).toBe('ended')
  })

  it('通话数不足时即使热度低迷也不收班（避免开场就草草收班）', () => {
    const base = createShiftState(config())
    const shift: ShiftState = { ...base, heat: 0, moment: 'rising' }
    expect(tickShift(shift).ending).toBeNull()
  })

  it('收班后不再产生新来电', () => {
    const base = createShiftState(config())
    const ended: ShiftState = { ...base, ending: 'fade', moment: 'ended' }
    const next = tick(ended, 20)
    expect(next.lines.every(line => line.phase === 'idle')).toBe(true)
  })

  it('收班叙事随收班方式变化，崩盘时是「被换下来」', () => {
    const base = createShiftState(config())
    const collapse = summarizeShift({ ...base, ending: 'collapse' })
    const perfect = summarizeShift({ ...base, ending: 'perfect' })
    expect(collapse.endingNarrative).toContain('组长')
    expect(perfect.endingNarrative).not.toBe(collapse.endingNarrative)
    expect(summarizeShift(base).endingNarrative).toBeNull()
  })
})
