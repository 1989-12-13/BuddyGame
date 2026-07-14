import { TIER_STYLE, styles } from '../styles'

/** 问询按钮 — 带层级颜色 + 时间代价徽章 */
export function AskBtnEx({
  label,
  icon,
  timeCost,
  done,
  disabled,
  tier,
  onClick,
}: {
  id: string
  label: string
  icon?: React.ReactNode
  timeCost: number
  done: boolean
  disabled?: boolean
  tier?: string
  onClick: () => void
}) {
  const ts = tier ? TIER_STYLE[tier] : undefined
  return (
    <button
      style={{
        ...styles.qBtn,
        backgroundColor: done ? 'var(--success-green-bg)' : disabled ? 'var(--bg-surface)' : (ts?.bg ?? 'var(--bg-elevated)'),
        borderColor: done ? 'var(--accent-green)' : disabled ? 'var(--border)' : (ts?.border ?? 'var(--accent-blue)'),
        color: done ? 'var(--accent-green)' : disabled ? 'var(--border-bright)' : '#b1bac4',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled && !done ? 0.45 : 1,
        position: 'relative',
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
        {done ? <span>✓ </span> : icon ? <span style={{ marginRight: 2, display: 'flex' }}>{icon}</span> : null}
        <span style={{ fontWeight: done ? 'normal' : 'bold', fontSize: 11 }}>{label}</span>
      </div>
      {!done && (
        <span style={{
          position: 'absolute',
          top: -5,
          right: -5,
          backgroundColor: ts?.badge ?? 'var(--accent-blue)',
          color: 'var(--bg)',
          fontSize: 9,
          fontWeight: 900,
          padding: '1px 5px',
          borderRadius: 10,
          fontFamily: 'monospace',
        }}>
          {timeCost}s
        </span>
      )}

    </button>
  )
}
