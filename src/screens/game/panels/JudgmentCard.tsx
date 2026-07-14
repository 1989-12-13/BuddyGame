import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Z_JUDGMENT_OVERLAY } from '../../../game/core/zIndex'
import type { DialogueLine, JudgmentPrompt } from '../../../game/types'
import { createShuffleMap } from '../../../utils/shuffleUtils'

const FEEDBACK_MS = 2000

/**
 * 判断某对话行是否已完成流式输出。
 * 不在 pendingSet 中，且 streamIdx 已越过该行或正在该行且已输出完最后一个字符。
 */
function isLineDone(
  lineIndex: number,
  streamIdx: number,
  streamPos: number,
  pendingSet: ReadonlySet<number>,
  dialogueLog: DialogueLine[],
): boolean {
  if (pendingSet.has(lineIndex)) return false
  if (streamIdx === lineIndex) {
    return streamPos >= [...dialogueLog[lineIndex].text].length
  }
  return streamIdx === -1 || streamIdx > lineIndex
}

/**
 * 临床判断浮层 — 来电者叙述完后，玩家从中做出专业推理。
 * 以模态浮层形式展示（替代原来对话区内的内联卡片），
 * 答完一题展示 2s 反馈后再自动切到下一题或关闭。
 *
 * 关键：浮层只会在对应对话行完成流式输出后才出现。
 */
