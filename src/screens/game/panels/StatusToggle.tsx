import { styles } from '../styles'

/** 生命体征切换器 — 带信息质量标记 */
export function StatusToggle({
  label,
  field,
  value,
  trueLabel,
  falseLabel,
  colorTrue,
  colorFalse,
  onToggle,
}: {
  label: string
  field: 'conscious' | 'breathing'
  value: boolean | null
  trueLabel: string
  falseLabel: string
  colorTrue: string
  colorFalse: string
  onToggle: (field: 'conscious' | 'breathing', val: boolean) => void
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={styles.formLabel}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          style={{
            flex: 1,
            padding: '4px 8px',
            borderRadius: 4,
            border: `1px solid ${colorTrue}`,
            backgroundColor: value === true ? colorTrue : 'transparent',
            color: value === true ? '#fff' : colorTrue,
            fontSize: 'var(--fs-caption)',
            cursor: 'pointer',
            fontWeight: value === true ? 'var(--fw-bold)' : 'var(--fw-normal)',
          }}
          onClick={() => onToggle(field, true)}
        >
          {trueLabel}
        </button>
        <button
          style={{
            flex: 1,
            padding: '4px 8px',
            borderRadius: 4,
            border: `1px solid ${colorFalse}`,
            backgroundColor: value === false ? colorFalse : 'transparent',
            color: value === false ? '#fff' : colorFalse,
            fontSize: 'var(--fs-caption)',
            cursor: 'pointer',
            fontWeight: value === false ? 'var(--fw-bold)' : 'var(--fw-normal)',
          }}
          onClick={() => onToggle(field, false)}
        >
          {falseLabel}
        </button>
      </div>
    </div>
  )
}
