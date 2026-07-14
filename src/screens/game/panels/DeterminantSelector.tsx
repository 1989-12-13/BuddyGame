import type { MpdsDeterminant } from '../../../game/types'
import { MPDS_DETERMINANT_INFO } from '../../../game/types'
import { styles } from '../styles'

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
    <div style={{ display: 'flex', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
      {levels.map((l) => {
        const info = MPDS_DETERMINANT_INFO[l.key]
        const isActive = current === l.key
        return (
          <button
            key={l.key}
            title={info.responseCode}
            style={{
              flex: '1 0 auto',
              padding: '4px 6px',
              borderRadius: 4,
              border: `2px solid ${info.color}`,
              backgroundColor: isActive ? info.color : 'transparent',
              color: isActive ? '#fff' : info.color,
              fontSize: 11,
              fontWeight: isActive ? 'bold' : 'normal',
              cursor: 'pointer',
              minWidth: 50,
            }}
            onClick={() => onSelect(l.key)}
          >
            <div style={{ fontWeight: 'bold' }}>{l.label}</div>
            <div style={{ fontSize: 9, opacity: 0.85 }}>{l.desc}</div>
          </button>
        )
      })}
    </div>
  )
}
