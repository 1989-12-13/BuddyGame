// ============================================================
// 120调度台 — World Reducer
// 120急救调度模拟游戏核心逻辑·调度中枢
// ============================================================

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
import {
  handleStartShift,
  handleUpdateTerminal,
  handleSetPatientStatus,
  handleSetMpdsDeterminant,
  handleSetDeterminantSubcode,
  handleSetProtocol,
  handleSetTriage,
  handleSelectVehicle,
  handleDismissPatientEvent,
  handleDismissDebrief,
  handleChoosePerk,
  handleShowEnding,
  handleBackToTitle,
} from './reducers/miscHandlers'

export function worldReducer(state: WorldState, action: GameAction): WorldState {
  switch (action.type) {
    case 'START_SHIFT':
      return handleStartShift(state, action.forceScenarios)

    case 'ANSWER_CALL':
      return handleAnswerCall(state)

    case 'ASK_QUESTION':
      return handleAskQuestion(state, action.questionId)

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

    case 'SELECT_VEHICLE':
      return handleSelectVehicle(state, action.vehicleId)

    case 'DISPATCH':
      return handleDispatch(state, action.vehicleId)

    case 'ANSWER_GUIDANCE':
      return handleAnswerGuidance(state, action.stepIndex, action.selectedIndex)

    case 'COMPLETE_MINIGAME':
      return handleCompleteMinigame(state, action.stepIndex, action.score, action.passed)

    case 'DISMISS_PATIENT_EVENT':
      return handleDismissPatientEvent(state, action.eventId)

    case 'END_CALL':
      return handleEndCall(state, action.perkChoices)

    case 'DISMISS_DEBRIEF':
      return handleDismissDebrief(state)

    case 'CHOOSE_PERK':
      return handleChoosePerk(state, action.perkId)

    case 'TICK':
      return handleTick(state)

    case 'SHOW_ENDING':
      return handleShowEnding(state)

    case 'BACK_TO_TITLE':
      return handleBackToTitle(state)

    default:
      return state
  }
}

export type { GameAction }
