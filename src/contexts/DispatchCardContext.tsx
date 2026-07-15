// ============================================================
// 调度卡控制上下文 — 允许非 GameScreen 的组件（如设置面板）触发调度卡弹窗
// 使用方式：
//   - GameScreen 中用 <DispatchCardProvider value={...}> 包裹内容
//   - 任何子组件用 const dc = useDispatchCard() 读取状态，dc?.open() 弹卡
// ============================================================

import { createContext, useContext } from 'react'

export interface DispatchCardControl {
  /** 当前是否在可调度的通话阶段（questioning / connected） */
  isVisible: boolean
  /** 是否已经分诊完成（terminal.triage !== null） */
  hasTriage: boolean
  /** 触发打开调度卡弹窗 */
  open: () => void
}

const DispatchCardContext = createContext<DispatchCardControl | null>(null)

export const DispatchCardProvider = DispatchCardContext.Provider

/** 读取调度卡控制。Provider 缺失时返回 null（非游戏页面调用安全） */
export function useDispatchCard(): DispatchCardControl | null {
  return useContext(DispatchCardContext)
}
