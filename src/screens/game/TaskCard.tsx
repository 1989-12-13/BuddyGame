import type { Dispatch } from 'react'
import { MapPin, Navigation, ClipboardList, CheckCircle2 } from 'lucide-react'
import type { WorldState, MpdsDeterminant } from '../../game/types'
import type { GameAction } from '../../game/core/actions'
import { dispatchEligibility } from '../../game/core/session'
import { TerminalForm } from './panels/TerminalForm'
const PRIORITIES: [MpdsDeterminant, string][] = [['ECHO', '立即响应 · 极危急'], ['DELTA', '紧急响应 · 高风险'], ['CHARLIE', '优先响应 · 需评估'], ['BRAVO', '及时响应 · 较低风险'], ['ALPHA', '常规响应 · 低风险']]
export function TaskCard({ state, dispatch, onRoute, onEnd }: { state: WorldState; dispatch: Dispatch<GameAction>; onRoute: () => void; onEnd: () => void }) {
  const t = state.terminal
  const eligibility = dispatchEligibility(state)
  return <>
    <div className="panel-heading"><ClipboardList size={18} /><h2>这通电话的记录</h2><span className="eyebrow">TASK CARD</span></div>
    <div className="task-fields">
      <label><span><MapPin size={14} /> 事发地址</span><textarea rows={3} value={t.address} placeholder="从来电中确认位置" onChange={e => dispatch({ type: 'UPDATE_TERMINAL', field: 'address', value: e.target.value })} /></label>
      <label><span>联系电话</span><input value={t.contact} placeholder="等待核实" onChange={e => dispatch({ type: 'UPDATE_TERMINAL', field: 'contact', value: e.target.value })} /></label>
      <label><span>主要情况</span><textarea rows={2} value={t.chiefComplaint} placeholder="记录观察到的情况" onChange={e => dispatch({ type: 'UPDATE_TERMINAL', field: 'chiefComplaint', value: e.target.value })} /></label>
      {(['conscious', 'breathing'] as const).map(field => <fieldset className="status-choice" key={field}><legend>{field === 'conscious' ? '患者有意识吗？' : '患者有正常呼吸吗？'}</legend>
        <div>{[true, false].map(value => <button key={String(value)} aria-pressed={t[field] === value} onClick={() => dispatch({ type: 'SET_PATIENT_STATUS', field, value })}>{value ? '有' : '没有'}{t[field] === value && <CheckCircle2 size={14} />}</button>)}</div>
      </fieldset>)}
      <label><span>响应优先级</span><select value={t.determinant ?? ''} onChange={e => dispatch({ type: 'SET_MPDS_DETERMINANT', determinant: e.target.value as MpdsDeterminant })}><option value="" disabled>根据已确认的信息选择</option>{PRIORITIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <details className="technical-details"><summary>详细记录 · 专业编码</summary><TerminalForm terminal={t} onChange={(field, value) => dispatch({ type: 'UPDATE_TERMINAL', field, value })} onSetStatus={(field, value) => dispatch({ type: 'SET_PATIENT_STATUS', field, value })} onSetDeterminant={determinant => dispatch({ type: 'SET_MPDS_DETERMINANT', determinant })} onSetDeterminantSubcode={subcode => dispatch({ type: 'SET_DETERMINANT_SUBCODE', subcode })} onSetProtocol={protocolNumber => dispatch({ type: 'SET_PROTOCOL', protocolNumber })} /></details>
    </div>
    <div className="task-footer">
      {state.dispatchSent ? <p className="success-text"><CheckCircle2 size={16} /> {state.rescue.outcome ? '现场已接手，请完成交接' : `救护车已出发 · 预计 ${state.ambulanceRemaining} 秒`}</p> : <>
        <p className="helper">{eligibility.allowed ? '信息已就绪，比较路线后确认派车。' : eligibility.reasons.join(' · ')}</p>
        <button className="primary wide" disabled={!eligibility.allowed} onClick={onRoute}><Navigation size={18} /> 规划救援路线</button>
      </>}
      <button className="text-button danger-text" onClick={onEnd}>结束当前通话</button>
    </div>
  </>
}
