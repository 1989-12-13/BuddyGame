import { useEffect, useRef, useState } from 'react'
import { ArrowDown, Headphones, RotateCcw, VolumeX } from 'lucide-react'
import type { WorldState } from '../../game/types'
import { getCaller } from '../../game/npc/personas'

const rescueStatusText = {
  pending: '车辆途中',
  arrived: '已到达',
  resolved: '救援已结算',
  'missed-handoff': '未完成交接',
} as const

/** 通话实录 — 流式对话流。判断题由右下角浮窗承担，不再内联插入消息流。 */
export function Transcript({ state, onReplay, onStop }: { state: WorldState; onReplay: () => void; onStop: () => void }) {
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
    <div className="transcript-tools">
      <button className="icon-button" onClick={onReplay} aria-label="重播上一句"><RotateCcw size={16} /></button>
      <button className="icon-button" onClick={onStop} aria-label="停止语音"><VolumeX size={16} /></button>
      <button className="text-button" onClick={() => setHistory(!history)}>{history ? '当前通话' : '已完成记录'}</button>
    </div>
    <div className="transcript-scroll" ref={ref} onScroll={() => { const el = ref.current!; follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; if (follow.current) setUnread(false) }}>
      {history ? <>{state.callHistory.length === 0 && <p className="empty-copy">完成一通电话后，记录会保存在这里。</p>}{state.callHistory.map((entry, i) => <details className="history-entry" key={`${entry.callId}-${i}`}><summary>{entry.scenarioTitle} · {entry.score ?? '—'} 分</summary><span className={`history-rescue-status ${entry.outcome === 'failed' ? 'bad' : ''}`}>{entry.outcome === 'pending' ? rescueStatusText[entry.rescueStatus] : entry.outcome === 'success' ? '模拟救援完成' : '模拟救援未成功'}</span>{entry.dialogueLog.map((line, j) => <p key={j}>{line.text}</p>)}</details>)}</> : <>
        {state.dialogueLog.length === 0 && <div className="transcript-empty"><Headphones size={38} /><p>每一次倾听，<br />都是救援的开始。</p></div>}
        {state.dialogueLog.map((line, index) => <div key={`${state.callInstanceId}-${index}`} className={`message message-${line.speaker} message-enter`}>
          <span className="message-label">{line.speaker === 'caller' ? '来电者' : line.speaker === 'operator' ? '你' : '调度记录'}<time>{Math.floor(line.timestamp / 60).toString().padStart(2, '0')}:{(line.timestamp % 60).toString().padStart(2, '0')}</time></span>
          <p>{line.text}</p>
        </div>)}
      </>}
    </div>
    {unread && !history && <button className="new-message" onClick={() => { follow.current = true; ref.current?.scrollTo({ top: ref.current.scrollHeight }); setUnread(false) }}><ArrowDown size={16} /> 查看新消息</button>}
  </>
}
