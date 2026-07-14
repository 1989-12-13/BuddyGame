import { useEffect, useRef } from 'react'
import type { WorldState } from '../../../game/types'
import type { WorldAction } from '../../../game/core/actions'
import { detectEnding } from '../../../game/endings/endings'
import type { EndingDef } from '../../../game/types'

interface LifecycleCallbacks {
  onEnding: (ending: EndingDef, totalScore: number, callScores: number[]) => void
}

/**
 * 承载原 GameScreen 的游戏循环生命周期副作用：
 * - TICK 计时器（每秒 dispatch TICK）
 * - 结局检测（screen === 'ending' 时回调 onEnding）
 * - 自动滚动对话（dialogueRef）
 * - 自动挂断（rescue.outcome 触发 2.5s / 患者死亡触发 2s）
 * 行为逐字节等价于原实现。
 */
export function useCallLifecycle(
  state: WorldState,
  dispatch: React.Dispatch<WorldAction>,
  dialogueRef: React.RefObject<HTMLDivElement | null>,
  onEnding: LifecycleCallbacks['onEnding'],
) {
  // --- 计时器 ---
  useEffect(() => {
    if (state.screen !== 'playing') return
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => clearInterval(id)
  }, [state.screen, dispatch])

  // --- 检测结局 ---
  useEffect(() => {
    if (state.screen === 'ending') {
      const ending = detectEnding(state.totalScore)
      onEnding(ending, state.totalScore, state.callScores)
    }
  }, [onEnding, state.callScores, state.screen, state.totalScore])

  // --- 自动滚动对话 ---
  useEffect(() => {
    if (dialogueRef.current) {
      dialogueRef.current.scrollTop = dialogueRef.current.scrollHeight
    }
  }, [state.dialogueLog.length, dialogueRef])

  // 救援结算完成 → 2.5s 后自动挂断进入下一通（地图接管观察期）
  const prevOutcome = useRef<string | null>(null)
  useEffect(() => {
    const outcome = state.rescue.outcome
    if (outcome && outcome !== prevOutcome.current && state.currentCall) {
      prevOutcome.current = outcome
      const t = setTimeout(() => {
        dispatch({ type: 'END_CALL' })
      }, 2500)
      return () => clearTimeout(t)
    }
    prevOutcome.current = outcome
  }, [state.rescue.outcome, state.currentCall, dispatch])

  // 患者死亡（rescue.outcome 未及触发）→ 2s 后自动挂断
  useEffect(() => {
    if (state.patientStatus?.died && state.currentCall && state.rescue.outcome === null) {
      const t = setTimeout(() => {
        dispatch({ type: 'END_CALL' })
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [state.patientStatus?.died, state.currentCall, state.rescue.outcome, dispatch])
}