export function JudgmentCard({
  judgments,
  disabled = false,
  dialogueLog,
  streamIdx,
  streamPos,
  pendingSet,
  onSelect,
}: {
  judgments: JudgmentPrompt[]
  disabled?: boolean
  dialogueLog: DialogueLine[]
  streamIdx: number
  streamPos: number
  pendingSet: ReadonlySet<number>
  onSelect: (judgmentId: string, optionIndex: number) => void
}) {
  const [feedbackId, setFeedbackId] = useState<string | null>(null)
  const feedbackTimerRef = useRef<number | null>(null)

  // 清理定时器
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  // 当前展示的判断题：
  //   - 有 feedbackId → 保持展示该题（已答，显示 2s 反馈）
  //   - 无 feedbackId → 展示第一个满足「行已完成流式」的未答题
  const displayJudgment: JudgmentPrompt | null = (() => {
    if (feedbackId) {
      return judgments.find(j => j.id === feedbackId) ?? null
    }
    return judgments.find(
      j =>
        j.chosenOptionIndex === null &&
        isLineDone(j.dialogueIndex, streamIdx, streamPos, pendingSet, dialogueLog),
    ) ?? null
  })()

  // 打乱当前题目的选项顺序，防止玩家通过位置记忆作答
  const shuffleMap = useMemo(
    () => displayJudgment ? createShuffleMap(displayJudgment.options.length) : { toOriginal: [], toDisplay: [] },
    [displayJudgment?.id],
  )

  // 关闭判断浮层（触发下一题或结束）
  const advanceToNext = useCallback(() => {
    setFeedbackId(null)
  }, [])

  const handleSelect = useCallback(
    (optionDisplayIdx: number) => {
      if (!displayJudgment || disabled) return
      const originalIdx = shuffleMap.toOriginal[optionDisplayIdx]
      onSelect(displayJudgment.id, originalIdx)
      setFeedbackId(displayJudgment.id)

      if (feedbackTimerRef.current !== null) {
        clearTimeout(feedbackTimerRef.current)
      }
      feedbackTimerRef.current = window.setTimeout(() => {
        advanceToNext()
        feedbackTimerRef.current = null
      }, FEEDBACK_MS)
    },
    [displayJudgment, disabled, shuffleMap, onSelect, advanceToNext],
  )

  if (!displayJudgment) return null

  const displayOptions = shuffleMap.toOriginal.map(i => displayJudgment.options[i])

  const isFeedback = feedbackId === displayJudgment.id
  const resolvedIdx = isFeedback
    ? (judgments.find(j => j.id === displayJudgment.id)?.chosenOptionIndex ?? null)
    : displayJudgment.chosenOptionIndex
  const isResolved = resolvedIdx !== null
  const displayIdx = isResolved ? shuffleMap.toDisplay[resolvedIdx!] : -1
  const choiceIsCorrect =
    isResolved
      ? displayJudgment.options[resolvedIdx!]?.isCorrect ?? false
      : false

  return (
    <AnimatePresence>
      <motion.div
        key={displayJudgment.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: Z_JUDGMENT_OVERLAY,
          backgroundColor: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
        onClick={() => {
          // 点击遮罩不关闭，防止误操作
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 8 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            width: 380,
            maxWidth: '90vw',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 12,
            border: '2px solid var(--accent-amber)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span style={{ color: 'var(--accent-amber)', fontSize: 16 }}>◆</span>
            <span
              style={{
                flex: 1,
                fontSize: 'var(--fs-body)',
                fontWeight: 'var(--fw-bold)',
                color: 'var(--text-primary)',
              }}
            >
              {displayJudgment.question}
            </span>
            {isResolved && (
              <span
                style={{
                  color: choiceIsCorrect ? 'var(--accent-green)' : 'var(--danger-red)',
                  fontSize: 'var(--fs-micro)',
                  fontWeight: 'var(--fw-bold)',
                }}
              >
                {choiceIsCorrect ? '✓ 正确' : '✕ 需复核'}
              </span>
            )}
          </div>

          {/* Options */}
          <div style={{ padding: '10px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {displayOptions.map((opt, idx) => {
              const isChosen = isResolved && displayIdx === idx
              const isCorrectReveal = isResolved && opt.isCorrect
              let bgColor = 'var(--bg-surface)'
              let borderColor = 'var(--border)'
              if (isResolved) {
                if (isChosen) {
                  bgColor = opt.isCorrect ? 'var(--success-green-bg)' : 'var(--danger-red-bg)'
                  borderColor = opt.isCorrect ? 'var(--accent-green)' : 'var(--danger-red)'
                } else if (isCorrectReveal) {
                  bgColor = 'var(--success-green-bg)'
                  borderColor = 'var(--accent-green)'
                }
              }

              return (
                <button
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '10px 12px',
                    backgroundColor: bgColor,
                    borderRadius: 8,
                    border: `1px solid ${borderColor}`,
                    cursor: isResolved || disabled ? 'default' : 'pointer',
                    opacity: isResolved && !isChosen && !isCorrectReveal ? 0.35 : 1,
                    transition: 'background-color 0.2s, border-color 0.2s, opacity 0.2s',
                    textAlign: 'left',
                    fontSize: 'var(--fs-body)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    lineHeight: 1.4,
                  }}
                  onClick={() => !isResolved && !disabled && handleSelect(idx)}
                  disabled={isResolved || disabled}
                  onPointerEnter={e => {
                    if (!isResolved && !disabled) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)'
                    }
                  }}
                  onPointerLeave={e => {
                    if (!isResolved && !disabled) {
                      e.currentTarget.style.backgroundColor = bgColor
                    }
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 4,
                      fontSize: 'var(--fs-micro)',
                      fontWeight: 'var(--fw-bold)',
                      backgroundColor: isChosen
                        ? (opt.isCorrect ? 'var(--accent-green)' : 'var(--danger-red)')
                        : 'var(--bg)',
                      color: isChosen ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: isChosen ? 'bold' : 'normal',
                        color: isChosen
                          ? (opt.isCorrect && isResolved ? 'var(--accent-green)' : isResolved ? 'var(--danger-red)' : 'var(--accent-amber)')
                          : 'var(--text-muted)',
                      }}
                    >
                      {opt.label}
                    </div>
                    {opt.sublabel && (
                      <div
                        style={{
                          fontSize: 'var(--fs-micro)',
                          color: 'var(--text-muted)',
                          marginTop: 2,
                        }}
                      >
                        {opt.sublabel}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
