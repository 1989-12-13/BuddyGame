import { styles } from './CallDebrief.styles'

interface Props {
  judgments: Array<{
    question: string
    isCorrect: boolean
    playerChoice: string | null
    correctAnswer: string
    reason?: string
  }>
}

export function JudgmentSection({ judgments }: Props) {
  if (judgments.length === 0) return null
  return (
    <>
      <div style={styles.sectionTitle}>◆ 临床判断</div>
      <div style={styles.judgmentList}>
        {judgments.map((j, i) => (
          <div key={i} style={{
            ...styles.judgmentRow,
            borderColor: j.isCorrect ? 'var(--success-green)' : 'var(--danger-red)',
          }}>
            <div style={styles.judgmentQuestion}>{j.question}</div>
            <div style={styles.judgmentChoices}>
              <span style={{ color: j.isCorrect ? 'var(--success-green)' : 'var(--danger-red)', fontSize: 12 }}>
                你的选择：{j.playerChoice ?? '未作答'}
              </span>
              {!j.isCorrect && (
                <>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>
                    ✓ 正确：{j.correctAnswer}
                  </span>
                  {j.reason && (
                    <div style={{ color: 'var(--warning-amber)', fontSize: 10, marginTop: 2, fontStyle: 'italic' }}>
                      ℹ {j.reason}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export function NarrativeBox({ text }: { text: string }) {
  return (
    <div style={styles.narrativeBox}>
      <div style={styles.narrativeText}>{text}</div>
    </div>
  )
}

export function ReviewPoints({ points }: { points: string[] }) {
  if (points.length === 0) return null
  return (
    <div style={styles.reviewBox}>
      <div style={styles.sectionTitle}>◆ 关键复盘</div>
      {points.slice(0, 4).map(point => (
        <div key={point} style={styles.reviewPoint}>{point}</div>
      ))}
    </div>
  )
}
