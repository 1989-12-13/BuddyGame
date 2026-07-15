// ============================================================
// 120调度台 — 班次评估/结局画面（暗色调度台主题 + 通话卡片）
// ============================================================

import { useEffect } from 'react'
import type { EndingDef } from '../game/types'
import { RotateCcw, Trophy, ShieldCheck, ShieldAlert, Skull } from 'lucide-react'
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
  SAVE_THRESHOLD,
} from './EndingScreen.styles'

interface Props {
  ending: EndingDef
  totalScore: number
  callScores?: number[]
  onRestart: () => void
}

export function EndingScreen({ ending, totalScore, callScores, onRestart }: Props) {
  const audio = useAudio()

  useEffect(() => {
    audio.play('success')
  }, [audio])

  const handleRestart = () => {
    audio.play('confirm')
    onRestart()
  }

  const calls = callScores ?? []
  const savedCount = calls.filter(s => s >= SAVE_THRESHOLD).length
  const totalCalls = calls.length || 5

  const rating = totalScore >= 350 ? 'gold' : totalScore >= 250 ? 'silver' : totalScore >= 150 ? 'bronze' : 'fail'

  return (
    <div style={styles.container}>
      <div style={ecgLineStyle(rating)} />

      <div style={styles.content}>
        {/* Rating badge */}
        <div style={styles.badgeWrap}>
          <div style={badgeStyle(rating)}>
            {rating === 'gold' && <><Trophy size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />金牌调度员</>}
            {rating === 'silver' && <><Trophy size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />银牌调度员</>}
            {rating === 'bronze' && <><Trophy size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />铜牌调度员</>}
            {rating === 'fail' && <><Skull size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />需要复训</>}
          </div>
        </div>

        {/* Title */}
        <h1 style={styles.title}>{ending.title}</h1>
        <p style={styles.subtitle}>{ending.subtitle}</p>

        <div style={styles.divider} />

        {/* Total score */}
        <div style={scoreBoxStyle(rating)}>
          <span style={styles.scoreLabel}>班次总分</span>
          <span style={scoreValueStyle(rating)}>{totalScore}</span>
          <span style={styles.scoreMax}>/ 500</span>
        </div>

        {/* Per-call cards */}
        {calls.length > 0 && (
          <>
            <div style={styles.divider} />
            <div style={styles.callsHeader}>
              <span style={styles.callsHeaderText}>今晚接警记录</span>
              <span style={savedSummaryStyle(savedCount, totalCalls)}>
                救回 {savedCount} / {totalCalls} 人
              </span>
            </div>
            <div style={styles.cardsGrid}>
              {calls.map((score, i) => {
                const saved = score >= SAVE_THRESHOLD
                return (
                  <div key={i} style={callCardStyle(saved)} className="animate-card-reveal">
                    <div style={styles.callCardNum}>{String(i + 1).padStart(2, '0')}</div>
                    <div style={styles.callCardInfo}>
                      <div style={callCardScoreStyle(saved)}>
                        {score}
                        <span style={styles.callCardMax}>/100</span>
                      </div>
                      <div style={callCardStatusStyle(saved)}>
                        {saved ? <><ShieldCheck size={10} style={{ marginRight: 1, verticalAlign: 'text-bottom' }} />救回</> : <><ShieldAlert size={10} style={{ marginRight: 1, verticalAlign: 'text-bottom' }} />错失</>}
                      </div>
                    </div>
                    <div style={styles.callCardBar}>
                      <div style={callCardBarFillStyle(saved, score)} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div style={styles.divider} />

        {/* Description / outcome narrative */}
        <p style={styles.description}>{ending.description}</p>

        <div style={styles.divider} />

        {/* Restart */}
        <button style={styles.restartBtn} onClick={handleRestart}>
          <RotateCcw size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />重新值班
        </button>
      </div>
    </div>
  )
}
