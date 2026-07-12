// ============================================================
// 零点接线台 — Game Actions
// ============================================================

import type { TriageLevel, MpdsDeterminant, FragmentTargetField } from '../types'

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
  | { type: 'SELECT_VEHICLE'; vehicleId: string }                 // 玩家在派车 UI 中选定车辆
  | { type: 'DISPATCH'; vehicleId?: string }                      // 派车；可选指定车辆，否则用 selectedVehicleId 或自动选最快
  | { type: 'ANSWER_GUIDANCE'; stepIndex: number; selectedIndex: number }
  | { type: 'COMPLETE_MINIGAME'; stepIndex: number; score: number; passed: boolean }
  | { type: 'DISMISS_PATIENT_EVENT'; eventId: string }            // 关闭一个顶部 toast
  | { type: 'END_CALL' }
  | { type: 'TICK' }
  | { type: 'SHOW_ENDING' }
  | { type: 'BACK_TO_TITLE' }
