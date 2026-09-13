import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DEFAULT_SHIFT_CONFIG, createShiftState, type ShiftLine, type ShiftState } from '../../game/core/shift'
import { ShiftStatusBar } from './ShiftStatusBar'

/** 把某条线路标记为「车辆外出未归」 */
function withVehicleOut(base: ShiftState): ShiftState {
  const mission = { id: 'r', vehicleId: 'ambulance', outcome: null }
  return {
    ...base,
    lines: base.lines.map((line, index) => (index === 0
      ? ({ ...line, vehicleId: 'ambulance', world: { ...line.world, backgroundRescues: [mission] } } as unknown as ShiftLine)
      : line)),
  }
}

describe('ShiftStatusBar · 班次状态条', () => {
  it('只给玩家看时钟与可用车辆', () => {
    const base = createShiftState(DEFAULT_SHIFT_CONFIG)
    render(<ShiftStatusBar shift={{ ...base, clock: 125, heat: 88, moment: 'peak' }} />)

    const bar = screen.getByLabelText('班次状态')
    expect(bar.textContent).toContain('02:05')
    expect(bar.textContent).toContain('可用车辆 2')
  })

  it('玩法内部数值（热度 / 段落 / 来电计数）一律不出现在界面上', () => {
    const base = createShiftState(DEFAULT_SHIFT_CONFIG)
    render(<ShiftStatusBar shift={{ ...base, heat: 88, moment: 'peak' }} />)

    const text = screen.getByLabelText('班次状态').textContent ?? ''
    for (const hidden of ['最忙', '开场', '已接', '未接', '待决策', '响铃']) {
      expect(text).not.toContain(hidden)
    }
  })

  it('车辆被占用后可用数下降', () => {
    render(<ShiftStatusBar shift={withVehicleOut(createShiftState(DEFAULT_SHIFT_CONFIG))} />)
    expect(screen.getByLabelText('班次状态').textContent).toContain('可用车辆 1')
  })
})
