import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { Activity, ArrowRight, BookOpen, CheckCircle2, ClipboardList, Headphones, Map, Pause, Phone, Play, Settings, ShieldCheck, Volume2, X, Ambulance } from 'lucide-react'
import type { EndingDef } from '../../game/types'
import type { DispatchCardControl } from '../../contexts/DispatchCardContext'
import { worldReducer } from '../../game/core/worldReducer'
import { createInitialState } from '../../game/core/worldState'
import { handleStartShift } from '../../game/core/reducers/miscHandlers'
import { isWorldPaused } from '../../game/core/session'
import { buildDispatchPlan, type DispatchPlan } from '../../game/core/dispatchPlanning'
import { CAMPAIGN, CAMPAIGN_IDS } from '../../game/core/campaign'
import { loadCheckpoint, saveCheckpoint } from '../../game/core/checkpoint'
import { readStorage, writeStorage } from '../../utils/storage'
import { detectEnding } from '../../game/endings/endings'
import { useAudio } from '../../audio/AudioContext'
import { stressToEmotion } from '../../audio/ttsEmotion'
import { useTheme } from '../../contexts/ThemeContext'
import { CityMap } from '../../components/map/CityMap'
import { RoutePlanner } from '../../components/feedback/RoutePlanner'
import { GuidancePanel } from './panels/GuidancePanel'
import { WaitingCarePanel } from './WaitingCarePanel'
import { formatPlayTime } from '../../game/core/pacing'
import { TaskCard } from './TaskCard'
import { Transcript } from './Transcript'
import { QuestionDock } from './QuestionDock'
import { ReroutePanel } from './ReroutePanel'
import { HandoffPanel } from './HandoffPanel'
import { Dialog } from '../../components/ui/Dialog'
import { ROGUE_PERKS } from '../../game/core/perks'
import './workbench.css'

interface Props { onNavigate: (screen: 'title' | 'ending', ending?: EndingDef, totalScore?: number, callScores?: number[], activeSeconds?: number) => void; scenarioId?: string; onDispatchCardChange?: (control: DispatchCardControl) => void }
type Tab = 'call' | 'map' | 'task'
type Modal = 'settings' | 'help' | 'exit' | 'end' | null
const PHASES = ['接听', '问询', '路线', '指导', '交接']

