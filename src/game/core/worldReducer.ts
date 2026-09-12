// ============================================================
// 120调度台 — World Reducer
// 120急救调度模拟游戏核心逻辑·调度中枢
// ============================================================

import { isWorldPaused, isActionBusy } from './session'
import { applyCallEvents } from './callEvents'
import type { WorldState } from '../types'
import type { GameAction } from './actions'
import { handleAskQuestion } from './reducers/askQuestion'
import { handleDispatch } from './reducers/dispatch'
import { handleEndCall } from './reducers/endCall'
import { handleAnswerCall } from './reducers/answerCall'
import { handleCalmCaller } from './reducers/calmCaller'
import { handleMakeJudgment } from './reducers/makeJudgment'
import { handleAnswerGuidance } from './reducers/answerGuidance'
import { handleCompleteMinigame } from './reducers/completeMinigame'
import { handleTick } from './reducers/tick'
import { isGuidanceActive } from './reducers/helpers'
import { handleCareCheck } from './waitingCare'
import { handleReroute } from './reducers/reroute'
import { handleSubmitHandoff } from './handoff'
import {
  handleStartShift,
  handleUpdateTerminal,
  handleSetPatientStatus,
  handleSetMpdsDeterminant,
  handleSetDeterminantSubcode,
  handleSetProtocol,
  handleSetTriage,
  handleDismissPatientEvent,
  handleDismissRescueNotification,
  handleDismissDebrief,
  handleChoosePerk,
  handleShowEnding,
  handleBackToTitle,
} from './reducers/miscHandlers'

export function worldReducer(state: WorldState, action: GameAction): WorldState {
  if (action.type === 'PAUSE') return state.pauseReasons.includes(action.reason) ? state : { ...state, pauseReasons: [...state.pauseReasons, action.reason] }
  if (action.type === 'RESUME') return { ...state, pauseReasons: action.reason ? state.pauseReasons.filter(r => r !== action.reason) : state.pauseReasons.filter(r => !['manual', 'background'].includes(r)) }
  if ('callInstanceId' in action && action.callInstanceId !== undefined && action.callInstanceId !== state.callInstanceId) return state
  if (isWorldPaused(state) && !['DISMISS_DEBRIEF', 'CHOOSE_PERK', 'BACK_TO_TITLE', 'START_SHIFT'].includes(action.type)) return state
  if (isActionBusy(state) && ['ASK_QUESTION', 'CALM_CALLER', 'DISPATCH'].includes(action.type)) return state
  switch (action.type) {
    case 'CARE_CHECK':
      return handleCareCheck(state, action.checkId, action.selectedIndex)
    case 'START_SHIFT':
      return handleStartShift(state, action.forceScenarios)

    case 'ANSWER_CALL':
      return handleAnswerCall(state, action.scenario)

    case 'ASK_QUESTION': {
      const next = handleAskQuestion(state, action.questionId, {
        spokenLine: action.spokenLine,
        stressDelta: action.stressDelta,
        extraTime: action.extraTime,
      })
      return next === state ? state : applyCallEvents(next, 'after_question', action.questionId)
    }

    case 'CALM_CALLER':
      return handleCalmCaller(state)

    case 'MAKE_JUDGMENT':
      return handleMakeJudgment(state, action.judgmentId, action.chosenOptionIndex)

    case 'UPDATE_TERMINAL':
      return handleUpdateTerminal(state, action.field, action.value)

    case 'SET_PATIENT_STATUS':
      return handleSetPatientStatus(state, action.field, action.value)

    case 'SET_MPDS_DETERMINANT':
      return handleSetMpdsDeterminant(state, action.determinant)

    case 'SET_DETERMINANT_SUBCODE':
      return handleSetDeterminantSubcode(state, action.subcode)

    case 'SET_PROTOCOL':
      return handleSetProtocol(state, action.protocolNumber)

    case 'SET_TRIAGE':
      return handleSetTriage(state, action.level)

    case 'DISPATCH': {
      const next = handleDispatch(state, action.vehicleId, action.route, action.routeOptions)
      return next === state ? state : applyCallEvents(next, 'after_dispatch')
    }

    case 'REROUTE_AMBULANCE':
      return handleReroute(state, action.routeId)

    case 'SUBMIT_HANDOFF':
      return handleSubmitHandoff(state, action.factIds)

    case 'ANSWER_GUIDANCE':
      return handleAnswerGuidance(state, action.stepIndex, action.selectedIndex)

    case 'CONTINUE_GUIDANCE':
      if (!isGuidanceActive(state) || action.stepIndex !== state.guidanceStepIndex || state.guidanceResults[action.stepIndex] == null) return state
      return { ...state, guidanceStepIndex: state.guidanceStepIndex + 1 }

    case 'COMPLETE_MINIGAME':
      return handleCompleteMinigame(state, action.stepIndex, action.score, action.passed)

    case 'DISMISS_PATIENT_EVENT':
      return handleDismissPatientEvent(state, action.eventId)

    case 'DISMISS_RESCUE_NOTIFICATION':
      return handleDismissRescueNotification(state, action.notificationId)

    case 'END_CALL':
      return handleEndCall(state, action.perkChoices)

    case 'DISMISS_DEBRIEF':
      return handleDismissDebrief(state)

    case 'CHOOSE_PERK':
      return handleChoosePerk(state, action.perkId)

    case 'TICK':
      return applyCallEvents(handleTick(state), 'time_elapsed')

    case 'SHOW_ENDING':
      return handleShowEnding(state)

    case 'BACK_TO_TITLE':
      return handleBackToTitle()

    default:
      return state
  }
}

export type { GameAction }
