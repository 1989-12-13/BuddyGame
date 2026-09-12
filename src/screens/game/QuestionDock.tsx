// ============================================================
// 对话回合 — 玩家选择「要说什么」，而不是「该问什么」
//   · 顺序由 5 步标准协议自动推进（core/dialogueTurn.ts）
//   · 信息状态条把「情绪 → 信息质量」这条链路显示出来：
//     情绪越高，来电者说的话越不可靠；安抚是唯一能把信息问准的手段
// ============================================================

import { MessageCircle } from 'lucide-react'
import type { Dispatch } from 'react'
import type { WorldState } from '../../game/types'
import type { GameAction } from '../../game/core/actions'
import { isActionBusy } from '../../game/core/session'
import { buildTurn, QUALITY_LABEL, TURN_KIND_LABEL } from '../../game/core/dialogueTurn'
import './turn-dock.css'

export function QuestionDock({ state, dispatch }: { state: WorldState; dispatch: Dispatch<GameAction> }) {
  if (!state.currentCall || !state.callerState || state.dispatchSent || state.rescue.outcome || state.patientStatus?.died) return null

  const busy = isActionBusy(state)
  const turn = buildTurn(state)
  if (turn.options.length === 0) return null

  return (
    <section className="question-dock" aria-label="对话回合">
      <header>
        <MessageCircle size={17} />
        <h3>下一句，你说什么？</h3>
        <span>{busy ? `通话中 · ${state.actionEndsAt - state.shiftElapsed} 秒` : '顺序交给协议，你只管怎么说'}</span>
      </header>

      <div className="fact-strip" aria-label="信息状态">
        <span className="fact-strip-label">信息状态</span>
        {turn.facts.map(fact => (
          <span key={fact.id} className={`fact-chip fact-${fact.quality}`}>
            {fact.label}
            <b>{QUALITY_LABEL[fact.quality]}</b>
          </span>
        ))}
      </div>

      {turn.notice && <p className={`turn-notice${turn.degraded ? ' is-degraded' : ''}`}>{turn.notice}</p>}

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
            {option.hint && <small>{option.hint}</small>}
          </button>
        ))}
      </div>
    </section>
  )
}
