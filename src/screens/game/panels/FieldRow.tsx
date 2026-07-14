import { styles } from '../styles'

/** 单行输入框 */
export function FieldRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={styles.formLabel}>
        {icon} {label}
      </label>
      {children}
    </div>
  )
}
