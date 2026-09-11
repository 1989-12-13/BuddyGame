// ============================================================
// 120调度台 — 班次评估/结局画面（暗色调度台主题 + 通话卡片）
// 结构：评级徽章 → 标题 → 总分 → 接警记录 → 结局文案 → 重新值班
// ============================================================

import { formatPlayTime } from '../game/core/pacing'
import { useEffect } from 'react'
import type { EndingDef } from '../game/types'
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
  onRestart: () => void
}

export function EndingScreen({ ending, totalScore, callScores, activeSeconds = 0, onRestart }: Props) {
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

        <p style={styles.description}>{ending.description}</p>
        <p style={styles.footnote}>本班次有效体验 {formatPlayTime(activeSeconds)} · 不含暂停与复盘</p>

        <button style={styles.restartBtn} onClick={handleRestart}>
          <RotateCcw size={14} style={{ marginRight: 'var(--space-4)', verticalAlign: 'text-bottom' }} />重新值班
        </button>
      </div>
    </div>
  )
}
