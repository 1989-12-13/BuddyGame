// ============================================================
// 对话回合 — 底部抽屉：玩家选择「要说什么」，而不是「该问什么」
//   · 顺序由 5 步标准协议自动推进（core/dialogueTurn.ts）
//   · 每句话的代价（放慢 / 加快 / 安抚 …）收进抽屉顶部的图例，
//     选项按钮本身只留「类型徽标 + 台词」，把纵向空间让给对话流
//   · 来电者与登记完成度常驻在「来电实录」栏，不在这里占用高度
// ============================================================

import { useState } from 'react'
import { ChevronDown, MessageCircle } from 'lucide-react'
import type { Dispatch } from 'react'
import type { WorldState } from '../../game/types'
import type { GameAction } from '../../game/core/actions'
import { isActionBusy } from '../../game/core/session'
import { buildTurn, TURN_KIND_LABEL } from '../../game/core/dialogueTurn'
import './turn-dock.css'

export function QuestionDock({ state, dispatch }: { state: WorldState; dispatch: Dispatch<GameAction> }) {
  const [open, setOpen] = useState(true)
  if (!state.currentCall || !state.callerState || state.dispatchSent || state.rescue.outcome || state.patientStatus?.died) return null

  const busy = isActionBusy(state)
  const turn = buildTurn(state)
  if (turn.options.length === 0) return null

  return (
    <section className={`question-dock${open ? '' : ' is-collapsed'}`} aria-label="对话回合">
      <header>
        <MessageCircle size={17} />
        <h3>下一句，你说什么？</h3>
        <span>{busy ? `通话中 · ${state.actionEndsAt - state.shiftElapsed} 秒` : '顺序交给协议，你只管怎么说'}</span>
        <button
          type="button"
          className="dock-toggle"
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}
        >
          <ChevronDown size={15} className={open ? '' : 'is-flipped'} />
          {open ? '收起' : `展开 ${turn.options.length} 个选项`}
        </button>
      </header>

      {open && <>
        <div className="turn-options">
          {turn.options.map(option => (
            <button
              key={option.id}
              type="button"
              className={`turn-option turn-${option.kind}`}
              disabled={busy}
              onClick={() => dispatch(option.action)}
            >
              <span className="turn-kind">{TURN_KIND_LABEL[option.kind]}</span>
              <strong>{option.line}</strong>
            </button>
          ))}
        </div>
      </>}
    </section>
  )
}
