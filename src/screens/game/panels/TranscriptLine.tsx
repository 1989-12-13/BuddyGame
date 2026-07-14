import { styles } from '../styles'
import type { CSSProperties } from 'react'

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

  const pillColor = isCaller ? 'var(--danger-red)' : isOperator ? 'var(--accent-blue)' : 'var(--text-muted)'
  const pillBg = isCaller
    ? 'var(--danger-red-bg)'
    : isOperator
      ? 'rgba(59, 130, 246, 0.10)'
      : 'var(--bg-elevated)'

  const pillStyle: CSSProperties = {
    display: 'inline-block',
    padding: '1px 8px',
    marginRight: 8,
    borderRadius: 4,
    background: pillBg,
    color: pillColor,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    letterSpacing: 1,
    lineHeight: 1.5,
    border: `1px solid ${pillColor}33`,
    minWidth: 38,
    textAlign: 'center',
  }

  return (
    <div style={{
      ...styles.transcript,
      animation: `fade-in-up 0.3s ease-out both`,
      animationDelay: `${index * 0.02}s`,
    }}>
      <span style={pillStyle}>{speakerLabel}</span>
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