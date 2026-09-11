import type { MpdsDeterminant } from '../../../game/types'
import { MPDS_DETERMINANT_INFO } from '../../../game/types'

/** MPDS 判定码选择器 — Echo/Delta/Charlie/Bravo/Alpha */
export function DeterminantSelector({
  current,
  onSelect,
}: {
  current: MpdsDeterminant | null
  onSelect: (d: MpdsDeterminant) => void
}) {
  const levels: { key: MpdsDeterminant; label: string; desc: string }[] = [
    { key: 'ECHO', label: 'E-ECHO', desc: '即刻生命威胁' },
    { key: 'DELTA', label: 'D-DELTA', desc: '高危/潜在致命' },
    { key: 'CHARLIE', label: 'C-CHARLIE', desc: '中危/需ALS' },
    { key: 'BRAVO', label: 'B-BRAVO', desc: '低中危/BLS' },
    { key: 'ALPHA', label: 'A-ALPHA', desc: '低危/转运' },
  ]

  return (
    <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
      {levels.map((l) => {
        const info = MPDS_DETERMINANT_INFO[l.key]
        const isActive = current === l.key
        const color = l.key === 'ECHO' || l.key === 'DELTA' ? 'var(--danger)' : l.key === 'CHARLIE' ? 'var(--warning)' : 'var(--success)'
        return (
          <button
            key={l.key}
            title={info.responseCode}
            aria-pressed={isActive}
            style={{
              flex: '1 0 auto',
              padding: 'var(--space-4) var(--space-6)',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${isActive ? color : 'var(--line)'}`,
              backgroundColor: isActive ? `color-mix(in srgb, ${color} 9%, var(--bg-surface))` : 'var(--bg-surface)',
              color: isActive ? color : 'var(--text-2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              fontSize: 'var(--fs-small)',
              fontWeight: isActive ? 'var(--fw-bold)' : 'var(--fw-normal)',
              cursor: 'pointer',
              minWidth: 50,
            }}
            onClick={() => onSelect(l.key)}
          >
            <div style={{ fontWeight: 'var(--fw-bold)' }}>{l.label}</div>
            <div style={{ fontSize: 'var(--fs-micro)', opacity: 0.85 }}>{l.desc}</div>
          </button>
        )
      })}
    </div>
  )
}
