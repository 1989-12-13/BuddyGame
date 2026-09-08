import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, ClipboardCheck, TriangleAlert } from 'lucide-react'
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
  onEndGuidance,
  onContinue,
  paused,
  disabled = false,
}: {
  guidance: FirstAidGuidance
  stepIndex: number
  results: ('correct' | 'incorrect' | null)[]
  onAnswer: (stepIdx: number, selectedIdx: number) => void
  onCompleteMiniGame: (stepIdx: number, score: number, passed: boolean) => void
  onEndGuidance?: () => void
  onContinue?: () => void
  /** 折叠/遮罩时暂停 minigame */
  paused?: boolean
  /** 流式输出进行中，禁止操作 */
  disabled?: boolean
}) {
  const currentStep = guidance.steps[stepIndex]
  const [started, setStarted] = useState(false)
  const optionCount = currentStep?.options.length ?? 0
  const shuffleMap = useMemo(() => createShuffleMap(optionCount), [optionCount])
  const displayOptions = shuffleMap.toOriginal.map(i => currentStep?.options[i])
  if (currentStep && results[stepIndex] != null) {
    const correct = results[stepIndex] === 'correct'
    return <section className="guidance-feedback" aria-label="本步指导反馈">
      <span className="eyebrow">步骤 {stepIndex + 1} / {guidance.steps.length}</span>
      <h3>{currentStep.prompt}</h3>
      <strong className={correct ? 'success-text' : 'danger-text'}>{correct ? <CheckCircle2 size={20} /> : <TriangleAlert size={20} />}{correct ? '操作已记录' : '这一步需要调整'}</strong>
      <p>{correct ? currentStep.feedback.correct : currentStep.feedback.incorrect}</p>
      <blockquote>{correct ? (currentStep.miniGame?.feedback.good ?? currentStep.feedback.callerCorrect) : (currentStep.miniGame?.feedback.bad ?? currentStep.feedback.callerIncorrect)}</blockquote>
      <p className="helper">先核对来电者的反馈。继续后会停止上一段语音，通话计时保持进行。</p>
      <button className="primary" disabled={disabled} onClick={onContinue}>我已核对，继续指导<ArrowRight size={18} /></button>
    </section>
  }
  if (stepIndex >= guidance.steps.length) {
    return (
      <div style={styles.guidancePanel}>
        <div style={styles.guidanceTitle}><ClipboardCheck size={20} /> {guidance.title}</div>
        {results.map((r, i) => (
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
        ))}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={onEndGuidance}
            style={{
              padding: '10px 32px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: 'var(--danger-red)',
              color: '#fff',
              fontSize: 'var(--fs-body)',
              fontWeight: 'var(--fw-bold)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              letterSpacing: 2,
            }}
          >
            查看交接选项
          </button>
        </div>
      </div>
    )
  }

  const previousResults = results.slice(0, stepIndex)

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
      <div style={styles.guidanceTitle}><ClipboardCheck size={20} /> {guidance.title}</div>
      {stepIndex === 0 && <p style={styles.guidanceIntro}>{guidance.intro}</p>}
      {renderStepHistory()}

      {currentStep.miniGame ? (
        <>
          <p style={styles.guidancePrompt}>步骤{stepIndex + 1}：{currentStep.prompt}</p>
          {!started ? <div className="minigame-brief"><p>{currentStep.miniGame.instruction}</p><button className="primary" disabled={disabled || paused} onClick={() => setStarted(true)}>开始本步操作<ArrowRight size={18} /></button><p className="helper">准备好后开始。救护车仍在行驶，游戏暂停按钮会同时暂停车辆和操作。</p></div> : <MiniGameHost
            spec={currentStep.miniGame}
            onComplete={(score, passed) => onCompleteMiniGame(stepIndex, score, passed)}
            paused={paused}
          />}
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
