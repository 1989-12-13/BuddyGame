import { useMemo } from 'react'
import type { FirstAidGuidance } from '../../../game/types'
import { MiniGameHost } from '../../../components/minigames/MiniGameHost'
import { styles } from '../styles'
import { createShuffleMap } from '../../../utils/shuffleUtils'

/** 急救指导面板 */
export function GuidancePanel({
  guidance,
  stepIndex,
  results,
  onAnswer,
  onCompleteMiniGame,
  paused,
  disabled = false,
}: {
  guidance: FirstAidGuidance
  stepIndex: number
  results: ('correct' | 'incorrect' | null)[]
  onAnswer: (stepIdx: number, selectedIdx: number) => void
  onCompleteMiniGame: (stepIdx: number, score: number, passed: boolean) => void
  /** 折叠/遮罩时暂停 minigame */
  paused?: boolean
  /** 流式输出进行中，禁止操作 */
  disabled?: boolean
}) {
  if (stepIndex >= guidance.steps.length) return null

  const currentStep = guidance.steps[stepIndex]
  const previousResults = results.slice(0, stepIndex)

  // 打乱当前步骤的选项顺序，防止玩家通过位置记忆作答
  const shuffleMap = useMemo(
    () => createShuffleMap(currentStep.options.length),
    [currentStep.id],
  )
  const displayOptions = shuffleMap.toOriginal.map(i => currentStep.options[i])

  /** 步骤历史记录渲染（两分支共用） */
  const renderStepHistory = () => previousResults.map((r, i) => (
    <div
      key={i}
      style={{
        padding: '6px 10px',
        margin: '3px 0',
        backgroundColor: r === 'correct' ? 'var(--success-green-bg)' : 'var(--danger-red-bg)',
        borderRadius: 6,
        fontSize: 'var(--fs-body-sm)',
        color: r === 'correct' ? 'var(--success-green)' : 'var(--danger-red)',
        borderLeft: `2px solid ${r === 'correct' ? 'var(--success-green)' : 'var(--danger-red)'}`,
      }}
    >
      {r === 'correct' ? '✓' : '✕'} 步骤{i + 1}：{guidance.steps[i].prompt}
    </div>
  ))

  return (
    <div style={styles.guidancePanel}>
      <div style={styles.guidanceTitle}>🚑 {guidance.title}</div>
      {stepIndex === 0 && <p style={styles.guidanceIntro}>{guidance.intro}</p>}
      {renderStepHistory()}

      {currentStep.miniGame ? (
        <>
          <p style={styles.guidancePrompt}>步骤{stepIndex + 1}：{currentStep.prompt}</p>
          <MiniGameHost
            spec={currentStep.miniGame}
            onComplete={(score, passed) => onCompleteMiniGame(stepIndex, score, passed)}
            paused={paused}
          />
        </>
      ) : (
        <div style={styles.guidanceStep}>
          <p style={styles.guidancePrompt}>
            步骤{stepIndex + 1}：{currentStep.prompt}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {displayOptions.map((opt, i) => (
              <button
                key={i}
                style={{
                  ...styles.guidanceOption,
                  opacity: disabled ? 0.45 : 1,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
                onClick={() => !disabled && onAnswer(stepIndex, shuffleMap.toOriginal[i])}
                disabled={disabled}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
