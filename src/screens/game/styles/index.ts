// ============================================================
// 零点接线台 — 调度主界面样式模块（合并导出）
// 拆分自 styles.ts (798行 → 6个模块 + 索引文件)
// ============================================================

import type { CSSProperties } from 'react'
import * as layout from './layout'
import * as callPanel from './callPanel'
import * as questionArea from './questionArea'
import * as guidance from './guidance'
import * as dispatchCard from './dispatchCard'
import * as perks from './perks'

// ============================================================
// 合并的 styles 对象（向后兼容）
// 各面板组件通过 `import { styles } from '../styles'` 引用
// ============================================================

export const styles: Record<string, CSSProperties> = {
  ...layout,
  ...callPanel,
  ...questionArea,
  ...guidance,
  ...dispatchCard,
  ...perks,
}

// ============================================================
// 全局共享数据（非样式）
// ============================================================

/** 问题层级配色 */
export const TIER_STYLE: Record<string, { border: string; bg: string; badge: string; label: string }> = {
  critical:  { border: 'var(--danger-red)', bg: 'var(--danger-red-bg)', badge: 'var(--danger-red)', label: '◆ 关键' },
  important: { border: 'var(--warning-amber)', bg: 'var(--warning-amber-bg)', badge: 'var(--warning-amber)', label: '◆ 重要' },
  detail:    { border: 'var(--success-green)', bg: 'var(--success-green-bg)', badge: 'var(--success-green)', label: '◆ 细节' },
}

/** 问题分类图标 */
export const CATEGORY_ICON: Record<string, string> = {
  consciousness: '🧠',
  breathing: '🫁',
  bleeding: '🩸',
  pain: '😣',
  age_gender: '○',
  mechanism: '🔧',
}

// --- 模块内具名导出（供 tree-shake 直接引用）---
// layout: container, mainArea, floatCard, splitBar, splitBarHandle, splitBarDot, centerMessage, answerBtn
// callPanel: phonePanel, phoneHeader, callLiveBar, liveDot, liveLabel, callTimer, targetBadge, phoneHeaderInfo, callPhaseTag, dialogueArea, transcript, transcriptSpeaker, transcriptText, streamCursor
// questionArea: questionArea, qSection, qSectionTitle, protocolStepsList, protocolStepRow, protocolStepNum, protocolStepBtn, qBtnSmall, qGrid, qBtn, stressBar, stressTrack, stressFill, bottomToolbar, terminalBtn, calmBtn
// guidance: guidanceOverlay, guidanceWindow, guidanceWindowHeader, guidancePanel, guidanceTitle, guidanceIntro, guidanceStep, guidancePrompt, guidanceOption, closingPanel, closingStatusCard, closingSummaryGrid, closingSummaryItem, closingSummaryLabel, closingSummaryValue, endCallBtn
// dispatchCard: modalOverlay, modalCard, modalHeader, modalHeaderLeft, modalHeaderRight, mpdsModalBadge, modalCloseBtn, modalBody, modalFooter, modalDispatchBtn, modalDispatchBtnDisabled, modalSaveBtn, modalEndCallBtn, modalWarning, terminalForm, dispatchSent, formField, formLabel, formInput
// perks: perkScreen, perkHeader, perkTitle, perkSubtitle, perkGrid, perkCard, perkCategory, perkName, perkDesc, perkEffect
