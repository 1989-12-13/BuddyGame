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
      gap: 'var(--space-4)',
      fontSize: 'var(--fs-caption)',
      fontWeight: 'var(--fw-bold)',
      color: 'var(--text-2)',
      borderBottom: inline ? 'none' : '1px solid var(--line)',
      padding: inline ? 0 : 'var(--space-6) 0 var(--space-4)',
      marginBottom: inline ? 0 : 4,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-6)'}}>{icon} {text}</span>
      {required && (
        <span style={{ color: 'var(--danger)', fontWeight: 'var(--fw-bold)' }}>*</span>
      )}
    </div>
  )
}
