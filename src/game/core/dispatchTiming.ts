import type { MpdsDeterminant } from '../types'
import {
  DISPATCH_WARN_TIME,
  DISPATCH_CRITICAL_TIME,
} from './constants'

export type DispatchTimingState = 'normal' | 'warning' | 'overtime'

export function getDispatchTimingState(elapsed: number): DispatchTimingState {
  if (elapsed > DISPATCH_CRITICAL_TIME) return 'overtime'
  if (elapsed >= DISPATCH_WARN_TIME) return 'warning'
  return 'normal'
}

export function crossedDispatchWarning(previousElapsed: number, elapsed: number): boolean {
  return (previousElapsed < DISPATCH_WARN_TIME && elapsed >= DISPATCH_WARN_TIME)
    || (previousElapsed <= DISPATCH_CRITICAL_TIME && elapsed > DISPATCH_CRITICAL_TIME)
}

export function formatPlayerDeterminantCode(
  protocolNumber: number,
  determinant: MpdsDeterminant | null,
): string {
  return determinant ? `${protocolNumber}-${determinant[0]}-?` : `${protocolNumber}-?-?`
}
