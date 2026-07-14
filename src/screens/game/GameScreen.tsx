// ============================================================
// 零点接线台 — 调度主界面容器（双线程：电话+终端）
// 副作用拆分到 hooks/，子组件拆分到 panels/，样式集中在 styles.ts
// ============================================================

import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { createInitialState } from '../../game/core/initialState'
import { VITAL_SIGN_COLORS, C_DARK_DANGER } from '../../game/core/colors'
import { fmtDuration } from '../../utils/timeFormat'
import type { EndingDef } from '../../game/types'
import { buildDispatchPlan, type DispatchPlan } from '../../game/core/dispatchPlanning'
import { getPerkChoices, hasPerk } from '../../game/core/perks'
import { worldReducer } from '../../game/core/worldReducer'
import { getCaller } from '../../game/npc/personas'
import { Hud } from '../../components/hud/Hud'
import { CallDebrief } from '../../components/call/CallDebrief'
import { VitalSignsBar } from '../../components/feedback/VitalSignsBar'
import { EventToastStack } from '../../components/feedback/EventToastStack'
import { RoutePlanner } from '../../components/feedback/RoutePlanner'
import { CityMap } from '../../components/map/CityMap'
import { CallDrawer } from '../../components/call/CallDrawer'
import { HistoryPanel } from '../../components/call/HistoryPanel'
import { GuidanceOverlay } from '../../components/guidance/GuidanceOverlay'
import { useAudio } from '../../audio/AudioContext'
import { styles } from './styles'
import { useStreamingQueue } from './hooks/useStreamingQueue'
import { useCallAudio } from './hooks/useCallAudio'
import { useCallLifecycle } from './hooks/useCallLifecycle'
import { useSplitter } from './hooks/useSplitter'
import { CallWaiting } from './panels/CallWaiting'
import { PerkSelection } from './panels/PerkSelection'
import { PhoneHeader } from './panels/PhoneHeader'
import { TranscriptLine } from './panels/TranscriptLine'
import { JudgmentCard } from './panels/JudgmentCard'
import { QuestionPanel } from './panels/QuestionPanel'
import { ClosingPanel } from './panels/ClosingPanel'
import { GuidancePanel } from './panels/GuidancePanel'
import { TerminalModal } from './panels/TerminalModal'

interface Props {
  onNavigate: (screen: 'title' | 'ending', ending?: EndingDef, totalScore?: number, callScores?: number[]) => void
  scenarioId?: string
}

export function GameScreen({ onNavigate, scenarioId }: Props) {
  const [state, dispatch] = useReducer(worldReducer, null, createInitialState)
  const [terminalModalOpen, setTerminalModalOpen] = useState(false)
  const [dispatchPlan, setDispatchPlan] = useState<DispatchPlan | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(true)
  // Drawer 显示模式：当前通话 vs 历史任务（点击地图上的救护车触发）
  const [drawerMode, setDrawerMode] = useState<'current' | { type: 'history'; callId: string }>('current')
  const [guidanceCollapsed, setGuidanceCollapsed] = useState(false)

  const audio = useAudio()
  const dialogueRef = useRef<HTMLDivElement>(null)

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
      setDispatchPlan(null)
    }
  }, [state.currentCall])

  // --- 切换抽屉展开/折叠 ---
  const handleToggleDrawer = useCallback(() => {
    setDrawerOpen(o => !o)
  }, [])

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

  // --- 游戏循环 hooks ---
  const { streamIdx, streamPos, pendingSet } = useStreamingQueue(state, audio)
  const { interruptCallerVoice } = useCallAudio(state, audio)
  useCallLifecycle(state, dispatch, dialogueRef, (ending, totalScore, callScores) => {
    onNavigate('ending', ending, totalScore, callScores)
  })
  const { dialogueHeight, splitHovered, setSplitHovered, setDialogueHeight, handleSplitterDown } = useSplitter()

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

  // --- 安抚来电者 ---
  const handleCalm = useCallback(() => {
    interruptCallerVoice()
    dispatch({ type: 'CALM_CALLER' })
  }, [interruptCallerVoice])

  // --- 打开调度卡 ---
  const handleOpenTerminal = useCallback(() => {
    setTerminalModalOpen(true)
  }, [])

  // --- 处理派车：系统自动配车，玩家只负责逐节点规划路线 ---
  const handleDispatch = useCallback(() => {
    if (!state.currentCall) return
    if (!state.terminal.determinant) return // 必须选择判定码才能派车
    const plan = buildDispatchPlan(state)
    if (!plan) return
    setTerminalModalOpen(false)
    setDispatchPlan(plan)
  }, [state])

  // --- 抵达现场节点后，按已冻结的车辆与路线真正派出 ---
  const handleConfirmRoute = useCallback((route: DispatchPlan['routes'][number]) => {
    if (!dispatchPlan) return
    interruptCallerVoice()
    setDispatchPlan(null)
    setTerminalModalOpen(false)
    dispatch({ type: 'DISPATCH', vehicleId: dispatchPlan.vehicle.id, route })
  }, [dispatchPlan, interruptCallerVoice])

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
  const drawerTitle = fmtDuration(callElapsed)
  const drawerMini = state.patientStatus ? (
    <div style={{
      width: 8, height: 100, backgroundColor: '#2a323e', borderRadius: 4,
      overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse',
    }}>
      <div style={{
        width: '100%',
        height: `${state.patientStatus.stability}%`,
        backgroundColor: VITAL_SIGN_COLORS[state.patientStatus.vitalSign] ?? C_DARK_DANGER,
        transition: 'height 0.5s ease, background-color 0.3s ease',
      }} />
    </div>
  ) : null

  return (
    <div style={styles.container}>
      <Hud state={state} />

      <div style={styles.mainArea}>
        <CityMap state={state} onAmbulanceClick={handleAmbulanceClick} />

        <CallDrawer
          open={drawerOpen}
          onToggle={handleToggleDrawer}
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
                <span style={{ fontSize: 15, fontWeight: 'bold', color: 'var(--accent-green)' }}>通话完成</span>
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

      {/* 节点式路线规划：车辆由系统自动分配，不再提供选车控件 */}
      {dispatchPlan && (
        <RoutePlanner
          vehicle={dispatchPlan.vehicle}
          routes={dispatchPlan.routes}
          priorityChannelActive={hasPerk(state.perks, 'priority_channel')}
          onConfirm={handleConfirmRoute}
          onCancel={() => setDispatchPlan(null)}
        />
      )}
      </div>
    </div>
  )
}
