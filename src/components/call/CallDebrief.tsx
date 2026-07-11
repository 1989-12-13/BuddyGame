// ============================================================
// 零点接线台 — 每通电话结算报告弹窗
// ============================================================

import { useEffect, useRef } from 'react'
import type { DebriefEntry } from '../../game/core/debrief'
import { parseScoreBreakdown } from '../../game/core/debrief'
import type { WorldState } from '../../game/types'

interface Props {
  state: WorldState
  debrief: DebriefEntry
  onNext: () => void
}

const LEVEL_LABEL: Record<string, string> = {
  full: '完整地址',
  partial: '部分地址',
  vague: '模糊定位',
  none: '未获取',
}

export function CallDebrief({ state, debrief, onNext }: Props) {
  const breakdown = parseScoreBreakdown(state)
  const btnRef = useRef<HTMLButtonElement>(null)

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
          {debrief.isPrank ? '📞 恶作剧电话' : `📞 ${debrief.scenarioTitle}`}
        </h2>

        {/* 总分 */}
        <div style={styles.totalScore}>
          <span style={styles.totalScoreValue}>{debrief.score}</span>
          <span style={styles.totalScoreLabel}>/ 100</span>
        </div>

        {/* 分项得分条 */}
        <div style={styles.breakdownRow}>
          {[
            { label: '派车速度', value: breakdown.speed, max: 40, color: '#38bdf8' },
            { label: '信息完整', value: breakdown.info, max: 30, color: '#4ade80' },
            { label: '分诊准确', value: breakdown.triage, max: 20, color: '#facc15' },
            { label: '急救指导', value: breakdown.guidance, max: 10, color: '#f97316' },
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
            判断扣分：<span style={{ color: '#ef4444', fontWeight: 'bold' }}>-{breakdown.penalty}</span>
          </div>
        )}

        <div style={styles.divider} />

        {/* 决策明细 */}
        <div style={styles.detailGrid}>
          <DetailItem
            icon="⏱" label="派车时间"
            value={debrief.dispatchTime !== null ? `${debrief.dispatchTime}秒` : '未派车'}
            ok={debrief.withinTimeLimit}
          />
          <DetailItem
            icon="📍" label="地址获取"
            value={LEVEL_LABEL[debrief.addressStatus] ?? debrief.addressStatus}
            ok={debrief.addressStatus === 'full' || debrief.addressStatus === 'partial'}
          />
          <DetailItem icon="📞" label="联系电话" ok={debrief.hasContact} />
          <DetailItem icon="🩺" label="病情信息" ok={debrief.hasCondition} />
          <DetailItem icon="🆘" label="求助诉求" ok={debrief.hasPurpose} />
          <DetailItem
            icon="🎯" label="MPDS 判定"
            value={`${debrief.playerDeterminant ?? '未选择'}（预期 ${debrief.expectedDeterminant ?? '未知'}）`}
            ok={debrief.determinantCorrect}
          />
          <DetailItem
            icon="🚨" label="分诊等级"
            value={`${triageLabel(debrief.playerTriage)}（正确：${triageLabel(debrief.correctTriage)}）`}
            ok={debrief.triageCorrect}
            partial={!debrief.triageCorrect && debrief.triageDiff <= 1}
          />
          {debrief.guidanceTotal > 0 && (
            <DetailItem
              icon="🩺" label="急救指导"
              value={`${debrief.guidanceCorrect}/${debrief.guidanceTotal} 步正确`}
              ok={debrief.guidanceCorrect === debrief.guidanceTotal}
              partial={debrief.guidanceCorrect > 0 && debrief.guidanceCorrect < debrief.guidanceTotal}
            />
          )}
        </div>

        {/* 临床判断明细 */}
        {debrief.judgments.length > 0 && (
          <>
            <div style={styles.sectionTitle}>🔍 临床判断</div>
            <div style={styles.judgmentList}>
              {debrief.judgments.map((j, i) => (
                <div key={i} style={{
                  ...styles.judgmentRow,
                  borderColor: j.isCorrect ? '#27ae60' : '#ef4444',
                }}>
                  <div style={styles.judgmentQuestion}>{j.question}</div>
                  <div style={styles.judgmentChoices}>
                    <span style={{ color: j.isCorrect ? '#4ade80' : '#f87171', fontSize: 12 }}>
                      你的选择：{j.playerChoice}
                    </span>
                    {!j.isCorrect && (
                      <>
                        <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 8 }}>
                          ✓ 正确：{j.correctAnswer}
                        </span>
                        {j.reason && (
                          <div style={{ color: '#facc15', fontSize: 10, marginTop: 2, fontStyle: 'italic' }}>
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

        <div style={styles.divider} />

        <button ref={btnRef} style={styles.nextBtn} onClick={onNext}>
          接听下一通电话 (Enter)
        </button>
      </div>
    </div>
  )
}

function DetailItem({
  icon, label, value, ok, partial,
}: {
  icon: string; label: string; value?: string; ok: boolean; partial?: boolean
}) {
  const statusIcon = ok ? '✅' : partial ? '⚠️' : '❌'
  const statusColor = ok ? '#4ade80' : partial ? '#facc15' : '#ef4444'
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
    backgroundColor: '#0f172a',
    borderRadius: 10,
    border: '1px solid #334155',
    padding: '20px 24px',
    overflowY: 'auto' as const,
    color: '#e2e8f0',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    textAlign: 'center' as const,
    margin: 0,
  },
  totalScore: {
    textAlign: 'center' as const,
    padding: '8px 0',
  },
  totalScoreValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#38bdf8',
    fontFamily: 'monospace',
  },
  totalScoreLabel: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 4,
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
    color: '#94a3b8',
    minWidth: 56,
    textAlign: 'right' as const,
  },
  breakdownBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#1e293b',
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
    color: '#f87171',
    padding: '2px 0',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
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
    color: '#94a3b8',
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
    color: '#fbbf24',
    borderBottom: '1px solid #334155',
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
    backgroundColor: '#0b1320',
  },
  judgmentQuestion: {
    fontSize: 11,
    color: '#cbd5e1',
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
    backgroundColor: '#0a1628',
    borderRadius: 6,
    border: '1px solid #1e293b',
  },
  narrativeText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 1.6,
    fontStyle: 'italic' as const,
  },
  nextBtn: {
    padding: '12px 24px',
    backgroundColor: '#dc2626',
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