export function GameScreen({ onNavigate, scenarioId }: Props) {
  const [state, dispatch] = useReducer(worldReducer, scenarioId, id => {
    if (id === '__resume__') { const saved = loadCheckpoint(); if (saved) return saved }
    return handleStartShift(createInitialState(), id && !id.startsWith('__') ? [id] : id === '__random__' ? undefined : CAMPAIGN_IDS)
  })
  const [tab, setTab] = useState<Tab>('map')
  const [modal, setModal] = useState<Modal>(null)
  const [plan, setPlan] = useState<DispatchPlan | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)
  const [audioFailed, setAudioFailed] = useState(false)
  const [tutorialSeen, setTutorialSeen] = useState(() => readStorage('dispatch120-tutorial') === 'done')
  const audio = useAudio()
  const { theme, toggle } = useTheme()
  const paused = isWorldPaused(state)
  const call = state.currentCall
  const chapter = CAMPAIGN.find(c => c.id === (call?.id ?? state.scenarioQueue[state.callIndex]))
  const step = state.rescue.outcome || state.patientStatus?.died ? 4 : state.dispatchSent ? 3 : plan ? 2 : call ? 1 : 0
  const lastSpoken = useRef(0)
  const deferredMiniGame = useRef<{ callInstanceId: number; stepIndex: number; score: number; passed: boolean } | null>(null)
  const latestPaused = useRef(paused)
  latestPaused.current = paused
  useEffect(() => {
    if (state.screen !== 'playing' || paused) return
    const timer = window.setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => window.clearInterval(timer)
  }, [state.screen, paused])
  useEffect(() => {
    const onHidden = () => { if (document.hidden) dispatch({ type: 'PAUSE', reason: 'background' }) }
    document.addEventListener('visibilitychange', onHidden)
    onHidden()
    return () => document.removeEventListener('visibilitychange', onHidden)
  }, [])
  useEffect(() => {
    audio.tts.setPaused(paused)
    if (!paused && deferredMiniGame.current) { dispatch({ type: 'COMPLETE_MINIGAME', ...deferredMiniGame.current }); deferredMiniGame.current = null }
  }, [paused, audio.tts])
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
  useEffect(() => { setSaveFailed(!saveCheckpoint(state)) }, [state.callIndex, state.scenarioQueue, state.perks, state.rescueNotifications.length]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (state.screen === 'ending') onNavigate('ending', detectEnding(state.totalScore / Math.max(1, state.totalCalls) * 5), state.totalScore, state.callScores, state.activePlaySeconds)
  }, [state.screen, state.totalScore, state.totalCalls, state.callScores, state.activePlaySeconds, onNavigate])
  const openModal = (value: Modal) => { dispatch({ type: 'PAUSE', reason: value === 'settings' ? 'settings' : value === 'help' ? 'help' : 'confirm' }); setModal(value) }
  const closeModal = () => { dispatch({ type: 'RESUME', reason: modal === 'settings' ? 'settings' : modal === 'help' ? 'help' : 'confirm' }); setModal(null) }
  const endCall = () => { setPlan(null); audio.tts.stop(); dispatch({ type: 'END_CALL' }) }
  const replay = () => {
    const last = [...state.dialogueLog].reverse().find(line => line.speaker === 'caller')
    if (!last) return
    audio.tts.stop(); void audio.tts.enqueue(`replay-${state.callInstanceId}`, { text: last.text, kind: 'caller' }).catch(() => setAudioFailed(true))
  }
  const openRoute = () => { const next = buildDispatchPlan(state); if (next) { setPlan(next); setTab('map') } }
  const onFinishMiniGame = (stepIndex: number, score: number, passed: boolean) => {
    const result = { callInstanceId: state.callInstanceId, stepIndex, score, passed }
    if (latestPaused.current) deferredMiniGame.current = result
    else dispatch({ type: 'COMPLETE_MINIGAME', ...result })
  }
  let overlay: ReactNode = null
  if (modal) overlay = <Dialog title={modal === 'settings' ? '值班设置' : modal === 'help' ? '接好这通电话' : modal === 'exit' ? '离开工作台？' : '结束这通电话？'} onClose={closeModal}>
    {modal === 'settings' ? <div className="dialog-content"><label className="volume-setting"><Volume2 size={20} /> 音量<input aria-label="音量" type="range" min="0" max="1" step="0.05" value={audio.volume} onChange={e => audio.setVolume(Number(e.target.value))} /></label><button className="secondary wide" onClick={toggle}>切换到{theme === 'dark' ? '明亮' : '夜间'}工作台</button><p>设置期间，所有游戏计时暂停。</p><button className="text-button" onClick={() => { closeModal(); openModal('exit') }}>返回主菜单</button></div> : modal === 'help' ? <div className="dialog-content"><p>你是电话这头的接线员。听清来电，确认地点与患者情况，再选择响应优先级和路线。</p><ol><li>左侧阅读对话，判断题就在相关描述下方。</li><li>中部选择问询或指导；右侧核对已记录的信息。</li><li>确认路线后派车，保持通话直到现场交接。</li></ol><p>急救内容用于公益科普。现实中请及时拨打 120，听从专业指导。</p><button className="primary" onClick={() => { writeStorage('dispatch120-tutorial', 'done'); setTutorialSeen(true); closeModal() }}>明白了，回到工作台</button></div> : <div className="dialog-content"><p>{modal === 'exit' ? '已完成的通话成绩会保留；重新进入时，本通电话从头开始。' : state.dispatchSent && !state.rescue.outcome ? '救护车仍在途中。现在结束会停止本通电话的指导，尚未完成的操作将记入复盘。' : '当前记录将结算，尚未完成的问询和指导不会自动补齐。'}</p><div className="dialog-actions"><button className="secondary" onClick={closeModal}>继续当前通话</button><button className="danger-button" onClick={() => { closeModal(); if (modal === 'exit') onNavigate('title'); else endCall() }}>{modal === 'exit' ? '保存并离开' : '确认结束通话'}</button></div></div>}
  </Dialog>
  else if (paused && !state.lastDebrief && !state.pendingPerkChoices.length) overlay = <Dialog title="值班已暂停" onClose={() => dispatch({ type: 'RESUME' })}><div className="dialog-content"><p>通话、车辆和急救操作的计时都已停下。准备好后再继续。</p><button className="primary" onClick={() => dispatch({ type: 'RESUME' })}><Play size={18} /> 继续值班</button></div></Dialog>
  else if (state.lastDebrief) {
    const result = state.lastDebrief
    overlay = <Dialog title="通话复盘" onClose={() => dispatch({ type: 'DISMISS_DEBRIEF' })}><div className="dialog-content debrief-content"><span className="eyebrow">每一次回顾，都为了下一次更好</span><h3>{result.scenarioTitle}</h3><div className="debrief-score"><strong>{result.score}</strong><span>/ 100 · 操作评价</span></div><p>{result.patientStatus}</p><p>{result.outcomeNarrative}</p><div className="score-chips">{Object.entries(result.breakdown).map(([key, value]) => <span key={key}>{({ speed: '响应', info: '信息', triage: '优先级', decision: '判断', guidance: '指导', penalty: '扣分' } as Record<string, string>)[key]} <b>{value}</b></span>)}</div><h4>下一次可以留意</h4><ul>{result.reviewPoints.map(point => <li key={point}>{point}</li>)}</ul><div className="knowledge-note"><BookOpen size={20} /><p>{CAMPAIGN.find(c => c.id === result.scenarioId)?.takeaway ?? '完整描述观察到的情况，配合接线员确认关键信息。'}</p></div><button className="primary wide" onClick={() => dispatch({ type: 'DISMISS_DEBRIEF' })}>{state.shiftCompletePending ? '查看班次总结' : '准备下一通来电'}<ArrowRight size={18} /></button></div></Dialog>
  } else if (state.pendingPerkChoices.length) overlay = <Dialog title="给下一通电话的一点支持" onClose={() => dispatch({ type: 'CHOOSE_PERK', perkId: state.pendingPerkChoices[0] })}><div className="dialog-content"><p>选择一项工作辅助，带进下一通电话。</p>{state.pendingPerkChoices.map(id => <button key={id} className="perk-option" onClick={() => dispatch({ type: 'CHOOSE_PERK', perkId: id })}><strong>{ROGUE_PERKS[id].title}</strong><span>{ROGUE_PERKS[id].description}</span></button>)}</div></Dialog>
  return <div className="dispatch-desk">
    <header className="desk-header"><button className="desk-brand" onClick={() => openModal('exit')} aria-label="返回主菜单"><span className="brand-symbol"><Activity size={25} /></span><strong>120<span>调度台</span></strong></button><div className="shift-heading"><span className="eyebrow">第一次独立值班</span><span>每一次接听，都有人在等待。</span></div><div className="header-controls"><span className="shift-count">{Math.min(state.callIndex + 1, state.totalCalls)} <small>/ {state.totalCalls} 通</small></span><button className="icon-button" onClick={() => dispatch({ type: 'PAUSE', reason: 'manual' })} aria-label="暂停值班"><Pause size={19} /></button><button className="icon-button" onClick={() => openModal('help')} aria-label="操作帮助"><BookOpen size={19} /></button><button className="icon-button" onClick={() => openModal('settings')} aria-label="设置"><Settings size={19} /></button></div></header>
    <nav className="stage-strip" aria-label="通话流程">{PHASES.map((label, i) => <span key={label} className={i === step ? 'active' : i < step ? 'complete' : ''}><b>{i < step ? <CheckCircle2 size={15} /> : `0${i + 1}`}</b>{label}</span>)}<p><span className="live-dot" />{paused ? '计时已暂停' : call ? '通话进行中' : '等待下一通来电'}</p></nav>
    {state.rescueNotifications.length > 0 && <section className="rescue-notices" aria-label="后台救援结果">{state.rescueNotifications.map(notification => <div key={notification.id} className={notification.kind}><Ambulance size={18} /><span>{notification.text}</span><button className="icon-button" aria-label="关闭救援结果" onClick={() => dispatch({ type: 'DISMISS_RESCUE_NOTIFICATION', notificationId: notification.id })}><X size={16} /></button></div>)}</section>}
    <nav className="mobile-tabs" aria-label="工作区切换">{([['call', Headphones, '通话'], ['map', Map, '工作区'], ['task', ClipboardList, '任务卡']] as const).map(([id, Icon, label]) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}><Icon size={17} />{label}</button>)}</nav>
    <main className={`desk-grid tab-${tab}`} inert={paused}>
      <aside className="desk-panel transcript-panel"><Transcript state={state} dispatch={dispatch} onReplay={replay} onStop={() => audio.tts.stop()} /></aside>
      <section className="desk-panel workspace-panel">
        <div className="workspace-heading"><div><span className="eyebrow">{chapter ? `CHAPTER ${chapter.chapter}` : 'FREE SHIFT'}</span><h1>{chapter?.title ?? call?.title ?? '城市正在等待你的声音'}</h1></div><span className="location-chip"><Map size={15} /> 城市救援图</span></div>
        {!call ? <div className="shift-welcome"><div className="welcome-emblem"><Headphones size={52} /></div><span className="eyebrow">准备接听 · 第 {state.callIndex + 1} 通</span><h2>{chapter?.focus ?? '让帮助抵达需要的地方'}</h2><p>{chapter?.note ?? '这一次，留意电话里的细节，做出你的判断。'}</p>{!tutorialSeen && <button className="secondary" onClick={() => openModal('help')}><BookOpen size={17} /> 第一次值班？先熟悉工作台</button>}{state.fleet.vehicles[0]?.status !== 'available' ? <div className="turnaround-note"><p>救护车正在完成上一项任务。当前没有患者等待。</p><button className="secondary" onClick={() => dispatch({ type: 'ADVANCE_TURNAROUND' })}>加速车辆周转 · 15 秒</button></div> : <button className="primary answer-button" onClick={() => { dispatch({ type: 'ANSWER_CALL' }); setTab('call'); audio.play('connect') }}><Phone size={20} /> 接听来电<ArrowRight size={18} /></button>}</div> : <>
          <div className="patient-summary"><span><ShieldCheck size={16} />{state.rescue.outcome ? '现场已接手' : state.dispatchSent ? '救护车已出发' : '等待派车'}</span><span>{state.terminal.address || '地点待确认'}</span><time>{Math.floor((state.shiftElapsed - state.callStartTime) / 60).toString().padStart(2, '0')}:{((state.shiftElapsed - state.callStartTime) % 60).toString().padStart(2, '0')}</time></div>
          <div className={`main-workspace ${plan || state.guidanceActive || state.pendingReroute ? 'has-activity' : ''}`}>
            {plan ? <RoutePlanner embedded routes={plan.routes} onCancel={() => setPlan(null)} onConfirm={route => { dispatch({ type: 'DISPATCH', vehicleId: 'ambulance', route, routeOptions: plan.routes, callInstanceId: plan.callInstanceId }); setPlan(null) }} /> : state.pendingReroute ? <ReroutePanel state={state} dispatch={dispatch} /> : state.rescue.outcome || state.patientStatus?.died ? <HandoffPanel state={state} dispatch={dispatch} onComplete={endCall} /> : state.guidanceActive && call.guidance && state.guidanceStepIndex >= call.guidance.steps.length ? <div className="embedded-guidance"><WaitingCarePanel key={state.callInstanceId} state={state} dispatch={dispatch} onStopSpeech={() => audio.tts.stop()} /></div> : state.guidanceActive && call.guidance ? <div className="embedded-guidance"><GuidancePanel key={`${state.callInstanceId}-${state.guidanceStepIndex}`} guidance={call.guidance} stepIndex={state.guidanceStepIndex} results={state.guidanceResults} onContinue={() => { audio.tts.stop(); dispatch({ type: 'CONTINUE_GUIDANCE', callInstanceId: state.callInstanceId, stepIndex: state.guidanceStepIndex }) }} paused={paused} disabled={paused} onAnswer={(stepIndex, selectedIndex) => dispatch({ type: 'ANSWER_GUIDANCE', callInstanceId: state.callInstanceId, stepIndex, selectedIndex })} onCompleteMiniGame={onFinishMiniGame} onEndGuidance={() => openModal('end')} /><p className="helper">救护车预计 {Math.max(0, state.ambulanceRemaining)} 秒后到达。保持通话，留意来电者反馈。</p></div> : <CityMap state={state} />}
          </div>
          {!plan && !state.guidanceActive && !state.rescue.outcome && !state.patientStatus?.died && <QuestionDock state={state} dispatch={dispatch} />}
          {!state.dispatchSent && <button className="mobile-primary primary" onClick={() => setTab('task')}>核对任务卡<ArrowRight size={17} /></button>}
        </>}
        <div className="workspace-footnote"><ShieldCheck size={14} /><span>{audioFailed ? '语音暂不可用，可继续阅读字幕。' : saveFailed ? '当前浏览器无法保存进度，本次仍可正常游玩。' : '游戏内时间经过压缩 · 公益科普体验'}</span></div>
      </section>
      <aside className="desk-panel task-panel">{call ? <TaskCard state={state} dispatch={dispatch} onRoute={openRoute} onEnd={() => openModal('end')} /> : <><div className="panel-heading"><ClipboardList size={18} /><h2>值班备忘</h2></div><div className="shift-memo"><span className="eyebrow">BEFORE THE CALL</span><h3>不必知道所有答案，<br />先问对下一个问题。</h3><ul><li>确认事发地点</li><li>描述意识与呼吸</li><li>记录，再核实</li><li>让指导清楚可执行</li></ul><p>一通电话的成绩衡量游戏操作，不代表真实急救能力。</p></div></>}</aside>
    </main>
    <footer className="desk-bottom"><span><span className="live-dot" /> 调度中心在线</span><span>有效体验 {formatPlayTime(state.activePlaySeconds)}</span><button className="text-button" onClick={() => openModal('exit')}><X size={14} /> 离开工作台</button></footer>
    {overlay}
  </div>
}
