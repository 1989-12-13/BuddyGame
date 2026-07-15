// ============================================================
// 120调度台 — 调度主界面容器（双线程：电话+终端）
// 副作用拆分到 hooks/，子组件拆分到 panels/，样式集中在 styles.ts
// ============================================================

import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { createInitialState } from '../../game/core/initialState'
import { VITAL_SIGN_COLORS, C_DARK_DANGER } from '../../game/core/colors'
import { Z_CLOSING_OVERLAY, Z_PERK } from '../../game/core/zIndex'
import { fmtDuration } from '../../utils/timeFormat'
import type { EndingDef } from '../../game/types'
import { buildDispatchPlan, type DispatchPlan } from '../../game/core/dispatchPlanning'
import { getPerkChoices, hasPerk } from '../../game/core/perks'
import { worldReducer } from '../../game/core/worldReducer'
import { getCaller } from '../../game/npc/personas'
import { Hud } from '../../components/hud/Hud'
import { CallInfoBar } from '../../components/hud/CallInfoBar'
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
import type { DispatchCardControl } from '../../contexts/DispatchCardContext'
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
  /** 调度卡控制状态上报给 App，供 SettingsPanel 读取 */
  onDispatchCardChange?: (control: DispatchCardControl) => void
}

export function GameScreen({ onNavigate, scenarioId, onDispatchCardChange }: Props) {
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
  const { streamIdx, streamPos, pendingSet, isStreaming } = useStreamingQueue(state, audio)
  const { interruptCallerVoice } = useCallAudio(state, audio)
  const handleEnding = useCallback(
    (ending: EndingDef, totalScore: number, callScores: number[]) => {
      onNavigate('ending', ending, totalScore, callScores)
    },
    [onNavigate],
  )
  useCallLifecycle(state, dispatch, dialogueRef, handleEnding)
  const { dialogueHeight, splitHovered, setSplitHovered, setDialogueHeight, handleSplitterDown } = useSplitter()

  // --- callPhase 驱动的 UI 状态机（合并多个互操作的 useEffect）---
  const uiPrevRef = useRef({ phase: state.callPhase })
  useEffect(() => {
    const prev = uiPrevRef.current.phase
    const phase = state.callPhase
    if (prev === phase) return

    // 进入 closing → 折叠抽屉（让地图接管）
    if (phase === 'closing' && prev !== 'closing') {
      setDrawerOpen(false)
    }
    // 新通话开始（completed → questioning）→ 展开抽屉 + 重置指导折叠
    if (phase === 'questioning' && prev === 'completed') {
      setDrawerOpen(true)
      setGuidanceCollapsed(false)
    }
    // 首次进入 guidance → 默认展开指导浮层
    if (phase === 'guidance' && prev !== 'guidance') {
      setGuidanceCollapsed(false)
    }
    uiPrevRef.current = { phase }
  }, [state.callPhase])

  // --- 展开抽屉查看对话时，自动折叠指导浮层（互操作补充） ---
  useEffect(() => {
    if (drawerOpen && state.callPhase === 'guidance') {
      setGuidanceCollapsed(true)
    }
  }, [drawerOpen, state.callPhase])

  // --- 新通话到达时确保 drawer 已展开 ---
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

  // --- 完成节点路线后，按已冻结的车辆与路线真正派出 ---
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

  const call = state.currentCall
  const caller = call ? getCaller(call.callerId) : null

  // 抽屉标题与迷你信息
  const callElapsed = call ? state.shiftElapsed - state.callStartTime : 0
  const drawerTitle = call ? fmtDuration(callElapsed) : '--:--'
  const drawerMini = state.patientStatus ? (
    <div style={{
      width: 8, height: 100, backgroundColor: 'var(--border)', borderRadius: 4,
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

  // 调度卡入口的控制权下沉到左侧设置面板；通过 onDispatchCardChange 上报给 App（供 SettingsPanel 读取）
  const isDispatchAvailable = state.callPhase === 'questioning' || state.callPhase === 'connected'
  const hasTriageNow = state.terminal.triage !== null
  const openDispatch = handleOpenTerminal

  useEffect(() => {
    onDispatchCardChange?.({ isAvailable: isDispatchAvailable, hasTriage: hasTriageNow, open: openDispatch })
  }, [isDispatchAvailable, hasTriageNow, openDispatch, onDispatchCardChange])

  return (
    <div style={styles.container}>
      <Hud state={state} />

      <div style={styles.mainArea}>
        <CityMap state={state} onAmbulanceClick={handleAmbulanceClick} />

        {/* ====== 无通话 → 等待接听 ====== */}
        <AnimatePresence>
          {!call && state.callIndex < state.totalCalls && !state.lastDebrief && state.pendingPerkChoices.length === 0 && (
            <motion.div
              key="call-waiting"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.15 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* ====== 无通话 → 班次结束 ====== */}
        <AnimatePresence>
          {!call && state.callIndex >= state.totalCalls && !state.lastDebrief && state.pendingPerkChoices.length === 0 && (
            <motion.div
              key="shift-end"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.15 }}
            >
              <div style={styles.floatCard}>
                <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>本班次所有通话已处理完毕</h2>
                <p style={{ color: 'var(--text-muted)' }}>正在生成班次评估报告...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ====== 有通话 → 通话 UI ====== */}
        {call && (
          <>
        <CallInfoBar state={state} visible={true} />
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
          <AnimatePresence mode="wait">
            <motion.div
              key="current"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
            >
            <PhoneHeader
              phoneNumber={call.phoneNumber}
              baseStation={call.baseStation}
              callerName={caller?.name ?? '未知'}
              relationship={caller?.relationship ?? '未知'}
              callPhase={state.callPhase}
              elapsed={state.shiftElapsed - state.callStartTime}
              stressLevel={state.callerState?.stressLevel ?? '紧张'}
              stress={state.callerState?.stress ?? 50}
            />

        {state.patientStatus && (
          <VitalSignsBar status={state.patientStatus} />
        )}

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
            return (
              <div key={i}>
                <TranscriptLine
                  line={line}
                  index={i}
                  displayText={displayText}
                  showCursor={showCursor}
                />
              </div>
            )
          })}
        </div>

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

        {(state.callPhase === 'questioning' || state.callPhase === 'connected') && (
          <QuestionPanel
            call={call}
            askedMPDS={state.callerState?.askedMPDS ?? []}
            stressLevel={state.callerState?.stressLevel ?? '紧张'}
            stress={state.callerState?.stress ?? 50}
            disabled={isStreaming}
            onAsk={(id) => { interruptCallerVoice(); dispatch({ type: 'ASK_QUESTION', questionId: id }) }}
            onCalm={handleCalm}
          />
        )}
            </motion.div>
          </AnimatePresence>
        )}
        </CallDrawer>
          </>
        )}

        {/* ====== 即时反馈 Toast ====== */}
        <EventToastStack
          events={state.patientEvents}
          onDismiss={handleDismissEvent}
        />

        {/* ====== MPDS 调度卡 leftsider ====== */}
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

        {/* ====== 急救指导浮层 ====== */}
        {state.callPhase === 'guidance' && call && call.guidance && (
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
              disabled={isStreaming}
              onAnswer={(stepIdx, selectedIdx) =>
                dispatch({ type: 'ANSWER_GUIDANCE', stepIndex: stepIdx, selectedIndex: selectedIdx })
              }
              onCompleteMiniGame={(stepIdx, score, passed) =>
                dispatch({ type: 'COMPLETE_MINIGAME', stepIndex: stepIdx, score, passed })
              }
            />
          </GuidanceOverlay>
        )}

        {/* ====== 临床判断浮层 ====== */}
        {state.pendingJudgments && state.pendingJudgments.length > 0 && (
          <JudgmentCard
            judgments={state.pendingJudgments}
            disabled={isStreaming}
            dialogueLog={state.dialogueLog}
            streamIdx={streamIdx}
            streamPos={streamPos}
            pendingSet={pendingSet.current}
            onSelect={(judgmentId, optionIdx) => handleJudgment(judgmentId, optionIdx)}
          />
        )}

        {/* ====== 节点式路线规划：车辆由系统自动分配 ====== */}
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

      {/* ====== 收尾阶段 — 全屏遮罩（移出 Drawer，在 container 层级）====== */}
      <AnimatePresence>
        {state.callPhase === 'closing' && call && (
          <motion.div
            key="closing-overlay"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            style={{
              ...styles.guidanceOverlay,
              zIndex: Z_CLOSING_OVERLAY,
            }}
          >
            <div style={{ ...styles.guidanceWindow, width: 360 }}>
              <div style={styles.guidanceWindowHeader}>
                <span style={{ fontSize: 'var(--fs-body-lg)' }}>✅</span>
                <span style={{ fontSize: 'var(--fs-body-lg)', fontWeight: 'var(--fw-bold)', color: 'var(--accent-green)' }}>通话完成</span>
              </div>
              <ClosingPanel
                guidance={!!call.guidance}
                ambulanceRemaining={state.ambulanceRemaining}
                terminal={state.terminal}
                onEndCall={() => { interruptCallerVoice(); handleEndCall() }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 通话结算报告 — Overlay ====== */}
      <AnimatePresence>
        {state.lastDebrief && (
          <CallDebrief
            debrief={state.lastDebrief}
            onNext={() => dispatch({ type: 'DISMISS_DEBRIEF' })}
            nextLabel={state.shiftCompletePending ? '生成班次报告' : '查看班次收益'}
          />
        )}
      </AnimatePresence>

      {/* ====== Perk 收益选择 — 关闭总结卡后才展示 ====== */}
      <AnimatePresence>
        {!state.lastDebrief && state.pendingPerkChoices.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
            position: 'fixed', inset: 0, zIndex: Z_PERK,
            backgroundColor: 'var(--bg)',
            display: 'flex', flexDirection: 'column',
          }}>
            <Hud state={state} />
            <PerkSelection
              choices={state.pendingPerkChoices}
              owned={state.perks}
              onChoose={(perkId) => dispatch({ type: 'CHOOSE_PERK', perkId })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
