import { styles } from '../styles'
import { CheckCircle2 } from 'lucide-react'

/** 生命体征切换器 — 带信息质量标记 */
export function StatusToggle({
  ariaLabel,
  label,
  field,
  value,
  trueLabel,
  falseLabel,
  colorTrue,
  colorFalse,
  onToggle,
}: {
  ariaLabel?: string
  /** 可选标签 — 不传则由外部包装层渲染 */
  label?: string
  field: 'conscious' | 'breathing'
  value: boolean | null
  trueLabel: string
  falseLabel: string
  colorTrue: string
  colorFalse: string
  onToggle: (field: 'conscious' | 'breathing', val: boolean) => void
}) {
  return (
    <div role="group" aria-label={ariaLabel} style={{ marginBottom: 6 }}>
      {label && <div style={styles.formLabel}>{label}</div>}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          aria-pressed={value === true}
          style={{
            flex: 1,
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${value === true ? colorTrue : 'var(--line)'}`,
            backgroundColor: value === true ? 'var(--success-bg)' : 'var(--bg-surface)',
            color: value === true ? colorTrue : 'var(--text-2)',
            fontSize: 'var(--fs-caption)',
            cursor: 'pointer',
            fontWeight: value === true ? 'var(--fw-bold)' : 'var(--fw-normal)',
          }}
          onClick={() => onToggle(field, true)}
        >
          {trueLabel}
          {value === true && <CheckCircle2 size={15} />}
        </button>
        <button
          aria-pressed={value === false}
          style={{
            flex: 1,
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${value === false ? colorFalse : 'var(--line)'}`,
            backgroundColor: value === false ? 'var(--danger-bg)' : 'var(--bg-surface)',
            color: value === false ? colorFalse : 'var(--text-2)',
            fontSize: 'var(--fs-caption)',
            cursor: 'pointer',
            fontWeight: value === false ? 'var(--fw-bold)' : 'var(--fw-normal)',
          }}
          onClick={() => onToggle(field, false)}
        >
          {falseLabel}
          {value === false && <CheckCircle2 size={15} />}
        </button>
      </div>
    </div>
  )
}
