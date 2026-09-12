import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { ShiftScreen } from './ShiftScreen'

// 工作台内含 Leaflet / 音频等浏览器依赖，这里替换为桩件，只验证班次层行为
vi.mock('./WorkbenchScreen', () => ({
  GameScreen: () => <div data-testid="workbench-stub" />,
}))

describe('ShiftScreen · 并发值班入口', () => {
  it('开局渲染三条线路，并在时钟推进后出现响铃', async () => {
    vi.useFakeTimers()
    render(<ShiftScreen onNavigate={() => {}} />)

    expect(screen.getByLabelText('电话线路')).toBeInTheDocument()
    expect(document.querySelectorAll('.lr-item')).toHaveLength(3)
    expect(document.querySelectorAll('.lr-item.lr-ringing')).toHaveLength(0)

    await act(async () => { vi.advanceTimersByTime(1000) })

    const ringing = document.querySelectorAll('.lr-item.lr-ringing')
    expect(ringing.length).toBeGreaterThan(0)
    // 响铃线路必须给出接听入口（进度与倒计时）
    expect(document.querySelector('.lr-remain')?.textContent).toMatch(/\d+s/)

    vi.useRealTimers()
  })

  it('未接听时线路会超时释放并计入未接来电', async () => {
    vi.useFakeTimers()
    render(<ShiftScreen onNavigate={() => {}} />)

    // 默认响铃上限 22 秒，推进到超时
    await act(async () => { vi.advanceTimersByTime(25_000) })

    expect(document.querySelector('.lr-bad')?.textContent).toContain('未接')

    vi.useRealTimers()
  })
})
