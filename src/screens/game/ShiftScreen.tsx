// ============================================================
// 并发值班 — 班次屏幕
// 一名调度员 + 3 条电话线路 + 2 辆救护车。
// 玩家一次只处理一条线，其余线路会响铃、会焦虑、会超时。
// ============================================================

import { useCallback, useEffect, useReducer, useRef } from 'react'
import { Activity } from 'lucide-react'
import {
  DEFAULT_SHIFT_CONFIG,
  createShiftState,
  focusedLine,
  isShiftComplete,
  isShiftPaused,
  shiftReducer,
  summarizeShift,
  type ShiftAction,
  type ShiftSummary,
} from '../../game/core/shift'
import { buildScenarioQueue } from '../../game/core/worldState'
import { detectEnding } from '../../game/endings/endings'
import type { EndingDef } from '../../game/types'
import { GameScreen } from './WorkbenchScreen'
import { LineRack } from './LineRack'
import { VerifyPanel } from './VerifyPanel'
import './shift.css'

interface Props {
  onNavigate: (
    screen: 'title' | 'ending',
    ending?: EndingDef,
    totalScore?: number,
    callScores?: number[],
    activeSeconds?: number,
    shiftDetail?: ShiftSummary,
  ) => void
}

export function ShiftScreen({ onNavigate }: Props) {
  const [shift, dispatch] = useReducer(shiftReducer, null, () =>
    createShiftState({ ...DEFAULT_SHIFT_CONFIG, queue: buildScenarioQueue() }),
  )

  // 班次时钟：一次 tick 推进全部线路
  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: 'TICK' } as ShiftAction), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const focused = focusedLine(shift)
  const paused = isShiftPaused(shift)
  const complete = isShiftComplete(shift)

  // 班次收束 → 交给既有的结算画面（未接来电按 0 分计入，让它出现在接警记录里）
  const summaryRef = useRef(summarizeShift(shift))
  summaryRef.current = summarizeShift(shift)
  const navigatedAway = useRef(false)
  const finishShift = useCallback(() => {
    if (navigatedAway.current) return
    navigatedAway.current = true
    const { totalScore, callScores, activeSeconds } = summaryRef.current
    const average = callScores.length > 0 ? totalScore / callScores.length : 0
    onNavigate('ending', detectEnding(average * 5), totalScore, callScores, activeSeconds, summaryRef.current)
  }, [onNavigate])

  useEffect(() => {
    if (complete) finishShift()
  }, [complete, finishShift])

  return (
    <div className={`shift-shell ${paused ? 'is-paused' : ''}`}>
      <LineRack
        shift={shift}
        paused={paused}
        onFocus={lineId => dispatch({ type: 'FOCUS_LINE', lineId })}
        onAnswer={lineId => dispatch({ type: 'ANSWER_LINE', lineId })}
        onTogglePause={() => dispatch(paused ? { type: 'RESUME', reason: 'manual' } : { type: 'PAUSE', reason: 'manual' })}
      />

      <div className="shift-stage">
        {focused && focused.phase === 'active' ? (
          <GameScreen
            key={focused.id}
            controlled={{ state: focused.world, dispatch, paused }}
            onNavigate={target => { if (target === 'title') onNavigate('title') }}
          />
        ) : (
          <div className="shift-idle">
            <Activity size={44} />
            <h2>{complete ? '今晚的班次结束了' : '城市正在等待你的声音'}</h2>
            <p>{complete ? '所有来电都已处理完毕。' : '左侧线路响铃时，点击即可接听。'}</p>
            {complete
              ? <button type="button" className="primary" onClick={finishShift}>查看班次总结</button>
              : <button type="button" className="text-button" onClick={finishShift}>结束当前班次</button>}
          </div>
        )}

        {/* 第二位来电者的冲突信息必须被处置 */}
        {focused && focused.phase === 'active' && focused.verification && (
          <VerifyPanel
            line={focused}
            onResolve={choice => dispatch({ type: 'RESOLVE_VERIFICATION', lineId: focused.id, choice })}
          />
        )}
      </div>
    </div>
  )
}
