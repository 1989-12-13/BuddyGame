import type { CalleeStressLevel } from '../../../game/types'
import { styles } from '../styles'

/** 电话面板顶部 — LIVE 指示器 + 通话计时 + 超时警告 */
export function PhoneHeader({
  elapsed,
  stressLevel,
}: {
  phoneNumber: string
  baseStation: string
  callerName: string
  relationship: string
  callPhase: string
  elapsed: number
  stressLevel: CalleeStressLevel
  stress: number
}) {
  const mm = Math.floor(elapsed / 60)
  const ss = elapsed % 60
  const urgent = elapsed >= 45

  return (
    <div style={styles.phoneHeader}>
      {/* 第一行：LIVE指示器 + 通话计时 */}
      <div style={styles.callLiveBar}>
        <span style={styles.liveDot}>●</span>
        <span style={styles.liveLabel}>LIVE</span>
        <span style={{
          ...styles.callTimer,
          color: urgent ? 'var(--danger-red)' : 'var(--accent-amber)',
          fontWeight: urgent ? 'var(--fw-black)' : 'var(--fw-bold)',
        }}>
          通话 {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
        </span>
        <span style={{
          ...styles.targetBadge,
          color: urgent ? 'var(--danger-red)' : 'var(--accent-amber)',
          borderColor: urgent ? 'var(--danger-red)' : 'var(--accent-amber)',
        }}>
          {urgent ? '⚠ 超时' : '目标 60秒派车'}
        </span>
      </div>

      {/* 来电者情绪失控警告 */}
      {stressLevel === '失控' && (
        <div style={styles.callPhaseTag}>
          <span style={{ color: 'var(--danger-red)' }}>来电者情绪失控</span>
        </div>
      )}
    </div>
  )
}
