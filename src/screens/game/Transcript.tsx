import { useEffect, useRef, useState } from 'react'
import { ArrowDown, Headphones, RotateCcw, VolumeX } from 'lucide-react'
import type { WorldState } from '../../game/types'
import { STRESS_INFO } from '../../game/types'
import { getCaller } from '../../game/npc/personas'
import { NextStepChecks } from './NextStepDock'

/**
 * 通话实录 — 对话流是这局游戏的核心内容，因此它占据通话台的主体高度。
 *
 * 顶栏一行承载「当前状态」，不再各占一块纵向空间：
 *   1. 谁在电话那头（姓名 / 关系 / 情绪）
 *   2. 登记还差什么（地点 / 意识 / 呼吸 / 判定码）
 *   3. 回声与记录工具
 *
 * 系统提示（接线记录、派车确认、路况播报…）不在通话时展示：
 * 它们仍然写在 dialogueLog 里供复盘与结算使用，只是不占用对话流。
 */
export function Transcript({ state, onReplay, onStop }: { state: WorldState; onReplay: () => void; onStop: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const follow = useRef(true)
  const [unread, setUnread] = useState(false)
  const caller = state.currentCall ? getCaller(state.currentCall.callerId) : null
  const stress = state.callerState?.stressLevel ?? null
  const visible = state.dialogueLog.filter(line => line.speaker !== 'system')

  useEffect(() => {
    if (follow.current) ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'instant' })
    else setUnread(true)
  }, [state.dialogueLog.length])

  useEffect(() => { follow.current = true; setUnread(false) }, [state.callInstanceId])

  return <>
    <div className="transcript-bar">
      {caller && (
        <span className="tb-caller" aria-label="来电者">
          <span className="tb-avatar"><Headphones size={15} /></span>
          <b>{caller.name}</b>
          <span className="tb-relation">{caller.relationship}</span>
          {stress && (
            <span className="tb-stress" style={{ color: STRESS_INFO[stress].color, borderColor: STRESS_INFO[stress].color }}>
              情绪 {stress}
            </span>
          )}
          <span className="voice-bars" aria-hidden="true"><i /><i /><i /><i /><i /></span>
        </span>
      )}

      <NextStepChecks state={state} />

      <div className="transcript-tools">
        <button className="icon-button" onClick={onReplay} aria-label="重播上一句"><RotateCcw size={16} /></button>
        <button className="icon-button" onClick={onStop} aria-label="停止语音"><VolumeX size={16} /></button>
      </div>
    </div>
    <div className="transcript-scroll" ref={ref} onScroll={() => { const el = ref.current!; follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; if (follow.current) setUnread(false) }}>
      {visible.length === 0 && <div className="transcript-empty"><Headphones size={38} /><p>每一次倾听，<br />都是救援的开始。</p></div>}
      {visible.map((line, index) => <div key={`${state.callInstanceId}-${index}`} className={`message message-${line.speaker} message-enter`}>
        <span className="message-label">{line.speaker === 'caller' ? '来电者' : '你'}<time>{Math.floor(line.timestamp / 60).toString().padStart(2, '0')}:{(line.timestamp % 60).toString().padStart(2, '0')}</time></span>
        <p>{line.text}</p>
      </div>)}
    </div>
    {unread && <button className="new-message" onClick={() => { follow.current = true; ref.current?.scrollTo({ top: ref.current.scrollHeight }); setUnread(false) }}><ArrowDown size={16} /> 查看新消息</button>}
  </>
}
