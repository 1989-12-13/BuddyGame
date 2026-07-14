// ============================================================
// 零点接线台 — 每通电话结算报告弹窗
// 子组件拆分：ScoreBreakdown / DetailItem → shared.tsx
//           JudgmentSection / NarrativeBox / ReviewPoints → sections.tsx
// 样式拆分：CallDebrief.styles.ts
// ============================================================

import { useEffect, useRef } from 'react'
import { Phone } from 'lucide-react'
import type { DebriefEntry } from '../../game/core/debrief'
import { C_SUCCESS, C_AMBER, C_DANGER, C_INFO } from '../../game/core/colors'
import { styles } from './CallDebrief.styles'
import { ScoreBreakdown, DetailItem } from './CallDebrief.shared'
import { JudgmentSection, NarrativeBox, ReviewPoints } from './CallDebrief.sections'

interface Props {
  debrief: DebriefEntry
  onNext: () => void
  nextLabel?: string
}

const LEVEL_LABEL: Record<string, string> = {
  full: '完整地址',
  partial: '部分地址',
  vague: '模糊定位',
  none: '未获取',
}

const OUTCOME_STYLE: Record<DebriefEntry['outcomeTier'], { label: string; color: string; bg: string }> = {
  good: { label: 'GOOD END', color: C_SUCCESS, bg: 'var(--success-green-bg)' },
  normal: { label: 'NORMAL END', color: C_AMBER, bg: 'var(--warning-amber-bg)' },
  bad: { label: 'BAD END', color: C_DANGER, bg: 'var(--danger-red-bg)' },
  special: { label: 'SPECIAL END', color: C_INFO, bg: 'var(--info-cyan-bg)' },
}

function triageLabel(t: string | null) {
  const map: Record<string, string> = { red: '红色（濒危）', yellow: '黄色（危重）', green: '绿色（轻伤）', black: '黑色' }
  return t ? map[t] ?? t : '未选择'
}

export function CallDebrief({ debrief, onNext, nextLabel = '继续' }: Props) {
  const breakdown = debrief.breakdown
  const btnRef = useRef<HTMLButtonElement>(null)
  const outcomeStyle = OUTCOME_STYLE[debrief.outcomeTier]

  useEffect(() => {
    btnRef.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNext])

  return (
    <div style={styles.overlay}>
      <div style={styles.card} role="dialog" aria-modal="true" aria-label="通话结算报告">
        <h2 style={styles.header}>
          {debrief.isPrank ? '◈ 恶作剧电话' : `◈ ${debrief.scenarioTitle}`}
        </h2>

        <div style={{ ...styles.outcomeBox, backgroundColor: outcomeStyle.bg, borderColor: outcomeStyle.color }}>
          <div style={{ ...styles.outcomeBadge, color: outcomeStyle.color }}>{outcomeStyle.label}</div>
          <div style={styles.outcomeTitle}>{debrief.outcomeTitle}</div>
          <div style={styles.patientStatus}>{debrief.patientStatus}</div>
          <div style={styles.consequence}>{debrief.consequence}</div>
        </div>

        <div style={styles.totalScore}>
          <span style={styles.totalScoreLabel}>调度评级</span>
          <span style={styles.totalScoreValue}>{debrief.score}</span>
          <span style={styles.totalScoreLabel}>/ 100</span>
        </div>

        <ScoreBreakdown breakdown={breakdown} />

        {breakdown.penalty > 0 && (
          <div style={styles.penaltyRow}>
            判断扣分：<span style={{ color: C_DANGER, fontWeight: 'bold' }}>-{breakdown.penalty}</span>
          </div>
        )}

        <div style={styles.divider} />

        <div style={styles.detailGrid}>
          <DetailItem icon="◷" label="派车时间" value={debrief.dispatchTime !== null ? `${debrief.dispatchTime}秒` : '未派车'} ok={debrief.withinTimeLimit} />
          <DetailItem icon="◉" label="地址获取" value={LEVEL_LABEL[debrief.addressStatus] ?? debrief.addressStatus} ok={debrief.addressStatus === 'full' || debrief.addressStatus === 'partial'} />
          <DetailItem icon={<Phone size={12} />} label="联系电话" ok={debrief.hasContact} />
          <DetailItem icon="♥" label="病情信息" ok={debrief.hasCondition} />
          <DetailItem icon="!" label="求助诉求" ok={debrief.hasPurpose} />
          <DetailItem icon="◎" label="MPDS 判定" value={`${debrief.playerDeterminant ?? '未选择'}（预期 ${debrief.expectedDeterminant ?? '未知'}）`} ok={debrief.determinantCorrect} />
          <DetailItem icon="!" label="分诊等级" value={`${triageLabel(debrief.playerTriage)}（正确：${triageLabel(debrief.correctTriage)}）`} ok={debrief.triageCorrect} partial={!debrief.triageCorrect && debrief.triageDiff <= 1} />
          {debrief.guidanceTotal > 0 && (
            <DetailItem icon="♥" label="急救指导" value={`${debrief.guidanceCorrect}/${debrief.guidanceTotal} 步正确`} ok={debrief.guidanceCorrect === debrief.guidanceTotal} partial={debrief.guidanceCorrect > 0 && debrief.guidanceCorrect < debrief.guidanceTotal} />
          )}
        </div>

        <JudgmentSection judgments={debrief.judgments} />
        <NarrativeBox text={debrief.outcomeNarrative} />
        <ReviewPoints points={debrief.reviewPoints} />

        <div style={styles.divider} />

        <button ref={btnRef} style={styles.nextBtn} onClick={onNext}>
          {nextLabel} (Enter)
        </button>
      </div>
    </div>
  )
}
