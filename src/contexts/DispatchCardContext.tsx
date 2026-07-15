// ============================================================
// 调度卡控制上下文 — 跨层级共享调度卡弹窗入口
// App 持有 Provider，SettingsPanel（在 App 树中）与 GameScreen（在 mainContent 中）都能读写。
// GameScreen 通过 props 传入 setter；SettingsPanel 通过 useDispatchCard 读取
// ============================================================

import { createContext, useContext } from 'react'

export interface DispatchCardControl {
  /** 当前是否有未分诊状态（红色脉冲提示） */
  hasTriage: boolean
  /** 是否可点击（通话阶段） */
  isAvailable: boolean
  /** 调度卡弹窗当前是否已打开（打开时左侧 pill 应隐藏） */
  isOpen: boolean
  /** 触发打开调度卡弹窗（无通话时点击无效） */
  open: () => void
}

const DispatchCardContext = createContext<DispatchCardControl | null>(null)

export const DispatchCardProvider = DispatchCardContext.Provider

/** 读取调度卡控制。Provider 缺失时返回 null（非游戏页面调用安全） */
export function useDispatchCard(): DispatchCardControl | null {
  return useContext(DispatchCardContext)
}
