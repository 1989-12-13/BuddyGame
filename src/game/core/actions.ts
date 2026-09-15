// ============================================================
// 120调度台 — Game Actions
// ============================================================

import type { TriageLevel, MpdsDeterminant, FragmentTargetField, EmergencyScenario } from '../types'
import type { RoguePerkId } from './perks'
import type { RoutePlan } from './routing'

export type TerminalField = 'address' | 'contact' | 'chiefComplaint' | 'patientAge' | 'patientGender' | 'conditionNote'

export type GameAction =
  | { type: 'PAUSE'; reason: import('./session').PauseReason }
  | { type: 'RESUME'; reason?: import('./session').PauseReason }
  | { type: 'CARE_CHECK'; callInstanceId: number; checkId: string; selectedIndex: number }
  | { type: 'START_SHIFT'; forceScenarios?: string[] }
  /** scenario 用于交叉核实通话：直接注入派生场景，绕过场景队列 */
  | { type: 'ANSWER_CALL'; scenario?: EmergencyScenario }
  | {
      type: 'ASK_QUESTION'
      questionId: string
      /** 对话回合：玩家实际说出口的那句话（覆盖默认措辞） */
      spokenLine?: string
      /** 对话回合：措辞带来的额外情绪影响（正=加压，负=安抚） */
      stressDelta?: number
      /** 对话回合：措辞带来的额外耗时（秒，可为负） */
      extraTime?: number
    }
  | { type: 'CALM_CALLER' }                                          // 安抚来电者情绪
  | { type: 'MAKE_JUDGMENT'; judgmentId: string; chosenOptionIndex: number }  // 临床判断选择题
  | { type: 'UPDATE_TERMINAL'; field: TerminalField | FragmentTargetField; value: string }
  | { type: 'SET_PATIENT_STATUS'; field: 'conscious' | 'breathing'; value: boolean }
  | { type: 'SET_MPDS_DETERMINANT'; determinant: MpdsDeterminant }
  | { type: 'SET_DETERMINANT_SUBCODE'; subcode: number }
  | { type: 'SET_PROTOCOL'; protocolNumber: number | null }
  | { type: 'SET_TRIAGE'; level: TriageLevel }
  | { type: 'DISPATCH'; callInstanceId?: number; vehicleId: string; route: RoutePlan }   // 系统车辆 + 玩家逐节点确认的完整路线
  | { type: 'SUBMIT_HANDOFF'; callInstanceId: number; factIds: string[] }
  | { type: 'ANSWER_GUIDANCE'; callInstanceId?: number; stepIndex: number; selectedIndex: number }
  | { type: 'CONTINUE_GUIDANCE'; callInstanceId: number; stepIndex: number }
  | { type: 'COMPLETE_MINIGAME'; callInstanceId?: number; stepIndex: number; score: number; passed: boolean }
  | { type: 'END_CALL'; perkChoices?: RoguePerkId[] }
  | { type: 'DISMISS_DEBRIEF' }
  | { type: 'CHOOSE_PERK'; perkId: RoguePerkId }
  | { type: 'DISMISS_PATIENT_EVENT'; eventId: string }            // 关闭一个顶部 toast
  | { type: 'DISMISS_RESCUE_NOTIFICATION'; notificationId: string }
  /** 字幕已完整播出到某一行：记进世界状态，切线路重挂载后不再重播这一段 */
  | { type: 'MARK_LINES_STREAMED'; throughIndex: number }
  | { type: 'TICK' }
  | { type: 'SHOW_ENDING' }
  | { type: 'BACK_TO_TITLE' }
