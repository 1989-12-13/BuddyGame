import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { ShiftScreen } from './ShiftScreen'

// 工作台内含 Leaflet / 音频等浏览器依赖，这里替换为桩件，只验证班次层行为。
// 注意：线路条与班次状态条是由班次层以插槽（slots）注入工作台的，
// 桩件必须把它们渲染出来，否则班次层 UI 永远不会挂载。
vi.mock('./WorkbenchScreen', () => ({
  GameScreen: ({ controlled }: { controlled?: { slots?: { statusBar?: ReactNode; lineBoard?: ReactNode } } }) => (
    <div data-testid="workbench-stub">
      {controlled?.slots?.statusBar}
      {controlled?.slots?.lineBoard}
    </div>
  ),
}))

describe('ShiftScreen · 并发值班入口', () => {
  it('没有活跃线路时不占位，响铃后才出现线路 chip', async () => {
    vi.useFakeTimers()
    render(<ShiftScreen onNavigate={() => {}} />)

    // 空闲线路完全不显示（排除了「3 张空卡片吃掉左栏上半屏」）
    expect(screen.queryByLabelText('电话线路')).not.toBeInTheDocument()

    await act(async () => { vi.advanceTimersByTime(1000) })

    const chips = document.querySelectorAll('.lr-chip')
    expect(chips).toHaveLength(1)
    expect(chips[0].className).toContain('lr-ringing')
    // 接听前只给倒计时，不给场景名
    expect(chips[0].textContent).toMatch(/\d+s/)

    vi.useRealTimers()
  })

  it('接听后 chip 转为通话中，并带出场景名、协议进度与来电者', async () => {
    vi.useFakeTimers()
    render(<ShiftScreen onNavigate={() => {}} />)
    await act(async () => { vi.advanceTimersByTime(1000) })

    const ringing = document.querySelector<HTMLButtonElement>('.lr-chip.lr-ringing')!
    expect(ringing).toBeTruthy()
    await act(async () => { ringing.click() })

    const chip = document.querySelector('.lr-chip')!
    expect(chip.className).toContain('lr-active')
    // chip 上给的是场景名 + 通话时长（不再显示协议进度）
    expect(chip.textContent).toMatch(/\d{2}:\d{2}/)
    expect(chip.textContent).not.toMatch(/\d+\/\d+/)
    // 来电者信息改挂在「来电实录」栏，线路 chip 上不再重复
    expect(document.querySelector('.lr-caller')).toBeNull()

    vi.useRealTimers()
  })

  it('响铃 chip 会持续走倒计时，未接听时保持响铃态', async () => {
    vi.useFakeTimers()
    render(<ShiftScreen onNavigate={() => {}} />)
    await act(async () => { vi.advanceTimersByTime(1000) })

    const readSeconds = () => Number.parseInt(document.querySelector('.lr-chip b')!.textContent!.replace(/\D/g, ''), 10)
    const before = readSeconds()

    await act(async () => { vi.advanceTimersByTime(3000) })

    expect(readSeconds()).toBeLessThan(before)
    expect(document.querySelector('.lr-chip')!.className).toContain('lr-ringing')

    vi.useRealTimers()
  })
})
