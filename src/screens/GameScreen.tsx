// ============================================================
// 零点接线台 — 调度主界面（双线程：电话+终端）
// ============================================================

import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { createInitialState } from '../game/core/initialState'
import type { MpdsDeterminant, CallPhase, TerminalState, CalleeStressLevel } from '../game/types'
import { MPDS_DETERMINANT_INFO, STRESS_INFO, PROTOCOL_REF, TRIAGE_LABELS } from '../game/types'
import type { TerminalField } from '../game/core/actions'
import { worldReducer } from '../game/core/worldReducer'
import { getCaller } from '../game/npc/personas'
import { detectEnding } from '../game/endings/endings'
import { Phone } from 'lucide-react'
import { Hud } from '../components/hud/Hud'
import { CallInfoBar } from '../components/hud/CallInfoBar'
import { MiniGameHost } from '../components/minigames/MiniGameHost'
import { CallDebrief } from '../components/call/CallDebrief'
import { ROGUE_PERKS, getPerkChoices } from '../game/core/perks'
import type { RoguePerkId } from '../game/core/perks'
import { VitalSignsBar } from '../components/feedback/VitalSignsBar'
import { EventToastStack } from '../components/feedback/EventToastStack'
import { VehicleSelector } from '../components/feedback/VehicleSelector'
import { CityMap } from '../components/map/CityMap'
import { CallDrawer } from '../components/call/CallDrawer'
import { HistoryPanel } from '../components/call/HistoryPanel'
import { GuidanceOverlay } from '../components/guidance/GuidanceOverlay'
import type { EndingDef } from '../game/types'
import { useAudio } from '../audio/AudioContext'
import { stressToEmotion, stressToTypewriterInterval } from '../audio/ttsEmotion'

interface Props {
  onNavigate: (screen: 'title' | 'ending', ending?: EndingDef, totalScore?: number, callScores?: number[]) => void
  scenarioId?: string
}

