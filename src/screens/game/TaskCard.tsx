// ============================================================
// 调度登记表 —— 始终显示完整字段
// ============================================================
// 玩家不需要手工填表：问询与判断会自动写入登记表。
// 登记表始终展开完整字段，方便随时查看与微调。
// 派车入口统一收进工作区底部的常驻操作条，这里不再放按钮。
// ============================================================

import type { Dispatch } from 'react'
import { ClipboardList } from 'lucide-react'
import type { WorldState } from '../../game/types'
import type { GameAction } from '../../game/core/actions'
import { nextStepChecks } from './nextStepChecks'
import { TerminalForm } from './panels/TerminalForm'

export function TaskCard({ state, dispatch }: { state: WorldState; dispatch: Dispatch<GameAction>; onRoute?: () => void; idle?: boolean }) {
  const t = state.terminal
  const checks = nextStepChecks(state)
  const done = checks.filter(item => item.done).length

  return <>
    <div className="panel-heading">
      <ClipboardList size={18} />
      <h2>调度登记表</h2>
      <span className="task-done-count">{done} / {checks.length} 已确认</span>
    </div>

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
  </>
}
