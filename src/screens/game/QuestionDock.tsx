import { HeartHandshake, MessageCircle, Check } from 'lucide-react'
import type { WorldState } from '../../game/types'
import type { GameAction } from '../../game/core/actions'
import type { Dispatch } from 'react'
import { isActionBusy } from '../../game/core/session'
const QUESTIONS = [['step1_location', '确认位置'], ['step2_event', '了解情况'], ['step4_vitals', '意识与呼吸'], ['step3_age', '年龄信息'], ['ask_landmark', '核实地标'], ['ask_contact', '回拨电话'], ['ask_purpose', '确认求助']] as const
export function QuestionDock({ state, dispatch }: { state: WorldState; dispatch: Dispatch<GameAction> }) {
  if (!state.currentCall || !state.callerState || state.dispatchSent || state.rescue.outcome || state.patientStatus?.died) return null
  const asked = state.callerState.askedMPDS
  const busy = isActionBusy(state)
  return <section className="question-dock"><header><MessageCircle size={17} /><h3>下一句，问什么？</h3><span>{busy ? `问询中 · ${state.actionEndsAt - state.shiftElapsed} 秒` : '依据已经听到的信息，选择重点'}</span></header>
    <div className="question-buttons">{QUESTIONS.map(([id, label]) => <button key={id} disabled={busy || asked.includes(id)} className={asked.includes(id) ? 'done' : ''} onClick={() => dispatch({ type: 'ASK_QUESTION', questionId: id })}>{asked.includes(id) && <Check size={14} />}{label}</button>)}</div>
    {state.currentCall.mpdsQuestions.length > 0 && <details><summary>补充问询</summary><div className="question-buttons">{state.currentCall.mpdsQuestions.map(q => <button key={q.id} disabled={busy || asked.includes(q.id) || !!q.prerequisites?.some(id => !asked.includes(id))} onClick={() => dispatch({ type: 'ASK_QUESTION', questionId: q.id })}>{q.label}</button>)}</div></details>}
    <button className="calm-button" disabled={busy || state.callerState.stress === 0} onClick={() => dispatch({ type: 'CALM_CALLER' })}><HeartHandshake size={17} /> 安抚来电者 <span>{state.calmCount > 0 ? '换个重点，再一起确认' : '让我们一步一步来'}</span></button>
  </section>
}
