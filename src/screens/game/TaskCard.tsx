import type { Dispatch } from 'react'
import { Navigation, ClipboardList, CheckCircle2 } from 'lucide-react'
import type { WorldState } from '../../game/types'
import type { GameAction } from '../../game/core/actions'
import { dispatchEligibility } from '../../game/core/session'
import { PatientVitals } from './PatientVitals'
import { TerminalForm } from './panels/TerminalForm'

export function TaskCard({ state, dispatch, onRoute, onEnd }: { state: WorldState; dispatch: Dispatch<GameAction>; onRoute: () => void; onEnd: () => void }) {
  const t = state.terminal
  const eligibility = dispatchEligibility(state)
  return <>
    <div className="panel-heading"><ClipboardList size={18} /><h2>调度登记表</h2><span className="eyebrow">MPDS RECORD</span></div>
    <PatientVitals state={state} />
    <div className="task-fields full-record">
      <TerminalForm
        terminal={t}
        onChange={(field, value) => dispatch({ type: 'UPDATE_TERMINAL', field, value })}
        onSetStatus={(field, value) => dispatch({ type: 'SET_PATIENT_STATUS', field, value })}
        onSetDeterminant={determinant => dispatch({ type: 'SET_MPDS_DETERMINANT', determinant })}
        onSetDeterminantSubcode={subcode => dispatch({ type: 'SET_DETERMINANT_SUBCODE', subcode })}
        onSetProtocol={protocolNumber => dispatch({ type: 'SET_PROTOCOL', protocolNumber })}
      />
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
