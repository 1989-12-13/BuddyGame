// ============================================================
// 并发值班 — 线路墙
// 显示所有电话线路的状态、响铃倒计时、来电者情绪，
// 是「注意力稀缺」这一核心玩法的可视化载体。
// ============================================================

import { AlertTriangle, Ambulance, Check, Headphones, Pause, Phone, Play, Timer } from 'lucide-react'
import type { ShiftLine, ShiftState } from '../../game/core/shift'
import { availableVehicleCount, lineNeedsDecision, pendingDecisionCount } from '../../game/core/shift'
import { getScenario } from '../../game/events/templates'
import { getCaller } from '../../game/npc/personas'
import { STRESS_INFO } from '../../game/types'

function lineTitle(line: ShiftLine): string | null {
  if (line.world.currentCall) return line.world.currentCall.title
  if (line.scenarioId) return getScenario(line.scenarioId).title
  return null
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function LineRack({
  shift,
  paused,
  onFocus,
  onAnswer,
  onTogglePause,
}: {
  shift: ShiftState
  paused: boolean
  onFocus: (lineId: string) => void
  onAnswer: (lineId: string) => void
  onTogglePause: () => void
}) {
  const ringingCount = shift.lines.filter(line => line.phase === 'ringing').length
  const pending = shift.config.queue.length - shift.queueIndex
  const decisionCount = pendingDecisionCount(shift)

  return (
    <section className="line-rack" aria-label="电话线路">
      <header className="lr-head">
        <span className="eyebrow">电话线路</span>
        <span className="lr-clock">{formatClock(shift.clock)}</span>
      </header>

      <div className="lr-status">
        <span><Ambulance size={14} /> 可用车辆 <b>{availableVehicleCount(shift)}</b> / {shift.config.vehicleCount}</span>
        <span>待处理 <b>{pending}</b></span>
        {decisionCount > 0 && <span className="lr-warn">待决策 <b>{decisionCount}</b></span>}
        {shift.missed.length > 0 && <span className="lr-bad">未接 <b>{shift.missed.length}</b></span>}
      </div>

      <ul className="lr-list">
        {shift.lines.map(line => {
          const focused = shift.focusedLineId === line.id
          const caller = line.world.currentCall ? getCaller(line.world.currentCall.callerId) : null
          const stress = line.world.callerState?.stressLevel
          const remain = Math.max(0, shift.config.ringTimeout - line.ringingFor)
          const interactive = line.phase === 'ringing' || line.phase === 'active'
          const needsDecision = lineNeedsDecision(line)
          const isSupplement = line.role === 'supplement'
          const linkedIncident = line.incidentId
            ? shift.incidents.find(incident => incident.id === line.incidentId) ?? null
            : null
          const hasSecondCall = !isSupplement && Boolean(linkedIncident?.supplementLineId)

          return (
            <li key={line.id} className={`lr-item lr-${line.phase} ${focused ? 'is-focused' : ''} ${needsDecision ? 'needs-decision' : ''}`}>
              <button
                type="button"
                className="lr-body"
                disabled={!interactive}
                onClick={() => (line.phase === 'ringing' ? onAnswer(line.id) : onFocus(line.id))}
              >
                <span className="lr-top">
                  <span className="lr-phase">
                    {line.phase === 'ringing' && <><Phone size={14} /> 响铃</>}
                    {line.phase === 'active' && <><Headphones size={14} /> 通话中</>}
                    {line.phase === 'done' && <><Check size={14} /> 已结束</>}
                    {line.phase === 'idle' && <><Timer size={14} /> 空闲</>}
                  </span>
                  {line.phase === 'ringing' && (
                    <span className="lr-remain"><AlertTriangle size={13} /> {remain}s</span>
                  )}
                </span>
                {needsDecision && <span className="lr-flag"><AlertTriangle size={12} /> 待决策 · 在途事件</span>}
                {(isSupplement || hasSecondCall) && (
                  <span className="lr-link">同一事故 {isSupplement ? '· 核实通话' : '· 有第二通'}</span>
                )}
                <strong className="lr-title">{lineTitle(line) ?? '等待来电'}</strong>
                {caller && (
                  <span className="lr-caller">
                    {caller.name}{stress && <> · <b style={{ color: STRESS_INFO[stress].color }}>{stress}</b></>}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {ringingCount > 0 && <p className="lr-hint">点击响铃线路即可接听。未接听的线路会转入留言。</p>}
      {shift.lastRejection && <p className="lr-reject"><AlertTriangle size={14} /> {shift.lastRejection}</p>}

      <button type="button" className="lr-pause" onClick={onTogglePause}>
        {paused ? <><Play size={15} /> 继续值班</> : <><Pause size={15} /> 暂停</>}
      </button>
    </section>
  )
}
