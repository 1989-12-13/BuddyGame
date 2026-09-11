import { useState, type Dispatch } from 'react'
import { BookOpen, CheckCircle2, ClipboardCheck } from 'lucide-react'
import type { WorldState, MiniGameSpec } from '../../game/types'
import type { GameAction } from '../../game/core/actions'
import { availableCareChecks, careChecksFor } from '../../game/core/waitingCare'
import { MiniGameHost } from '../../components/minigames/MiniGameHost'
import { isWorldPaused } from '../../game/core/session'

export function WaitingCarePanel({ state, dispatch, onStopSpeech }: { state: WorldState; dispatch: Dispatch<GameAction>; onStopSpeech: () => void }) {
  const [practice, setPractice] = useState<MiniGameSpec | null>(null)
  const [result, setResult] = useState<number | null>(null)
  const specs = state.currentCall?.guidance?.steps.flatMap(step => step.miniGame ? [step.miniGame] : []) ?? []
  const checks = availableCareChecks(state)
  const upcoming = careChecksFor(state).find(check => !checks.some(ready => ready.id === check.id))
  const paused = isWorldPaused(state)
  return <section className="waiting-care" aria-label="途中照护台">
    <h3><ClipboardCheck size={20} />电话指导已完成</h3>
    <p className="helper">等待救护车到达（约 {Math.max(0, state.ambulanceRemaining)} 秒）。保持通话，留意来电者的新问题。</p>
    {checks.map(check => <article className="care-check" key={check.id}><h4>{check.message}</h4>{state.careChecks[check.id] === undefined ? check.options.map((option, index) => <button className="secondary" key={option} disabled={paused} onClick={() => { onStopSpeech(); dispatch({ type: 'CARE_CHECK', callInstanceId: state.callInstanceId, checkId: check.id, selectedIndex: index }) }}>{option}</button>) : <p role="status"><CheckCircle2 size={16} />{state.careChecks[check.id] === check.correctIndex ? '已记录：' : '需要复核：'}{check.explanation}</p>}</article>)}
    {upcoming && state.dispatchRecord && <p className="helper">下一次联络确认：约 {Math.max(0, upcoming.after - (state.shiftElapsed - state.dispatchRecord.dispatchedAt))} 秒后。救护车仍在行驶。</p>}
    <details open={practice !== null}><summary><BookOpen size={16} />本场景操作复习</summary><div className="practice-choices">{specs.map(spec => <button className="secondary" key={spec.title} disabled={paused} onClick={() => { setPractice(spec); setResult(null) }}>{spec.title}</button>)}</div>
      {practice && result === null && <MiniGameHost key={practice.title} spec={practice} paused={paused} onComplete={score => setResult(score)} />}
      {result !== null && <p role="status">本次练习 {Math.round(result * 100)} 分。实际通话成绩保持不变。</p>}
    </details>
  </section>
}
