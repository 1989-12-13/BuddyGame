import { ArrowRight, HeartPulse } from 'lucide-react'
import type { DebriefEntry } from '../../game/core/debrief'
import { DIMENSION_KEYS } from '../../game/core/evaluation'

interface Props {
  debrief: DebriefEntry
  onNext: () => void
  nextLabel?: string
}

export function CallDebrief({ debrief, onNext, nextLabel = '继续' }: Props) {
  return (
    <section style={styles.card} aria-label="通话五维复盘">
      <header style={styles.header}>
        <div style={styles.grade}>{debrief.overallGrade}</div>
        <div>
          <div style={styles.eyebrow}>{debrief.outcomeLabel}</div>
          <h2 style={styles.title}>{debrief.profile.title}</h2>
          <p style={styles.subtitle}>{debrief.scenarioTitle}</p>
        </div>
      </header>

      <p style={styles.narrative}><HeartPulse size={18} />{debrief.arrivalNarrative}</p>

      <div style={styles.dimensions}>
        {DIMENSION_KEYS.map(key => {
          const item = debrief.dimensions[key]
          return <div key={key} style={styles.dimension}><span>{item.label}</span><strong>{item.grade === 'NA' ? '—' : item.grade}</strong></div>
        })}
      </div>

      <p style={styles.description}>{debrief.profile.description}</p>
      {debrief.reviewPoints.length > 0 && <ul style={styles.list}>{debrief.reviewPoints.map(point => <li key={point}>{point}</li>)}</ul>}
      <button style={styles.button} onClick={onNext}>{nextLabel}<ArrowRight size={16} /></button>
    </section>
  )
}

const styles = {
  card: { display: 'grid', gap: 16, padding: 24, color: 'var(--text)' },
  header: { display: 'flex', gap: 16, alignItems: 'center' },
  grade: { width: 64, height: 64, borderRadius: '50%', border: '1px solid var(--accent)', display: 'grid', placeItems: 'center', color: 'var(--accent)', fontSize: 36, fontWeight: 800 },
  eyebrow: { color: 'var(--success)', fontSize: 12, letterSpacing: 1 },
  title: { margin: 0, fontSize: 22 },
  subtitle: { margin: 0, color: 'var(--text-3)' },
  narrative: { display: 'flex', gap: 10, alignItems: 'flex-start', lineHeight: 1.8, color: 'var(--text-2)' },
  dimensions: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 },
  dimension: { display: 'grid', gap: 4, justifyItems: 'center', padding: 10, borderRadius: 8, background: 'var(--bg-raised)', fontSize: 12 },
  description: { color: 'var(--text-2)' },
  list: { margin: 0, paddingLeft: 22, color: 'var(--text-2)' },
  button: { justifySelf: 'end', display: 'inline-flex', gap: 8, alignItems: 'center', padding: '10px 18px' },
} as const
