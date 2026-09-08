import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { PatientVitals } from './PatientVitals'
import { worldReducer } from '../../game/core/worldReducer'
import { createInitialState } from '../../game/core/worldState'
afterEach(cleanup)
describe('patient status display', () => {
  it('keeps unknown observations explicit and labels the bar as a simulation', () => {
    const state = worldReducer(worldReducer(createInitialState(), { type: 'START_SHIFT', forceScenarios: ['cardiac_arrest'] }), { type: 'ANSWER_CALL' })
    render(<PatientVitals state={state} />)
    expect(screen.getByText('意识：待确认')).toBeInTheDocument()
    expect(screen.getByText(/不是血氧、心率或存活概率/)).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: '模拟照护余量' })).toHaveAttribute('aria-valuenow', '80')
    expect(screen.queryByText('呼吸正常')).not.toBeInTheDocument()
  })
})