export function GameScreen({ onNavigate, scenarioId }: Props) {
  const [state, dispatch] = useReducer(worldReducer, null, createInitialState)
  const [terminalModalOpen, setTerminalModalOpen] = useState(false)
  const [vehicleSelectorOpen, setVehicleSelectorOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(true)
  // Drawer 显示模式：当前通话 vs 历史任务（点击地图上的救护车触发）
  const [drawerMode, setDrawerMode] = useState<'current' | { type: 'history'; callId: string }>('current')
  const [guidanceCollapsed, setGuidanceCollapsed] = useState(false)

  // --- 启动班次 ---
  useEffect(() => {
    dispatch({ type: 'START_SHIFT', forceScenarios: scenarioId ? [scenarioId] : undefined })
  }, [scenarioId])

  // --- 新通话时自动展开调度卡 + 切回当前对话模式 ---
  // 调度卡改为 leftsider，随通话自动展开；玩家可手动 ✕ 折叠
  useEffect(() => {
    if (state.currentCall) {
      setTerminalModalOpen(true)
      setDrawerMode('current')
    } else {
      setTerminalModalOpen(false)
    }
  }, [state.currentCall])

  // --- 点击地图救护车 → 拉出该任务历史对话 drawer ---
  const handleAmbulanceClick = useCallback((_vehicleId: string, callId: string) => {
    setDrawerMode({ type: 'history', callId })
    setDrawerOpen(true)
  }, [])

  // --- 关闭历史 view 回到当前通话 ---
  const closeHistoryView = useCallback(() => {
    setDrawerMode('current')
  }, [])

  // 当前 drawer 模式 + 历史条目查找
  const isHistoryView = typeof drawerMode !== 'string'
  const historyEntry = isHistoryView
    ? state.callHistory.find(h => h.callId === (drawerMode as { type: 'history'; callId: string }).callId) ?? null
    : null

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
      onNavigate('ending', ending, state.totalScore, state.callScores)
    }
  }, [onNavigate, state.callScores, state.screen, state.totalScore])

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

  // 派车音效（合成提示音 + 救护车鸣笛）
  useEffect(() => {
    if (state.dispatchSent && !prevDispatchSent.current) {
      audio.play('dispatch')
      audio.playSiren()
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

  // 救援结算完成 → 2.5s 后自动挂断进入下一通（地图接管观察期）
  const prevOutcome = useRef<string | null>(null)
  useEffect(() => {
    const outcome = state.rescue.outcome
    if (outcome && outcome !== prevOutcome.current && state.currentCall) {
      prevOutcome.current = outcome
      const t = setTimeout(() => {
        dispatch({ type: 'END_CALL' })
      }, 2500)
      return () => clearTimeout(t)
    }
    prevOutcome.current = outcome
  }, [state.rescue.outcome, state.currentCall])

  // 患者死亡（rescue.outcome 未及触发）→ 2s 后自动挂断
  useEffect(() => {
    if (state.patientStatus?.died && state.currentCall && state.rescue.outcome === null) {
      const t = setTimeout(() => dispatch({ type: 'END_CALL' }), 2000)
      return () => clearTimeout(t)
    }
  }, [state.patientStatus?.died, state.currentCall, state.rescue.outcome])

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
    const interval = stressToTypewriterInterval(state.callerState?.stress ?? 50)
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
    }, interval)  // 按 stress 分档: 65-120ms/char
  }, [state.callerState?.stress])

  // 新对话行入队
  useEffect(() => {
    const curLen = state.dialogueLog.length
    const oldLen = prevLogLen.current
    prevLogLen.current = curLen

    if (curLen <= oldLen) return

    for (let i = oldLen; i < curLen; i++) {
      const line = state.dialogueLog[i]
      // 系统提示行不流式，直接显示；仅来电者/接线员行逐字输出
      if (line.speaker !== 'system') {
        pendingQueue.current.push({ idx: i, text: line.text })
        pendingSet.current.add(i)
      }
      // TTS: 仅来电者发声 (接线员玩家自己, 系统提示不发声)
      if (line.speaker === 'caller') {
        const stress = state.callerState?.stress ?? 50
        audio.tts.enqueue(`caller-${i}`, {
          text: line.text,
          kind: 'caller',
          emotion: stressToEmotion(stress),
        }).catch(() => undefined)
      }
    }

    startQueue()
  }, [state.dialogueLog.length, startQueue, state.callerState?.stress, audio.tts])

  // 通话结束 (currentCall 由有变无) → 停掉所有未播完的 TTS
  const prevCallRef = useRef(state.currentCall)
  useEffect(() => {
    if (prevCallRef.current && !state.currentCall) {
      audio.tts.stop()
    }
    prevCallRef.current = state.currentCall
  }, [state.currentCall, audio.tts])

  /**
   * 玩家动作会触发新的来电者回应 → 打断正在播放/排队的旧来电者语音
   * (打字机按设计保留, 让旧文本继续打完整句, 不与 TTS 强同步)
   */
  const interruptCallerVoice = useCallback(() => {
    audio.tts.stop()
  }, [audio.tts])

  // --- 安抚来电者 ---
  const handleCalm = useCallback(() => {
    interruptCallerVoice()
    dispatch({ type: 'CALM_CALLER' })
  }, [interruptCallerVoice])

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

  // --- 进入 closing 阶段自动折叠抽屉（让地图接管） ---
  const prevPhaseRef = useRef(state.callPhase)
  useEffect(() => {
    if (prevPhaseRef.current === state.callPhase) return
    // 进入 closing（指导完成或无指导直接派车后）→ 折叠
    if (state.callPhase === 'closing' && prevPhaseRef.current !== 'closing') {
      setDrawerOpen(false)
    }
    // 新通话开始 → 展开 + 重置指导折叠
    if (state.callPhase === 'questioning' && prevPhaseRef.current === 'completed') {
      setDrawerOpen(true)
      setGuidanceCollapsed(false)
    }
    // 首次进入 guidance 阶段 → 默认展开指导浮层
    if (state.callPhase === 'guidance' && prevPhaseRef.current !== 'guidance') {
      setGuidanceCollapsed(false)
    }
    prevPhaseRef.current = state.callPhase
  }, [state.callPhase])

  // --- 用户展开抽屉查看对话时，自动折叠指导浮层（职责分离） ---
  useEffect(() => {
    if (drawerOpen && state.callPhase === 'guidance') {
      setGuidanceCollapsed(true)
    }
  }, [drawerOpen, state.callPhase])

  // --- 无 currentCall 但还有下一通（pendingCallPhase='completed' 后），新 ANSWER_CALL 时展开 ---
  useEffect(() => {
    if (state.currentCall && state.callPhase === 'questioning') {
      setDrawerOpen(true)
    }
  }, [state.currentCall, state.callPhase])

  // --- 处理派车：先弹车辆选择 ---
  const handleDispatch = useCallback(() => {
    if (!state.currentCall) return
    if (!state.terminal.determinant) return // 必须选择判定码才能派车
    setTerminalModalOpen(false) // 关闭调度卡，避免遮挡车辆选择
    setVehicleSelectorOpen(true)
  }, [state.currentCall, state.terminal.determinant])

  // --- 选定车辆后真正派出 ---
  const handleConfirmVehicle = useCallback((vehicleId: string) => {
    interruptCallerVoice()
    setVehicleSelectorOpen(false)
    setTerminalModalOpen(false)
    dispatch({ type: 'DISPATCH', vehicleId })
  }, [interruptCallerVoice])

  // --- 关闭一个事件 toast ---
  const handleDismissEvent = useCallback((eventId: string) => {
    interruptCallerVoice()
    dispatch({ type: 'DISMISS_PATIENT_EVENT', eventId })
  }, [interruptCallerVoice])

  // --- 处理临床判断选择 ---
  const handleJudgment = useCallback((judgmentId: string, optionIndex: number) => {
    interruptCallerVoice()
    dispatch({ type: 'MAKE_JUDGMENT', judgmentId, chosenOptionIndex: optionIndex })
  }, [interruptCallerVoice])

  // --- 处理挂断电话（预计算 Perk 选择以保证 reducer 确定性）---
  const handleEndCall = useCallback(() => {
    const perkChoices = getPerkChoices(state.perks, 3)
    dispatch({ type: 'END_CALL', perkChoices })
  }, [state.perks])

  if (state.lastDebrief) {
    return (
      <div style={styles.container}>
        <Hud state={state} />
        <CallDebrief
          debrief={state.lastDebrief}
          onNext={() => dispatch({ type: 'DISMISS_DEBRIEF' })}
          nextLabel={state.shiftCompletePending ? '生成班次报告' : '查看班次收益'}
        />
      </div>
    )
  }

  if (state.pendingPerkChoices.length > 0) {
    return (
      <div style={styles.container}>
        <Hud state={state} />
        <PerkSelection
          choices={state.pendingPerkChoices}
          owned={state.perks}
          onChoose={(perkId) => dispatch({ type: 'CHOOSE_PERK', perkId })}
        />
      </div>
    )
  }

  // 无活跃通话时 — 等待接听（地图作背景 + 浮动卡片）
  if (!state.currentCall && state.callIndex < state.totalCalls) {
    return (
      <div style={styles.container}>
        <Hud state={state} />
        <div style={styles.mainArea}>
          <CityMap state={state} />
          <div style={styles.floatCard}>
            <CallWaiting
              callIndex={state.callIndex}
              totalCalls={state.totalCalls}
              onAnswer={() => dispatch({ type: 'ANSWER_CALL' })}
              shiftElapsed={state.shiftElapsed}
              totalScore={state.totalScore}
              lastScore={state.callScores[state.callScores.length - 1]}
            />
          </div>
          <EventToastStack events={state.patientEvents} onDismiss={handleDismissEvent} />
        </div>
      </div>
    )
  }

  // 无更多通话
  if (!state.currentCall && state.callIndex >= state.totalCalls) {
    return (
      <div style={styles.container}>
        <Hud state={state} />
        <div style={styles.mainArea}>
          <CityMap state={state} />
          <div style={styles.floatCard}>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>本班次所有通话已处理完毕</h2>
            <p style={{ color: 'var(--text-muted)' }}>正在生成班次评估报告...</p>
          </div>
          <EventToastStack events={state.patientEvents} onDismiss={handleDismissEvent} />
        </div>
      </div>
    )
  }

  // --- 通话中 ---
  const call = state.currentCall!
  const caller = getCaller(call.callerId)
  const hasTriage = state.terminal.triage !== null

  // 抽屉标题与迷你信息
  const callElapsed = state.shiftElapsed - state.callStartTime
  const callMm = String(Math.floor(callElapsed / 60)).padStart(2, '0')
  const callSs = String(callElapsed % 60).padStart(2, '0')
  const drawerTitle = `${callMm}:${callSs}`
  const drawerMini = state.patientStatus ? (
    <div style={{
      width: 8, height: 100, backgroundColor: '#2a323e', borderRadius: 4,
      overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse',
    }}>
      <div style={{
        width: '100%',
        height: `${state.patientStatus.stability}%`,
        backgroundColor:
          state.patientStatus.vitalSign === 'stable' ? '#16a34a' :
          state.patientStatus.vitalSign === 'warning' ? '#f59e0b' :
          state.patientStatus.vitalSign === 'critical' ? '#ef4444' : '#7f1d1d',
        transition: 'height 0.5s ease, background-color 0.3s ease',
      }} />
    </div>
  ) : null

  return (
    <div style={styles.container}>
      <Hud state={state} />
      <CallInfoBar state={state} visible={drawerOpen} />

      <div style={styles.mainArea}>
        <CityMap state={state} onAmbulanceClick={handleAmbulanceClick} />

        <CallDrawer
          open={drawerOpen}
          onToggle={() => setDrawerOpen(o => !o)}
          active={state.callPhase !== 'completed' && !historyEntry}
          title={drawerTitle}
          mini={drawerMini}
          historyBadge={historyEntry ? '历史任务' : undefined}
        >
        {historyEntry ? (
          <HistoryPanel entry={historyEntry} onClose={closeHistoryView} />
        ) : (
          <>
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

        {/* 即时反馈：患者生命体征 */}
        {state.patientStatus && (
          <VitalSignsBar status={state.patientStatus} />
        )}

        {/* 对话区 — 救护车进度由主地图承载，避免重复 */}

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
            backgroundColor: splitHovered ? 'var(--border-bright)' : 'var(--border)',
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

        {/* 急救指导面板 — 已移至 mainArea 浮层（GuidanceOverlay） */}

        {/* 问询按钮区 */}
        {(state.callPhase === 'questioning' || state.callPhase === 'connected') && (
          <QuestionPanel
            call={call}
            askedMPDS={state.callerState?.askedMPDS ?? []}
            stressLevel={state.callerState?.stressLevel ?? '紧张'}
            stress={state.callerState?.stress ?? 50}
            onAsk={(id) => { interruptCallerVoice(); dispatch({ type: 'ASK_QUESTION', questionId: id }) }}
            onCalm={handleCalm}
            onOpenTerminal={handleOpenTerminal}
            hasTriage={hasTriage}
          />
        )}

        {/* 收尾阶段 — 弹窗 */}
        {state.callPhase === 'closing' && call && (
          <div style={styles.guidanceOverlay}>
            <div style={{ ...styles.guidanceWindow, width: 360 }}>
              <div style={styles.guidanceWindowHeader}>
                <span style={{ fontSize: 18 }}>✅</span>
                <span style={{ fontSize: 15, fontWeight: 'bold', color: '#4ade80' }}>通话完成</span>
              </div>
              <ClosingPanel
                guidance={!!call.guidance}
                ambulanceRemaining={state.ambulanceRemaining}
                terminal={state.terminal}
                onEndCall={() => { interruptCallerVoice(); handleEndCall() }}
              />
            </div>
          </div>
        )}
          </>
        )}
        </CallDrawer>

        {/* ====== 急救指导浮层（居中模态 / 折叠为左下角悬浮球） ====== */}
        {state.callPhase === 'guidance' && call.guidance && (
          <GuidanceOverlay
            collapsed={guidanceCollapsed}
            onToggle={() => setGuidanceCollapsed(c => !c)}
            title={`♥ ${call.guidance.title}`}
            subtitle={`步骤 ${Math.min(state.guidanceStepIndex + 1, call.guidance.steps.length)}/${call.guidance.steps.length}`}
          >
            <GuidancePanel
              guidance={call.guidance}
              stepIndex={state.guidanceStepIndex}
              results={state.guidanceResults}
              paused={guidanceCollapsed}
              onAnswer={(stepIdx, selectedIdx) =>
                dispatch({ type: 'ANSWER_GUIDANCE', stepIndex: stepIdx, selectedIndex: selectedIdx })
              }
              onCompleteMiniGame={(stepIdx, score, passed) =>
                dispatch({ type: 'COMPLETE_MINIGAME', stepIndex: stepIdx, score, passed })
              }
            />
          </GuidanceOverlay>
        )}

      {/* ====== MPDS调度卡 leftsider ====== */}
      <AnimatePresence>
        {terminalModalOpen && (
          <TerminalModal
            terminal={state.terminal}
            dispatchSent={state.dispatchSent}
            ambulanceRemaining={state.ambulanceRemaining}
            onChange={(field, value) =>
              dispatch({ type: 'UPDATE_TERMINAL', field, value })
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
            onEndCall={() => { interruptCallerVoice(); setTerminalModalOpen(false); handleEndCall() }}
          />
        )}
      </AnimatePresence>

      {/* 即时反馈：顶部事件 toast 堆叠 */}
      <EventToastStack
        events={state.patientEvents}
        onDismiss={handleDismissEvent}
      />

      {/* 派车车辆选择模态 */}
      {vehicleSelectorOpen && (
        <VehicleSelector
          fleet={state.fleet}
          suggestedCapability={call.correctTriage}
          onSelect={handleConfirmVehicle}
          onCancel={() => setVehicleSelectorOpen(false)}
        />
      )}
      </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        lineHeight: 1,
        marginBottom: 8,
        animation: 'call-incoming 1.2s ease-in-out infinite',
      }}>
        <Phone size={64} color="#dc2626" strokeWidth={1.8} />
      </div>
      <h2 style={{ color: 'var(--text-primary)', margin: '0 0 4px', fontSize: 18 }}>
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
      <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 12 }}>
        班次运行 {Math.floor(shiftElapsed / 60)}分{shiftElapsed % 60}秒 | 累计 {totalScore}分
      </p>
      <button style={styles.answerBtn} onClick={onAnswer}>
        接 听 电 话
      </button>
    </div>
  )
}

