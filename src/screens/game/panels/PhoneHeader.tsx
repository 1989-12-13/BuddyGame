import type { CallPhase, CalleeStressLevel } from '../../../game/types'
import { STRESS_INFO } from '../../../game/types'
import { styles } from '../styles'

/** 电话面板顶部 — 紧急调度台风格 + 来电者压力指示器 */
export function PhoneHeader({
  phoneNumber,
  baseStation,
  callerName,
  relationship,
  callPhase,
  elapsed,
  stressLevel,
  stress,
}: {
  phoneNumber: string
  baseStation: string
  callerName: string
  relationship: string
  callPhase: CallPhase
  elapsed: number
  stressLevel: CalleeStressLevel
  stress: number
}) {
  const mm = Math.floor(elapsed / 60)
  const ss = elapsed % 60
  const urgent = elapsed >= 45
  const si = STRESS_INFO[stressLevel]

  return (
    <div style={styles.phoneHeader}>
      {/* 第一行：LIVE指示器 + 通话计时 */}
      <div style={styles.callLiveBar}>
        <span style={styles.liveDot}>●</span>
        <span style={styles.liveLabel}>LIVE</span>
        <span style={{
          ...styles.callTimer,
          color: urgent ? '#ef4444' : '#d97706',
          fontWeight: urgent ? 900 : 700,
        }}>
          通话 {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
        </span>
        <span style={{
          ...styles.targetBadge,
          color: urgent ? '#ef4444' : '#d97706',
          borderColor: urgent ? '#ef4444' : '#d97706',
        }}>
          {urgent ? '⚠ 超时' : '目标 60秒派车'}
        </span>
      </div>

      {/* 第二行：来电信息 + 问询耗时 */}
      <div style={styles.phoneHeaderInfo}>
        <span>{phoneNumber}</span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span>基站 {baseStation}</span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span>{callerName}（{relationship}）</span>
      </div>

      {/* 第三行：来电者压力指示器 */}
      <div style={styles.stressBar}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 40 }}>
          {si.emoji} {si.label}
        </span>
        <div style={styles.stressTrack}>
          <div style={{
            ...styles.stressFill,
            width: `${stress}%`,
            backgroundColor: si.color,
          }} />
        </div>
        <span style={{ fontSize: 10, color: si.color, minWidth: 28, textAlign: 'right', fontFamily: 'monospace' }}>
          {stress}%
        </span>
      </div>

      {/* 第四行：阶段指示 */}
      <div style={styles.callPhaseTag}>
        {callPhase === 'questioning' && '问询中'}
        {callPhase === 'guidance' && '急救指导'}
        {callPhase === 'closing' && '收尾'}
        {callPhase === 'connected' && '已接通'}
        {stressLevel === '失控' && <span style={{ color: '#dc2626', marginLeft: 8 }}>来电者情绪失控</span>}
      </div>
    </div>
  )
}
