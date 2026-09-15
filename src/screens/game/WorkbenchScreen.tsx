import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { Activity, ArrowRight, BookOpen, CheckCircle2, ClipboardList, Headphones, Map, Pause, Phone, Play, Settings, ShieldCheck, Volume2, X, Ambulance } from 'lucide-react'
import type { ShiftEvaluation, WorldState } from '../../game/types'
import type { GameAction } from '../../game/core/actions'
import type { DispatchCardControl } from '../../contexts/DispatchCardContext'
import { worldReducer } from '../../game/core/worldReducer'
import { createInitialState } from '../../game/core/worldState'
import { handleStartShift } from '../../game/core/reducers/miscHandlers'
import { isWorldPaused } from '../../game/core/session'
import { buildDispatchPlan, type DispatchPlan } from '../../game/core/dispatchPlanning'
import { loadCheckpoint, saveCheckpoint } from '../../game/core/checkpoint'
import { readStorage, writeStorage } from '../../utils/storage'
import { buildShiftEvaluation, DIMENSION_KEYS } from '../../game/core/evaluation'
import { useAudio } from '../../audio/AudioContext'
import { stressToEmotion } from '../../audio/ttsEmotion'
import { useStreamingQueue } from './hooks/useStreamingQueue'
import { useTheme } from '../../contexts/ThemeContext'
import { CityMap } from '../../components/map/CityMap'
import { RoutePlanner } from '../../components/feedback/RoutePlanner'
import { GuidancePanel } from './panels/GuidancePanel'
import { WaitingCarePanel } from './WaitingCarePanel'
import { PatientVitals } from './PatientVitals'
import { JudgmentFloat } from './JudgmentFloat'
import { NextStepDock } from './NextStepDock'
import { TaskCard } from './TaskCard'
import { Transcript } from './Transcript'
import { QuestionDock } from './QuestionDock'
import { HandoffPanel } from './HandoffPanel'
import { Dialog } from '../../components/ui/Dialog'
import { ROGUE_PERKS } from '../../game/core/perks'
import './workbench.css'

/** 并发模式注入：状态、动作与插槽由班次层提供 */
interface ControlledProps {
  state: WorldState
  dispatch: (action: GameAction) => void
  paused?: boolean
  /** 当前没有聚焦线路：接听入口在线路列表里，不显示「接听来电」按钮 */
  awaitingLine?: boolean
  /** 班次层塞进工作台的区块：线路列表进通话栏，状态条进顶栏下方 */
  slots?: { statusBar?: ReactNode; lineBoard?: ReactNode }
}
interface Props { onNavigate: (screen: 'title' | 'ending', evaluation?: ShiftEvaluation) => void; scenarioId?: string; onDispatchCardChange?: (control: DispatchCardControl) => void; controlled?: ControlledProps }
type Tab = 'call' | 'map' | 'task'
type Modal = 'settings' | 'help' | 'exit' | 'end' | null
const PHASES = ['接听', '问询', '路线', '指导', '交接']

