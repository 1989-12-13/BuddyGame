import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TitleScreen } from './DispatchTitle'

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggle: () => {} }),
}))

describe('标题页入口', () => {
  it('主按钮「开始值班」进入并发值班', () => {
    const onStart = vi.fn()
    render(<TitleScreen onStart={onStart} />)

    fireEvent.click(screen.getByText('开始值班'))

    expect(onStart).toHaveBeenCalledWith('__shift__')
  })
})
