// ============================================================
// 零点接线台 — HUD 状态栏（暗色调度台主题）
// ============================================================

import type { CSSProperties } from 'react'
import type { WorldState } from '../../game/types'

interface Props {
  state: WorldState
}

/* Inline SVG icons — replace emoji with crisp monochrome glyphs */
const IconClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)
const IconPhone = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)
const IconList = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)
const IconStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)
const IconTruck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)

export function Hud({ state }: Props) {
  const minutes = Math.floor(state.shiftElapsed / 60)
  const seconds = state.shiftElapsed % 60
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const callTime = state.currentCall
    ? state.shiftElapsed - state.callStartTime
    : 0
  const callTimeColor = callTime > 60 ? '#ff3b3b' : callTime > 43 ? '#ffb000' : '#00ff88'

  const isOnCall = state.currentCall !== null
  const availableVehicles = state.fleet.vehicles.filter(v => v.status === 'available').length

  return (
    <div style={styles.container}>
      {/* 左侧：班次计时器 */}
      <div style={styles.group}>
        <span style={iconStyle('#8b949e')}><IconClock /></span>
        <span style={styles.label}>班次</span>
        <span style={styles.value}>{timeStr}</span>
      </div>

      {/* 通话计时 */}
      {isOnCall && (
        <div style={styles.group}>
          <span style={iconStyle(callTimeColor)}><IconPhone /></span>
          <span style={styles.label}>通话</span>
          <span style={{ ...styles.value, color: callTimeColor }}>
            {String(Math.floor(callTime / 60)).padStart(2, '0')}:
            {String(callTime % 60).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* 通话编号 */}
      <div style={styles.group}>
        <span style={iconStyle('#8b949e')}><IconList /></span>
        <span style={styles.label}>通话</span>
        <span style={styles.value}>
          {state.callIndex}/{state.totalCalls}
        </span>
      </div>

      {/* 右侧：累计得分 */}
      <div style={{ ...styles.group, marginLeft: 'auto' }}>
        <span style={iconStyle('#ffb000')}><IconStar /></span>
        <span style={styles.label}>得分</span>
        <span style={{ ...styles.value, color: '#ffb000' }}>{state.totalScore}</span>
      </div>

      {/* 可用救护车 */}
      <div style={styles.group}>
        <span style={iconStyle(availableVehicles > 0 ? '#00ff88' : '#ff3b3b')}><IconTruck /></span>
        <span style={styles.label}>车辆</span>
        <span style={{
          ...styles.value,
          color: availableVehicles > 0 ? '#00ff88' : '#ff3b3b',
        }}>
          {availableVehicles}/{state.fleet.vehicles.length}
        </span>
      </div>

      {/* 救护车 ETA */}
      {state.dispatchSent && state.ambulanceRemaining > 0 && (
        <div style={styles.group}>
          <span style={iconStyle('#ff3b3b')}><IconTruck /></span>
          <span style={{ ...styles.value, color: '#ff3b3b', fontSize: 13 }}>
            ETA {state.ambulanceRemaining}s
          </span>
        </div>
      )}

      {state.dispatchSent && state.ambulanceRemaining === 0 && (
        <div style={styles.group}>
          <span style={iconStyle('#00ff88')}><IconTruck /></span>
          <span style={{ ...styles.value, color: '#00ff88', fontSize: 13 }}>
            已到达
          </span>
        </div>
      )}
    </div>
  )
}

const iconStyle = (color: string): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  color,
})

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '6px 16px',
    backgroundColor: '#11151c',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    minHeight: 36,
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: '#6e7681',
    textTransform: 'uppercase' as const,
    fontWeight: 700,
    letterSpacing: 1,
    fontFamily: 'var(--font-mono)',
  },
  value: {
    fontSize: 14,
    color: '#e6edf3',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    letterSpacing: 0.5,
  },
}
