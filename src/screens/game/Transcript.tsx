import { useEffect, useRef, useState } from 'react'
import { ArrowDown, Headphones, RotateCcw, VolumeX } from 'lucide-react'
import type { WorldState } from '../../game/types'
import type { GameAction } from '../../game/core/actions'
import type { Dispatch } from 'react'
import { getCaller } from '../../game/npc/personas'
export function Transcript({ state, dispatch, onReplay, onStop }: { state: WorldState; dispatch: Dispatch<GameAction>; onReplay: () => void; onStop: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const follow = useRef(true)
  const [unread, setUnread] = useState(false)
  const [history, setHistory] = useState(false)
  const caller = state.currentCall ? getCaller(state.currentCall.callerId) : null
  useEffect(() => {
    if (follow.current) ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'instant' })
    else setUnread(true)
  }, [state.dialogueLog.length])
  useEffect(() => { follow.current = true; setUnread(false); setHistory(false) }, [state.callInstanceId])
  return <>
    <div className="panel-heading"><Headphones size={18} /><h2>来电实录</h2><span className="live-dot" /></div>
    {caller && <div className="caller-profile"><div className="avatar"><Headphones size={28} /></div><div><strong>{caller.name}</strong><p>{caller.relationship} · {state.callerState?.stressLevel}</p></div><span className="voice-bars"><i /><i /><i /><i /><i /></span></div>}
    <div className="transcript-tools"><span>整句字幕</span><button className="icon-button" onClick={onReplay} aria-label="重播上一句"><RotateCcw size={16} /></button><button className="icon-button" onClick={onStop} aria-label="停止语音"><VolumeX size={16} /></button><button className="text-button" onClick={() => setHistory(!history)}>{history ? '当前通话' : '已完成记录'}</button></div>
    <div className="transcript-scroll" ref={ref} onScroll={() => { const el = ref.current!; follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; if (follow.current) setUnread(false) }}>
      {history ? <>{state.callHistory.length === 0 && <p className="empty-copy">完成一通电话后，记录会保存在这里。</p>}{state.callHistory.map((entry, i) => <details className="history-entry" key={`${entry.callId}-${i}`}><summary>{entry.scenarioTitle} · {entry.score ?? '—'} 分</summary>{entry.dialogueLog.map((line, j) => <p key={j}>{line.text}</p>)}</details>)}</> : <>
      {state.dialogueLog.length === 0 && <div className="transcript-empty"><Headphones size={38} /><p>每一次倾听，<br />都是救援的开始。</p></div>}
      {state.dialogueLog.map((line, index) => <div key={`${state.callInstanceId}-${index}`} className={`message message-${line.speaker}`}>
        <span className="message-label">{line.speaker === 'caller' ? '来电者' : line.speaker === 'operator' ? '你' : '调度记录'}<time>{Math.floor(line.timestamp / 60).toString().padStart(2, '0')}:{(line.timestamp % 60).toString().padStart(2, '0')}</time></span>
        <p>{line.text}</p>
        {state.pendingJudgments.filter(j => j.dialogueIndex === index).map(j => <div className="inline-judgment" key={j.id}><strong>{j.question}</strong>{j.options.map((option, optionIndex) => <button key={optionIndex} disabled={j.chosenOptionIndex !== null} className={j.chosenOptionIndex === optionIndex ? 'selected' : ''} onClick={() => dispatch({ type: 'MAKE_JUDGMENT', judgmentId: j.id, chosenOptionIndex: optionIndex })}>{option.label}</button>)}{j.chosenOptionIndex !== null && <p className="helper">{j.options[j.chosenOptionIndex].isCorrect ? '已确认，记录已更新。' : `需要留意：${j.options.find(o => o.isCorrect)?.label}`}</p>}</div>)}
      </div>)}
      </>}
    </div>
    {unread && !history && <button className="new-message" onClick={() => { follow.current = true; ref.current?.scrollTo({ top: ref.current.scrollHeight }); setUnread(false) }}><ArrowDown size={16} /> 查看新消息</button>}
    <div className="panel-footnote">先听清，再确认。语音不会锁住你的操作。</div>
  </>
}
