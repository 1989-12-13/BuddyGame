import type { WorldState, CallEvent } from '../types'
import { stressToLevel } from '../types'

/** Events are narrative facts, not implicit diagnoses or arbitrary damage. */
export function applyCallEvents(state: WorldState, trigger: CallEvent['trigger'], questionId?: string): WorldState {
  if (!state.currentCall || !state.callerState || state.rescue.outcome || state.patientStatus?.died) return state
  let next = state
  for (const event of state.currentCall.specialEvents) {
    if (event.trigger !== trigger || next.triggeredEventIds.includes(event.id)) continue
    const threshold = Number(event.triggerValue)
    const eligible = trigger === 'time_elapsed'
      ? !!event.triggerValue?.trim() && Number.isFinite(threshold) && threshold >= 0 && state.shiftElapsed - state.callStartTime >= threshold
      : trigger === 'after_question' ? !!event.triggerValue && event.triggerValue === questionId : true
    if (!eligible) continue
    const caller = next.callerState!
    const stress = event.type === 'caller_panic' ? Math.min(100, caller.stress + 10) : caller.stress
    next = {
      ...next,
      triggeredEventIds: [...next.triggeredEventIds, event.id],
      callerState: { ...caller, stress, stressLevel: stressToLevel(stress) },
      dialogueLog: [...next.dialogueLog, { speaker: 'caller', text: event.dialogue, timestamp: next.shiftElapsed }],
    }
  }
  return next
}