function PerkSelection({
  choices,
  owned,
  onChoose,
}: {
  choices: RoguePerkId[]
  owned: RoguePerkId[]
  onChoose: (perkId: RoguePerkId) => void
}) {
  return (
    <div style={styles.perkScreen}>
      <div style={styles.perkHeader}>班次经验</div>
      <h2 style={styles.perkTitle}>选择一项后续收益</h2>
      <p style={styles.perkSubtitle}>
        已获得 {owned.length} 项收益。每次选择只影响本轮值班，用来形成轻量肉鸽节奏。
      </p>
      <div style={styles.perkGrid}>
        {choices.map(id => {
          const perk = ROGUE_PERKS[id]
          return (
            <button key={id} style={styles.perkCard} onClick={() => onChoose(id)}>
              <span style={styles.perkCategory}>{perk.category.toUpperCase()}</span>
              <span style={styles.perkName}>{perk.title}</span>
              <span style={styles.perkDesc}>{perk.description}</span>
              <span style={styles.perkEffect}>{perk.effect}</span>
            </button>
          )
        })}
      </div>
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
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span>基站 {baseStation}</span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span>{callerName}（{relationship}）</span>
      </div>

      {/* 第三行：来电者压力指示器 */}
      <div style={styles.stressBar}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 40 }}>
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

