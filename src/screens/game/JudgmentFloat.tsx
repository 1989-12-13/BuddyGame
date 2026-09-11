import { useEffect, useState, type Dispatch } from 'react'
import { Brain, CheckCircle2, TriangleAlert, X } from 'lucide-react'
import type { JudgmentPrompt } from '../../game/types'
import type { GameAction } from '../../game/core/actions'

/**
 * 临床判断浮窗 — 右下角非阻塞小卡片。
 * 不打断对话流：玩家可以继续听/继续问，答完后展示短暂反馈，可手动关闭。
 */
export function JudgmentFloat({ judgments, dispatch }: { judgments: JudgmentPrompt[]; dispatch: Dispatch<GameAction> }) {
  const active = judgments.find(j => j.chosenOptionIndex === null) ?? null
  const lastAnswered = [...judgments].reverse().find(j => j.chosenOptionIndex !== null) ?? null
  const activeId = active?.id ?? null
  const [acknowledgedId, setAcknowledgedId] = useState<string | null>(null)

  useEffect(() => {
    if (activeId) setAcknowledgedId(null)
  }, [activeId])

  if (active) {
    return <aside className="judgment-float" role="complementary" aria-label="临床判断">
      <header><Brain size={16} /><strong>临床判断</strong><span>听完叙述后选择</span></header>
      <p className="judgment-question">{active.question}</p>
      <div className="judgment-options">
        {active.options.map((option, index) => (
          <button key={index} onClick={() => dispatch({ type: 'MAKE_JUDGMENT', judgmentId: active.id, chosenOptionIndex: index })}>
            <span>{option.label}</span>
            {option.sublabel && <small>{option.sublabel}</small>}
          </button>
        ))}
      </div>
    </aside>
  }

  if (!lastAnswered) return null
  if (acknowledgedId === lastAnswered.id) return null

  const chosen = lastAnswered.chosenOptionIndex === null ? null : lastAnswered.options[lastAnswered.chosenOptionIndex]
  const correct = Boolean(chosen?.isCorrect)
  return <aside className={`judgment-float result ${correct ? 'good' : 'bad'}`} role="status" aria-label="判断结果">
    <header>
      <strong className={correct ? 'success-text' : 'danger-text'}>
        {correct ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}
        {correct ? '判断记录已确认' : '这一步需要留意'}
      </strong>
      <button className="icon-button" aria-label="关闭判断结果" onClick={() => setAcknowledgedId(lastAnswered.id)}><X size={15} /></button>
    </header>
    <p>{correct ? chosen?.label : `正确方向：${lastAnswered.options.find(o => o.isCorrect)?.label ?? '—'}`}</p>
  </aside>
}
