// ============================================================
// 120调度台 — 统一动画常量与预设变体
// 用于 Toast、评分卡、页面切换等场景
// ============================================================

import type { Variants } from 'motion/react'

// -------------------- 基础时长（与 CSS 令牌 --dur-* 对齐） --------------------

/** 即时反馈（按压脉冲、闪烁）—— 对齐 --dur-fast(120ms) */
export const DUR_INSTANT = 0.12
/** 快速过渡（Hover、选中态）—— 对齐 --dur-fast(120ms) */
export const DUR_QUICK = 0.12
/** 标准过渡（Toast 入场、评分显示）—— 对齐 --dur-base(200ms) */
export const DUR_NORMAL = 0.2
/** 从容过渡（卡片展开、页面切换）—— 对齐 --dur-slow(320ms) */
export const DUR_EASE = 0.32
/** 重要过渡（结果展示、结算动画）—— 对齐 --dur-slow(320ms) */
export const DUR_EMPHASIS = 0.32

// -------------------- 缓动曲线（统一到 --ease-out） --------------------

/** 快速进出（按钮、弹窗）—— 同 --ease-out */
export const EASE_OUT_FAST = [0.16, 1, 0.3, 1] as const
/** 标准缓出（卡片入场）—— 同 --ease-out */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const
/** 弹性缓出（强调反馈） */
export const EASE_SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 }

// -------------------- 预设动画变体 --------------------

/** 右滑入场（Toast 使用） */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: DUR_NORMAL, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    x: 40,
    scale: 0.96,
    transition: { duration: DUR_QUICK },
  },
}

/** 上滑淡入（弹窗/评分卡） */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR_EASE, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: DUR_QUICK },
  },
}

/** 缩放弹出（图标/徽章） */
export const scalePop: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: EASE_SPRING,
  },
  exit: {
    opacity: 0,
    scale: 0.7,
    transition: { duration: DUR_QUICK },
  },
}

/** 页面切换变体 */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR_EASE, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: DUR_QUICK },
  },
}

/** 列表交错入场（含 stagger） */
export const staggerList = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: DUR_NORMAL, ease: EASE_OUT },
    },
  },
}

// -------------------- 便捷 keyframes 字符串 --------------------

/** 右滑入场 CSS keyframes */
export const KEYFRAMES_SLIDE_IN_RIGHT = '@keyframes slide-in-right { from { opacity:0; transform:translateX(40px) } to { opacity:1; transform:translateX(0) } }'

/** 上滑淡入 CSS keyframes */
export const KEYFRAMES_FADE_IN_UP = '@keyframes fade-in-up { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }'
