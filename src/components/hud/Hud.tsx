// ============================================================
// 零点接线台 — HUD 状态栏（暗色调度台主题 + Lucide Icons）
// ============================================================

import type { CSSProperties } from 'react'
import { Clock, Phone, List, Star, Truck } from 'lucide-react'
import type { WorldState } from '../../game/types'
import { C_DANGER, C_WARNING, C_SUCCESS } from '../../game/core/colors'
import { ThemeToggle } from '../ThemeToggle'

interface Props {
  state: WorldState
}

const SIZE = 14

function iconEl(color: string) {
  return { display: 'flex', alignItems: 'center', color }
}

export function Hud({ state }: Props) {
  const minutes = Math.floor(state.shiftElapsed / 60)
  const seconds = state.shiftElapsed % 60
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const callTime = state.currentCall
    ? state.shiftElapsed - state.callStartTime
    : 0
  const callTimeColor = callTime > 60 ? C_DANGER : callTime > 43 ? C_WARNING : C_SUCCESS

  const isOnCall = state.currentCall !== null
  const availableVehicles = state.fleet.vehicles.filter(v => v.status === 'available').length

  return (
    <div style={styles.container}>
      {/* 左侧：班次计时器 */}
      <div style={styles.group}>
        <span style={iconEl('var(--text-secondary)')}><Clock size={SIZE} strokeWidth={2.5} /></span>
        <span style={styles.label}>班次</span>
        <span style={styles.value}>{timeStr}</span>
      </div>

      {/* 通话计时 */}
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

      {/* 通话编号 */}
      <div style={styles.group}>
        <span style={iconEl('var(--text-secondary)')}><List size={SIZE} strokeWidth={2.5} /></span>
        <span style={styles.label}>通话</span>
        <span style={styles.value}>
          {state.callIndex}/{state.totalCalls}
        </span>
      </div>

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
