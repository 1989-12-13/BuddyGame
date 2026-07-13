// ============================================================
// 零点接线台 — 每通电话结算报告弹窗
// ============================================================

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Phone } from 'lucide-react'
import type { DebriefEntry } from '../../game/core/debrief'

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
  good: { label: 'GOOD END', color: '#4ade80', bg: 'rgba(34, 197, 94, 0.12)' },
  normal: { label: 'NORMAL END', color: '#facc15', bg: 'rgba(250, 204, 21, 0.12)' },
  bad: { label: 'BAD END', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)' },
  special: { label: 'SPECIAL END', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
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

  const triageLabel = (t: string | null) => {
    const map: Record<string, string> = { red: '红色（濒危）', yellow: '黄色（危重）', green: '绿色（轻伤）', black: '黑色' }
    return t ? map[t] ?? t : '未选择'
  }

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

        {/* 内部分数仍保留给复盘与平衡 */}
        <div style={styles.totalScore}>
          <span style={styles.totalScoreLabel}>调度评级</span>
          <span style={styles.totalScoreValue}>{debrief.score}</span>
          <span style={styles.totalScoreLabel}>/ 100</span>
        </div>

        {/* 分项得分条 */}
        <div style={styles.breakdownRow}>
          {[
            { label: '派车速度', value: breakdown.speed, max: 40, color: '#00d4ff' },
            { label: '信息完整', value: breakdown.info, max: 30, color: '#22c55e' },
            { label: '分诊准确', value: breakdown.triage, max: 20, color: '#ffb000' },
            { label: '判定码', value: breakdown.decision, max: 5, color: '#a78bfa' },
            { label: '急救指导', value: breakdown.guidance, max: 10, color: '#ff8c00' },
          ].map(item => (
            <div key={item.label} style={styles.breakdownItem}>
              <div style={styles.breakdownLabel}>{item.label}</div>
              <div style={styles.breakdownBarTrack}>
                <div style={{
                  ...styles.breakdownBarFill,
                  width: `${(item.value / item.max) * 100}%`,
                  backgroundColor: item.color,
                }} />
              </div>
              <div style={{ ...styles.breakdownValue, color: item.color }}>
                {item.value}/{item.max}
              </div>
            </div>
          ))}
        </div>

        {breakdown.penalty > 0 && (
          <div style={styles.penaltyRow}>
            判断扣分：<span style={{ color: '#ff5454', fontWeight: 'bold' }}>-{breakdown.penalty}</span>
          </div>
        )}

        <div style={styles.divider} />

        {/* 决策明细 */}
        <div style={styles.detailGrid}>
          <DetailItem
            icon="◷" label="派车时间"
            value={debrief.dispatchTime !== null ? `${debrief.dispatchTime}秒` : '未派车'}
            ok={debrief.withinTimeLimit}
          />
          <DetailItem
            icon="◉" label="地址获取"
            value={LEVEL_LABEL[debrief.addressStatus] ?? debrief.addressStatus}
            ok={debrief.addressStatus === 'full' || debrief.addressStatus === 'partial'}
          />
          <DetailItem icon={<Phone size={12} />} label="联系电话" ok={debrief.hasContact} />
          <DetailItem icon="♥" label="病情信息" ok={debrief.hasCondition} />
          <DetailItem icon="!" label="求助诉求" ok={debrief.hasPurpose} />
          <DetailItem
            icon="◎" label="MPDS 判定"
            value={`${debrief.playerDeterminant ?? '未选择'}（预期 ${debrief.expectedDeterminant ?? '未知'}）`}
            ok={debrief.determinantCorrect}
          />
          <DetailItem
            icon="!" label="分诊等级"
            value={`${triageLabel(debrief.playerTriage)}（正确：${triageLabel(debrief.correctTriage)}）`}
            ok={debrief.triageCorrect}
            partial={!debrief.triageCorrect && debrief.triageDiff <= 1}
          />
          {debrief.guidanceTotal > 0 && (
            <DetailItem
              icon="♥" label="急救指导"
              value={`${debrief.guidanceCorrect}/${debrief.guidanceTotal} 步正确`}
              ok={debrief.guidanceCorrect === debrief.guidanceTotal}
              partial={debrief.guidanceCorrect > 0 && debrief.guidanceCorrect < debrief.guidanceTotal}
            />
          )}
        </div>

        {/* 临床判断明细 */}
        {debrief.judgments.length > 0 && (
          <>
            <div style={styles.sectionTitle}>◆ 临床判断</div>
            <div style={styles.judgmentList}>
              {debrief.judgments.map((j, i) => (
                <div key={i} style={{
                  ...styles.judgmentRow,
                  borderColor: j.isCorrect ? '#22c55e' : '#ff5454',
                }}>
                  <div style={styles.judgmentQuestion}>{j.question}</div>
                  <div style={styles.judgmentChoices}>
                    <span style={{ color: j.isCorrect ? '#22c55e' : '#ff6b6b', fontSize: 12 }}>
                      你的选择：{j.playerChoice}
                    </span>
                    {!j.isCorrect && (
                      <>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>
                          ✓ 正确：{j.correctAnswer}
                        </span>
                        {j.reason && (
                          <div style={{ color: '#ffb000', fontSize: 10, marginTop: 2, fontStyle: 'italic' }}>
                            ℹ {j.reason}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 叙事结局 */}
        <div style={styles.narrativeBox}>
          <div style={styles.narrativeText}>{debrief.outcomeNarrative}</div>
        </div>

        {debrief.reviewPoints.length > 0 && (
          <div style={styles.reviewBox}>
            <div style={styles.sectionTitle}>◆ 关键复盘</div>
            {debrief.reviewPoints.slice(0, 4).map(point => (
              <div key={point} style={styles.reviewPoint}>{point}</div>
            ))}
          </div>
        )}

        <div style={styles.divider} />

        <button ref={btnRef} style={styles.nextBtn} onClick={onNext}>
          {nextLabel} (Enter)
        </button>
      </div>
    </div>
  )
}

function DetailItem({
  icon, label, value, ok, partial,
}: {
  icon: ReactNode; label: string; value?: string; ok: boolean; partial?: boolean
}) {
  const statusIcon = ok ? '✓' : partial ? '⚠' : '✕'
  const statusColor = ok ? '#22c55e' : partial ? '#ffb000' : '#ff5454'
  return (
    <div style={styles.detailItem}>
      <span style={{ fontSize: 13 }}>{statusIcon}</span>
      <span style={styles.detailLabel}>{icon} {label}</span>
      {value && <span style={{ ...styles.detailValue, color: statusColor }}>{value}</span>}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(3px)',
  },
  card: {
    width: 'min(520px, calc(100vw - 24px))',
    maxHeight: '85vh',
    backgroundColor: 'var(--bg-elevated)',
    borderRadius: 10,
    border: '1px solid var(--border)',
    padding: '20px 24px',
    overflowY: 'auto' as const,
    color: 'var(--text-primary)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    textAlign: 'center' as const,
    margin: 0,
  },
  totalScore: {
    textAlign: 'center' as const,
    padding: '4px 0',
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
  },
  totalScoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00d4ff',
    fontFamily: 'monospace',
  },
  totalScoreLabel: {
    fontSize: 16,
    color: 'var(--text-secondary)',
    marginLeft: 4,
  },
  outcomeBox: {
    border: '1px solid',
    borderRadius: 8,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 5,
  },
  outcomeBadge: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.4,
  },
  outcomeTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  patientStatus: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  consequence: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  breakdownRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  breakdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  breakdownLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    minWidth: 56,
    textAlign: 'right' as const,
  },
  breakdownBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'var(--border-light)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.6s ease',
  },
  breakdownValue: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    minWidth: 40,
  },
  penaltyRow: {
    textAlign: 'center' as const,
    fontSize: 12,
    color: '#ff6b6b',
    padding: '2px 0',
  },
  divider: {
    height: 1,
    backgroundColor: 'var(--border-light)',
    margin: '2px 0',
  },
  detailGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    padding: '2px 4px',
  },
  detailLabel: {
    color: 'var(--text-muted)',
    minWidth: 90,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffb000',
    borderBottom: '1px solid var(--border)',
    paddingBottom: 3,
    marginTop: 4,
  },
  judgmentList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  judgmentRow: {
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid',
    backgroundColor: 'var(--bg-input)',
  },
  judgmentQuestion: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    marginBottom: 2,
  },
  judgmentChoices: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 4,
  },
  narrativeBox: {
    marginTop: 4,
    padding: '8px 10px',
    backgroundColor: 'var(--bg-input)',
    borderRadius: 6,
    border: '1px solid var(--border-light)',
  },
  narrativeText: {
    fontSize: 12,
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    fontStyle: 'italic' as const,
  },
  reviewBox: {
    padding: '2px 0 0',
  },
  reviewPoint: {
    fontSize: 12,
    color: 'var(--text-primary)',
    lineHeight: 1.5,
    padding: '3px 0 3px 14px',
  },
  nextBtn: {
    padding: '12px 24px',
    backgroundColor: '#ff3b3b',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'inherit',
    alignSelf: 'center' as const,
  },
}
