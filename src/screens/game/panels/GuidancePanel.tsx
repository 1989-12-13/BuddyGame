import type { FirstAidGuidance } from '../../../game/types'
import { MiniGameHost } from '../../../components/minigames/MiniGameHost'
import { styles } from '../styles'

/** 急救指导面板 */
export function GuidancePanel({
  guidance,
  stepIndex,
  results,
  onAnswer,
  onCompleteMiniGame,
  paused,
}: {
  guidance: FirstAidGuidance
  stepIndex: number
  results: ('correct' | 'incorrect' | null)[]
  onAnswer: (stepIdx: number, selectedIdx: number) => void
  onCompleteMiniGame: (stepIdx: number, score: number, passed: boolean) => void
  /** 折叠/遮罩时暂停 minigame */
  paused?: boolean
}) {
  if (stepIndex >= guidance.steps.length) return null

  const currentStep = guidance.steps[stepIndex]
  const previousResults = results.slice(0, stepIndex)

  // 互动小游戏步骤：渲染实操环节
  if (currentStep.miniGame) {
    return (
      <div style={styles.guidancePanel}>
        <div style={styles.guidanceTitle}>🚑 {guidance.title}</div>
        {stepIndex === 0 && <p style={styles.guidanceIntro}>{guidance.intro}</p>}
        {previousResults.map((r, i) => (
          <div
            key={i}
            style={{
              padding: '6px 10px',
              margin: '3px 0',
              backgroundColor: r === 'correct' ? 'var(--success-green-bg)' : 'var(--danger-red-bg)',
              borderRadius: 6,
              fontSize: 13,
              color: r === 'correct' ? 'var(--success-green)' : 'var(--danger-red)',
              borderLeft: `2px solid ${r === 'correct' ? 'var(--success-green)' : 'var(--danger-red)'}`,
            }}
          >
            {r === 'correct' ? '✓' : '✕'} 步骤{i + 1}：{guidance.steps[i].prompt}
          </div>
        ))}
        <p style={styles.guidancePrompt}>步骤{stepIndex + 1}：{currentStep.prompt}</p>
        <MiniGameHost
          spec={currentStep.miniGame}
          onComplete={(score, passed) => onCompleteMiniGame(stepIndex, score, passed)}
          paused={paused}
        />
      </div>
    )
  }

  return (
    <div style={styles.guidancePanel}>
      <div style={styles.guidanceTitle}>🚑 {guidance.title}</div>
      {stepIndex === 0 && (
        <p style={styles.guidanceIntro}>{guidance.intro}</p>
      )}

      {/* 已完成步骤 */}
      {previousResults.map((r, i) => (
        <div
          key={i}
          style={{
            padding: '6px 10px',
            margin: '3px 0',
            backgroundColor: r === 'correct' ? 'var(--success-green-bg)' : 'var(--danger-red-bg)',
            borderRadius: 6,
            fontSize: 13,
            color: r === 'correct' ? 'var(--success-green)' : 'var(--danger-red)',
            borderLeft: `2px solid ${r === 'correct' ? 'var(--success-green)' : 'var(--danger-red)'}`,
          }}
        >
          {r === 'correct' ? '✓' : '✕'} 步骤{i + 1}：{guidance.steps[i].prompt}
        </div>
      ))}

      {/* 当前步骤 */}
      <div style={styles.guidanceStep}>
        <p style={styles.guidancePrompt}>
          步骤{stepIndex + 1}：{currentStep.prompt}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {currentStep.options.map((opt, i) => (
            <button
              key={i}
              style={styles.guidanceOption}
              onClick={() => onAnswer(stepIndex, i)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'var(--bg-elevated)' }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
