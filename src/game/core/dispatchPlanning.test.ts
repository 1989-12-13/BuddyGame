import { describe, expect, it } from 'vitest'
import type { WorldState } from '../types'
import { buildDispatchPlan } from './dispatchPlanning'
import { createInitialState } from './worldState'
import { worldReducer } from './worldReducer'

function classifiedCall(): WorldState {
  const started = worldReducer(createInitialState(), { type: 'START_SHIFT' })
  const queued = {
    ...started,
    scenarioQueue: ['cardiac_arrest', ...started.scenarioQueue.filter(id => id !== 'cardiac_arrest')],
  }
  const answered = worldReducer(queued, { type: 'ANSWER_CALL' })
  return worldReducer(answered, { type: 'SET_MPDS_DETERMINANT', determinant: 'ECHO' })
}

describe('automatic ambulance dispatch planning', () => {
  it('assigns the only fully capable MICU to a red call', () => {
    const plan = buildDispatchPlan(classifiedCall())
    expect(plan?.requiredCapability).toBe(5)
    expect(plan?.vehicle.id).toBe('ambulance_c')
    expect(plan?.routes).toHaveLength(3)
  })

  it('falls back to the next most capable available ambulance', () => {
    const state = classifiedCall()
    const withoutMicu: WorldState = {
      ...state,
      fleet: {
        ...state.fleet,
        vehicles: state.fleet.vehicles.map(vehicle => vehicle.id === 'ambulance_c'
          ? { ...vehicle, status: 'en_route' as const }
          : vehicle),
      },
    }
    expect(buildDispatchPlan(withoutMicu)?.vehicle.id).toBe('ambulance_a')
  })

  it('is deterministic for one planning snapshot and changes road generation between runs', () => {
    const state = classifiedCall()
    expect(buildDispatchPlan(state)).toEqual(buildDispatchPlan(state))

    const nextRun = { ...state, shiftNumber: state.shiftNumber + 1 }
    expect(buildDispatchPlan(nextRun)?.routes).not.toEqual(buildDispatchPlan(state)?.routes)
  })
})
