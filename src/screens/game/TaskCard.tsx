import type { Dispatch } from 'react'
import { Navigation, ClipboardList } from 'lucide-react'
import type { WorldState } from '../../game/types'
import type { GameAction } from '../../game/core/actions'
import { dispatchEligibility } from '../../game/core/session'
import { TerminalForm } from './panels/TerminalForm'

export function TaskCard({ state, dispatch, onRoute, idle = false }: { state: WorldState; dispatch: Dispatch<GameAction>; onRoute: () => void; idle?: boolean }) {
  const t = state.terminal
  const eligibility = dispatchEligibility(state)
  return <>
    <div className="panel-heading"><ClipboardList size={18} /><h2>调度登记表</h2><span className="eyebrow">MPDS RECORD</span></div>
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
    {!idle && !state.dispatchSent && (
      <div className="task-footer">
        <button className="primary wide task-dispatch-mobile" disabled={!eligibility.allowed} title={eligibility.allowed ? undefined : eligibility.reasons.join('；')} onClick={onRoute}><Navigation size={18} /> 规划救援路线</button>
      </div>
    )}
  </>
}
