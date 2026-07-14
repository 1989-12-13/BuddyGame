// ============================================================
// VitalSignsBar — 患者实时生命体征条（即时反馈层）
// stability 0-100 + vitalSign 4 档 + 心电节律指示
// ============================================================

import { Activity, HeartPulse, HeartCrack } from 'lucide-react'
import type { PatientStatus, VitalSign } from '../../game/types'
import { vitalSignLabel } from '../../game/core/worldState'
import { VITAL_SIGN_COLORS } from '../../game/core/colors'
import { VITAL_STABLE_THRESHOLD, VITAL_WARNING_THRESHOLD, VITAL_CRITICAL_THRESHOLD } from '../../game/core/constants'

interface Props {
  status: PatientStatus
}

const SIGN_COLOR: Record<VitalSign, string> = VITAL_SIGN_COLORS as Record<VitalSign, string>

export function VitalSignsBar({ status }: Props) {
  const color = SIGN_COLOR[status.vitalSign]
  const dead = status.died || status.stability <= 0
  const Icon = dead ? HeartCrack : status.vitalSign === 'critical' ? HeartPulse : Activity

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 12px',
      backgroundColor: dead ? 'var(--danger-red-bg)' : 'var(--bg-elevated)',
      borderBottom: `2px solid ${color}`,
      fontSize: 12,
      fontFamily: 'monospace',
    }}>
      <Icon size={14} color={color} />
      <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold', letterSpacing: 1 }}>患者体征</span>

      {/* 生命条 */}
      <div style={{
        flex: 1,
        height: 8,
        backgroundColor: 'var(--border)',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          width: `${Math.max(0, status.stability)}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'width 0.3s linear, background-color 0.3s',
          boxShadow: `0 0 6px ${color}80`,
        }} />
        {/* 档位刻度 */}
        {[VITAL_CRITICAL_THRESHOLD, VITAL_WARNING_THRESHOLD, VITAL_STABLE_THRESHOLD].map(t => (
          <div key={t} style={{
            position: 'absolute',
            left: `${t}%`,
            top: 0, bottom: 0,
            width: 1,
            backgroundColor: 'rgba(255,255,255,0.6)',
          }} />
        ))}
      </div>

      <span style={{ color, fontWeight: 900, minWidth: 38, textAlign: 'right' }}>
        {Math.round(status.stability)}%
      </span>
      <span style={{
        color,
        fontWeight: 'bold',
        padding: '2px 8px',
        borderRadius: 3,
        backgroundColor: `${color}15`,
        border: `1px solid ${color}40`,
        minWidth: 56,
        textAlign: 'center' as const,
      }}>
        {dead ? '已死亡' : vitalSignLabel(status.vitalSign)}
      </span>
    </div>
  )
}