/** 问题层级配色 */
const TIER_STYLE: Record<string, { border: string; bg: string; badge: string; label: string }> = {
  critical:  { border: '#dc2626', bg: 'rgba(220, 38, 38, 0.08)', badge: '#dc2626', label: '◆ 关键' },
  important: { border: '#d97706', bg: 'rgba(217, 119, 6, 0.08)', badge: '#d97706', label: '◆ 重要' },
  detail:    { border: '#16a34a', bg: 'rgba(22, 163, 74, 0.08)', badge: '#16a34a', label: '◆ 细节' },
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
    { step: 1, id: 'step1_location', icon: '◉', label: '位置确认', qText: '请问事发的确切地址是哪里？', timeCost: 2, desc: '派车根本依据' },
    { step: 2, id: 'step2_event', icon: '≡', label: '事件简述', qText: '好的，请告诉我具体发生了什么事？', timeCost: 3, desc: '获取主诉入口' },
    { step: 3, id: 'step3_age', icon: '○', label: '患者年龄', qText: '患者多大年龄了？', timeCost: 2, desc: '关键救治因素' },
    { step: 4, id: 'step4_vitals', icon: '♥', label: '意识与呼吸', qText: '患者清醒吗？他/她还有呼吸吗？', timeCost: 3, desc: '最关键的病情评估' },
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
                borderColor: done ? '#16a34a' : isCurrent ? '#d97706' : 'var(--border)',
                backgroundColor: done ? 'rgba(22, 163, 74, 0.08)' : isCurrent ? 'rgba(217, 119, 6, 0.08)' : 'transparent',
              }}>
                {/* 步骤编号 */}
                <div style={{
                  ...styles.protocolStepNum,
                  backgroundColor: done ? '#16a34a' : isCurrent ? '#d97706' : 'var(--border)',
                  color: done ? '#fff' : isCurrent ? '#fff' : 'var(--text-secondary)',
                }}>
                  {done ? '✓' : ps.step}
                </div>

                {/* 步骤信息 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: done ? 'normal' : 'bold',
                    color: done ? '#16a34a' : isCurrent ? '#d97706' : 'var(--text-secondary)',
                    textDecoration: done ? 'line-through' : 'none',
                  }}>
                    {ps.icon} {ps.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
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
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
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
              <div style={{ ...styles.qBtnSmall, borderColor: '#16a34a', color: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.08)' }}>
                ✓ 地址已精确
              </div>
            )}

            {/* 联系电话 */}
            {!contactDone && (
              <AskBtnEx
                id="ask_contact"
                label="联系电话"
                icon={<Phone size={10} />}
                timeCost={1}
                done={false}
                tier="detail"
                onClick={() => onAsk('ask_contact')}
              />
            )}
            {contactDone && (
              <div style={{ ...styles.qBtnSmall, borderColor: '#16a34a', color: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.08)' }}>
                ✓ 已记录
              </div>
            )}

            {/* 场景专属补充MPDS问题 */}
            {supplementaryQ.map((q) => (
              <AskBtnEx
                key={q.id}
                id={q.id}
                label={q.label}
                icon={CATEGORY_ICON[q.category] || '≡'}
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
              backgroundColor: hasTriage ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)',
            }}
            onClick={onOpenTerminal}
          >
            {hasTriage ? '✓' : '⚠'} 调度卡
            {!hasTriage && (
              <span style={{ fontSize: 9, color: '#ff6b6b', display: 'block' }}>
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
  age_gender: '○',
  mechanism: '🔧',
}

/** 问询按钮 — 带层级颜色 + 时间代价徽章 */
function AskBtnEx({
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
  icon?: React.ReactNode
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
        backgroundColor: done ? 'rgba(22, 163, 74, 0.08)' : disabled ? 'var(--bg-surface)' : (ts?.bg ?? 'var(--bg-elevated)'),
        borderColor: done ? '#16a34a' : disabled ? 'var(--border)' : (ts?.border ?? '#3b82f6'),
        color: done ? '#16a34a' : disabled ? 'var(--border-bright)' : '#b1bac4',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled && !done ? 0.45 : 1,
        position: 'relative',
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
        {done ? <span>✓ </span> : icon ? <span style={{ marginRight: 2, display: 'flex' }}>{icon}</span> : null}
        <span style={{ fontWeight: done ? 'normal' : 'bold', fontSize: 11 }}>{label}</span>
      </div>
      {!done && (
        <span style={{
          position: 'absolute',
          top: -5,
          right: -5,
          backgroundColor: ts?.badge ?? '#3b82f6',
          color: 'var(--bg)',
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

/** MPDS 调度卡 leftsider（替代 popup，自动展开动画） */
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
    <motion.aside
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', stiffness: 240, damping: 30 }}
      style={styles.modalOverlay}
    >
      <div style={styles.modalCard}>
        {/* sider 头部 */}
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderLeft}>
            <span style={styles.mpdsModalBadge}>
              协议 {terminal.protocolNumber ?? '?'}
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                MPDS 调度终端
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
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

        {/* sider 内容 */}
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

        {/* sider 底部 — 操作按钮 */}
        <div style={styles.modalFooter}>
          {!dispatchSent ? (
            <>
              <button style={styles.modalEndCallBtn} onClick={onEndCall}>
                ✕ 挂断
              </button>
              <div style={{ flex: 1 }} />
              <button style={styles.modalSaveBtn} onClick={onClose}>
                ≡ 暂存
              </button>
              <button
                style={{
                  ...styles.modalDispatchBtn,
                  ...(!terminal.determinant ? styles.modalDispatchBtnDisabled : {}),
                }}
                onClick={onDispatch}
                disabled={!terminal.determinant}
                title={terminal.determinant ? '确认派车' : '请先在调度卡中选择 MPDS 判定码'}
              >
                ▸ 确认派车
              </button>
            </>
          ) : (
            <div style={styles.dispatchSent}>
              <span style={{ fontSize: 20 }}>▸</span>
              <div>
                <div style={{ fontWeight: 'bold', color: '#15803d' }}>救护车已派出</div>
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
    </motion.aside>
  )
}

/** 收尾面板 */
function ClosingPanel({
  guidance,
  ambulanceRemaining,
  terminal,
  onEndCall,
}: {
  guidance: boolean
  ambulanceRemaining: number
  terminal: TerminalState
  onEndCall: () => void
}) {
  const arrived = ambulanceRemaining <= 0
  const protocolEntry = PROTOCOL_REF.find(([n]) => n === terminal.protocolNumber)
  const triageLabel = terminal.triage
    ? ({ red: '红色 — 濒危', yellow: '黄色 — 危重', green: '绿色 — 轻伤', black: '死亡/无需抢救' } as Record<string, string>)[terminal.triage]
    : '—'

  const triageColor = terminal.triage === 'red' ? '#dc2626'
    : terminal.triage === 'yellow' ? '#eab308'
    : terminal.triage === 'green' ? '#16a34a'
    : terminal.triage === 'black' ? '#6b7280'
    : 'var(--text-muted)'

  return (
    <div style={styles.closingPanel}>
      {/* 状态卡片 */}
      <div style={styles.closingStatusCard}>
        <div style={{ fontSize: 36, marginBottom: 8, filter: arrived ? 'none' : 'brightness(1.2)', animation: arrived ? 'none' : 'pulse 1.5s ease-in-out infinite' }}>
          🚑
        </div>
        <div style={{ fontSize: 15, fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 4 }}>
          {arrived ? '救护车已到达现场' : '等待救护车到达'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          {arrived ? '急救人员正在接手处理' : guidance ? '急救指导已完成' : '派车指令已发出'}
        </div>
        {!arrived && (
          <>
            <div style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              backgroundColor: 'var(--border)',
              overflow: 'hidden',
              marginBottom: 6,
            }}>
              <div style={{
                height: '100%',
                borderRadius: 3,
                width: `${Math.max(5, (45 - ambulanceRemaining) / 45 * 100)}%`,
                background: ambulanceRemaining > 10
                  ? 'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))'
                  : 'linear-gradient(90deg, var(--warning-amber), var(--danger-red))',
                transition: 'width 1s linear',
              }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: ambulanceRemaining > 10 ? 'var(--accent-blue)' : 'var(--danger-red)' }}>
              {ambulanceRemaining}s
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>预计到达时间</div>
          </>
        )}
        {arrived && (
          <div style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--success-green)' }}>
            ✓ 任务完成
          </div>
        )}
      </div>

      {/* 通话摘要 */}
      <div style={styles.closingSummaryGrid}>
        <div style={styles.closingSummaryItem}>
          <div style={styles.closingSummaryLabel}>📍 地址</div>
          <div style={styles.closingSummaryValue}>
            {terminal.address ? '已确认' : '待确认'}
          </div>
        </div>
        <div style={styles.closingSummaryItem}>
          <div style={styles.closingSummaryLabel}>📋 协议</div>
          <div style={styles.closingSummaryValue}>
            {protocolEntry ? `${protocolEntry[0]}·${protocolEntry[1]}` : '—'}
          </div>
        </div>
        <div style={styles.closingSummaryItem}>
          <div style={styles.closingSummaryLabel}>🏥 分诊</div>
          <div style={{ ...styles.closingSummaryValue, color: triageColor }}>
            {terminal.triage ? triageLabel : '未分诊'}
          </div>
        </div>
        <div style={styles.closingSummaryItem}>
          <div style={styles.closingSummaryLabel}>🚨 响应</div>
          <div style={styles.closingSummaryValue}>
            {terminal.determinant
              ? `${terminal.determinant}${terminal.determinantSubcode ? `-${terminal.determinantSubcode}` : ''}`
              : '—'}
          </div>
        </div>
      </div>

      {/* 挂断按钮 */}
      <button
        style={styles.endCallBtn}
        onClick={onEndCall}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.transform = 'scale(1.02)' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.transform = 'scale(1)' }}
      >
        <span>📞</span>
        <span>结束通话</span>
      </button>
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
  paused,
}: {
  guidance: import('../game/types').FirstAidGuidance
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
      <FieldRow icon="◉" label="事件地址">
        <textarea
          style={styles.formInput}
          value={terminal.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="记录详细地址…"
          rows={2}
        />
      </FieldRow>

      {/* 联系电话 */}
      <FieldRow icon={<Phone size={13} />} label="联系电话">
        <input
          style={{ ...styles.formInput, height: 30 }}
          value={terminal.contact}
          onChange={(e) => onChange('contact', e.target.value)}
          placeholder="记录联系方式…"
        />
      </FieldRow>

      {/* 主诉 */}
      <FieldRow icon="♥" label="主诉">
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
          <FieldRow icon="○" label="年龄">
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
      <SectionTitle icon="♥" text="关键问题" />

      {/* 意识状态 */}
      <StatusToggle
        label="意识状态"
        field="conscious"
        value={terminal.conscious}
        trueLabel="有意识"
        falseLabel="无意识"
        colorTrue="#22c55e"
        colorFalse="#ff3b3b"
        onToggle={onSetStatus}
      />

      {/* 呼吸状态 */}
      <StatusToggle
        label="呼吸状态"
        field="breathing"
        value={terminal.breathing}
        trueLabel="正常呼吸"
        falseLabel="无呼吸/异常"
        colorTrue="#22c55e"
        colorFalse="#ff3b3b"
        onToggle={onSetStatus}
      />

      {/* ====== 协议号 ====== */}
      <SectionTitle icon="≡" text="MPDS 协议" />
      <FieldRow icon="#" label="协议编号">
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
        <summary style={{ color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
          ¶ 协议编号对照
        </summary>
        <div style={{
          marginTop: 4,
          padding: 6,
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 4,
          maxHeight: 160,
          overflowY: 'auto',
          color: 'var(--text-secondary)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1px 12px',
          fontSize: 10.5,
        }}>
          {PROTOCOL_REF.map(([num, name]) => (
            <div key={num} style={{ display: 'flex', gap: 4, padding: '1px 0' }}>
              <span style={{ color: '#0ea5e9', fontWeight: 'bold', minWidth: 20 }}>{num}</span>
              <span>{name}</span>
            </div>
          ))}
        </div>
      </details>

      {/* ====== 判定码 (Determinant) ====== */}
      <SectionTitle icon="◎" text="MPDS 判定码" />
      <DeterminantSelector
        current={terminal.determinant}
        onSelect={onSetDeterminant}
      />
      {terminal.triage && (
        <FieldRow icon="▲" label="分诊等级">
          <span style={{
            fontSize: 13,
            fontWeight: 'bold',
            color: terminal.triage === 'red' ? '#dc2626'
              : terminal.triage === 'yellow' ? '#ff8c00'
              : terminal.triage === 'green' ? '#16a34a'
              : '#6b7280',
          }}>
            {TRIAGE_LABELS[terminal.triage]}
          </span>
        </FieldRow>
      )}
      <FieldRow icon="#" label="子编码">
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { n: 1, color: '#dc2626', label: '危重伤' },
            { n: 2, color: '#ff8c00', label: '重伤' },
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
                  backgroundColor: active ? color : 'var(--bg-elevated)',
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
function SectionTitle({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{
      fontSize: 12,
      fontWeight: 'bold',
      color: 'var(--text-secondary)',
      borderBottom: '1px solid var(--border)',
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
  icon: React.ReactNode
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

const styles: Record<string, CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg)',
    color: 'var(--text-primary)',
    overflow: 'hidden',
  },

  // ---------- 主区（地图 + 浮层）----------
  mainArea: {
    flex: 1,
    position: 'relative' as const,
    overflow: 'hidden',
    minHeight: 0,
  },
  floatCard: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(17, 21, 28, 0.88)',
    border: '1px solid #2a323e',
    borderRadius: 10,
    padding: '24px 32px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    backdropFilter: 'blur(6px)',
    zIndex: 40,
  },

  // ---------- 电话面板（全宽）----------
  phonePanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-elevated)',
    overflow: 'hidden',
    minHeight: 0,
    border: '1px solid var(--border)',
  },

  phoneHeader: {
    padding: '8px 12px',
    backgroundColor: 'var(--bg-surface)',
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
    color: 'var(--text-secondary)',
    fontFamily: 'monospace',
  },
  callPhaseTag: {
    fontSize: 12,
    color: 'var(--text-muted)',
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
    backgroundColor: 'var(--bg-surface)',
  },

  transcript: {
    fontSize: 14,
    lineHeight: 1.7,
    fontFamily: '"Source Code Pro", "Consolas", "Courier New", monospace',
    padding: '4px 0',
    borderBottom: '1px solid var(--border-light)',
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
    backgroundColor: 'var(--border)',
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
    backgroundColor: 'var(--text-muted)',
  },

  // ---------- 问询区域 ----------
  questionArea: {
    borderTop: '1px solid var(--border)',
    padding: '6px 10px',
    backgroundColor: 'var(--bg-surface)',
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
    backgroundColor: 'var(--border)',
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
    borderTop: '1px solid var(--border)',
    backgroundColor: 'var(--bg-surface)',
  },
  terminalBtn: {
    padding: '8px 16px',
    borderRadius: 6,
    border: '2px solid',
    backgroundColor: 'transparent',
    color: '#b1bac4',
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
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    color: '#b1bac4',
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
    color: 'var(--text-muted)',
    marginBottom: 3,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    borderBottom: '1px solid var(--border)',
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

  // ---------- 急救指导 - 弹窗 ----------
  guidanceOverlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 900,
    backgroundColor: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'fade-in 0.2s ease',
  },
  guidanceWindow: {
    width: 420,
    maxHeight: '85vh',
    backgroundColor: 'var(--bg-elevated)',
    borderRadius: 14,
    border: '1px solid var(--danger-red-border)',
    boxShadow: '0 0 0 1px rgba(220,38,38,0.15), var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    animation: 'fade-in-up 0.25s ease',
  },
  guidanceWindowHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 18px',
    borderBottom: '1px solid var(--danger-red-border)',
    backgroundColor: 'rgba(220,38,38,0.06)',
  },

  // ---------- 急救指导 ----------
  guidancePanel: {
    padding: '14px 16px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 10,
    flex: 1,
    minHeight: 60,
    overflowY: 'auto' as const,
    boxShadow: '0 0 0 1px var(--danger-red-border), var(--shadow-md)',
  },
  guidanceTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'var(--danger-red)',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  guidanceIntro: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 10,
    padding: '10px 12px',
    backgroundColor: 'var(--warning-amber-bg)',
    borderRadius: 8,
    borderLeft: '2px solid var(--warning-amber)',
    lineHeight: 1.6,
  },
  guidanceStep: {
    marginTop: 10,
  },
  guidancePrompt: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    marginBottom: 6,
    padding: '6px 0',
  },
  guidanceOption: {
    padding: '10px 14px',
    border: '1.5px solid var(--border)',
    borderRadius: 8,
    backgroundColor: 'var(--bg-elevated)',
    cursor: 'pointer',
    fontSize: 13,
    color: 'var(--text-primary)',
    textAlign: 'left' as const,
    transition: 'all 0.12s ease',
  },

  // ---------- 收尾 ----------
  closingPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 16,
    padding: '20px 16px',
    flex: 1,
    minHeight: 60,
    overflowY: 'auto' as const,
  },
  closingStatusCard: {
    width: '100%',
    maxWidth: 280,
    padding: '20px 16px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 12,
    textAlign: 'center' as const,
    boxShadow: 'var(--shadow-md)',
  },
  closingSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    width: '100%',
    maxWidth: 280,
  },
  closingSummaryItem: {
    padding: '10px 12px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 8,
    textAlign: 'center' as const,
    boxShadow: 'var(--shadow-sm)',
  },
  closingSummaryLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    marginBottom: 2,
  },
  closingSummaryValue: {
    fontSize: 13,
    fontWeight: 'bold' as const,
    color: 'var(--text-primary)',
  },
  endCallBtn: {
    width: '100%',
    maxWidth: 280,
    padding: '10px 24px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.15s',
  },

  // ---------- MPDS 调度卡 leftsider（从左滑入式）----------
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    bottom: 0,
    left: 0,
    width: 420,
    zIndex: 60,  // 低于 CallDrawer + 上面 InfoBar
    backgroundColor: 'var(--bg-elevated)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    boxShadow: '6px 0 30px rgba(0,0,0,0.6)',
  },
  modalCard: {
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--bg-elevated)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    borderLeft: '2px solid #dc2626',
    boxShadow: 'none',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: 'var(--bg-surface)',
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
    backgroundColor: 'var(--border-light)',
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
    color: 'var(--text-muted)',
    border: '1px solid var(--border-bright)',
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
    backgroundColor: 'var(--bg-surface)',
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
    backgroundColor: 'var(--border-light)',
    fontSize: 11,
    fontWeight: 'bold',
    color: 'var(--text-secondary)',
    flexShrink: 0,
    marginTop: 1,
  },
  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderTop: '1px solid var(--border)',
    backgroundColor: 'var(--bg-surface)',
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
  modalDispatchBtnDisabled: {
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-muted)',
    cursor: 'not-allowed',
    opacity: 0.55,
  },
  modalSaveBtn: {
    padding: '8px 16px',
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
  },
  modalEndCallBtn: {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    fontSize: 11,
    cursor: 'pointer',
  },
  modalWarning: {
    padding: '6px 16px',
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
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
    backgroundColor: 'var(--bg-elevated)',
    borderRadius: 6,
    border: '1px solid #15803d',
    flex: 1,
  },

  formField: {
    marginBottom: 10,
  },
  formLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 'bold',
    color: 'var(--text-secondary)',
    marginBottom: 4,
  },
  formInput: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 4,
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontFamily: 'monospace',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },

  // ---------- 肉鸽收益选择 ----------
  perkScreen: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: 'var(--bg-surface)',
  },
  perkHeader: {
    fontSize: 12,
    color: '#00d4ff',
    fontFamily: 'var(--font-mono)',
    letterSpacing: 2,
    fontWeight: 800,
  },
  perkTitle: {
    margin: 0,
    color: 'var(--text-primary)',
    fontSize: 24,
  },
  perkSubtitle: {
    margin: 0,
    color: 'var(--text-muted)',
    fontSize: 13,
    maxWidth: 560,
    textAlign: 'center' as const,
    lineHeight: 1.5,
  },
  perkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    width: 'min(720px, 100%)',
    marginTop: 8,
  },
  perkCard: {
    minHeight: 150,
    padding: '14px 16px',
    border: '1px solid var(--border)',
    borderRadius: 8,
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  perkCategory: {
    fontSize: 10,
    color: '#00d4ff',
    fontFamily: 'var(--font-mono)',
    letterSpacing: 1.2,
    fontWeight: 800,
  },
  perkName: {
    fontSize: 18,
    fontWeight: 800,
  },
  perkDesc: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    flex: 1,
  },
  perkEffect: {
    alignSelf: 'flex-start',
    padding: '4px 8px',
    border: '1px solid #00d4ff',
    borderRadius: 999,
    color: '#00d4ff',
    fontSize: 11,
    fontWeight: 800,
  },

  // ---------- 等待接听 — 紧急调度台 ----------
  centerMessage: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'var(--bg-surface)',
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
