import type { WorldState } from '../types'
import { createInitialState } from './worldState'
import { SCENARIO_IDS } from '../events/templates'
import { ROGUE_PERKS } from './perks'
import { readStorage, writeStorage, removeStorage } from '../../utils/storage'

const KEY = 'dispatch120-checkpoint-v1'
export function saveCheckpoint(state: WorldState): boolean {
  if (state.callIndex >= state.totalCalls && !state.backgroundRescues.some(rescue => !rescue.outcome)) { removeStorage(KEY); return true }
  return writeStorage(KEY, JSON.stringify({
    version: 2,
    queue: state.scenarioQueue,
    index: state.callIndex,
    scores: state.callScores,
    perks: state.perks,
    elapsed: state.shiftElapsed,
    activeSeconds: Math.max(0, state.activePlaySeconds - (state.currentCall ? state.shiftElapsed - state.callStartTime : 0)),
    callInstanceId: state.callInstanceId,
    fleet: state.fleet,
    backgroundRescues: state.backgroundRescues,
    rescueNotifications: state.rescueNotifications,
  }))
}
export function loadCheckpoint(): WorldState | null {
  try {
    const saved = JSON.parse(readStorage(KEY) ?? 'null')
    if (!saved || ![1, 2].includes(saved.version) || !Array.isArray(saved.queue) || !saved.queue.length || saved.queue.length > 33 || !saved.queue.every((id: unknown) => typeof id === 'string' && SCENARIO_IDS.includes(id))) return null
    if (!Number.isInteger(saved.index) || saved.index < 0 || saved.index > saved.queue.length || (saved.version === 1 && saved.index >= saved.queue.length)) return null
    if (!Array.isArray(saved.scores) || saved.scores.length !== saved.index || !saved.scores.every((n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100)) return null
    if (!Array.isArray(saved.perks) || !saved.perks.every((id: unknown) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(ROGUE_PERKS, id))) return null
    if (!Number.isFinite(saved.elapsed) || saved.elapsed < 0) return null
    if (saved.activeSeconds !== undefined && (!Number.isInteger(saved.activeSeconds) || saved.activeSeconds < 0 || saved.activeSeconds > saved.elapsed)) return null
    const initial = createInitialState()
    const restoreBackground = saved.version === 2
      && Array.isArray(saved.backgroundRescues)
      && Array.isArray(saved.rescueNotifications)
      && saved.fleet?.vehicles?.length === 1
    return {
      ...initial,
      screen: 'playing',
      shiftNumber: 1,
      callPhase: 'completed',
      scenarioQueue: saved.queue,
      totalCalls: saved.queue.length,
      callIndex: saved.index,
      callScores: saved.scores,
      totalScore: saved.scores.reduce((a: number, b: number) => a + b, 0),
      perks: [...new Set<string>(saved.perks)] as WorldState['perks'],
      shiftElapsed: saved.elapsed,
      activePlaySeconds: saved.activeSeconds ?? 0,
      ...(restoreBackground ? {
        callInstanceId: Number.isInteger(saved.callInstanceId) ? saved.callInstanceId : 0,
        fleet: saved.fleet,
        backgroundRescues: saved.backgroundRescues,
        rescueNotifications: saved.rescueNotifications,
        shiftCompletePending: saved.index >= saved.queue.length,
      } : {}),
    }
  } catch { return null }
}
