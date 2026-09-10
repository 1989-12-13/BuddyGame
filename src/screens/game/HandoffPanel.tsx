import { useState } from 'react'
import { ArrowRight, CheckCircle2, ClipboardCheck, ShieldCheck } from 'lucide-react'
import type { Dispatch } from 'react'
import type { GameAction } from '../../game/core/actions'
import { buildHandoffFacts } from '../../game/core/handoff'
import type { WorldState } from '../../game/types'

export function HandoffPanel({ state, dispatch, onComplete }: { state: WorldState; dispatch: Dispatch<GameAction>; onComplete: () => void }) {
  const { facts, requiredIds } = buildHandoffFacts(state)
  const [selected, setSelected] = useState<string[]>(state.handoff.selectedFactIds)
  if (!state.rescue.outcome) {
    return <div className="handoff"><ShieldCheck size={52} /><h2>这通电话，需要一次认真回顾</h2><p>{state.rescue.failureReason ?? '患者情况已经恶化，操作评价与模拟救援结局会分别记录。'}</p><button className="primary" onClick={onComplete}>查看复盘<ArrowRight size={18} /></button></div>
  }
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : current.length < requiredIds.length ? [...current, id] : current)
  return <section className="handoff handoff-form" aria-label="现场交接">
    <ClipboardCheck size={44} />
    <div><span className="eyebrow">现场交接</span><h2>选择需要交给现场人员的信息</h2><p>请选择 {requiredIds.length} 项。只交接本通电话已经确认和实际执行的内容。</p></div>
    <div className="handoff-facts">{facts.map(fact => <button key={fact.id} aria-pressed={selected.includes(fact.id)} onClick={() => toggle(fact.id)} disabled={!selected.includes(fact.id) && selected.length >= requiredIds.length}><span>{selected.includes(fact.id) && <CheckCircle2 size={16} />}</span>{fact.label}</button>)}</div>
    {state.handoff.feedback.length > 0 && <div className={`handoff-feedback ${state.handoff.completed ? 'good' : 'caution'}`}>{state.handoff.feedback.map(line => <p key={line}>{line}</p>)}</div>}
    {state.handoff.completed
      ? <button className="primary" onClick={onComplete}>完成交接，查看复盘<ArrowRight size={18} /></button>
      : <button className="primary" disabled={selected.length !== requiredIds.length} onClick={() => dispatch({ type: 'SUBMIT_HANDOFF', callInstanceId: state.callInstanceId, factIds: selected })}>{state.handoff.attempts === 0 ? '提交交接记录' : '修正并再次提交'}</button>}
  </section>
}
