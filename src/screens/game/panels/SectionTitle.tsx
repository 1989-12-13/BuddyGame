/** 小标题 */
export function SectionTitle({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{
      fontSize: 12,
      fontWeight: 'bold',
      color: 'var(--text-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '6px 0 3px',
      marginBottom: 4,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    }}>
      {icon} {text}
    </div>
  )
}
