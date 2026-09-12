import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SHIFT_CONFIG,
  answerLine,
  availableVehicleCount,
  busyVehicleCount,
  createShiftState,
  focusLine,
  isShiftComplete,
  isVehicleOut,
  lineNeedsDecision,
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
import { getScenario } from '../events/templates'

function config(overrides: Partial<ShiftConfig> = {}): ShiftConfig {
  return {
    ...DEFAULT_SHIFT_CONFIG,
    queue: ['falls_elderly', 'chest_pain', 'hemorrhage'],
    ...overrides,
  }
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

  it('空队列时班次直接视为收束', () => {
    const shift = createShiftState(config({ queue: [] }))
    expect(isShiftComplete(shift)).toBe(true)
  })
})

describe('班次协调器 · 来电到达与响铃', () => {
  it('第一次 tick 即让第一条空闲线路响铃', () => {
    const shift = tick(createShiftState(config()), 1)
    const ringing = shift.lines.filter(line => line.phase === 'ringing')
    expect(ringing).toHaveLength(1)
    expect(ringing[0].scenarioId).toBe('falls_elderly')
    expect(shift.arrivalCooldown).toBeGreaterThan(0)
  })

  it('到达受冷却间隔约束，不会同一秒涌入', () => {
    const shift = tick(createShiftState(config()), 1)
    expect(shift.lines.filter(line => line.phase === 'ringing')).toHaveLength(1)
    expect(shift.queueIndex).toBe(1)
  })

  it('冷却结束后才播放下一起来电', () => {
    const shift = tick(createShiftState(config({ arrivalGap: 3 })), 4)
    expect(shift.lines.filter(line => line.phase === 'ringing')).toHaveLength(2)
  })

  it('响铃超时记为未接来电并释放线路', () => {
    const shift = tick(createShiftState(config({ queue: ['falls_elderly'], ringTimeout: 5 })), 5)
    expect(shift.lines[0].phase).toBe('idle')
    expect(shift.lines[0].scenarioId).toBeNull()
    expect(shift.missed).toEqual(['falls_elderly'])
  })
})

describe('班次协调器 · 接听与聚焦', () => {
  it('接听后线路转为通话中，并装载对应场景', () => {
    let shift = tick(createShiftState(config()), 1)
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
    let shift = tick(createShiftState(config()), 4)
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
    let shift = tick(createShiftState(config()), 4)
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
    const base = createShiftState(config({ queue: [] }))
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
    const base = createShiftState(config({ queue: [] }))
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

describe('班次协调器 · 在途事件可见性', () => {
  it('有待决策在途事件的线路会被标记出来', () => {
    const base = createShiftState(config({ queue: [] }))
    const line = {
      ...base.lines[0],
      phase: 'active',
      world: {
        ...createInitialState(),
        pendingReroute: { callInstanceId: 1, message: '前方车流加密', currentRouteId: 'r1', options: [] },
      },
    } as unknown as ShiftLine
    const shift: ShiftState = { ...base, lines: [line, base.lines[1], base.lines[2]] }

    expect(lineNeedsDecision(line)).toBe(true)
    expect(pendingDecisionCount(shift)).toBe(1)
  })

  it('空闲线路不会被标记为待决策', () => {
    const base = createShiftState(config({ queue: [] }))
    expect(pendingDecisionCount(base)).toBe(0)
    expect(lineNeedsDecision({ ...base.lines[0], phase: 'done' })).toBe(false)
  })
})

describe('班次协调器 · 收束结算', () => {
  it('汇总带场景名、未接来电与交叉核实结论', () => {
    const base = createShiftState(config({ queue: [] }))
    const shift: ShiftState = {
      ...base,
      missed: ['chest_pain'],
      completed: [{ lineId: 'line-1', scenarioId: 'falls_elderly', score: 80, activeSeconds: 40 }],
      incidents: [
        { id: 'inc-1', scenarioId: 'falls_elderly', primaryLineId: 'line-1', supplementLineId: 'line-2', supplementAt: 0, resolved: true, resolution: 'adopt' },
        { id: 'inc-2', scenarioId: 'stroke', primaryLineId: 'line-3', supplementLineId: null, supplementAt: 0, resolved: false, resolution: null },
      ],
    }

    const summary = summarizeShift(shift)

    expect(summary.calls[0].title).toBe(getScenario('falls_elderly').title)
    expect(summary.missed[0].scenarioId).toBe('chest_pain')
    expect(summary.incidents.filter(item => item.resolution)).toHaveLength(1)
    expect(summary.narrative).toContain('接住 1 通')
    expect(summary.narrative).toContain('漏接 1 通')
    expect(summary.narrative).toContain('采纳最新观察 1 次')
  })

  it('跨线路累积成绩，未接来电按 0 分计入', () => {
    const base = createShiftState(config({ queue: [] }))
    const shift: ShiftState = {
      ...base,
      missed: ['chest_pain'],
      completed: [
        { lineId: 'line-1', scenarioId: 'falls_elderly', score: 80, activeSeconds: 40 },
        { lineId: 'line-2', scenarioId: 'hemorrhage', score: 60, activeSeconds: 30 },
      ],
    }

    const summary = summarizeShift(shift)
    expect(summary.totalScore).toBe(140)
    expect(summary.callScores).toEqual([80, 60, 0])
    expect(summary.activeSeconds).toBe(70)
    expect(summary.missedCount).toBe(1)
  })

  it('线路结束时自动快照成绩，线路复用不会把分丢掉', () => {
    const base = createShiftState(config({ queue: [] }))
    const ending: ShiftLine = {
      ...base.lines[0],
      phase: 'active',
      scenarioId: 'falls_elderly',
      world: {
        ...createInitialState(),
        screen: 'playing',
        totalCalls: 1,
        callIndex: 1,
        currentCall: null,
        callScores: [77],
        totalScore: 77,
        activePlaySeconds: 42,
      },
    }
    const shift: ShiftState = { ...base, lines: [ending, base.lines[1], base.lines[2]] }

    const next = tickShift(shift)
    expect(next.lines[0].phase).toBe('done')
    expect(next.completed).toHaveLength(1)
    expect(next.completed[0]).toMatchObject({ lineId: 'line-1', scenarioId: 'falls_elderly', score: 77, activeSeconds: 42 })
  })
})

describe('班次协调器 · TICK 路由', () => {
  it('shiftReducer 的 TICK 推进全部线路，而非仅聚焦线路', () => {
    let shift = tick(createShiftState(config()), 4)
    shift = answerLine(shift, 'line-1')
    shift = answerLine(shift, 'line-2')
    const focusedClock = shift.lines[1].world.shiftElapsed
    const backgroundClock = shift.lines[0].world.shiftElapsed

    shift = shiftReducer(shift, { type: 'TICK' })
    expect(shift.lines[1].world.shiftElapsed).toBe(focusedClock + 1)
    expect(shift.lines[0].world.shiftElapsed).toBe(backgroundClock + 1)
    expect(shift.clock).toBe(5)
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
