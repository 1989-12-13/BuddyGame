// ============================================================
// 零点接线台 — 调度主界面（双线程：电话+终端）
// ============================================================

import React, { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import { createInitialState } from '../game/core/initialState'
import type { MpdsDeterminant, CallPhase, TerminalState, CalleeStressLevel } from '../game/types'
import { MPDS_DETERMINANT_INFO, STRESS_INFO, PROTOCOL_REF } from '../game/types'
import type { TerminalField } from '../game/core/actions'
import { worldReducer } from '../game/core/worldReducer'
import { getCaller } from '../game/npc/personas'
import { detectEnding } from '../game/endings/endings'
import { Hud } from '../components/hud/Hud'
import { MiniGameHost } from '../components/minigames/MiniGameHost'
import type { EndingDef } from '../game/types'
import { useAudio } from '../audio/AudioContext'

interface Props {
  onNavigate: (screen: 'title' | 'ending', ending?: EndingDef, totalScore?: number) => void
  scenarioId?: string
}

export function GameScreen({ onNavigate, scenarioId }: Props) {
  const [state, dispatch] = useReducer(worldReducer, null, createInitialState)
  const [terminalModalOpen, setTerminalModalOpen] = useState(false)

  // --- 启动班次 ---
  useEffect(() => {
    dispatch({ type: 'START_SHIFT', forceScenarios: scenarioId ? [scenarioId] : undefined })
  }, [scenarioId])

  // --- 新通话时强制关闭调度卡 ---
  useEffect(() => {
    if (!state.currentCall) setTerminalModalOpen(false)
  }, [state.currentCall])

  // --- 计时器 ---
  useEffect(() => {
    if (state.screen !== 'playing') return
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => clearInterval(id)
  }, [state.screen])

  // --- 检测结局 ---
  useEffect(() => {
    if (state.screen === 'ending') {
      const ending = detectEnding(state.totalScore)
      onNavigate('ending', ending, state.totalScore)
    }
  }, [state.screen])

  // --- 自动滚动对话 ---
  const dialogueRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (dialogueRef.current) {
      dialogueRef.current.scrollTop = dialogueRef.current.scrollHeight
    }
  }, [state.dialogueLog.length])

  // --- 流式逐字显示：多行排队依次输出 ---
  const prevLogLen = useRef(0)                         // 上一次已处理的对话行数
  const pendingSet = useRef(new Set<number>())          // 已入队、尚未流式完毕的行索引
  const pendingQueue = useRef<{ idx: number; text: string }[]>([])  // 待流式的行队列
  const timerId = useRef<number | null>(null)           // 定时器
  const isProcessing = useRef(false)                    // 是否正在处理队列
  const [streamIdx, setStreamIdx] = useState(-1)        // 正在流式的行
  const [streamPos, setStreamPos] = useState(0)         // 已显示字符数

  // --- 音效管理 ---
  const audio = useAudio()
  const prevCallCount = useRef(state.callIndex)

  // 来电铃声循环（无活跃通话且还有下一通时）
  useEffect(() => {
    if (!state.currentCall && state.callIndex < state.totalCalls) {
      const id = setInterval(() => audio.play('ring'), 4000)
      return () => clearInterval(id)
    }
  }, [state.currentCall, state.callIndex, state.totalCalls, audio])

  // 接听电话 → connect 音效
  useEffect(() => {
    if (state.currentCall && state.callIndex !== prevCallCount.current) {
      audio.play('connect')
    }
    prevCallCount.current = state.callIndex
  }, [state.currentCall, state.callIndex, audio])

  // 追踪音效状态
  const prevDispatchSent = useRef(state.dispatchSent)
  const prevAmbulance = useRef(state.ambulanceRemaining)
  const prevCallPhase = useRef(state.callPhase)
  const prevDialogueLen = useRef(state.dialogueLog.length)
  const prevJudgments = useRef(state.pendingJudgments?.length ?? 0)

  // 派车音效
  useEffect(() => {
    if (state.dispatchSent && !prevDispatchSent.current) {
      audio.play('dispatch')
    }
    prevDispatchSent.current = state.dispatchSent
  }, [state.dispatchSent, audio])

  // 救护车到达音效
  useEffect(() => {
    if (prevAmbulance.current > 0 && state.ambulanceRemaining === 0) {
      audio.play('arrival')
    }
    prevAmbulance.current = state.ambulanceRemaining
  }, [state.ambulanceRemaining, audio])

  // 问询/挂断/紧张音效 — 通过对话日志变化推断
  useEffect(() => {
    const curLen = state.dialogueLog.length
    if (curLen <= prevDialogueLen.current) {
      prevDialogueLen.current = curLen
      return
    }
    const newLines = state.dialogueLog.slice(prevDialogueLen.current)
    prevDialogueLen.current = curLen

    for (const line of newLines) {
      if (line.speaker === 'operator' && line.text.startsWith('请问')) {
        audio.play('question')
      }
      if (line.speaker === 'operator' && line.text.includes('做得好')) {
        audio.play('success')
      }
    }
  }, [state.dialogueLog, audio])

  // 通话结束音效
  useEffect(() => {
    if (prevCallPhase.current !== 'completed' && state.callPhase === 'completed') {
      audio.play('hangup')
    }
    prevCallPhase.current = state.callPhase
  }, [state.callPhase, audio])

  // 临床判断选择音效
  useEffect(() => {
    const curJudgments = state.pendingJudgments?.length ?? 0
    if (curJudgments > prevJudgments.current) {
      audio.play('confirm')
    }
    prevJudgments.current = curJudgments
  }, [state.pendingJudgments, audio])

  // 启动队列处理（幂等：已在处理中则跳过）
  const startQueue = useCallback(() => {
    if (isProcessing.current) return
    if (pendingQueue.current.length === 0) {
      setStreamIdx(-1)
      return
    }

    isProcessing.current = true
    const item = pendingQueue.current.shift()!
    pendingSet.current.delete(item.idx)   // 开始流式，移出待流式集合
    const chars = [...item.text]
    setStreamIdx(item.idx)
    setStreamPos(0)

    let pos = 0
    timerId.current = window.setInterval(() => {
      pos += 1
      if (pos >= chars.length) {
        setStreamPos(chars.length)
        if (timerId.current !== null) {
          clearInterval(timerId.current)
          timerId.current = null
        }
        isProcessing.current = false
        // 行间短暂停顿后开始下一行
        setTimeout(() => startQueue(), 300)  // 行间停顿300ms，模拟换气停顿
      } else {
        setStreamPos(pos)
      }
    }, 65)  // ~15 字符/秒，接近真实语速
  }, [])

  // 新对话行入队
  useEffect(() => {
    const curLen = state.dialogueLog.length
    const oldLen = prevLogLen.current
    prevLogLen.current = curLen

    if (curLen <= oldLen) return

    for (let i = oldLen; i < curLen; i++) {
      // 系统提示行不流式，直接显示；仅来电者/接线员行逐字输出
      if (state.dialogueLog[i].speaker !== 'system') {
        pendingQueue.current.push({ idx: i, text: state.dialogueLog[i].text })
        pendingSet.current.add(i)
      }
    }

    startQueue()
  }, [state.dialogueLog.length, startQueue])

  // --- 安抚来电者 ---
  const handleCalm = useCallback(() => {
    dispatch({ type: 'CALM_CALLER' })
  }, [])

  // --- 对话区 / 操作面板拖拽分割 ---
  const [dialogueHeight, setDialogueHeight] = useState<number | null>(null)
  const [splitHovered, setSplitHovered] = useState(false)
  const splitDragRef = useRef<{ startY: number; startH: number } | null>(null)

  const handleSplitterDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const area = (e.currentTarget as HTMLElement).previousElementSibling as HTMLElement | null
    const currentH = dialogueHeight ?? area?.getBoundingClientRect().height ?? 300
    splitDragRef.current = { startY: e.clientY, startH: currentH }

    const onMove = (ev: PointerEvent) => {
      if (!splitDragRef.current) return
      const dy = ev.clientY - splitDragRef.current.startY
      const newH = Math.max(80, Math.min(window.innerHeight - 280, splitDragRef.current.startH + dy))
      setDialogueHeight(newH)
    }
    const onUp = () => {
      splitDragRef.current = null
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [dialogueHeight])

  // --- 打开调度卡 ---
  const handleOpenTerminal = useCallback(() => {
    setTerminalModalOpen(true)
  }, [])

  // --- 处理派车（从模态框调用）---
  const handleDispatch = useCallback(() => {
    if (!state.currentCall) return
    if (!state.terminal.determinant) return // 必须选择判定码才能派车
    setTerminalModalOpen(false)
    dispatch({ type: 'DISPATCH' })
  }, [state.currentCall, state.terminal.determinant])

  // --- 处理临床判断选择 ---
  const handleJudgment = useCallback((judgmentId: string, optionIndex: number) => {
    dispatch({ type: 'MAKE_JUDGMENT', judgmentId, chosenOptionIndex: optionIndex })
  }, [])

  // 无活跃通话时 — 等待接听
  if (!state.currentCall && state.callIndex < state.totalCalls) {
    return (
      <div style={styles.container}>
        <Hud state={state} />
        <CallWaiting
          callIndex={state.callIndex}
          totalCalls={state.totalCalls}
          onAnswer={() => dispatch({ type: 'ANSWER_CALL' })}
          shiftElapsed={state.shiftElapsed}
          totalScore={state.totalScore}
          lastScore={state.callScores[state.callScores.length - 1]}
        />
      </div>
    )
  }

  // 无更多通话
  if (!state.currentCall && state.callIndex >= state.totalCalls) {
    return (
      <div style={styles.container}>
        <Hud state={state} />
        <div style={styles.centerMessage}>
          <h2 style={{ color: '#334155' }}>本班次所有通话已处理完毕</h2>
          <p style={{ color: '#94a3b8' }}>正在生成班次评估报告...</p>
        </div>
      </div>
    )
  }

  // --- 通话中 ---
  const call = state.currentCall!
  const caller = getCaller(call.callerId)
  const hasTriage = state.terminal.triage !== null

  return (
    <div style={styles.container}>
      <Hud state={state} />

      {/* ====== 电话面板（全宽） ====== */}
      <div style={styles.phonePanel}>
        <PhoneHeader
          phoneNumber={call.phoneNumber}
          baseStation={call.baseStation}
          callerName={caller.name}
          relationship={caller.relationship}
          callPhase={state.callPhase}
          elapsed={state.shiftElapsed - state.callStartTime}
          stressLevel={state.callerState?.stressLevel ?? '紧张'}
          stress={state.callerState?.stress ?? 50}
        />

        {/* 对话区 — 每条来电者发言旁可能弹出临床判断卡 */}
        <div ref={dialogueRef} style={{
          ...styles.dialogueArea,
          flex: dialogueHeight ? 'none' : 1,
          height: dialogueHeight ?? undefined,
          minHeight: dialogueHeight ? 80 : 0,
        }}>
          {state.dialogueLog.map((line, i) => {
            const isStreaming = i === streamIdx
            const isPending = pendingSet.current.has(i) && !isStreaming
            const displayText = isStreaming
              ? [...line.text].slice(0, streamPos).join('')
              : isPending
                ? ''
                : line.text
            const showCursor = isStreaming && streamPos < [...line.text].length
            // 该行已流式完成（不在待流式集合，且不是当前正在流式的行）
            const hasFinished = !isStreaming && !pendingSet.current.has(i) && displayText.length > 0
            // 查找附着在该行上的判断卡
            const judgment = state.pendingJudgments?.find(
              j => j.dialogueIndex === i && line.speaker === 'caller'
            )
            return (
              <div key={i}>
                <TranscriptLine
                  line={line}
                  index={i}
                  displayText={displayText}
                  showCursor={showCursor}
                />
                {/* 来电者行流式完成后，若有判断卡则显示 */}
                {judgment && hasFinished && (
                  <JudgmentCard
                    judgment={judgment}
                    onSelect={(optIdx) => handleJudgment(judgment.id, optIdx)}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* ====== 可拖拽分隔条 ====== */}
        <div
          style={{
            ...styles.splitBar,
            backgroundColor: splitHovered ? '#cbd5e1' : '#e2e8f0',
          }}
          onPointerDown={handleSplitterDown}
          onPointerEnter={() => setSplitHovered(true)}
          onPointerLeave={() => setSplitHovered(false)}
          onDoubleClick={() => setDialogueHeight(null)}
          title="拖拽调整对话区高度，双击重置"
        >
          <div style={styles.splitBarHandle}>
            <div style={styles.splitBarDot} />
            <div style={styles.splitBarDot} />
            <div style={styles.splitBarDot} />
          </div>
        </div>

        {/* 急救指导面板 */}
        {state.callPhase === 'guidance' && call.guidance && (
          <GuidancePanel
            guidance={call.guidance}
            stepIndex={state.guidanceStepIndex}
            results={state.guidanceResults}
            onAnswer={(stepIdx, selectedIdx) =>
              dispatch({ type: 'ANSWER_GUIDANCE', stepIndex: stepIdx, selectedIndex: selectedIdx })
            }
            onCompleteMiniGame={(stepIdx, score, passed) =>
              dispatch({ type: 'COMPLETE_MINIGAME', stepIndex: stepIdx, score, passed })
            }
          />
        )}

        {/* 问询按钮区 */}
        {(state.callPhase === 'questioning' || state.callPhase === 'connected') && (
          <QuestionPanel
            call={call}
            askedMPDS={state.callerState?.askedMPDS ?? []}
            stressLevel={state.callerState?.stressLevel ?? '紧张'}
            stress={state.callerState?.stress ?? 50}
            onAsk={(id) => dispatch({ type: 'ASK_QUESTION', questionId: id })}
            onCalm={handleCalm}
            onOpenTerminal={handleOpenTerminal}
            hasTriage={hasTriage}
          />
        )}

        {/* 收尾阶段 */}
        {state.callPhase === 'closing' && (
          <div style={styles.closingPanel}>
            <p style={{ color: '#16a34a', fontWeight: 'bold', marginBottom: 8 }}>
              {call.guidance ? '急救指导已完成，等待救护车到达。' : '派车指令已发出。'}
            </p>
            <button style={styles.endCallBtn} onClick={() => dispatch({ type: 'END_CALL' })}>
              挂断电话
            </button>
          </div>
        )}
      </div>

      {/* ====== MPDS调度卡弹出模态框 ====== */}
      {terminalModalOpen && (
        <TerminalModal
          terminal={state.terminal}
          dispatchSent={state.dispatchSent}
          ambulanceRemaining={state.ambulanceRemaining}
          onChange={(field, value) =>
            dispatch({ type: 'UPDATE_TERMINAL', field, value } as any)
          }
          onSetStatus={(field, value) =>
            dispatch({ type: 'SET_PATIENT_STATUS', field, value })
          }
          onSetDeterminant={(d) =>
            dispatch({ type: 'SET_MPDS_DETERMINANT', determinant: d })
          }
          onSetDeterminantSubcode={(subcode) =>
            dispatch({ type: 'SET_DETERMINANT_SUBCODE', subcode })
          }
          onSetProtocol={(protocol) =>
            dispatch({ type: 'SET_PROTOCOL', protocolNumber: protocol })
          }
          onDispatch={handleDispatch}
          onClose={() => setTerminalModalOpen(false)}
          onEndCall={() => { setTerminalModalOpen(false); dispatch({ type: 'END_CALL' }) }}
        />
      )}
    </div>
  )
}

// ============================================================
// 子组件
// ============================================================

/** 等待接听界面 */
function CallWaiting({
  callIndex,
  totalCalls,
  onAnswer,
  shiftElapsed,
  totalScore,
  lastScore,
}: {
  callIndex: number
  totalCalls: number
  onAnswer: () => void
  shiftElapsed: number
  totalScore: number
  lastScore?: number
}) {
  return (
    <div style={styles.centerMessage}>
      <div style={{
        fontSize: 64,
        marginBottom: 8,
        animation: 'pulse-live 0.8s ease-in-out infinite',
      }}>
        📞
      </div>
      <h2 style={{ color: '#334155', margin: '0 0 4px', fontSize: 18 }}>
        第 {callIndex + 1}/{totalCalls} 通来电
      </h2>
      <p style={{ color: '#ef4444', fontWeight: 'bold', margin: '0 0 8px', fontSize: 13 }}>
        线路接通中...
      </p>
      {lastScore !== undefined && (
        <p style={{ color: '#16a34a', fontWeight: 'bold', margin: '0 0 12px' }}>
          上一通得分：{lastScore}/100
        </p>
      )}
      <p style={{ color: '#94a3b8', marginBottom: 16, fontSize: 12 }}>
        班次运行 {Math.floor(shiftElapsed / 60)}分{shiftElapsed % 60}秒 | 累计 {totalScore}分
      </p>
      <button style={styles.answerBtn} onClick={onAnswer}>
        接 听 电 话
      </button>
    </div>
  )
}

/** 电话面板顶部 — 紧急调度台风格 + 来电者压力指示器 */
function PhoneHeader({
  phoneNumber,
  baseStation,
  callerName,
  relationship,
  callPhase,
  elapsed,
  stressLevel,
  stress,
}: {
  phoneNumber: string
  baseStation: string
  callerName: string
  relationship: string
  callPhase: CallPhase
  elapsed: number
  stressLevel: CalleeStressLevel
  stress: number
}) {
  const mm = Math.floor(elapsed / 60)
  const ss = elapsed % 60
  const urgent = elapsed >= 45
  const si = STRESS_INFO[stressLevel]

  return (
    <div style={styles.phoneHeader}>
      {/* 第一行：LIVE指示器 + 通话计时 */}
      <div style={styles.callLiveBar}>
        <span style={styles.liveDot}>●</span>
        <span style={styles.liveLabel}>LIVE</span>
        <span style={{
          ...styles.callTimer,
          color: urgent ? '#ef4444' : '#d97706',
          fontWeight: urgent ? 900 : 700,
        }}>
          通话 {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
        </span>
        <span style={{
          ...styles.targetBadge,
          color: urgent ? '#ef4444' : '#d97706',
          borderColor: urgent ? '#ef4444' : '#d97706',
        }}>
          {urgent ? '⚠ 超时' : '目标 60秒派车'}
        </span>
      </div>

      {/* 第二行：来电信息 + 问询耗时 */}
      <div style={styles.phoneHeaderInfo}>
        <span>{phoneNumber}</span>
        <span style={{ color: '#94a3b8' }}>|</span>
        <span>基站 {baseStation}</span>
        <span style={{ color: '#94a3b8' }}>|</span>
        <span>{callerName}（{relationship}）</span>
      </div>

      {/* 第三行：来电者压力指示器 */}
      <div style={styles.stressBar}>
        <span style={{ fontSize: 11, color: '#64748b', minWidth: 40 }}>
          {si.emoji} {si.label}
        </span>
        <div style={styles.stressTrack}>
          <div style={{
            ...styles.stressFill,
            width: `${stress}%`,
            backgroundColor: si.color,
          }} />
        </div>
        <span style={{ fontSize: 10, color: si.color, minWidth: 28, textAlign: 'right', fontFamily: 'monospace' }}>
          {stress}%
        </span>
      </div>

      {/* 第四行：阶段指示 */}
      <div style={styles.callPhaseTag}>
        {callPhase === 'questioning' && '问询中'}
        {callPhase === 'guidance' && '急救指导'}
        {callPhase === 'closing' && '收尾'}
        {callPhase === 'connected' && '已接通'}
        {stressLevel === '失控' && <span style={{ color: '#dc2626', marginLeft: 8 }}>来电者情绪失控</span>}
      </div>
    </div>
  )
}

/** 通话逐字稿 — 单列时序记录，支持流式逐字输出 */
function TranscriptLine({
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
        color: isCaller ? '#dc2626' : isOperator ? '#2563eb' : '#94a3b8',
      }}>
        [{speakerLabel}]
      </span>
      <span style={{
        ...styles.transcriptText,
        color: isCaller ? '#b91c1c' : '#475569',
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

/** 临床判断卡 — 来电者叙述完后，玩家从中做出专业推理 */
function JudgmentCard({
  judgment,
  onSelect,
}: {
  judgment: import('../game/types').JudgmentPrompt
  onSelect: (optionIndex: number) => void
}) {
  const isResolved = judgment.chosenOptionIndex !== null

  return (
    <div style={{
      ...styles.judgmentCard,
      borderColor: isResolved ? '#cbd5e1' : '#d97706',
    }}>
      <div style={styles.judgmentHeader}>
        <span style={styles.judgmentIcon}>🔍</span>
        <span style={styles.judgmentQuestion}>{judgment.question}</span>
        {isResolved && (
          <span style={{
            color: judgment.options[judgment.chosenOptionIndex!].isCorrect ? '#16a34a' : '#dc2626',
            fontSize: 10,
            fontWeight: 'bold',
            marginLeft: 'auto',
          }}>
            {judgment.options[judgment.chosenOptionIndex!].isCorrect ? '✅ 正确' : '❌ 需复核'}
          </span>
        )}
      </div>
      <div style={styles.judgmentOptions}>
        {judgment.options.map((opt, idx) => {
          const isChosen = judgment.chosenOptionIndex === idx
          const isCorrectReveal = isResolved && opt.isCorrect
          let bgColor = '#f8fafc'
          let borderColor = '#e2e8f0'
          if (isResolved) {
            if (isChosen) {
              bgColor = opt.isCorrect ? '#dcfce7' : '#fecaca'
              borderColor = opt.isCorrect ? '#16a34a' : '#dc2626'
            } else if (isCorrectReveal) {
              bgColor = '#dcfce7'
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
                    : '#475569',
                }}>
                  {opt.label}
                </div>
                {opt.sublabel && (
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
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

/** 问题层级配色 */
const TIER_STYLE: Record<string, { border: string; bg: string; badge: string; label: string }> = {
  critical:  { border: '#dc2626', bg: '#fef2f2', badge: '#dc2626', label: '🔴 关键' },
  important: { border: '#d97706', bg: '#fffbeb', badge: '#d97706', label: '🟡 重要' },
  detail:    { border: '#16a34a', bg: '#f0fdf4', badge: '#16a34a', label: '🟢 细节' },
}

/** 问询按钮面板 — 5步标准协议 + 补充MPDS问询 */
function QuestionPanel({
  call,
  askedMPDS,
  stressLevel,
  stress,
  onAsk,
  onCalm,
  onOpenTerminal,
  hasTriage,
}: {
  call: import('../game/types').EmergencyScenario
  askedMPDS: string[]
  stressLevel: CalleeStressLevel
  stress: number
  onAsk: (id: string) => void
  onCalm: () => void
  onOpenTerminal: () => void
  hasTriage: boolean
}) {
  const isAsked = (id: string) => askedMPDS.includes(id)
  const si = STRESS_INFO[stressLevel]

  // --- 4步协议状态 ---
  const step1Done = isAsked('step1_location')
  const step2Done = isAsked('step2_event')
  const step3Done = isAsked('step3_age')
  const step4Done = isAsked('step4_vitals')
  const landmarkDone = isAsked('ask_landmark')
  const contactDone = isAsked('ask_contact')

  const allFourStepsDone = step1Done && step2Done && step3Done && step4Done

  // 下一步：第一个未完成的步骤
  const nextStepLabel =
    !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : !step4Done ? 4 : null

  // 补充MPDS问题（4步完成后方可问询）
  const supplementaryQ = call.mpdsQuestions  // 所有MPDS问题现在都是补充性质

  // 4步协议定义
  const protocolSteps = [
    { step: 1, id: 'step1_location', icon: '📍', label: '位置确认', qText: '请问事发的确切地址是哪里？', timeCost: 2, desc: '派车根本依据' },
    { step: 2, id: 'step2_event', icon: '📋', label: '事件简述', qText: '好的，请告诉我具体发生了什么事？', timeCost: 3, desc: '获取主诉入口' },
    { step: 3, id: 'step3_age', icon: '👤', label: '患者年龄', qText: '患者多大年龄了？', timeCost: 2, desc: '关键救治因素' },
    { step: 4, id: 'step4_vitals', icon: '💓', label: '意识与呼吸', qText: '患者清醒吗？他/她还有呼吸吗？', timeCost: 3, desc: '最关键的病情评估' },
  ]

  return (
    <div style={styles.questionArea}>
      {/* ====== 5步标准协议 ====== */}
      <div style={styles.qSection}>
        <div style={styles.qSectionTitle}>
          📡 标准协议
          {allFourStepsDone && <span style={{ color: '#16a34a', marginLeft: 6 }}>✓ 全部完成</span>}
        </div>

        <div style={styles.protocolStepsList}>
          {protocolSteps.map((ps) => {
            const done = isAsked(ps.id)
            const isCurrent = ps.step === nextStepLabel
            const locked = !done && !isCurrent

            return (
              <div key={ps.id} style={{
                ...styles.protocolStepRow,
                opacity: locked ? 0.45 : 1,
                borderColor: done ? '#16a34a' : isCurrent ? '#d97706' : '#e2e8f0',
                backgroundColor: done ? '#f0fdf4' : isCurrent ? '#fffbeb' : 'transparent',
              }}>
                {/* 步骤编号 */}
                <div style={{
                  ...styles.protocolStepNum,
                  backgroundColor: done ? '#16a34a' : isCurrent ? '#d97706' : '#e2e8f0',
                  color: done ? '#fff' : isCurrent ? '#fff' : '#64748b',
                }}>
                  {done ? '✓' : ps.step}
                </div>

                {/* 步骤信息 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: done ? 'normal' : 'bold',
                    color: done ? '#16a34a' : isCurrent ? '#d97706' : '#64748b',
                    textDecoration: done ? 'line-through' : 'none',
                  }}>
                    {ps.icon} {ps.label}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
                    {ps.qText}
                  </div>
                </div>

                {/* 操作按钮 */}
                {done ? (
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    ✓ 完成
                  </span>
                ) : isCurrent ? (
                  <button
                    style={styles.protocolStepBtn}
                    onClick={() => onAsk(ps.id)}
                  >
                    询问 ({ps.timeCost}s)
                  </button>
                ) : (
                  <span style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    🔒 等待
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ====== 补充信息（5步完成后方出现） ====== */}
      {allFourStepsDone && (
        <div style={styles.qSection}>
          <div style={styles.qSectionTitle}>📎 补充信息（按需问询）</div>
          <div style={styles.qGrid}>
            {/* 标志建筑 */}
            {!landmarkDone && (
              <AskBtnEx
                id="ask_landmark"
                label="标志建筑"
                icon="🏢"
                timeCost={2}
                done={false}
                tier="important"
                onClick={() => onAsk('ask_landmark')}
              />
            )}
            {landmarkDone && (
              <div style={{ ...styles.qBtnSmall, borderColor: '#16a34a', color: '#16a34a', backgroundColor: '#f0fdf4' }}>
                ✓ 地址已精确
              </div>
            )}

            {/* 联系电话 */}
            {!contactDone && (
              <AskBtnEx
                id="ask_contact"
                label="联系电话"
                icon="📞"
                timeCost={1}
                done={false}
                tier="detail"
                onClick={() => onAsk('ask_contact')}
              />
            )}
            {contactDone && (
              <div style={{ ...styles.qBtnSmall, borderColor: '#16a34a', color: '#16a34a', backgroundColor: '#f0fdf4' }}>
                ✓ 已记录
              </div>
            )}

            {/* 场景专属补充MPDS问题 */}
            {supplementaryQ.map((q) => (
              <AskBtnEx
                key={q.id}
                id={q.id}
                label={q.label}
                icon={CATEGORY_ICON[q.category] || '📋'}
                timeCost={q.timeCost}
                done={isAsked(q.id)}
                disabled={isAsked(q.id)}
                tier={q.tier}
                onClick={() => onAsk(q.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ====== 安抚按钮 + 调度卡入口 + 压力提示 ====== */}
      <div style={styles.bottomToolbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, color: si.color, display: 'flex', alignItems: 'center', gap: 4 }}>
            {si.emoji} {si.label} ({stress}%)
            {(stressLevel === '恐慌' || stressLevel === '失控') && (
              <span style={{ color: '#d97706', fontSize: 10 }}>答案不可靠</span>
            )}
          </div>
          <button
            style={{
              ...styles.calmBtn,
              opacity: stress < 15 ? 0.4 : 1,
              cursor: stress < 15 ? 'not-allowed' : 'pointer',
            }}
            onClick={stress >= 15 ? onCalm : undefined}
            disabled={stress < 15}
            title="消耗2秒安抚来电者"
          >
            🫂 安抚 (+2s耗时)
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            style={{
              ...styles.terminalBtn,
              animation: !hasTriage ? 'pulse-alert 1.5s ease-in-out infinite' : 'none',
              borderColor: hasTriage ? '#16a34a' : '#dc2626',
              backgroundColor: hasTriage ? '#f0fdf4' : '#fef2f2',
            }}
            onClick={onOpenTerminal}
          >
            {hasTriage ? '✅' : '⚠️'} 调度卡
            {!hasTriage && (
              <span style={{ fontSize: 9, color: '#f87171', display: 'block' }}>
                未分诊
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/** 问题分类图标 */
const CATEGORY_ICON: Record<string, string> = {
  consciousness: '🧠',
  breathing: '🫁',
  bleeding: '🩸',
  pain: '😣',
  age_gender: '👤',
  mechanism: '🔧',
}

/** 问询按钮 — 带层级颜色 + 时间代价徽章 */
function AskBtnEx({
  id: _id,
  label,
  icon,
  timeCost,
  done,
  disabled,
  tier,
  onClick,
}: {
  id: string
  label: string
  icon?: string
  timeCost: number
  done: boolean
  disabled?: boolean
  tier?: string
  onClick: () => void
}) {
  const ts = tier ? TIER_STYLE[tier] : undefined
  return (
    <button
      style={{
        ...styles.qBtn,
        backgroundColor: done ? '#f0fdf4' : disabled ? '#f8fafc' : (ts?.bg ?? '#ffffff'),
        borderColor: done ? '#16a34a' : disabled ? '#e2e8f0' : (ts?.border ?? '#3b82f6'),
        color: done ? '#16a34a' : disabled ? '#cbd5e1' : '#475569',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled && !done ? 0.45 : 1,
        position: 'relative',
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
        {done ? '✅ ' : icon ? icon + ' ' : ''}
        <span style={{ fontWeight: done ? 'normal' : 'bold', fontSize: 11 }}>{label}</span>
      </div>
      {!done && (
        <span style={{
          position: 'absolute',
          top: -5,
          right: -5,
          backgroundColor: ts?.badge ?? '#3b82f6',
          color: '#000',
          fontSize: 9,
          fontWeight: 900,
          padding: '1px 5px',
          borderRadius: 10,
          fontFamily: 'monospace',
        }}>
          {timeCost}s
        </span>
      )}

    </button>
  )
}

/** MPDS 调度卡弹出模态框 */
function TerminalModal({
  terminal,
  dispatchSent,
  ambulanceRemaining,
  onChange,
  onSetStatus,
  onSetDeterminant,
  onSetDeterminantSubcode,
  onSetProtocol,
  onDispatch,
  onClose,
  onEndCall,
}: {
  terminal: TerminalState
  dispatchSent: boolean
  ambulanceRemaining: number
  onChange: (field: TerminalField, value: string) => void
  onSetStatus: (field: 'conscious' | 'breathing', value: boolean) => void
  onSetDeterminant: (d: MpdsDeterminant) => void
  onSetDeterminantSubcode: (subcode: number) => void
  onSetProtocol: (protocol: number) => void
  onDispatch: () => void
  onClose: () => void
  onEndCall: () => void
}) {

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* 模态框头部 */}
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderLeft}>
            <span style={styles.mpdsModalBadge}>
              协议 {terminal.protocolNumber ?? '?'}
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: '#334155' }}>
                MPDS 调度终端
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                判定码：{terminal.determinant
                  ? `${terminal.protocolNumber ?? '?'}-${terminal.determinant[0]}-${terminal.determinantSubcode ?? '?'}`
                  : '未选择'}
              </div>
            </div>
          </div>
          <div style={styles.modalHeaderRight}>
            <button style={styles.modalCloseBtn} onClick={onClose} title="关闭调度卡">
              ✕
            </button>
          </div>
        </div>

        {/* 模态框内容 */}
        <div style={styles.modalBody}>
          {/* 终端登记表单 */}
          <div style={{ marginTop: 8 }}>
            <TerminalForm
              terminal={terminal}
              onChange={onChange}
              onSetStatus={onSetStatus}
              onSetDeterminant={onSetDeterminant}
              onSetDeterminantSubcode={onSetDeterminantSubcode}
              onSetProtocol={onSetProtocol}
            />
          </div>
        </div>

        {/* 模态框底部 — 操作按钮 */}
        <div style={styles.modalFooter}>
          {!dispatchSent ? (
            <>
              <button style={styles.modalEndCallBtn} onClick={onEndCall}>
                ✕ 挂断
              </button>
              <div style={{ flex: 1 }} />
              <button style={styles.modalSaveBtn} onClick={onClose}>
                📋 暂存关闭
              </button>
              <button
                style={styles.modalDispatchBtn}
                onClick={onDispatch}
                title="确认派车"
              >
                🚑 确认派车
              </button>
            </>
          ) : (
            <div style={styles.dispatchSent}>
              <span style={{ fontSize: 20 }}>🚑</span>
              <div>
                <div style={{ fontWeight: 'bold', color: '#22c55e' }}>救护车已派出</div>
                {ambulanceRemaining > 0 ? (
                  <div style={{ color: '#dc2626', fontSize: 12 }}>
                    预计 {ambulanceRemaining} 秒后到达现场
                  </div>
                ) : (
                  <div style={{ color: '#16a34a', fontSize: 12, fontWeight: 'bold' }}>
                    救护车已到达现场！
                  </div>
                )}
              </div>
              <button style={styles.modalCloseBtn} onClick={onClose}>✕ 关闭</button>
            </div>
          )}
        </div>


      </div>
    </div>
  )
}

/** 急救指导面板 */
function GuidancePanel({
  guidance,
  stepIndex,
  results,
  onAnswer,
  onCompleteMiniGame,
}: {
  guidance: import('../game/types').FirstAidGuidance
  stepIndex: number
  results: ('correct' | 'incorrect' | null)[]
  onAnswer: (stepIdx: number, selectedIdx: number) => void
  onCompleteMiniGame: (stepIdx: number, score: number, passed: boolean) => void
}) {
  if (stepIndex >= guidance.steps.length) return null

  const currentStep = guidance.steps[stepIndex]
  const previousResults = results.slice(0, stepIndex)

  // 互动小游戏步骤：渲染实操环节
  if (currentStep.miniGame) {
    return (
      <div style={styles.guidancePanel}>
        <div style={styles.guidanceTitle}>🩺 {guidance.title}</div>
        {stepIndex === 0 && <p style={styles.guidanceIntro}>{guidance.intro}</p>}
        {previousResults.map((r, i) => (
          <div
            key={i}
            style={{
              padding: '4px 8px',
              margin: '2px 0',
              backgroundColor: r === 'correct' ? '#dcfce7' : '#fecaca',
              borderRadius: 4,
              fontSize: 13,
              color: r === 'correct' ? '#16a34a' : '#dc2626',
            }}
          >
            {r === 'correct' ? '✅' : '❌'} 步骤{i + 1}：{guidance.steps[i].prompt}
          </div>
        ))}
        <p style={styles.guidancePrompt}>步骤{stepIndex + 1}：{currentStep.prompt}</p>
        <MiniGameHost
          spec={currentStep.miniGame}
          onComplete={(score, passed) => onCompleteMiniGame(stepIndex, score, passed)}
        />
      </div>
    )
  }

  return (
    <div style={styles.guidancePanel}>
      <div style={styles.guidanceTitle}>🩺 {guidance.title}</div>
      {stepIndex === 0 && (
        <p style={styles.guidanceIntro}>{guidance.intro}</p>
      )}

      {/* 已完成步骤 */}
      {previousResults.map((r, i) => (
        <div
          key={i}
          style={{
            padding: '4px 8px',
            margin: '2px 0',
            backgroundColor: r === 'correct' ? '#dcfce7' : '#fecaca',
            borderRadius: 4,
            fontSize: 13,
            color: r === 'correct' ? '#16a34a' : '#dc2626',
          }}
        >
          {r === 'correct' ? '✅' : '❌'} 步骤{i + 1}：{guidance.steps[i].prompt}
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
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** MPDS 标准调度登记卡 — 结构化病例录入（无自动提示，玩家自主判断） */
function TerminalForm({
  terminal,
  onChange,
  onSetStatus,
  onSetDeterminant,
  onSetDeterminantSubcode,
  onSetProtocol,
}: {
  terminal: TerminalState
  onChange: (field: TerminalField, value: string) => void
  onSetStatus: (field: 'conscious' | 'breathing', value: boolean) => void
  onSetDeterminant: (d: MpdsDeterminant) => void
  onSetDeterminantSubcode: (subcode: number) => void
  onSetProtocol: (protocol: number) => void
}) {
  return (
    <div style={styles.terminalForm}>
      {/* ====== 协议号 ====== */}
      {/* ====== Case Entry（病例录入） ====== */}

      {/* 地址 */}
      <FieldRow icon="📍" label="事件地址">
        <textarea
          style={styles.formInput}
          value={terminal.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="记录详细地址…"
          rows={2}
        />
      </FieldRow>

      {/* 联系电话 */}
      <FieldRow icon="📞" label="联系电话">
        <input
          style={{ ...styles.formInput, height: 30 }}
          value={terminal.contact}
          onChange={(e) => onChange('contact', e.target.value)}
          placeholder="记录联系方式…"
        />
      </FieldRow>

      {/* 主诉 */}
      <FieldRow icon="🩺" label="主诉">
        <input
          style={{ ...styles.formInput, height: 30 }}
          value={terminal.chiefComplaint}
          onChange={(e) => onChange('chiefComplaint', e.target.value)}
          placeholder="标准化主诉…"
        />
      </FieldRow>

      {/* 患者基本信息 */}
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ flex: 1 }}>
          <FieldRow icon="👤" label="年龄">
            <input
              style={{ ...styles.formInput, height: 28 }}
              value={terminal.patientAge}
              onChange={(e) => onChange('patientAge', e.target.value)}
              placeholder="…"
            />
          </FieldRow>
        </div>
        <div style={{ flex: 1 }}>
          <FieldRow icon="⚧" label="性别">
            <input
              style={{ ...styles.formInput, height: 28 }}
              value={terminal.patientGender}
              onChange={(e) => onChange('patientGender', e.target.value)}
              placeholder="…"
            />
          </FieldRow>
        </div>
      </div>

      {/* ====== 患者生命体征 — 关键问题 ====== */}
      <SectionTitle icon="💓" text="关键问题" />

      {/* 意识状态 */}
      <StatusToggle
        label="意识状态"
        field="conscious"
        value={terminal.conscious}
        trueLabel="无意识"
        falseLabel="有意识"
        colorTrue="#dc2626"
        colorFalse="#16a34a"
        onToggle={onSetStatus}
      />

      {/* 呼吸状态 */}
      <StatusToggle
        label="呼吸状态"
        field="breathing"
        value={terminal.breathing}
        trueLabel="无呼吸/异常"
        falseLabel="正常呼吸"
        colorTrue="#dc2626"
        colorFalse="#16a34a"
        onToggle={onSetStatus}
      />

      {/* ====== 协议号 ====== */}
      <SectionTitle icon="📋" text="MPDS 协议" />
      <FieldRow icon="🔢" label="协议编号">
        <input
          type="number"
          min={1}
          max={33}
          style={{ ...styles.formInput, height: 30, width: 80 }}
          value={terminal.protocolNumber ?? ''}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            if (v >= 1 && v <= 33) onSetProtocol(v)
          }}
          placeholder="?"
        />
      </FieldRow>

      {/* 协议号对照参考（折叠） */}
      <details style={{ margin: '-4px 0 8px 22px', fontSize: 11 }}>
        <summary style={{ color: '#94a3b8', cursor: 'pointer', userSelect: 'none' }}>
          📖 协议编号对照
        </summary>
        <div style={{
          marginTop: 4,
          padding: 6,
          backgroundColor: '#f8fafc',
          borderRadius: 4,
          maxHeight: 160,
          overflowY: 'auto',
          color: '#64748b',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1px 12px',
          fontSize: 10.5,
        }}>
          {PROTOCOL_REF.map(([num, name]) => (
            <div key={num} style={{ display: 'flex', gap: 4, padding: '1px 0' }}>
              <span style={{ color: '#2563eb', fontWeight: 'bold', minWidth: 20 }}>{num}</span>
              <span>{name}</span>
            </div>
          ))}
        </div>
      </details>

      {/* ====== 判定码 (Determinant) ====== */}
      <SectionTitle icon="🎯" text="MPDS 判定码" />
      <DeterminantSelector
        current={terminal.determinant}
        onSelect={onSetDeterminant}
      />
      <FieldRow icon="🔢" label="子编码">
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { n: 1, color: '#dc2626', label: '危重伤' },
            { n: 2, color: '#ea580c', label: '重伤' },
            { n: 3, color: '#d97706', label: '轻伤' },
            { n: 4, color: '#16a34a', label: '非紧急' },
          ].map(({ n, color, label }) => {
            const active = terminal.determinantSubcode === n
            return (
              <button
                key={n}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  borderRadius: 4,
                  border: `2px solid ${color}`,
                  backgroundColor: active ? color : '#ffffff',
                  color: active ? '#fff' : color,
                  fontSize: 11,
                  fontWeight: active ? 'bold' : 'normal',
                  cursor: 'pointer',
                  textAlign: 'center' as const,
                }}
                onClick={() => onSetDeterminantSubcode(n)}
              >
                <div style={{ fontWeight: 'bold', fontSize: 13 }}>{n}</div>
                <div style={{ fontSize: 9, opacity: active ? 1 : 0.6 }}>{label}</div>
              </button>
            )
          })}
        </div>
      </FieldRow>

      {/* ====== 备注 ====== */}
      <SectionTitle icon="📝" text="事件备注" />
      <textarea
        style={styles.formInput}
        value={terminal.conditionNote}
        onChange={(e) => onChange('conditionNote', e.target.value)}
        placeholder="记录其他重要信息…"
        rows={2}
      />
    </div>
  )
}

/** 小标题 */
function SectionTitle({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      fontSize: 12,
      fontWeight: 'bold',
      color: '#64748b',
      borderBottom: '1px solid #e2e8f0',
      padding: '6px 0 3px',
      marginBottom: 4,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    }}>
      {icon} {text}
    </div>
  )
}

/** 单行输入框 */
function FieldRow({
  icon,
  label,
  children,
}: {
  icon: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={styles.formLabel}>
        {icon} {label}
      </label>
      {children}
    </div>
  )
}

/** 生命体征切换器 — 带信息质量标记 */
function StatusToggle({
  label,
  field,
  value,
  trueLabel,
  falseLabel,
  colorTrue,
  colorFalse,
  onToggle,
}: {
  label: string
  field: 'conscious' | 'breathing'
  value: boolean | null
  trueLabel: string
  falseLabel: string
  colorTrue: string
  colorFalse: string
  onToggle: (field: 'conscious' | 'breathing', val: boolean) => void
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={styles.formLabel}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          style={{
            flex: 1,
            padding: '4px 8px',
            borderRadius: 4,
            border: `1px solid ${colorTrue}`,
            backgroundColor: value === true ? colorTrue : 'transparent',
            color: value === true ? '#fff' : colorTrue,
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: value === true ? 'bold' : 'normal',
          }}
          onClick={() => onToggle(field, true)}
        >
          {trueLabel}
        </button>
        <button
          style={{
            flex: 1,
            padding: '4px 8px',
            borderRadius: 4,
            border: `1px solid ${colorFalse}`,
            backgroundColor: value === false ? colorFalse : 'transparent',
            color: value === false ? '#fff' : colorFalse,
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: value === false ? 'bold' : 'normal',
          }}
          onClick={() => onToggle(field, false)}
        >
          {falseLabel}
        </button>
      </div>
    </div>
  )
}

/** MPDS 判定码选择器 — Echo/Delta/Charlie/Bravo/Alpha */
function DeterminantSelector({
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

// ============================================================
// 样式
// ============================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#eef2f6',
    color: '#1e293b',
    overflow: 'hidden',
  },

  // ---------- 电话面板（全宽）----------
  phonePanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    minHeight: 0,
    border: '1px solid #e2e8f0',
  },

  phoneHeader: {
    padding: '8px 12px',
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #dc2626',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  // LIVE 指示器行
  callLiveBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    fontSize: 12,
    color: '#dc2626',
    animation: 'pulse-live 1s ease-in-out infinite',
    display: 'inline-block',
  },
  liveLabel: {
    fontSize: 13,
    fontWeight: 900,
    color: '#dc2626',
    fontFamily: 'monospace',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  callTimer: {
    fontSize: 24,
    fontWeight: 700,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  targetBadge: {
    marginLeft: 'auto',
    padding: '2px 8px',
    borderRadius: 10,
    border: '1px solid',
    fontSize: 12,
    fontWeight: 700,
    fontFamily: 'monospace',
  },
  phoneHeaderInfo: {
    fontSize: 13,
    display: 'flex',
    gap: 6,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  callPhaseTag: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },

  // ---------- 对话区 — 通话逐字稿 ----------
  dialogueArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minHeight: 0,
    backgroundColor: '#f8fafc',
  },

  transcript: {
    fontSize: 14,
    lineHeight: 1.7,
    fontFamily: '"Source Code Pro", "Consolas", "Courier New", monospace',
    padding: '4px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  transcriptSpeaker: {
    display: 'inline',
    fontWeight: 700,
    marginRight: 6,
    fontSize: 13,
  },
  transcriptText: {
    display: 'inline',
  },
  streamCursor: {
    display: 'inline-block',
    color: '#ef4444',
    fontSize: 14,
    marginLeft: 0,
    animation: 'pulse-live 0.7s step-end infinite',
    verticalAlign: 'baseline',
  },

  // ---------- 可拖拽分隔条 ----------
  splitBar: {
    flex: 'none',
    height: 10,
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'row-resize',
    userSelect: 'none',
    transition: 'background-color 0.15s',
    position: 'relative',
    zIndex: 5,
    flexShrink: 0,
  },
  splitBarHandle: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
    pointerEvents: 'none' as const,
  },
  splitBarDot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    backgroundColor: '#94a3b8',
  },

  // ---------- 问询区域 ----------
  questionArea: {
    borderTop: '1px solid #e2e8f0',
    padding: '6px 10px',
    backgroundColor: '#f8fafc',
    flex: 1,
    minHeight: 60,
    overflowY: 'auto' as const,
  },
  // 来电者压力条
  stressBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '2px 0',
  },
  stressTrack: {
    flex: 1,
    height: 7,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  stressFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.5s ease, background-color 0.3s ease',
  },
  bottomToolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 10px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  terminalBtn: {
    padding: '8px 16px',
    borderRadius: 6,
    border: '2px solid',
    backgroundColor: 'transparent',
    color: '#475569',
    fontSize: 14,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    transition: 'all 0.2s',
  },
  calmBtn: {
    padding: '5px 12px',
    borderRadius: 4,
    border: '1px solid #3b82f6',
    backgroundColor: '#eff6ff',
    color: '#475569',
    fontSize: 13,
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },

  qSection: {
    marginBottom: 6,
  },

  // ---------- 5步协议步骤列表 ----------
  protocolStepsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    marginBottom: 4,
  },
  protocolStepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid',
    transition: 'all 0.25s',
  },
  protocolStepNum: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 900,
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  protocolStepBtn: {
    padding: '4px 12px',
    borderRadius: 4,
    border: 'none',
    backgroundColor: '#d97706',
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.15s',
    fontFamily: 'monospace',
  },
  qBtnSmall: {
    padding: '3px 8px',
    borderRadius: 4,
    border: '1px solid',
    fontSize: 11,
    lineHeight: '1.3',
    textAlign: 'center' as const,
  },

  qSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 3,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 2,
  },
  qGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 4,
  },
  qBtn: {
    padding: '5px 10px',
    borderRadius: 4,
    border: '1px solid',
    fontSize: 13,
    transition: 'all 0.15s',
    lineHeight: '1.4',
  },

  // ---------- 急救指导 ----------
  guidancePanel: {
    borderTop: '2px solid #dc2626',
    padding: '10px 14px',
    backgroundColor: '#fef2f2',
    flex: 1,
    minHeight: 60,
    overflowY: 'auto' as const,
  },
  guidanceTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  guidanceIntro: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
    padding: '6px 10px',
    backgroundColor: '#fefce8',
    borderRadius: 4,
  },
  guidanceStep: {
    marginTop: 8,
  },
  guidancePrompt: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
  },
  guidanceOption: {
    padding: '8px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: 14,
    color: '#475569',
    textAlign: 'left' as const,
    transition: 'all 0.15s',
  },

  // ---------- 收尾 ----------
  closingPanel: {
    borderTop: '1px solid #e2e8f0',
    padding: '12px 14px',
    backgroundColor: '#f8fafc',
    textAlign: 'center' as const,
    flex: 1,
    minHeight: 60,
    overflowY: 'auto' as const,
  },
  endCallBtn: {
    padding: '8px 24px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  // ---------- MPDS 调度卡模态框 ----------
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(2px)',
  },
  modalCard: {
    width: 560,
    maxHeight: '90vh',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 0 0 2px #dc2626',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #dc2626',
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  modalHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  mpdsModalBadge: {
    backgroundColor: '#f1f5f9',
    border: '2px solid #3b82f6',
    borderRadius: 6,
    padding: '6px 12px',
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 900,
    fontFamily: 'monospace',
  },
  modalCloseBtn: {
    padding: '4px 10px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
    padding: '10px 16px',
    overflowY: 'auto' as const,
    minHeight: 0,
  },

  // ---------- 临床判断卡（内联在对话旁）----------
  judgmentCard: {
    marginLeft: 32,
    marginTop: 4,
    marginBottom: 8,
    padding: '8px 10px',
    borderRadius: 8,
    border: '2px solid',
    backgroundColor: '#f8fafc',
    animation: 'slide-in-right 0.3s ease-out',
    maxWidth: 460,
  },
  judgmentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#d97706',
  },
  judgmentIcon: {
    fontSize: 14,
  },
  judgmentQuestion: {
    flex: 1,
  },
  judgmentOptions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  judgmentOption: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid',
    fontSize: 12,
    textAlign: 'left' as const,
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  },
  judgmentOptionMarker: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: '#f1f5f9',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    flexShrink: 0,
    marginTop: 1,
  },
  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalDispatchBtn: {
    padding: '10px 24px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  modalSaveBtn: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
  },
  modalEndCallBtn: {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    fontSize: 11,
    cursor: 'pointer',
  },
  modalWarning: {
    padding: '6px 16px',
    backgroundColor: '#fef2f2',
    borderTop: '1px solid #dc2626',
    color: '#dc2626',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center' as const,
  },

  // ---------- 终端登记表单（模态框内复用）----------
  terminalForm: {
    padding: '0',
  },

  dispatchSent: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    borderRadius: 6,
    border: '1px solid #22c55e',
    flex: 1,
  },

  formField: {
    marginBottom: 10,
  },
  formLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 4,
  },
  formInput: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 4,
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#334155',
    fontSize: 13,
    fontFamily: 'monospace',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },

  // ---------- 等待接听 — 紧急调度台 ----------
  centerMessage: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
  },
  answerBtn: {
    padding: '14px 48px',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    animation: 'pulse-alert 1.5s ease-in-out infinite',
    letterSpacing: 4,
  },
}
