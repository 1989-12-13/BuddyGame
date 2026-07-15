/** 小标题 */
export function SectionTitle({
  icon,
  text,
  required = false,
  inline = false,
}: {
  icon: React.ReactNode
  text: string
  /** 必填标记（在标题右侧显示红色 *） */
  required?: boolean
  /** 行内模式 — 去掉下边框与上下 margin，可与其它元素并排 */
  inline?: boolean
}) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 'var(--fs-caption)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--text-secondary)',
      borderBottom: inline ? 'none' : '1px solid var(--border)',
      padding: inline ? 0 : '6px 0 3px',
      marginBottom: inline ? 0 : 4,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    }}>
      <span>{icon} {text}</span>
      {required && (
        <span style={{ color: 'var(--danger-red)', fontWeight: 'var(--fw-bold)' }}>*</span>
      )}
    </div>
  )
}
