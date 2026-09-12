// ============================================================
// 120调度台 — 班次评估/结局画面（暗色调度台主题 + 通话卡片）
// 结构：评级徽章 → 标题 → 总分 → 接警记录 → 结局文案 → 重新值班
// ============================================================

import { formatPlayTime } from '../game/core/pacing'
import { useEffect } from 'react'
import type { EndingDef } from '../game/types'
import type { ShiftSummary } from '../game/core/shift'
import { Activity, RotateCcw, Trophy, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useAudio } from '../audio/AudioContext'
import {
  styles,
  badgeStyle,
  scoreBoxStyle,
  scoreValueStyle,
  savedSummaryStyle,
  callCardStyle,
  callCardScoreStyle,
  callCardStatusStyle,
  callCardBarFillStyle,
  ecgLineStyle,
  SOLID_THRESHOLD,
} from './EndingScreen.styles'

interface Props {
  ending: EndingDef
  totalScore: number
  activeSeconds?: number
  callScores?: number[]
  /** 并发值班专有：未接来电、同一事故的交叉核实结论 */
  shiftDetail?: ShiftSummary
  onRestart: () => void
}

export function EndingScreen({ ending, totalScore, callScores, activeSeconds = 0, shiftDetail, onRestart }: Props) {
  const audio = useAudio()

  useEffect(() => {
    audio.play('success')
  }, [audio])

  const handleRestart = () => {
    audio.play('confirm')
    onRestart()
  }

  const calls = callScores ?? []
  const solidCount = calls.filter(s => s >= SOLID_THRESHOLD).length
  const totalCalls = calls.length || 5
  const maxScore = totalCalls * 100
  const averageScore = totalScore / totalCalls

  const rating = averageScore >= 70 ? 'gold' : averageScore >= 50 ? 'silver' : averageScore >= 30 ? 'bronze' : 'fail'

  const reviewedIncidents = shiftDetail?.incidents.filter(item => item.resolution) ?? []
  /** 逐通卡片上的场景名：前段是已完成的通话，后段是未接来电 */
  const cardLabel = (index: number): string | null => {
    if (!shiftDetail) return null
    if (index < shiftDetail.calls.length) return shiftDetail.calls[index].title
    const missed = shiftDetail.missed[index - shiftDetail.calls.length]
    return missed ? `未接 · ${missed.title}` : null
  }

  return (
    <div style={styles.container}>
      <div style={ecgLineStyle(rating)} />

      <div style={styles.content}>
        <div style={styles.badgeWrap}>
          <div style={badgeStyle(rating)}>
            {rating !== 'fail' ? <Trophy size={14} /> : <Activity size={14} />}{ending.badge}
          </div>
        </div>

        <h1 style={styles.title}>{ending.title}</h1>
        <p style={styles.subtitle}>{ending.subtitle}</p>

        <div style={scoreBoxStyle(rating)}>
          <span style={styles.scoreLabel}>操作评价</span>
          <span style={scoreValueStyle(rating)}>{totalScore}</span>
          <span style={styles.scoreMax}>/ {maxScore}</span>
        </div>

        {calls.length > 0 && (
          <div style={styles.callsPanel}>
            <div style={styles.callsHeader}>
              <span style={styles.callsHeaderText}>今晚接警记录</span>
              <span style={savedSummaryStyle(solidCount, totalCalls)}>稳健处理 {solidCount} / {totalCalls} 通</span>
            </div>
            <div style={styles.cardsGrid}>
              {calls.map((score, i) => {
                const saved = score >= SOLID_THRESHOLD
                return (
                  <div key={i} style={callCardStyle(saved)} className="animate-card-reveal">
                    <div style={styles.callCardNum}>{String(i + 1).padStart(2, '0')}</div>
                    <div style={styles.callCardInfo}>
                      {cardLabel(i) && <div style={cardLabelStyle}>{cardLabel(i)}</div>}
                      <div style={callCardScoreStyle(saved)}>
                        {score}
                        <span style={styles.callCardMax}>/100</span>
                      </div>
                      <div style={callCardStatusStyle(saved)}>
                        {saved ? <><ShieldCheck size={10} style={{ marginRight: 'var(--space-1)', verticalAlign: 'text-bottom' }} />操作稳健</> : <><ShieldAlert size={10} style={{ marginRight: 'var(--space-1)', verticalAlign: 'text-bottom' }} />建议复盘</>}
                      </div>
                    </div>
                    <div style={styles.callCardBar}>
                      <div style={callCardBarFillStyle(saved, score)} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {shiftDetail && (shiftDetail.missed.length > 0 || reviewedIncidents.length > 0) && (
          <div style={styles.callsPanel}>
            <div style={styles.callsHeader}>
              <span style={styles.callsHeaderText}>跨线路回顾</span>
              {shiftDetail.missed.length > 0 && (
                <span style={missedSummaryStyle}>漏接 {shiftDetail.missed.length} 通</span>
              )}
            </div>

            <p style={shiftNarrativeStyle}>{shiftDetail.narrative}</p>

            {shiftDetail.missed.length > 0 && (
              <div style={chipRowStyle}>
                {shiftDetail.missed.map((item, index) => (
                  <span key={`missed-${item.scenarioId}-${index}`} style={missedChipStyle}>未接 · {item.title}</span>
                ))}
              </div>
            )}

            {reviewedIncidents.map((item, index) => (
              <div key={`incident-${item.scenarioId}-${index}`} style={incidentRowStyle}>
                <span style={incidentTitleStyle}>{item.title}</span>
                <span style={resolutionChipStyle(item.resolution === 'adopt')}>
                  {item.resolution === 'adopt' ? '第二位来电者 · 采纳最新观察' : '第二位来电者 · 维持初报'}
                </span>
              </div>
            ))}
          </div>
        )}

        <p style={styles.description}>{ending.description}</p>
        <p style={styles.footnote}>本班次有效体验 {formatPlayTime(activeSeconds)} · 不含暂停与复盘</p>

        <button style={styles.restartBtn} onClick={handleRestart}>
          <RotateCcw size={14} style={{ marginRight: 'var(--space-4)', verticalAlign: 'text-bottom' }} />重新值班
        </button>
      </div>
    </div>
  )
}

// ---------- 并发值班 · 跨线路回顾（颜色/间距/字号均取设计令牌） ----------

const shiftNarrativeStyle = {
  fontSize: 'var(--fs-body-sm)', lineHeight: 1.7, color: 'var(--text-2)',
  margin: 'var(--space-8) 0 0',
} as const

const missedSummaryStyle = {
  fontSize: 'var(--fs-caption)', color: 'var(--danger)',
} as const

const chipRowStyle = {
  display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', marginTop: 'var(--space-10)',
} as const

const missedChipStyle = {
  padding: 'var(--space-2) var(--space-8)', borderRadius: 'var(--radius-full)',
  border: '1px solid var(--danger-line)', background: 'var(--danger-bg)',
  color: 'var(--danger)', fontSize: 'var(--fs-micro)',
} as const

const incidentRowStyle = {
  display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
  gap: 'var(--space-8)', marginTop: 'var(--space-8)',
  padding: 'var(--space-8) var(--space-10)',
  border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-raised)',
} as const

const incidentTitleStyle = {
  fontSize: 'var(--fs-small)', color: 'var(--text)',
} as const

const resolutionChipStyle = (adopted: boolean) => ({
  padding: 'var(--space-2) var(--space-8)', borderRadius: 'var(--radius-full)',
  border: `1px solid ${adopted ? 'var(--success-line)' : 'var(--warning-line)'}`,
  background: adopted ? 'var(--success-bg)' : 'var(--warning-bg)',
  color: adopted ? 'var(--success)' : 'var(--warning)',
  fontSize: 'var(--fs-micro)',
})

const cardLabelStyle = {
  fontSize: 'var(--fs-micro)', color: 'var(--text-3)', marginBottom: 'var(--space-2)',
} as const
