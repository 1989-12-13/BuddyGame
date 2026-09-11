import { useEffect, useState, type Dispatch } from 'react'
import { HeartHandshake, MessageCircle, Check, RotateCcw, Bookmark } from 'lucide-react'
import type { WorldState } from '../../game/types'
import type { GameAction } from '../../game/core/actions'
import { isActionBusy } from '../../game/core/session'
import { hasPerk } from '../../game/core/perks'
const QUESTIONS = [['step1_location', '确认位置'], ['step2_event', '了解情况'], ['step4_vitals', '意识与呼吸'], ['step3_age', '年龄信息'], ['ask_landmark', '核实地标'], ['ask_contact', '回拨电话'], ['ask_purpose', '确认求助']] as const
export function QuestionDock({ state, dispatch }: { state: WorldState; dispatch: Dispatch<GameAction> }) {
  const caller = state.currentCall && state.callerState ? state.callerState : null
  const primaryDone = Boolean(caller && QUESTIONS.every(([id]) => (caller.questionAttempts[id] ?? 0) > 0))
  const [extraOpen, setExtraOpen] = useState(false)
  useEffect(() => { if (primaryDone) setExtraOpen(true) }, [primaryDone])

  if (!state.currentCall || !caller || state.dispatchSent || state.rescue.outcome || state.patientStatus?.died) return null
  const asked = caller.askedMPDS
  const busy = isActionBusy(state)
  const canAsk = (id: string) => {
    const attempts = caller.questionAttempts[id] ?? 0
    if (attempts === 0) return true
    return attempts < 2
      && caller.questionQuality[id] !== 'clear'
      && caller.stress < (caller.questionStress[id] ?? caller.stress)
  }
  const hintId = hasPerk(state.perks, 'protocol_hint')
    ? QUESTIONS.find(([id]) => canAsk(id))?.[0] ?? null
    : null
  const renderQuestion = (id: string, label: string) => {
    const attempts = caller.questionAttempts[id] ?? 0
    const retry = attempts > 0 && canAsk(id)
    const complete = attempts > 0 && !retry
    return <button key={id} disabled={busy || !canAsk(id)} className={`${complete ? 'done' : ''} ${hintId === id ? 'hinted' : ''}`} onClick={() => dispatch({ type: 'ASK_QUESTION', questionId: id })}>{retry ? <RotateCcw size={14} /> : complete ? <Check size={14} /> : hintId === id ? <Bookmark size={14} /> : null}{retry ? `再确认${label}` : label}</button>
  }
  return <section className="question-dock"><header><MessageCircle size={17} /><h3>下一句，问什么？</h3><span>{busy ? `问询中 · ${state.actionEndsAt - state.shiftElapsed} 秒` : '依据已经听到的信息，选择重点'}</span></header>
    <div className="question-buttons">{QUESTIONS.map(([id, label]) => renderQuestion(id, label))}</div>
    {state.currentCall.mpdsQuestions.length > 0 && <details open={extraOpen} onToggle={e => setExtraOpen(e.currentTarget.open)}><summary>补充问询</summary><div className="question-buttons">{state.currentCall.mpdsQuestions.map(q => <button key={q.id} disabled={busy || !canAsk(q.id) || !!q.prerequisites?.some(id => !asked.includes(id))} onClick={() => dispatch({ type: 'ASK_QUESTION', questionId: q.id })}>{(caller.questionAttempts[q.id] ?? 0) > 0 && canAsk(q.id) && <RotateCcw size={14} />}{canAsk(q.id) && (caller.questionAttempts[q.id] ?? 0) > 0 ? `再确认${q.label}` : q.label}</button>)}</div></details>}
    <button className="calm-button" disabled={busy || caller.stress === 0} onClick={() => dispatch({ type: 'CALM_CALLER' })}><HeartHandshake size={17} /> 安抚来电者 <span>{state.calmCount > 0 ? '换个重点，再一起确认' : '让我们一步一步来'}</span></button>
  </section>
}
