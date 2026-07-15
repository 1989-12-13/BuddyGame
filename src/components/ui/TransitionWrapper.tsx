// ============================================================
// 120调度台 — 通用动画过渡封装
// 基于 motion 的预设变体，统一页面/卡片/弹窗的入场离场
// ============================================================

import { motion, type Variants, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { fadeInUp, scalePop, pageTransition, EASE_OUT, DUR_NORMAL } from '../animations/presets'

type PresetKey = 'fadeInUp' | 'scalePop' | 'pageTransition'

const VARIANT_MAP: Record<PresetKey, Variants> = {
  fadeInUp,
  scalePop,
  pageTransition,
}

interface Props {
  children: ReactNode
  /** 动画预设（默认 fadeInUp） */
  preset?: PresetKey
  /** 是否显示（用于 AnimatePresence 配合） */
  show?: boolean
  /** 自定义变体（覆盖 preset） */
  variants?: Variants
  /** 自定义过渡 */
  transition?: HTMLMotionProps<'div'>['transition']
  /** 额外 motion props */
  motionProps?: HTMLMotionProps<'div'>
  className?: string
  style?: React.CSSProperties
}

export function TransitionWrapper({
  children,
  preset = 'fadeInUp',
  show,
  variants: customVariants,
  transition,
  motionProps,
  className,
  style,
}: Props) {
  const v = customVariants ?? VARIANT_MAP[preset]

  return (
    <motion.div
      initial="hidden"
      animate={show !== false ? 'visible' : 'exit'}
      exit="exit"
      variants={v}
      transition={transition ?? { duration: DUR_NORMAL, ease: EASE_OUT }}
      className={className}
      style={style}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}
