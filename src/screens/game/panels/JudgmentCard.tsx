import type { JudgmentPrompt } from '../../../game/types'
import { styles } from '../styles'

/** 临床判断卡 — 来电者叙述完后，玩家从中做出专业推理 */
export function JudgmentCard({
  judgment,
  onSelect,
}: {
  judgment: JudgmentPrompt
  onSelect: (optionIndex: number) => void
}) {
  const isResolved = judgment.chosenOptionIndex !== null

  return (
    <div style={{
      ...styles.judgmentCard,
      borderColor: isResolved ? 'var(--border-bright)' : '#d97706',
    }}>
      <div style={styles.judgmentHeader}>
        <span style={styles.judgmentIcon}>◆</span>
        <span style={styles.judgmentQuestion}>{judgment.question}</span>
        {isResolved && (
          <span style={{
            color: judgment.options[judgment.chosenOptionIndex!].isCorrect ? '#16a34a' : '#dc2626',
            fontSize: 10,
            fontWeight: 'bold',
            marginLeft: 'auto',
          }}>
            {judgment.options[judgment.chosenOptionIndex!].isCorrect ? '✓ 正确' : '✕ 需复核'}
          </span>
        )}
      </div>
      <div style={styles.judgmentOptions}>
        {judgment.options.map((opt, idx) => {
          const isChosen = judgment.chosenOptionIndex === idx
          const isCorrectReveal = isResolved && opt.isCorrect
          let bgColor = 'var(--bg-surface)'
          let borderColor = 'var(--border)'
          if (isResolved) {
            if (isChosen) {
              bgColor = opt.isCorrect ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)'
              borderColor = opt.isCorrect ? '#16a34a' : '#dc2626'
            } else if (isCorrectReveal) {
              bgColor = 'rgba(22, 163, 74, 0.12)'
              borderColor = '#16a34a'
            }
          }

          return (
            <button
              key={idx}
              style={{
                ...styles.judgmentOption,
                backgroundColor: bgColor,
                borderColor,
                cursor: isResolved ? 'default' : 'pointer',
                opacity: isResolved && !isChosen && !isCorrectReveal ? 0.4 : 1,
              }}
              onClick={() => !isResolved && onSelect(idx)}
              disabled={isResolved}
            >
              <span style={styles.judgmentOptionMarker}>
                {String.fromCharCode(65 + idx)}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: isChosen ? 'bold' : 'normal',
                  color: isChosen
                    ? (opt.isCorrect && isResolved ? '#16a34a' : isResolved ? '#dc2626' : '#d97706')
                    : '#b1bac4',
                }}>
                  {opt.label}
                </div>
                {opt.sublabel && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                    {opt.sublabel}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
