import type { CallPhase, CalleeStressLevel } from '../../../game/types'
import { STRESS_INFO } from '../../../game/types'
import { Phone } from 'lucide-react'
import { styles } from '../styles'

/** 阶段文案 */
const PHASE_LABEL: Record<CallPhase, string> = {
  connected: '已接通',
  questioning: '问询中',
  guidance: '急救指导',
  closing: '收尾',
  completed: '已结束',
  ringing: '响铃中',
  dispatching: '派车中',
}

/** 电话面板顶部 — 紧急调度台风格 + 来电者压力指示器
 * v2 重构：移除通话计时（已在 Hud / CallInfoBar 显示，避免三处重复）；
 * 用 lucide 图标代替 · 和 | 等简陋分隔符；阶段 + LIVE + 目标秒数合并为顶部一条。 */
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
  const urgent = elapsed >= 45
  const si = STRESS_INFO[stressLevel]

  return (
    <div style={styles.phoneHeader}>
      {/* 第一行：LIVE 指示器 + 阶段 + 派车目标秒数
          通话计时已在 Hud + CallInfoBar 显示，此处省略以消除冗余。 */}
      <div style={styles.callLiveBar}>
        <span style={styles.liveDot}>●</span>
        <span style={styles.liveLabel}>LIVE</span>
        <span style={{
          padding: '2px 8px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          fontSize: 11,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: 1,
          fontWeight: 700,
        }}>
          {PHASE_LABEL[callPhase]}
        </span>
        <span style={{
          ...styles.targetBadge,
          color: urgent ? 'var(--danger-red)' : 'var(--accent-amber)',
          borderColor: urgent ? 'var(--danger-red)' : 'var(--accent-amber)',
        }}>
          {urgent ? '⚠ 超时' : '目标 60秒派车'}
        </span>
      </div>

      {/* 第二行：来电信息（用 lucide 图标 + 中点分隔，去掉 |） */}
      <div style={styles.phoneHeaderInfo}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Phone size={11} color="var(--text-secondary)" strokeWidth={2.5} />
          {phoneNumber}
        </span>
        <Sep />
        <span>基站 {baseStation}</span>
        <Sep />
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

    </div>
  )
}

/** 列表项间分隔点 — 比 `|` 更轻巧 */
function Sep() {
  return <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>·</span>
}
