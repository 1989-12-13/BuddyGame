import type { CallEvaluation, WorldState } from '../types'
import { createInitialState } from './worldState'
import { SCENARIO_IDS } from '../events/templates'
import { ROGUE_PERKS } from './perks'
import { readStorage, writeStorage, removeStorage } from '../../utils/storage'

const KEY = 'dispatch120-checkpoint-v3'
const LEGACY_KEYS = ['dispatch120-checkpoint-v1', 'dispatch120-checkpoint-v2']

export function saveCheckpoint(state: WorldState): boolean {
  LEGACY_KEYS.forEach(removeStorage)
  if (state.callIndex >= state.totalCalls && !state.backgroundRescues.some(rescue => !rescue.outcome)) {
    removeStorage(KEY)
    return true
  }
  return writeStorage(KEY, JSON.stringify({
    version: 3,
    queue: state.scenarioQueue,
    index: state.callIndex,
    evaluations: state.callEvaluations,
    perks: state.perks,
    elapsed: state.shiftElapsed,
    activeSeconds: Math.max(0, state.activePlaySeconds - (state.currentCall ? state.shiftElapsed - state.callStartTime : 0)),
    callInstanceId: state.callInstanceId,
    fleet: state.fleet,
    backgroundRescues: state.backgroundRescues,
    rescueNotifications: state.rescueNotifications,
  }))
}

function validEvaluations(value: unknown, expectedLength: number): value is CallEvaluation[] {
  return Array.isArray(value)
    && value.length === expectedLength
    && value.every(item => item && typeof item === 'object'
      && typeof (item as CallEvaluation).scenarioId === 'string'
      && typeof (item as CallEvaluation).overallGrade === 'string'
      && Array.isArray((item as CallEvaluation).reviewPoints))
}

export function loadCheckpoint(): WorldState | null {
  LEGACY_KEYS.forEach(removeStorage)
  const reject = () => { removeStorage(KEY); return null }
  try {
    const saved = JSON.parse(readStorage(KEY) ?? 'null')
    // v1/v2 只有旧分数，无法可靠还原五维证据，明确失效。
    if (!saved || saved.version !== 3) return reject()
    if (!Array.isArray(saved.queue) || !saved.queue.length || saved.queue.length > SCENARIO_IDS.length || !saved.queue.every((id: unknown) => typeof id === 'string' && SCENARIO_IDS.includes(id))) return reject()
    if (!Number.isInteger(saved.index) || saved.index < 0 || saved.index > saved.queue.length) return reject()
    if (!validEvaluations(saved.evaluations, saved.index)) return reject()
    if (!Array.isArray(saved.perks) || !saved.perks.every((id: unknown) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(ROGUE_PERKS, id))) return reject()
    if (!Number.isFinite(saved.elapsed) || saved.elapsed < 0) return reject()
    if (saved.activeSeconds !== undefined && (!Number.isInteger(saved.activeSeconds) || saved.activeSeconds < 0 || saved.activeSeconds > saved.elapsed)) return reject()
    const initial = createInitialState()
    const restoreBackground = Array.isArray(saved.backgroundRescues)
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
      callEvaluations: saved.evaluations,
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
  } catch {
    return reject()
  }
}
