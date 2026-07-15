import { describe, expect, it } from 'vitest'
import {
  crossedDispatchWarning,
  formatPlayerDeterminantCode,
  getDispatchTimingState,
} from '../game/core/dispatchTiming'

describe('dispatch timing status', () => {
  it('warns at 50 seconds and only marks overtime after 80 seconds', () => {
    expect(getDispatchTimingState(49)).toBe('normal')
    expect(getDispatchTimingState(50)).toBe('warning')
    expect(getDispatchTimingState(80)).toBe('warning')
    expect(getDispatchTimingState(81)).toBe('overtime')
  })

  it('does not reveal the expected determinant before the player selects one', () => {
    expect(formatPlayerDeterminantCode(28, null)).toBe('28-?-?')
    expect(formatPlayerDeterminantCode(28, 'CHARLIE')).toBe('28-C-?')
  })

  it('detects warning thresholds even when an action skips over the exact second', () => {
    expect(crossedDispatchWarning(49, 52)).toBe(true)
    expect(crossedDispatchWarning(80, 83)).toBe(true)
    expect(crossedDispatchWarning(52, 80)).toBe(false)
  })
})
