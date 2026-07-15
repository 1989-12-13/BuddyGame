import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { buildRouteOptions } from '../../game/core/routing'
import { RoutePlanner } from './RoutePlanner'

const START = { lat: 39.9967, lng: 116.4708 }
const END = { lat: 39.9151, lng: 116.3594 }

describe('RoutePlanner node workflow', () => {
  it('requires repeated adjacent-node choices before dispatch confirmation', () => {
    const routes = buildRouteOptions({ start: START, end: END, baseEta: 70, seed: 'route-planner-ui' })
    const chosenRoute = routes[0]
    const onConfirm = vi.fn()

    render(
      <RoutePlanner
        routes={routes}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByTestId('route-planner')).toBeInTheDocument()
    expect(screen.getByTestId('route-planning-steps')).toHaveTextContent('逐节点选择')
    const confirmButton = screen.getByRole('button', { name: '确认路线并派车' })
    expect(confirmButton).toBeDisabled()

    for (const node of chosenRoute.nodes.slice(1)) {
      const nodeButton = screen.getByRole('button', { name: `选择节点 ${node.label}` })
      expect(nodeButton).toBeEnabled()
      fireEvent.click(nodeButton)
    }

    expect(screen.getByText(`已到达事件现场，可确认 ${chosenRoute.label}`)).toBeInTheDocument()
    expect(confirmButton).toBeEnabled()
    fireEvent.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledWith(chosenRoute)
  })
})
