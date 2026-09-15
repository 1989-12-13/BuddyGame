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
} from '../../game/core/shift'
import { createInitialState } from '../../game/core/worldState'
import type { ShiftEvaluation, WorldState } from '../../game/types'
import { GameScreen } from './WorkbenchScreen'
import { LineRack } from './LineRack'
import { ShiftStatusBar } from './ShiftStatusBar'
import { VerifyPanel } from './VerifyPanel'
import { OnboardingCoach, type CoachStep } from './OnboardingCoach'
import './shift.css'

interface Props {
  onNavigate: (
    screen: 'title' | 'ending',
    evaluation?: ShiftEvaluation,
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

  // 班次收束 → 生成统一五维结算。
  const summaryRef = useRef(summarizeShift(shift))
  summaryRef.current = summarizeShift(shift)
  const navigatedAway = useRef(false)
  const finishShift = useCallback(() => {
    if (navigatedAway.current) return
    navigatedAway.current = true
    onNavigate('ending', summaryRef.current)
  }, [onNavigate])

  useEffect(() => {
    if (complete) finishShift()
  }, [complete, finishShift])

  /**
   * 首次值班引导：跟着做一遍，而不是先读一段说明。
   * 每一步都盯着一个真实控件，做到了就自动进入下一步。
   */
  const coachSteps = useMemo<CoachStep[]>(() => {
    const line = focusedLine(shift)
    const world = line?.world
    return [
      {
        target: '.line-rail',
        title: '线路响铃时，点它接起来',
        body: '一次只能盯一条线。其余线路会继续响、继续等，超时会转留言并回拨。',
        done: () => line?.phase === 'active',
      },
      {
        target: '.question-dock',
        title: '从这几句里挑一句说',
        body: '问什么交给协议推进，你只决定怎么说。安抚到位，来电者才说得清。',
        done: () => (world?.dialogueLog.length ?? 0) > 3,
      },
      {
        target: '.action-bar',
        title: '四项齐了，就在底部派车',
        body: '地点、意识、呼吸、判定码都确认后，这条常驻操作栏会亮起「规划救援路线」。',
        done: () => Boolean(world?.dispatchSent),
      },
      {
        target: '.main-workspace',
        title: '等车期间保持通话',
        body: '派车后按急救指导继续照护，直到急救人员接手。',
        done: () => Boolean(world?.guidanceActive || world?.rescue.outcome),
      },
    ]
  }, [shift])

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

      {!complete && <OnboardingCoach steps={coachSteps} onFinish={() => undefined} />}

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
