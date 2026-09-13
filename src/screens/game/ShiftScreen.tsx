// ============================================================
// 并发值班 — 班次屏幕
// ============================================================
// 一名调度员 + 3 条电话线路 + 2 辆救护车。
// 玩家一次只处理一条线，其余线路会响铃、会焦虑、会超时。
//
// 布局：默认落在「通话」视图且占满屏幕，线路条挂在通话台顶部，
// 班次级状态只有时钟与可用车辆（与患者体征合成一条状态带）。
// 工作区与登记表改成按需切换的视图，不再常驻挤占对话流的高度。
// ============================================================

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
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
import { createInitialState } from '../../game/core/worldState'
import { detectEnding } from '../../game/endings/endings'
import type { EndingDef, WorldState } from '../../game/types'
import { GameScreen } from './WorkbenchScreen'
import { LineRack } from './LineRack'
import { ShiftStatusBar } from './ShiftStatusBar'
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
    // 没有「今晚几通」：场景牌堆发完自动重洗，班次何时结束由热度模型决定
    createShiftState(DEFAULT_SHIFT_CONFIG),
  )

  // 班次时钟：一次 tick 推进全部线路
  useEffect(() => {
    const timer = window.setInterval(() => dispatch({ type: 'TICK' } as ShiftAction), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const focused = focusedLine(shift)
  const hasFocus = focused !== null && focused.phase === 'active'
  const paused = isShiftPaused(shift)
  const complete = isShiftComplete(shift)

  /**
   * 没有聚焦线路时，工作台渲染一个中立世界。
   * 这样桌面始终在场 —— 线路列表也就在通话栏里，不会出现
   * 「先是一块空舞台，接到电话才变成工作台」的跳变。
   */
  const idleWorld = useMemo<WorldState>(() => ({ ...createInitialState(), screen: 'playing' }), [])
  const world = hasFocus && focused ? focused.world : idleWorld

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
      <GameScreen
        // 逐线重挂载：避免上一通留下的路线弹窗、小游戏缓存串到下一通
        key={hasFocus && focused ? focused.id : 'idle'}
        controlled={{
          state: world,
          dispatch,
          paused,
          awaitingLine: !hasFocus,
          slots: {
            statusBar: <ShiftStatusBar shift={shift} />,
            lineBoard: (
              <LineRack
                shift={shift}
                onFocus={lineId => dispatch({ type: 'FOCUS_LINE', lineId })}
                onAnswer={lineId => dispatch({ type: 'ANSWER_LINE', lineId })}
              />
            ),
          },
        }}
        onNavigate={target => { if (target === 'title') onNavigate('title') }}
      />

      {/* 第二位来电者的冲突信息必须被处置 */}
      {hasFocus && focused?.verification && (
        <VerifyPanel
          line={focused}
          onResolve={choice => dispatch({ type: 'RESOLVE_VERIFICATION', lineId: focused.id, choice })}
        />
      )}
    </div>
  )
}
