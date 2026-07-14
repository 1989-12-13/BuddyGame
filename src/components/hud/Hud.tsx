// ============================================================
// 零点接线台 — HUD 状态栏（暗色调度台主题 + Lucide Icons）
// v3 重构：去掉"班次"计时器（与"通话"语义冗余，玩家易混淆；
//         班次进度改由"通话编号"1/5 体现）；
//         将原 CallInfoBar 的"体征""情绪"并入本栏（同一图标风格）；
//         体征/情绪仅在通话中显示，无 currentCall 时自动隐藏。
// ============================================================

import type { CSSProperties } from 'react'
import { Phone, List, Star, Truck, HeartPulse, Brain } from 'lucide-react'
import type { WorldState } from '../../game/types'
import { STRESS_INFO } from '../../game/types'
import { C_DANGER, C_WARNING, C_SUCCESS, VITAL_SIGN_COLORS } from '../../game/core/colors'
import { ThemeToggle } from '../ThemeToggle'

interface Props {
  state: WorldState
}

const SIZE = 14

function iconEl(color: string) {
  return { display: 'flex', alignItems: 'center', color }
}

export function Hud({ state }: Props) {
  // 通话计时：唯一计时器（与派车目标 45/60 秒比较）
  // 阈值与 dispatchTiming.getDispatchTimingState 对齐
  const callTime = state.currentCall
    ? state.shiftElapsed - state.callStartTime
    : 0
  const callTimeColor = callTime > 60 ? C_DANGER : callTime >= 45 ? C_WARNING : C_SUCCESS

  const isOnCall = state.currentCall !== null
  const availableVehicles = state.fleet.vehicles.filter(v => v.status === 'available').length

  // 体征（仅通话中）
  const ps = state.patientStatus
  const vitalsColor = ps
    ? (VITAL_SIGN_COLORS[ps.vitalSign] ?? (ps.stability < 30 ? C_DANGER : ps.stability < 60 ? C_WARNING : C_SUCCESS))
    : 'var(--text-secondary)'

  // 情绪（仅通话中）
  const cs = state.callerState
  const stressInfo = cs ? STRESS_INFO[cs.stressLevel] : null

  return (
    <div style={styles.container}>
      {/* 通话计时 — 唯一计时器 */}
      {isOnCall && (
        <div style={styles.group}>
          <span style={iconEl(callTimeColor)}><Phone size={SIZE} strokeWidth={2.5} /></span>
          <span style={styles.label}>通话</span>
          <span style={{ ...styles.value, color: callTimeColor }}>
            {String(Math.floor(callTime / 60)).padStart(2, '0')}:
            {String(callTime % 60).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* 通话编号 — 体现班次进度（替代原"班次"计时器） */}
      <div style={styles.group}>
        <span style={iconEl('var(--text-secondary)')}><List size={SIZE} strokeWidth={2.5} /></span>
        <span style={styles.label}>通话</span>
        <span style={styles.value}>
          {state.callIndex + 1}/{state.totalCalls}
        </span>
      </div>

      {/* 体征 — 从 CallInfoBar 迁移；仅在通话中显示 */}
      {ps && (
        <div style={styles.group} title={`生命体征 ${Math.round(ps.stability)}%`}>
          <span style={iconEl(vitalsColor)}><HeartPulse size={SIZE} strokeWidth={2.5} /></span>
          <span style={styles.label}>体征</span>
          <span style={{ ...styles.value, color: vitalsColor }}>
            {Math.round(ps.stability)}%
          </span>
        </div>
      )}

      {/* 情绪 — 从 CallInfoBar 迁移；仅在通话中显示 */}
      {stressInfo && (
        <div style={styles.group} title={`来电者情绪：${cs?.stressLevel}`}>
          <span style={iconEl(stressInfo.color)}><Brain size={SIZE} strokeWidth={2.5} /></span>
          <span style={styles.label}>情绪</span>
          <span style={{ ...styles.value, color: stressInfo.color }}>
            {stressInfo.label}
          </span>
        </div>
      )}

      {/* 右侧：累计得分 */}
      <div style={{ ...styles.group, marginLeft: 'auto' }}>
        <span style={iconEl('var(--accent-amber)')}><Star size={SIZE} strokeWidth={2.5} /></span>
        <span style={styles.label}>得分</span>
        <span style={{ ...styles.value, color: 'var(--accent-amber)' }}>{state.totalScore}</span>
      </div>

      {/* 可用救护车 */}
      <div style={styles.group}>
        <span style={iconEl(availableVehicles > 0 ? 'var(--accent-green)' : 'var(--danger-red)')}>
          <Truck size={SIZE} strokeWidth={2.5} />
        </span>
        <span style={styles.label}>车辆</span>
        <span style={{
          ...styles.value,
          color: availableVehicles > 0 ? 'var(--accent-green)' : 'var(--danger-red)',
        }}>
          {availableVehicles}/{state.fleet.vehicles.length}
        </span>
      </div>

      {/* 救护车 ETA */}
      {state.dispatchSent && state.ambulanceRemaining > 0 && (
        <div style={styles.group}>
          <span style={iconEl('var(--danger-red)')}><Truck size={SIZE} strokeWidth={2.5} /></span>
          <span style={{ ...styles.value, color: 'var(--danger-red)', fontSize: 13 }}>
            ETA {state.ambulanceRemaining}s
          </span>
        </div>
      )}

      {state.dispatchSent && state.ambulanceRemaining === 0 && (
        <div style={styles.group}>
          <span style={iconEl('var(--accent-green)')}><Truck size={SIZE} strokeWidth={2.5} /></span>
          <span style={{ ...styles.value, color: 'var(--accent-green)', fontSize: 13 }}>
            已到达
          </span>
        </div>
      )}

      <ThemeToggle />
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '6px 16px',
    backgroundColor: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
    WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)',
    borderBottom: '1px solid var(--glass-border)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    flexShrink: 0,
    minHeight: 36,
    position: 'relative',
    zIndex: 50,
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    fontWeight: 700,
    letterSpacing: 1,
    fontFamily: 'var(--font-mono)',
  },
  value: {
    fontSize: 14,
    color: 'var(--text-primary)',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    letterSpacing: 0.5,
  },
}
