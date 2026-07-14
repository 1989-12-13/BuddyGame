import { styles } from '../styles'

/** 通话逐字稿 — 单列时序记录，支持流式逐字输出 */
export function TranscriptLine({
  line,
  index,
  displayText,
  showCursor,
}: {
  line: { speaker: string; text: string }
  index: number
  displayText?: string
  showCursor?: boolean
}) {
  const isCaller = line.speaker === 'caller'
  const isOperator = line.speaker === 'operator'
  const speakerLabel = isCaller ? '来电者' : isOperator ? '接线员' : '系统'
  const text = displayText ?? line.text

  return (
    <div style={{
      ...styles.transcript,
      animation: `fade-in-up 0.3s ease-out both`,
      animationDelay: `${index * 0.02}s`,
    }}>
      <span style={{
        ...styles.transcriptSpeaker,
        color: isCaller ? '#dc2626' : isOperator ? '#0ea5e9' : 'var(--text-muted)',
      }}>
        [{speakerLabel}]
      </span>
      <span style={{
        ...styles.transcriptText,
        color: isCaller ? '#ff6b6b' : '#b1bac4',
        fontWeight: isCaller ? 700 : 500,
      }}>
        {text}
        {showCursor && (
          <span style={styles.streamCursor}>▌</span>
        )}
      </span>
    </div>
  )
}