export function GameScreen({ onNavigate, scenarioId, controlled }: Props) {
  const [internalState, internalDispatch] = useReducer(worldReducer, scenarioId, id => {
    if (id === '__resume__') { const saved = loadCheckpoint(); if (saved) return saved }
    // 线性流程只跑调用方指定的场景（场景练习 / 断点续玩），没有内置的固定通数排班
    return handleStartShift(createInitialState(), id && !id.startsWith('__') ? [id] : [])
  })
  // 并发模式下由班次层驱动：本组件只渲染聚焦线路，不自行计时/存档/跳转
  const embedded = controlled !== undefined
  const state = controlled?.state ?? internalState
  // dispatch 保持稳定引用：内部走 useReducer，并发模式走班次层注入
  const dispatchRef = useRef<(action: GameAction) => void>(internalDispatch)
  dispatchRef.current = controlled?.dispatch ?? internalDispatch
  const dispatch = useCallback((action: GameAction) => dispatchRef.current(action), [])
  // 默认落在「通话」：对话流是核心内容，工作区与登记表按需切过去
  const [tab, setTab] = useState<Tab>(embedded ? 'call' : 'map')
  const [modal, setModal] = useState<Modal>(null)
  const [plan, setPlan] = useState<DispatchPlan | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)
  const [audioFailed, setAudioFailed] = useState(false)
  const [tutorialSeen, setTutorialSeen] = useState(() => readStorage('dispatch120-tutorial') === 'done')
  const [taskPulse, setTaskPulse] = useState(false)
  const audio = useAudio()
  // 每播完一行就把进度写回这通电话的状态：切线路重挂载后不会重播整段历史
  const markStreamed = useCallback((index: number) => dispatch({ type: 'MARK_LINES_STREAMED', throughIndex: index }), [dispatch])
  const { streamIdx, streamPos, pendingSet } = useStreamingQueue(state, markStreamed)
  const { theme, toggle } = useTheme()
  const paused = isWorldPaused(state) || Boolean(controlled?.paused)
  const call = state.currentCall
  const dispatchReady = Boolean(state.terminal.address.trim() && state.terminal.conscious !== null && state.terminal.breathing !== null && state.terminal.determinant && state.terminal.triage)
  const step = state.rescue.outcome || state.patientStatus?.died ? 4 : state.dispatchSent ? 3 : dispatchReady ? 2 : call ? 1 : 0
  const centerBusy = Boolean(plan)
  const showGuidanceWindow = Boolean(call?.guidance && state.guidanceActive && state.guidanceStepIndex < (call.guidance?.steps.length ?? 0))
  const lastSpoken = useRef(0)
  const deferredMiniGame = useRef<{ callInstanceId: number; stepIndex: number; score: number; passed: boolean } | null>(null)
  const latestPaused = useRef(paused)
  latestPaused.current = paused
  useEffect(() => {
    if (embedded || state.screen !== 'playing' || paused) return
    const timer = window.setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => window.clearInterval(timer)
  }, [embedded, state.screen, paused, dispatch])
  useEffect(() => {
    if (embedded) return
    const onHidden = () => { if (document.hidden) dispatch({ type: 'PAUSE', reason: 'background' }) }
    document.addEventListener('visibilitychange', onHidden)
    onHidden()
    return () => document.removeEventListener('visibilitychange', onHidden)
  }, [embedded, dispatch])
  useEffect(() => {
    audio.tts.setPaused(paused)
    if (!paused && deferredMiniGame.current) { dispatch({ type: 'COMPLETE_MINIGAME', ...deferredMiniGame.current }); deferredMiniGame.current = null }
  }, [paused, audio.tts, dispatch])
  useEffect(() => {
    audio.tts.stop(); lastSpoken.current = 0; deferredMiniGame.current = null; setPlan(null); setAudioFailed(false)
    return () => audio.tts.stop()
  }, [state.callInstanceId, audio.tts])
  useEffect(() => {
    const lines = state.dialogueLog.slice(lastSpoken.current)
    lastSpoken.current = state.dialogueLog.length
    if (lines.some(line => line.speaker === 'caller')) audio.tts.stop()
    lines.forEach((line, i) => { if (line.speaker === 'caller') void audio.tts.enqueue(`${state.callInstanceId}-${i}-${line.timestamp}`, { text: line.text, kind: 'caller', emotion: stressToEmotion(state.callerState?.stress ?? 40) }).catch(() => setAudioFailed(true)) })
  }, [state.dialogueLog, state.callInstanceId, state.callerState?.stress, audio.tts])
  // Deliberately persist only at safe boundaries, never every timer tick.
  useEffect(() => { if (embedded) return; setSaveFailed(!saveCheckpoint(state)) }, [embedded, state.callIndex, state.scenarioQueue, state.perks, state.rescueNotifications.length]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (embedded || state.screen !== 'ending') return
    onNavigate('ending', buildShiftEvaluation(state.callEvaluations, { activeSeconds: state.activePlaySeconds }))
  }, [embedded, state.screen, state.callEvaluations, state.activePlaySeconds, onNavigate])
  /**
   * 工作区出现「必须处理的事」时自动带玩家过去，处理完自动回到通话台。
   * 默认单视图之后，指导窗口 / 改道 / 交接都住在工作区里，
   * 不这样带一下它们就变成了「藏起来的东西」。
   */
  const workspaceDemand = Boolean(plan || showGuidanceWindow || state.rescue.outcome || state.patientStatus?.died)
  const hadWorkspaceDemand = useRef(false)
  useEffect(() => {
    if (workspaceDemand) setTab('map')
    else if (hadWorkspaceDemand.current) setTab('call')
    hadWorkspaceDemand.current = workspaceDemand
  }, [workspaceDemand])
  const openModal = (value: Modal) => { dispatch({ type: 'PAUSE', reason: value === 'settings' ? 'settings' : value === 'help' ? 'help' : 'confirm' }); setModal(value) }
  const closeModal = () => { dispatch({ type: 'RESUME', reason: modal === 'settings' ? 'settings' : modal === 'help' ? 'help' : 'confirm' }); setModal(null) }
  const endCall = () => { setPlan(null); audio.tts.stop(); dispatch({ type: 'END_CALL' }) }
  const replay = () => {
    const last = [...state.dialogueLog].reverse().find(line => line.speaker === 'caller')
    if (!last) return
    audio.tts.stop(); void audio.tts.enqueue(`replay-${state.callInstanceId}`, { text: last.text, kind: 'caller' }).catch(() => setAudioFailed(true))
  }
  const openRoute = () => { const next = buildDispatchPlan(state); if (next) { setPlan(next); setTab('map') } }
  const goToTaskCard = () => {
    setTab('task'); setTaskPulse(true)
    window.setTimeout(() => setTaskPulse(false), 1400)
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('.task-panel textarea, .task-panel input, .task-panel button')?.focus()
    })
  }
  const onFinishMiniGame = (stepIndex: number, score: number, passed: boolean) => {
    const result = { callInstanceId: state.callInstanceId, stepIndex, score, passed }
    if (latestPaused.current) deferredMiniGame.current = result
    else dispatch({ type: 'COMPLETE_MINIGAME', ...result })
  }
  let overlay: ReactNode = null
  if (modal) overlay = <Dialog title={modal === 'settings' ? '值班设置' : modal === 'help' ? '接好这通电话' : modal === 'exit' ? '离开工作台？' : '结束这通电话？'} onClose={closeModal}>
    {modal === 'settings' ? <div className="dialog-content"><label className="setting-row"><span className="setting-label"><Volume2 size={20} /> 音量</span><input aria-label="音量" type="range" min="0" max="1" step="0.05" value={audio.volume} onChange={e => audio.setVolume(Number(e.target.value))} /></label><div className="setting-row"><span className="setting-label">工作台外观</span><button className="secondary" onClick={toggle}>切换到{theme === 'dark' ? '明亮' : '夜间'}</button></div><div className="dialog-actions"><button className="text-button" onClick={() => { closeModal(); openModal('exit') }}>返回主菜单</button></div></div> : modal === 'help' ? <div className="dialog-content"><p>你是电话这头的接线员。听清来电，确认地点与患者情况，再选择响应优先级和路线。</p><ol><li>左侧阅读对话，并选择下一句要问的问题。</li><li>需要判断时，右下角会弹出选择卡。</li><li>右侧登记表记录已知信息；左栏「下一步」会提示还差什么。</li><li>信息齐了就能派车，之后按指导保持通话，直到现场交接。</li></ol><p>急救内容用于公益科普。现实中请及时拨打 120，听从专业指导。</p><button className="primary" onClick={() => { writeStorage('dispatch120-tutorial', 'done'); setTutorialSeen(true); closeModal() }}>明白了，回到工作台</button></div> : <div className="dialog-content"><p>{modal === 'exit' ? '已完成通话的五维评价会保留。' : state.dispatchSent && !state.rescue.outcome ? '救护车仍在途中，现场结果会在抵达后更新。' : '当前记录将结算。'}</p><div className="dialog-actions"><button className="secondary" onClick={closeModal}>继续当前通话</button><button className="danger-button" onClick={() => { closeModal(); if (modal === 'exit') onNavigate('title'); else endCall() }}>{modal === 'exit' ? '保存并离开' : '确认结束通话'}</button></div></div>}
  </Dialog>
  else if (paused && !state.lastDebrief && !state.pendingPerkChoices.length) overlay = <Dialog title="值班已暂停" onClose={() => dispatch({ type: 'RESUME' })}><div className="dialog-content"><button className="primary wide" onClick={() => dispatch({ type: 'RESUME' })}><Play size={18} /> 继续值班</button></div></Dialog>
  else if (state.lastDebrief) {
    const result = state.lastDebrief
    overlay = <Dialog title="通话复盘" onClose={() => dispatch({ type: 'DISMISS_DEBRIEF' })}><div className="dialog-content debrief-content"><span className="eyebrow">每一次回顾，都为了下一次更好</span><h3>{result.scenarioTitle}</h3><div className="debrief-grade"><strong>{result.overallGrade}</strong><span>{result.profile.title}</span></div><div className={`patient-outcome outcome-${result.outcome}`}><b>{result.outcomeLabel}</b><span>{result.patientCount > 0 ? ` · 涉及 ${result.patientCount} 人` : ''}</span></div><p>{result.arrivalNarrative}</p><div className="evaluation-chips">{DIMENSION_KEYS.map(key => { const item = result.dimensions[key]; return <span key={key}><small>{item.label}</small><b>{item.grade === 'NA' ? '—' : item.grade}</b></span> })}</div><h4>下一次可以留意</h4>{result.reviewPoints.length ? <ul>{result.reviewPoints.map(point => <li key={point}>{point}</li>)}</ul> : <p>本通没有需要优先纠正的项目，继续保持稳定流程。</p>}<div className="knowledge-note"><BookOpen size={20} /><p>{result.profile.description}</p></div><button className="primary wide" onClick={() => dispatch({ type: 'DISMISS_DEBRIEF' })}>{state.shiftCompletePending ? '查看班次总结' : '准备下一通来电'}<ArrowRight size={18} /></button></div></Dialog>
  } else if (state.pendingPerkChoices.length) overlay = <Dialog title="给下一通电话的一点支持" onClose={() => dispatch({ type: 'CHOOSE_PERK', perkId: state.pendingPerkChoices[0] })}><div className="dialog-content"><p>选择一项工作辅助，带进下一通电话。</p>{state.pendingPerkChoices.map(id => <button key={id} className="perk-option" onClick={() => dispatch({ type: 'CHOOSE_PERK', perkId: id })}><strong>{ROGUE_PERKS[id].title}</strong><span>{ROGUE_PERKS[id].description}</span></button>)}</div></Dialog>
  return <div className="dispatch-desk">
    <header className="desk-header">
      <button className="desk-brand" onClick={() => openModal('exit')} aria-label="返回主菜单"><span className="brand-symbol"><Activity size={24} /></span><strong>120<span>调度台</span></strong></button>
      <nav className="phase-track" aria-label="通话流程">{PHASES.map((label, i) => <span key={label} className={i === step ? 'active' : i < step ? 'complete' : ''}><b>{i < step ? <CheckCircle2 size={13} /> : `0${i + 1}`}</b>{label}</span>)}</nav>
      <div className="header-controls">
        <span className="header-status"><span className="live-dot" />{paused ? '已暂停' : call ? '通话中' : '等待来电'}</span>
        {/* 并发模式下线路内世界只有单通（totalCalls=1），此处会显示误导性的 1/1，交给线路墙显示班次进度 */}
        {!embedded && <span className="shift-count">{Math.min(state.callIndex + 1, state.totalCalls)} <small>/ {state.totalCalls}</small></span>}
        <button className="icon-button" onClick={() => dispatch({ type: 'PAUSE', reason: 'manual' })} aria-label="暂停值班"><Pause size={19} /></button>
        <button className="icon-button" onClick={() => openModal('help')} aria-label="操作帮助"><BookOpen size={19} /></button>
        <button className="icon-button" onClick={() => openModal('settings')} aria-label="设置"><Settings size={19} /></button>
      </div>
    </header>
    {/* 状态带：班次时钟 / 车辆 + 患者体征合成同一条，避免两行占高度 */}
    <div className="status-strip">
      {controlled?.slots?.statusBar}
      {call && <PatientVitals state={state} />}
    </div>
    {state.rescueNotifications.length > 0 && <section className="rescue-notices" aria-label="后台救援结果">{state.rescueNotifications.map(notification => <div key={notification.id} className={notification.kind}><Ambulance size={18} /><span>{notification.text}</span><button className="icon-button" aria-label="关闭救援结果" onClick={() => dispatch({ type: 'DISMISS_RESCUE_NOTIFICATION', notificationId: notification.id })}><X size={16} /></button></div>)}</section>}
    {/* 线路 chips 居左、视图切换居中、结束通话居右，合并成一条 chip 行 */}
    <nav className="view-tabs" aria-label="工作区切换">
      {controlled?.slots?.lineBoard}
      {([['call', Headphones, '通话'], ['map', Map, '工作区'], ['task', ClipboardList, '任务卡']] as const).map(([id, Icon, label]) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}><Icon size={17} />{label}</button>)}
      {call && !state.rescue.outcome && !state.patientStatus?.died && <button className="end-call-tab text-button danger-text" onClick={() => openModal('end')}>结束当前通话</button>}
    </nav>
    <main className={`desk-grid tab-${tab} ${taskPulse ? 'task-pulse' : ''}`} inert={paused}>
      {/* 通话台：对话流（顶栏含来电者与登记完成度）→ 判断卡 + 选项抽屉；线路 chips 已合并进顶部 chip 行 */}
      <aside className="desk-panel transcript-panel">
        <Transcript state={state} onReplay={replay} onStop={() => audio.tts.stop()} streamIdx={streamIdx} streamPos={streamPos} pendingSet={pendingSet.current} />
        {/* 判断卡是随手要处理的事，不参与限高；只有选项抽屉封顶 1/3 */}
        <JudgmentFloat judgments={state.pendingJudgments} dispatch={dispatch} />
        <QuestionDock state={state} dispatch={dispatch} />
      </aside>
      <section className="desk-panel workspace-panel">
        {/* 「下一步」原本占着通话栏，现在挪到工作区：它的按钮本来就把你送进这里规划路线 */}
        <NextStepDock state={state} onGoToTask={goToTaskCard} onPlanRoute={openRoute} />
        {!call ? <div className="shift-welcome"><div className="welcome-emblem"><Headphones size={52} /></div><span className="eyebrow">{embedded ? '值班待命' : `准备接听 · 第 ${state.callIndex + 1} 通`}</span><h2>让帮助抵达需要的地方</h2><p>这一次，留意电话里的细节，做出你的判断。</p>{!tutorialSeen && <button className="secondary" onClick={() => openModal('help')}><BookOpen size={17} /> 第一次值班？先熟悉工作台</button>}{controlled?.awaitingLine ? <p className="awaiting-hint">线路响铃时，在「电话线路」里点击即可接听。</p> : state.fleet.vehicles[0]?.status !== 'available' ? <div className="turnaround-note"><p>救护车正在完成上一项任务。当前没有患者等待。</p></div> : <button className="primary answer-button" onClick={() => { dispatch({ type: 'ANSWER_CALL' }); setTab('call'); audio.play('connect') }}><Phone size={20} /> 接听来电<ArrowRight size={18} /></button>}</div> : <>
          <div className={`main-workspace ${centerBusy ? 'has-activity' : ''}`}>
            {plan ? <RoutePlanner embedded routes={plan.routes} onCancel={() => setPlan(null)} onConfirm={route => { dispatch({ type: 'DISPATCH', vehicleId: 'ambulance', route, callInstanceId: plan.callInstanceId }); setPlan(null) }} /> : state.rescue.outcome || state.patientStatus?.died ? <HandoffPanel state={state} dispatch={dispatch} onComplete={endCall} /> : state.guidanceActive && call.guidance && state.guidanceStepIndex >= call.guidance.steps.length ? <div className="embedded-guidance"><WaitingCarePanel key={state.callInstanceId} state={state} dispatch={dispatch} onStopSpeech={() => audio.tts.stop()} /></div> : <>
              <CityMap state={state} />
              {showGuidanceWindow && call.guidance && <div className="guidance-window" role="dialog" aria-label="急救指导"><GuidancePanel key={`${state.callInstanceId}-${state.guidanceStepIndex}`} guidance={call.guidance} stepIndex={state.guidanceStepIndex} results={state.guidanceResults} onContinue={() => { audio.tts.stop(); dispatch({ type: 'CONTINUE_GUIDANCE', callInstanceId: state.callInstanceId, stepIndex: state.guidanceStepIndex }) }} paused={paused} disabled={paused} onAnswer={(stepIndex, selectedIndex) => dispatch({ type: 'ANSWER_GUIDANCE', callInstanceId: state.callInstanceId, stepIndex, selectedIndex })} onCompleteMiniGame={onFinishMiniGame} onEndGuidance={() => openModal('end')} /></div>}
            </>}
          </div>
        </>}
        {(audioFailed || saveFailed) && <div className="workspace-footnote"><ShieldCheck size={14} /><span>{audioFailed ? '语音暂不可用，可继续阅读字幕。' : '当前浏览器无法保存进度，本次仍可正常游玩。'}</span></div>}
      </section>
      <aside className="desk-panel task-panel">{call ? <TaskCard state={state} dispatch={dispatch} onRoute={openRoute} /> : <div className="task-idle" inert><TaskCard state={state} dispatch={dispatch} onRoute={openRoute} idle /></div>}</aside>
    </main>
    {overlay}
  </div>
}
