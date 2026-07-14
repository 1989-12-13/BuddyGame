import type { CSSProperties, ReactNode } from 'react'
import { styles } from './CallDebrief.styles'

interface Props {
  breakdown: { speed: number; info: number; triage: number; decision: number; guidance: number; penalty: number }
}

const BARS = [
  { label: '派车速度', key: 'speed', max: 40, color: '#00d4ff' },
  { label: '信息完整', key: 'info', max: 30, color: '#22c55e' },
  { label: '分诊准确', key: 'triage', max: 20, color: '#ffb000' },
  { label: '判定码', key: 'decision', max: 5, color: '#a78bfa' },
  { label: '急救指导', key: 'guidance', max: 10, color: '#ff8c00' },
] as const

export function ScoreBreakdown({ breakdown }: Props) {
  return (
    <div style={styles.breakdownRow}>
      {BARS.map(({ label, key, max, color }) => (
        <div key={label} style={styles.breakdownItem}>
          <div style={styles.breakdownLabel}>{label}</div>
          <div style={styles.breakdownBarTrack}>
            <div style={{
              ...styles.breakdownBarFill,
              width: `${(breakdown[key] / max) * 100}%`,
              backgroundColor: color,
            } as CSSProperties} />
          </div>
          <div style={{ ...styles.breakdownValue, color } as CSSProperties}>
            {breakdown[key]}/{max}
          </div>
        </div>
      ))}
    </div>
  )
}

/** 单项详情行（通用） */
export function DetailItem({
  icon, label, value, ok, partial,
}: {
  icon: ReactNode; label: string; value?: string; ok: boolean; partial?: boolean
}) {
  const statusIcon = ok ? '✓' : partial ? '⚠' : '✕'
  const statusColor = ok ? '#16a34a' : partial ? '#d97706' : '#ef4444'
  return (
    <div style={styles.detailItem}>
      <span style={{ fontSize: 13 }}>{statusIcon}</span>
      <span style={styles.detailLabel}>{icon} {label}</span>
      {value && <span style={{ ...styles.detailValue, color: statusColor } as CSSProperties}>{value}</span>}
    </div>
  )
}
