import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CprGame } from './CprGame'
import { StepOrder } from './StepOrder'
import { RescueBreaths } from './RescueBreaths'
import { scoreBreath } from './breathing'
import type { MiniGameSpec } from '../../../game/types'

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
const order: MiniGameSpec = { kind: 'stepOrder', title: '排序', instruction: '测试', steps: ['确认安全', '照护患者', '接应车辆'], passThreshold: 0.8, feedback: { good: '好', bad: '请核对' } }
const breath: MiniGameSpec = { kind: 'rescueBreaths', title: '通气', instruction: '测试', passThreshold: 0.5, feedback: { good: '好', bad: '请核对' } }
describe('waiting care interactions', () => {
  it('completes two CPR cycles, ignores spam and cancels held breaths on pause', () => {
    vi.useFakeTimers()
    let now = 100
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const done = vi.fn()
    const spec: MiniGameSpec = { kind: 'cpr', title: 'CPR', instruction: '测试', cycles: 2, passThreshold: 0.7, feedback: { good: '好', bad: '核对' } }
    const view = render(<CprGame spec={spec} onComplete={done} />)
    for (let cycle = 0; cycle < 2; cycle++) {
      const press = screen.getByRole('button', { name: '胸外按压操作区' })
      for (let i = 0; i < 30; i++) {
        now += 545
        fireEvent.keyDown(press, { code: 'Space' })
        fireEvent.keyDown(press, { code: 'Space' })
      }
      expect(screen.getByText(`第 ${cycle + 1} 轮 · 胸外按压 30/30`)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /开始人工呼吸/ }))
      const breathButton = screen.getByRole('button', { name: '人工呼吸操作区' })
      fireEvent.keyDown(breathButton, { code: 'Space' })
      view.rerender(<CprGame spec={spec} onComplete={done} paused />)
      now += 10000
      view.rerender(<CprGame spec={spec} onComplete={done} />)
      fireEvent.keyUp(breathButton, { code: 'Space' })
      expect(screen.getByText(`第 ${cycle + 1} 轮 · 人工呼吸 0/2`)).toBeInTheDocument()
      for (let i = 0; i < 2; i++) { fireEvent.keyDown(breathButton, { code: 'Space' }); now += 1000; fireEvent.keyUp(breathButton, { code: 'Space' }) }
    }
    act(() => vi.advanceTimersByTime(800))
    expect(done).toHaveBeenCalledExactlyOnceWith(1, true)
  })
  it('allows ordering and undo; only explicit submission completes once', () => {
    const done = vi.fn()
    render(<StepOrder spec={order} onComplete={done} />)
    fireEvent.click(screen.getByRole('button', { name: /照护患者/ }))
    fireEvent.click(screen.getByRole('button', { name: /撤销上一步/ }))
    for (const name of ['确认安全', '照护患者', '接应车辆']) fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }))
    expect(done).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '确认操作顺序' }))
    fireEvent.click(screen.getByRole('button', { name: '确认操作顺序' }))
    expect(done).toHaveBeenCalledExactlyOnceWith(1, true)
  })
  it('does not award a perfect score for a wrong order or accept paused input', () => {
    const done = vi.fn()
    const view = render(<StepOrder spec={order} onComplete={done} paused />)
    fireEvent.click(screen.getByRole('button', { name: /接应车辆/ }))
    expect(screen.getByRole('list', { name: '已排好的步骤' }).children).toHaveLength(0)
    view.rerender(<StepOrder spec={order} onComplete={done} />)
    for (const name of ['接应车辆', '照护患者', '确认安全']) fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }))
    fireEvent.click(screen.getByRole('button', { name: '确认操作顺序' }))
    expect(done).toHaveBeenCalledWith(1 / 3, false)
  })
  it('scores breaths near one second and rejects zero, excessive or invalid holds', () => {
    expect(scoreBreath(1)).toBe(1)
    for (const value of [0, 0.3, 10, NaN, Infinity]) expect(scoreBreath(value)).toBe(0)
  })
  it('cancels an in-progress breath on pause, supports keyboard and submits once', () => {
    let now = 100
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const done = vi.fn()
    const view = render(<RescueBreaths spec={breath} onComplete={done} />)
    const button = screen.getByRole('button', { name: /按住进行一次通气/ })
    fireEvent.keyDown(button, { code: 'Space' })
    view.rerender(<RescueBreaths spec={breath} onComplete={done} paused />)
    now += 10000
    fireEvent.keyUp(button, { code: 'Space' })
    view.rerender(<RescueBreaths spec={breath} onComplete={done} />)
    expect(screen.getByText(/已完成 0\/2 次/)).toBeInTheDocument()
    for (let i = 0; i < 2; i++) { fireEvent.keyDown(button, { code: 'Space' }); now += 1000; fireEvent.keyUp(button, { code: 'Space' }) }
    fireEvent.click(screen.getByRole('button', { name: '记录练习结果' }))
    fireEvent.click(screen.getByRole('button', { name: '记录练习结果' }))
    expect(done).toHaveBeenCalledExactlyOnceWith(1, true)
  })
})
