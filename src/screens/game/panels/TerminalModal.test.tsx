import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../../game/core/initialState'
import { TerminalModal } from './TerminalModal'

describe('TerminalModal route-planning entry', () => {
  it('makes the node route step explicit before dispatch', () => {
    const onDispatch = vi.fn()
    const terminal = {
      ...createInitialState().terminal,
      determinant: 'ECHO' as const,
      triage: 'red' as const,
    }

    render(
      <TerminalModal
        terminal={terminal}
        dispatchSent={false}
        ambulanceRemaining={0}
        onChange={vi.fn()}
        onSetStatus={vi.fn()}
        onSetDeterminant={vi.fn()}
        onSetDeterminantSubcode={vi.fn()}
        onSetProtocol={vi.fn()}
        onDispatch={onDispatch}
        onClose={vi.fn()}
        onEndCall={vi.fn()}
      />,
    )

    expect(screen.getByText('下一步 · 路线规划')).toBeInTheDocument()
    expect(screen.getByText(/沿相邻节点选择完整路线/)).toBeInTheDocument()
    const routeButton = screen.getByRole('button', { name: /进入路线规划/ })
    expect(routeButton).toBeEnabled()
    fireEvent.click(routeButton)
    expect(onDispatch).toHaveBeenCalledOnce()
  })
})
