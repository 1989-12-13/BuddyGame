// ============================================================
// 调度登记表 —— 只读摘要（默认）+ 完整字段（按需展开）
// ============================================================
// 玩家不再需要手工填表：问询与判断会自动写入登记表。
// 因此它从「要填的表」退成「已确认了什么的回执」：
//   · 默认只显示四项关键字段（地点 / 意识 / 呼吸 / 判定码）与完成度
//   · 需要核对细节时才展开完整字段（仍可微调）
// 派车入口统一收进工作区底部的常驻操作条，这里不再放按钮。
// ============================================================

import { useState } from 'react'
import type { Dispatch } from 'react'
import { ClipboardList, ChevronDown } from 'lucide-react'
import type { WorldState } from '../../game/types'
import type { GameAction } from '../../game/core/actions'
import { TRIAGE_LABELS } from '../../game/types'
import { nextStepChecks } from './nextStepChecks'
import { TerminalForm } from './panels/TerminalForm'

function consciousLabel(value: boolean | null): string {
  if (value === null) return '待确认'
  return value ? '有意识' : '无意识'
}
function breathingLabel(value: boolean | null): string {
  if (value === null) return '待确认'
  return value ? '正常呼吸' : '无呼吸 / 异常'
}
function determinantLabel(state: WorldState): string {
  const t = state.terminal
  if (!t.determinant) return '待确认'
  const subcode = t.determinantSubcode ? ` · 子码 ${t.determinantSubcode}` : ''
  const triage = t.triage ? ` · ${TRIAGE_LABELS[t.triage]}` : ''
  return `${t.determinant}${subcode}${triage}`
}

export function TaskCard({ state, dispatch }: { state: WorldState; dispatch: Dispatch<GameAction>; onRoute?: () => void; idle?: boolean }) {
  const [open, setOpen] = useState(false)
  const t = state.terminal
  const checks = nextStepChecks(state)
  const done = checks.filter(item => item.done).length

  return <>
    <div className="panel-heading">
      <ClipboardList size={18} />
      <h2>调度登记表</h2>
      <span className="task-done-count">{done} / {checks.length} 已确认</span>
    </div>

    <div className="task-summary">
      <dl className="task-summary-list">
        <div><dt>事件地址</dt><dd>{t.address.trim() || '待确认'}</dd></div>
        <div><dt>意识</dt><dd className={t.conscious === null ? 'is-pending' : ''}>{consciousLabel(t.conscious)}</dd></div>
        <div><dt>呼吸</dt><dd className={t.breathing === null ? 'is-pending' : ''}>{breathingLabel(t.breathing)}</dd></div>
        <div><dt>判定码</dt><dd className={t.determinant ? '' : 'is-pending'}>{determinantLabel(state)}</dd></div>
      </dl>
      <button
        type="button"
        className="text-button task-expand"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        {open ? '收起完整登记表' : '展开完整登记表'}
        <ChevronDown size={15} className={open ? 'is-flipped' : ''} />
      </button>
    </div>

    {open && (
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
    )}
  </>
}
