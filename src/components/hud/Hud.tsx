// ============================================================
// 零点接线台 — HUD 状态栏
// ============================================================

import type { WorldState } from '../../game/types'

interface Props {
  state: WorldState
}

export function Hud({ state }: Props) {
  const minutes = Math.floor(state.shiftElapsed / 60)
  const seconds = state.shiftElapsed % 60
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const callTime = state.currentCall
    ? state.shiftElapsed - state.callStartTime
    : 0
  const callTimeColor = callTime > 60 ? '#dc2626' : callTime > 43 ? '#d97706' : '#16a34a'

  const isOnCall = state.currentCall !== null

  return (
    <div style={styles.container}>
      {/* 左侧：计时器 */}
      <div style={styles.group}>
        <span style={styles.icon}>⏱</span>
        <span style={styles.label}>班次</span>
        <span style={styles.value}>{timeStr}</span>
      </div>

      {/* 通话计时 */}
      {isOnCall && (
        <div style={styles.group}>
          <span style={styles.icon}>📞</span>
          <span style={styles.label}>通话</span>
          <span style={{ ...styles.value, color: callTimeColor }}>
            {String(Math.floor(callTime / 60)).padStart(2, '0')}:
            {String(callTime % 60).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* 中间：通话编号 */}
      <div style={styles.group}>
        <span style={styles.icon}>📋</span>
        <span style={styles.label}>通话</span>
        <span style={styles.value}>
          {state.callIndex}/{state.totalCalls}
        </span>
      </div>

      {/* 右侧：累计得分 */}
      <div style={{ ...styles.group, marginLeft: 'auto' }}>
        <span style={styles.icon}>⭐</span>
        <span style={styles.label}>得分</span>
        <span style={{ ...styles.value, color: '#ca8a04' }}>{state.totalScore}</span>
      </div>

      {/* 救护车状态 */}
      {state.dispatchSent && state.ambulanceRemaining > 0 && (
        <div style={styles.group}>
          <span style={styles.icon}>🚑</span>
          <span style={{ ...styles.value, color: '#dc2626', fontSize: 14 }}>
            ETA {state.ambulanceRemaining}s
          </span>
        </div>
      )}

      {state.dispatchSent && state.ambulanceRemaining === 0 && (
        <div style={styles.group}>
          <span style={styles.icon}>🚑</span>
          <span style={{ ...styles.value, color: '#22c55e', fontSize: 14 }}>
            已到达
          </span>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '6px 16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    flexShrink: 0,
    minHeight: 36,
  },
  group: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 13,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 15,
    color: '#334155',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
}
