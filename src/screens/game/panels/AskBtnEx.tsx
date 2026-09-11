import { TIER_STYLE, styles } from '../styles'

/** 问询按钮 — 带层级颜色 + 时间代价徽章 */
export function AskBtnEx({
  label,
  icon,
  done,
  disabled,
  tier,
  onClick,
}: {
  id: string
  label: string
  icon?: React.ReactNode
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
        backgroundColor: done ? 'var(--success-bg)' : disabled ? 'var(--bg-surface)' : (ts?.bg ?? 'var(--bg-raised)'),
        borderColor: done ? 'var(--success)' : disabled ? 'var(--line)' : (ts?.border ?? 'var(--accent)'),
        color: done ? 'var(--success)' : disabled ? 'var(--line-strong)' : 'var(--text-2)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled && !done ? 0.45 : 1,
        position: 'relative',
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', justifyContent: 'center' }}>
        {done ? <span>✓ </span> : icon ? <span style={{ marginRight: 'var(--space-2)', display: 'flex' }}>{icon}</span> : null}
        <span style={{ fontWeight: done ? 'var(--fw-normal)' : 'var(--fw-bold)', fontSize: 'var(--fs-small)' }}>{label}</span>
      </div>
    </button>
  )
}
