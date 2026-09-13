// ============================================================
// 并发值班 — 线路条
// ============================================================
// 只做一件事：把「现在有哪几条线在动」摆出来。
//   · 横向 chip 一排，放进通话台顶部 —— 不再占掉左栏上半屏
//   · 空闲线路完全不出现（没有内容可看的信息不该占位）
//   · 接听前只给倒计时（你还没听，不该知道是什么事）
//   · 接听后给「场景名 + 通话时长」，这两条才是调度员真正在盯的读数
// 时钟 / 车辆 / 患者体征由顶部的状态带承担，这里不再重复。
// ============================================================

import { Headphones, Phone } from 'lucide-react'
import type { ShiftLine, ShiftState } from '../../game/core/shift'
import { getScenario } from '../../game/events/templates'

/** 响铃时不给场景名：你还没接起这通电话 */
function activeTitle(line: ShiftLine): string {
  if (line.world.currentCall) return line.world.currentCall.title
  if (line.scenarioId) return getScenario(line.scenarioId).title
  return '通话中'
}

/** 通话时长 mm:ss */
function callDuration(line: ShiftLine): string {
  const seconds = Math.max(0, Math.floor(line.world.shiftElapsed - line.world.callStartTime))
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}

export function LineRack({
  shift,
  onFocus,
  onAnswer,
}: {
  shift: ShiftState
  onFocus: (lineId: string) => void
  onAnswer: (lineId: string) => void
}) {
  const active = shift.lines.filter(line => line.phase === 'ringing' || line.phase === 'active')
  if (active.length === 0) return null

  return (
    <section className="line-rail" aria-label="电话线路">
      <ul className="lr-chips">
        {active.map(line => {
          const isFocused = shift.focusedLineId === line.id
          const remain = Math.max(0, shift.config.ringTimeout - line.ringingFor)
          return (
            <li key={line.id}>
              <button
                type="button"
                className={`lr-chip lr-${line.phase}${isFocused ? ' is-focused' : ''}`}
                onClick={() => (line.phase === 'ringing' ? onAnswer(line.id) : onFocus(line.id))}
              >
                {line.phase === 'ringing'
                  ? <><Phone size={13} /><span>响铃</span><b>{remain}s</b></>
                  : <><Headphones size={13} /><span>{activeTitle(line)}</span><b>{callDuration(line)}</b></>}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
