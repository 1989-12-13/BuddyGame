// ============================================================
// 零点接线台 — Game Actions
// ============================================================

import type { TriageLevel, MpdsDeterminant, FragmentTargetField } from '../types'
import type { RoguePerkId } from './perks'

export type TerminalField = 'address' | 'contact' | 'chiefComplaint' | 'patientAge' | 'patientGender' | 'conditionNote'

export type GameAction =
  | { type: 'START_SHIFT'; forceScenarios?: string[] }
  | { type: 'ANSWER_CALL' }
  | { type: 'ASK_QUESTION'; questionId: string }
  | { type: 'CALM_CALLER' }                                          // 安抚来电者情绪
  | { type: 'MAKE_JUDGMENT'; judgmentId: string; chosenOptionIndex: number }  // 临床判断选择题
  | { type: 'UPDATE_TERMINAL'; field: TerminalField | FragmentTargetField; value: string }
  | { type: 'SET_PATIENT_STATUS'; field: 'conscious' | 'breathing'; value: boolean }
  | { type: 'SET_MPDS_DETERMINANT'; determinant: MpdsDeterminant }
  | { type: 'SET_DETERMINANT_SUBCODE'; subcode: number }
  | { type: 'SET_PROTOCOL'; protocolNumber: number }
  | { type: 'SET_TRIAGE'; level: TriageLevel }
  | { type: 'DISPATCH' }
  | { type: 'ANSWER_GUIDANCE'; stepIndex: number; selectedIndex: number }
  | { type: 'COMPLETE_MINIGAME'; stepIndex: number; score: number; passed: boolean }
  | { type: 'END_CALL'; perkChoices?: RoguePerkId[] }
  | { type: 'DISMISS_DEBRIEF' }
  | { type: 'CHOOSE_PERK'; perkId: RoguePerkId }
  | { type: 'TICK' }
  | { type: 'SHOW_ENDING' }
  | { type: 'BACK_TO_TITLE' }
