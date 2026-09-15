import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { OnboardingCoach, type CoachStep } from './OnboardingCoach'

const steps: CoachStep[] = [
  { target: '.line-rail', title: '线路响铃时点它', body: '一次只盯一条线。', done: () => false },
  { target: '.question-dock', title: '挑一句说', body: '你决定怎么说。', done: () => false },
]

describe('首次值班引导', () => {
  beforeEach(() => localStorage.clear())

  it('第一次进入显示第一步，可以手动翻到下一步', () => {
    render(<OnboardingCoach steps={steps} onFinish={() => undefined} />)

    expect(screen.getByRole('dialog', { name: '首次值班引导' })).toBeInTheDocument()
    expect(screen.getByText('线路响铃时点它')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /下一步/ }))

    expect(screen.getByText('挑一句说')).toBeInTheDocument()
  })

  it('跳过之后写入标记，重新挂载不再出现', () => {
    const first = render(<OnboardingCoach steps={steps} onFinish={() => undefined} />)
    fireEvent.click(screen.getByRole('button', { name: /跳过引导/ }))
    expect(localStorage.getItem('dispatch120-onboarded')).toBe('done')
    first.unmount()

    render(<OnboardingCoach steps={steps} onFinish={() => undefined} />)
    expect(screen.queryByRole('dialog', { name: '首次值班引导' })).toBeNull()
  })

  it('目标区域还不存在时不报错，只显示说明卡', () => {
    render(<OnboardingCoach steps={steps} onFinish={() => undefined} />)
    expect(screen.getByText('线路响铃时点它')).toBeInTheDocument()
    expect(document.querySelector('.coach-ring')).toBeNull()
  })
})
